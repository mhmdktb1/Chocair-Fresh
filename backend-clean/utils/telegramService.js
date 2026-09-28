import axios from 'axios';

/**
 * Telegram Notification Service for Store Admin
 * Sends instant push notifications with formatted order details directly to admin phone.
 */

const LBP_RATE = 89500;
const DEFAULT_BOT_TOKEN = '8943676195:AAGSac7PomfLgvImeqDGiJwTBbHQ3fP1dUE';

export const sendTelegramOrderAlert = async (order) => {
  if (process.env.NODE_ENV === 'test') {
    return { success: true, mode: 'test' };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;

  // If chat ID is not hardcoded, try to auto-discover it from the bot's latest active chats
  if (!chatId) {
    try {
      const updatesRes = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`, { timeout: 5000 });
      const updates = updatesRes.data?.result || [];
      if (updates.length > 0) {
        const lastMsg = updates[updates.length - 1]?.message || updates[updates.length - 1]?.channel_post;
        if (lastMsg?.chat?.id) {
          chatId = lastMsg.chat.id;
        }
      }
    } catch (discErr) {
      console.warn('Could not auto-discover Telegram chat ID:', discErr.message);
    }
  }

  if (!chatId) {
    console.log(`ℹ️ [Telegram Alert] Bot active (@chocair_fresh_bot), but Chat ID not yet received. Please open https://t.me/chocair_fresh_bot on your phone and press Start.`);
    return { success: false, reason: 'unconfigured_chat_id' };
  }

  try {
    const orderShortId = (order._id || order.id || '').toString().slice(-6).toUpperCase();
    const customer = order.customerInfo || {};
    const customerName = customer.name || 'Guest Customer';
    const customerPhone = customer.phone || 'Not provided';
    const deliveryPreference = order.deliveryPreference || customer.deliveryPreference || 'ASAP';
    const totalUsd = Number(order.totalPrice || order.total || 0);
    const totalLbp = (totalUsd * LBP_RATE).toLocaleString('en-US');
    const itemsPriceUsd = Number(order.itemsPrice || 0);
    const shippingUsd = Number(order.shippingPrice || 0);

    // Format item lines
    const items = (order.orderItems || order.items || []).map((item, index) => {
      const name = item.name || 'Product';
      const qty = item.qty || item.quantity || 1;
      const unit = item.unit || '1kg';
      const price = Number(item.price || 0).toFixed(2);
      const lineTotal = (qty * Number(item.price || 0)).toFixed(2);
      const note = item.instruction ? `\n   ↳ 📝 <i>Note: ${escapeHtml(item.instruction)}</i>` : '';
      return `${index + 1}. <b>${escapeHtml(name)}</b> (${qty}x ${unit}) — <b>$${lineTotal}</b> ($${price}/ea)${note}`;
    }).join('\n');

    // Build location line
    let locationDetails = '';
    if (customer.address) {
      locationDetails += `📍 <b>Address:</b> ${escapeHtml(customer.address)}\n`;
    }
    if (customer.building || customer.floor) {
      locationDetails += `🏢 <b>Building/Floor:</b> ${escapeHtml(customer.building || 'N/A')}, Floor ${escapeHtml(customer.floor || 'N/A')}\n`;
    }
    if (customer.distanceKm != null) {
      locationDetails += `📏 <b>Distance from Store:</b> ${Number(customer.distanceKm).toFixed(1)} km\n`;
    }
    if (customer.googleMapsLink) {
      locationDetails += `🗺️ <a href="${customer.googleMapsLink}">Open in Google Maps</a>\n`;
    }

    const messageHtml = 
`🚨 <b>NEW ORDER RECEIVED! #${orderShortId}</b>

👤 <b>Customer:</b> ${escapeHtml(customerName)}
📞 <b>Phone:</b> <code>${escapeHtml(customerPhone)}</code>
🚚 <b>Timing:</b> ${escapeHtml(deliveryPreference)}
💳 <b>Payment:</b> ${escapeHtml(order.paymentMethod || 'Cash on Delivery')}

🛒 <b>Items Ordered:</b>
${items || '<i>No items listed</i>'}

💵 <b>Subtotal:</b> $${itemsPriceUsd.toFixed(2)}
🛵 <b>Delivery Fee:</b> $${shippingUsd.toFixed(2)}
💰 <b>Total Due:</b> <b>$${totalUsd.toFixed(2)}</b> (≈ ${totalLbp} L.L.)

${locationDetails}
⏰ <i>${new Date(order.createdAt || Date.now()).toLocaleString('en-GB', { timeZone: 'Asia/Beirut' })} (Beirut Time)</i>`;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    // Send message with Telegram HTML formatting and quick Action inline buttons
    const payload = {
      chat_id: chatId,
      text: messageHtml,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: {
        inline_keyboard: [
          [
            ...(customerPhone && customerPhone !== 'Not provided' ? [
              {
                text: '💬 WhatsApp Customer',
                url: `https://wa.me/${normalizePhoneForWa(customerPhone)}?text=${encodeURIComponent(`Hello ${customerName}, this is Chocair Fresh regarding your order #${orderShortId}.`)}`
              }
            ] : []),
            ...(customer.googleMapsLink ? [
              {
                text: '📍 Navigate Map',
                url: customer.googleMapsLink
              }
            ] : [])
          ]
        ]
      }
    };

    const response = await axios.post(url, payload, { timeout: 10000 });
    console.log(`✅ [Telegram Service] Order #${orderShortId} alert sent successfully to Chat ID: ${chatId}`);
    return { success: true, messageId: response.data?.result?.message_id };
  } catch (err) {
    console.error(`❌ [Telegram Service Error]:`, err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const normalizePhoneForWa = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 8) {
    cleaned = '961' + cleaned.slice(1);
  } else if (cleaned.length === 8 && (cleaned.startsWith('7') || cleaned.startsWith('3') || cleaned.startsWith('8') || cleaned.startsWith('1'))) {
    cleaned = '961' + cleaned;
  }
  return cleaned;
};
