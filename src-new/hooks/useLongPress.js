import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_DELAY = 500;
const DEFAULT_MOVE_TOLERANCE = 10;
const GHOST_CLICK_WINDOW = 400;
// A native long-press (contextmenu) earlier than this is treated as noise, not a hold.
const MIN_NATIVE_HOLD = 250;

const vibrate = () => {
  try {
    navigator.vibrate?.(15);
  } catch {
    // Vibration is best-effort only.
  }
};

/**
 * Touch-only long-press detection that never blocks native scrolling.
 * - Fires `onLongPress(element)` after `delay` ms of a still finger, or earlier
 *   if the browser's own long-press gesture (contextmenu) arrives first, which
 *   is what Android Chrome does at ~400ms.
 * - Cancels on release before the delay, movement beyond `moveTolerance`, or
 *   scrolling. A pointercancel alone does not cancel a still finger, because
 *   Android emits one when its native long-press kicks in.
 * - Swallows the click that follows the release so a long press never also
 *   counts as a tap, and suppresses native context menu, drag and text selection.
 * Mouse input is ignored so desktop behaviour is unchanged.
 */
const useLongPress = (onLongPress, {
  delay = DEFAULT_DELAY,
  moveTolerance = DEFAULT_MOVE_TOLERANCE,
  ignoreSelector = 'button, input, textarea, select',
} = {}) => {
  const pressRef = useRef(null);
  const isTouchRef = useRef(false);
  const callbackRef = useRef(onLongPress);

  useEffect(() => {
    callbackRef.current = onLongPress;
  }, [onLongPress]);

  const endPress = useCallback(() => {
    const press = pressRef.current;
    if (!press) return;
    clearTimeout(press.timer);
    press.removeListeners();
    pressRef.current = null;
  }, []);

  useEffect(() => endPress, [endPress]);

  const swallowGhostClick = useCallback((pointerId) => {
    let releaseTimer = null;
    const swallow = (e) => {
      e.preventDefault();
      e.stopPropagation();
      remove();
    };
    const onRelease = (e) => {
      if (e.pointerId !== pointerId) return;
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(remove, GHOST_CLICK_WINDOW);
    };
    // A brand-new touch means the long-press gesture is over; never eat its click.
    const onNewPress = (e) => {
      if (e.pointerId !== pointerId) remove();
    };
    function remove() {
      clearTimeout(releaseTimer);
      window.removeEventListener('click', swallow, true);
      window.removeEventListener('pointerup', onRelease, true);
      window.removeEventListener('pointercancel', onRelease, true);
      window.removeEventListener('pointerdown', onNewPress, true);
    }
    window.addEventListener('click', swallow, true);
    window.addEventListener('pointerup', onRelease, true);
    window.addEventListener('pointercancel', onRelease, true);
    window.addEventListener('pointerdown', onNewPress, true);
  }, []);

  const fire = useCallback(() => {
    const press = pressRef.current;
    if (!press || press.fired || press.cancelled) return;
    press.fired = true;
    const { element, pointerId } = press;
    endPress();
    swallowGhostClick(pointerId);
    vibrate();
    callbackRef.current?.(element);
  }, [endPress, swallowGhostClick]);

  const onPointerDown = useCallback((e) => {
    isTouchRef.current = e.pointerType === 'touch' || e.pointerType === 'pen';
    if (!isTouchRef.current || !e.isPrimary) return;
    // Ignore events bubbling through React portals (e.g. the popup itself).
    if (!e.currentTarget.contains(e.target)) return;
    if (ignoreSelector && e.target.closest?.(ignoreSelector)) return;

    endPress();
    const element = e.currentTarget;
    const { pointerId } = e;
    const start = { x: e.clientX, y: e.clientY };

    const cancel = () => {
      if (pressRef.current) pressRef.current.cancelled = true;
      endPress();
    };
    const onMove = (ev) => {
      if (ev.pointerId !== pointerId) return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (dx * dx + dy * dy > moveTolerance * moveTolerance) cancel();
    };
    const onUp = (ev) => {
      if (ev.pointerId === pointerId) cancel();
    };
    // Keep the press alive briefly so a native contextmenu right after can still fire it.
    const onPointerCancel = (ev) => {
      if (ev.pointerId !== pointerId || !pressRef.current) return;
      clearTimeout(pressRef.current.timer);
      pressRef.current.timer = setTimeout(cancel, 600);
    };
    const onScroll = (ev) => {
      const t = ev.target;
      if (t === document || t === document.documentElement || (t instanceof Node && t.contains(element))) cancel();
    };
    const block = (ev) => ev.preventDefault();

    window.addEventListener('pointermove', onMove, { capture: true, passive: true });
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onPointerCancel, true);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('dragstart', block, true);
    window.addEventListener('selectstart', block, true);

    pressRef.current = {
      element,
      pointerId,
      startTime: performance.now(),
      fired: false,
      cancelled: false,
      timer: setTimeout(fire, delay),
      removeListeners: () => {
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);
        window.removeEventListener('pointercancel', onPointerCancel, true);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('dragstart', block, true);
        window.removeEventListener('selectstart', block, true);
      },
    };
  }, [delay, moveTolerance, ignoreSelector, endPress, fire]);

  // Android/iOS raise contextmenu for their native long-press: block the OS menu
  // (save image / open link) and treat it as our long press if the finger is still down.
  const onContextMenu = useCallback((e) => {
    if (!isTouchRef.current) return;
    e.preventDefault();
    const press = pressRef.current;
    if (press && e.currentTarget.contains(e.target) && performance.now() - press.startTime >= MIN_NATIVE_HOLD) {
      fire();
    }
  }, [fire]);

  return { onPointerDown, onContextMenu };
};

export default useLongPress;
