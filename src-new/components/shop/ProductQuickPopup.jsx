import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getProductDescription } from '../../utils/textUtils';
import './ProductQuickPopup.css';

const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 8;
const EXIT_DURATION = 140;
const PLACEHOLDER_IMAGE = '/assets/images/products/placeholder.jpg';

const computePosition = (anchorRect, popupW, popupH) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const left = Math.min(
    Math.max(anchorCenterX - popupW / 2, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, vw - popupW - VIEWPORT_MARGIN)
  );

  let top;
  let originY;
  if (anchorRect.bottom + ANCHOR_GAP + popupH <= vh - VIEWPORT_MARGIN) {
    top = anchorRect.bottom + ANCHOR_GAP;
    originY = 'top';
  } else if (anchorRect.top - ANCHOR_GAP - popupH >= VIEWPORT_MARGIN) {
    top = anchorRect.top - ANCHOR_GAP - popupH;
    originY = 'bottom';
  } else {
    // Not enough room above or below: float over the card, kept inside the viewport.
    const centered = anchorRect.top + anchorRect.height / 2 - popupH / 2;
    top = Math.min(Math.max(centered, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vh - popupH - VIEWPORT_MARGIN));
    originY = 'center';
  }

  const originX = Math.min(Math.max(anchorCenterX - left, 0), popupW);
  return { top, left, transformOrigin: `${originX}px ${originY}` };
};

const ProductQuickPopup = ({
  anchorEl,
  onClose,
  product,
  arabicName,
  imageSrc,
  unit,
  currentPrice,
  originalPrice,
  isDiscounted,
  discountPercent,
  cartItem,
  onAdd,
  onIncrease,
  onDecrease,
}) => {
  const navigate = useNavigate();
  const popupRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  const description = getProductDescription(product);
  const stock = product.countInStock ?? product.stock;
  const hasStockInfo = stock !== undefined && stock !== null && stock !== '';
  const isOutOfStock = hasStockInfo && Number(stock) <= 0;
  const productUrl = `/product/${product._id}`;

  const requestClose = useCallback(() => {
    if (closeTimerRef.current) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(onClose, EXIT_DURATION);
  }, [onClose]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!popup || !anchorEl) return undefined;
    const place = () => {
      setPosition(computePosition(anchorEl.getBoundingClientRect(), popup.offsetWidth, popup.offsetHeight));
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchorEl]);

  useEffect(() => {
    popupRef.current?.focus({ preventScroll: true });
    const onKeyDown = (e) => {
      if (e.key === 'Escape') requestClose();
    };
    const onScroll = (e) => {
      const t = e.target;
      if (t === document || t === document.documentElement || (t instanceof Node && t.contains(anchorEl))) {
        requestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [requestClose, anchorEl]);

  const handleAdd = () => {
    onAdd();
    requestClose();
  };

  const handleView = () => {
    onClose();
    navigate(productUrl, { state: { product } });
  };

  return createPortal(
    <div
      className={`pqp-backdrop ${isClosing ? 'is-closing' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        requestClose();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={popupRef}
        className={`pqp-popup ${position ? 'is-positioned' : ''} ${isClosing ? 'is-closing' : ''}`}
        style={position || undefined}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pqp-header">
          <div className="pqp-image-wrap">
            <img
              src={imageSrc}
              alt={product.name}
              className="pqp-image"
              draggable={false}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
            />
            {isDiscounted && discountPercent > 0 && (
              <span className="badge badge-sale pqp-image-badge">-{discountPercent}%</span>
            )}
          </div>

          <div className="pqp-info">
            <h3 className="pqp-name">{product.name}</h3>
            {arabicName && <p className="pqp-name-ar" dir="rtl">{arabicName}</p>}

            <div className="pqp-price-row">
              <span className="pqp-price">{formatCurrency(currentPrice)}</span>
              {unit && <span className="pqp-unit">/ {unit}</span>}
              {isDiscounted && originalPrice > currentPrice && (
                <span className="pqp-original-price">{formatCurrency(originalPrice)}</span>
              )}
            </div>

            {hasStockInfo && (
              <span className={`pqp-stock ${isOutOfStock ? 'is-out' : 'is-in'}`}>
                {isOutOfStock ? 'Out of stock' : 'In stock'}
              </span>
            )}
          </div>
        </div>

        {description && <p className="pqp-description">{description}</p>}

        <div className="pqp-actions">
          {cartItem ? (
            <div className="pqp-stepper" aria-label="Quantity in cart">
              <button type="button" className="pqp-stepper-btn" onClick={onDecrease} aria-label="Decrease quantity">
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <span className="pqp-stepper-qty">{cartItem.quantity}</span>
              <button type="button" className="pqp-stepper-btn" onClick={onIncrease} aria-label="Increase quantity">
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pqp-btn pqp-btn-primary"
              onClick={handleAdd}
              disabled={isOutOfStock}
            >
              <ShoppingCart size={15} />
              <span>{isOutOfStock ? 'Out of stock' : 'Add to Cart'}</span>
            </button>
          )}
          <button type="button" className="pqp-btn pqp-btn-secondary" onClick={handleView}>
            <span>View Product</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductQuickPopup;
