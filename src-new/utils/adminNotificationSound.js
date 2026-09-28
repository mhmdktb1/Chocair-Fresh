/**
 * Admin Order Notification Sound & Desktop Notification Utilities
 * Uses Web Audio API for zero-asset, zero-latency melodic order chime.
 */

class AdminNotificationManager {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = localStorage.getItem('cf_admin_sound_enabled') !== 'false';
    this.desktopNotificationsEnabled = localStorage.getItem('cf_admin_desktop_notif_enabled') !== 'false';
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = Boolean(enabled);
    localStorage.setItem('cf_admin_sound_enabled', this.soundEnabled ? 'true' : 'false');
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  setDesktopNotificationsEnabled(enabled) {
    this.desktopNotificationsEnabled = Boolean(enabled);
    localStorage.setItem('cf_admin_desktop_notif_enabled', this.desktopNotificationsEnabled ? 'true' : 'false');
  }

  isDesktopNotificationsEnabled() {
    return this.desktopNotificationsEnabled;
  }

  /**
   * Play crystal clear, pleasant 3-note order bell chime
   */
  playOrderChime() {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.4, gain: 0.22 },
        { freq: 659.25, time: 0.12, dur: 0.4, gain: 0.24 },
        { freq: 783.99, time: 0.24, dur: 0.5, gain: 0.26 },
        { freq: 1046.50, time: 0.38, dur: 0.7, gain: 0.32 },
      ];

      notes.forEach(({ freq, time, dur, gain: noteGain }) => {
        const startTime = now + time;
        
        // Primary Sine Oscillator (Pure Tone)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, startTime);

        gain1.gain.setValueAtTime(0.001, startTime);
        gain1.gain.exponentialRampToValueAtTime(noteGain, startTime + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        // Secondary Harmonic (Triangle for warmth)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, startTime); // 1 octave higher overtone

        gain2.gain.setValueAtTime(0.001, startTime);
        gain2.gain.exponentialRampToValueAtTime(noteGain * 0.15, startTime + 0.015);
        gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + (dur * 0.6));

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(startTime);
        osc1.stop(startTime + dur + 0.05);

        osc2.start(startTime);
        osc2.stop(startTime + dur + 0.05);
      });
    } catch (e) {
      console.warn('Could not play order chime:', e);
    }
  }

  /**
   * Request native browser Desktop Notification permission
   */
  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Trigger Desktop push/system notification if window is minimized or unfocused
   */
  showDesktopNotification(order) {
    if (!this.desktopNotificationsEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const orderShortId = (order.id || order._id || '').toString().slice(-6).toUpperCase();
      const customerName = order.customer || order.customerInfo?.name || 'Customer';
      const totalFormatted = `$${Number(order.total || order.totalPrice || 0).toFixed(2)}`;
      const itemCount = order.items?.length || order.orderItems?.length || 1;

      const title = `🚨 New Order Received! #${orderShortId}`;
      const body = `${customerName} placed an order for ${itemCount} item(s) (${totalFormatted}). Tap to open admin orders.`;

      const notification = new Notification(title, {
        body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-192x192.png',
        tag: `order-${orderShortId}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Error triggering desktop notification:', e);
    }
  }

  /**
   * Full notification trigger (Audio Chime + Desktop Notification)
   */
  notify(order) {
    this.playOrderChime();
    this.showDesktopNotification(order);
  }
}

export const adminNotification = new AdminNotificationManager();
export default adminNotification;
