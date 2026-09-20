import axios from 'axios';

/**
 * WhatsApp Cloud API (Meta) Service
 * Sends OTP verification and Order notification messages.
 * Falls back to console output if Meta WhatsApp credentials are not configured or in development.
 */

const normalizePhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d]/g, '');
  // If Lebanese local number starting with 0, convert to 961...
  if (cleaned.startsWith('0') && cleaned.length === 8) {
    cleaned = '961' + cleaned.slice(1);
  } else if (cleaned.length === 8 && (cleaned.startsWith('7') || cleaned.startsWith('3') || cleaned.startsWith('8') || cleaned.startsWith('1'))) {
    cleaned = '961' + cleaned;
  }
  return cleaned;
};

export const sendWhatsAppOtp = async (phone, otp) => {
  if (process.env.NODE_ENV === 'test') {
    return { success: true, mode: 'test' };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = normalizePhoneForWhatsApp(phone);

  console.log(`📱 [WhatsApp Service] Dispatching OTP ${otp} to +${recipient}`);

  if (!token || !phoneNumberId) {
    console.log(`ℹ️ [WhatsApp Service] Meta credentials not set in .env. Dev OTP: ${otp}`);
    return { success: true, mode: 'dev_simulation' };
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  // 1. Send via approved Meta Utility template (Bypasses Meta 24-hour customer-initiated window)
  try {
    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: process.env.WHATSAPP_OTP_TEMPLATE || 'jaspers_market_order_confirmation_v1',
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: 'Chocair Customer',
              },
              {
                type: 'text',
                text: `[ Verification Code: ${otp} ]`,
              },
              {
                type: 'text',
                text: '5 minutes',
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, templatePayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log(`✅ [WhatsApp Service] Official WhatsApp template OTP delivered to +${recipient} (Message ID: ${response.data.messages?.[0]?.id})`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (templateError) {
    console.warn(`⚠️ [WhatsApp Service] Template dispatch failed:`, templateError.response?.data || templateError.message);
  }

  // 2. Direct Text Message fallback
  try {
    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: false,
        body: `🍏 *Chocair Fresh Verification Code*\n\nYour verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
      },
    };

    const response = await axios.post(url, textPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log(`✅ [WhatsApp Service] Direct WhatsApp text delivered to +${recipient}`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    const metaError = error.response?.data?.error;
    console.error(`❌ [WhatsApp Service Error]:`, metaError || error.message);
    return { success: false, error: metaError?.message || error.message };
  }
};

export const sendWhatsAppOrderNotification = async (phone, order, options = {}) => {
  if (process.env.NODE_ENV === 'test') {
    return { success: true, mode: 'test' };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = normalizePhoneForWhatsApp(phone);
  const isAdmin = !!options.isAdmin;

  console.log(`📦 [WhatsApp Service] Order notification for #${order._id} to +${recipient} (${isAdmin ? 'admin' : 'customer'})`);

  if (!token || !phoneNumberId) {
    console.log(`ℹ️ [WhatsApp Service] Meta credentials not set. Simulated order notification for #${order._id}`);
    return { success: true, mode: 'dev_simulation' };
  }

  try {
    const itemsSummary = (order.orderItems || [])
      .map((item) => `• ${item.name} (${item.qty}x) - $${(item.price * item.qty).toFixed(2)}`)
      .join('\n');

    const messageText = isAdmin
      ? `🚨 *Chocair Fresh - New Order Alert*\n\nA new order has been placed.\n\n*Order ID:* #${order._id.toString().slice(-6).toUpperCase()}\n*Customer:* ${order.customerInfo?.name || 'Guest'}\n*Phone:* ${order.customerInfo?.phone || 'Not provided'}\n*Total:* $${order.totalPrice?.toFixed(2)}\n*Payment Method:* ${order.paymentMethod}\n\n*Items:*\n${itemsSummary}\n\n*Delivery Address:* ${order.customerInfo?.address || 'Provided Location'}`
      : `🍏 *Chocair Fresh - Order Confirmation*\n\nThank you for your order, *${order.customerInfo?.name || 'Valued Customer'}*!\n\n*Order ID:* #${order._id.toString().slice(-6).toUpperCase()}\n*Total:* $${order.totalPrice?.toFixed(2)}\n*Payment Method:* ${order.paymentMethod}\n*Delivery Address:* ${order.customerInfo?.address || 'Provided Location'}\n\n*Items:*\n${itemsSummary}\n\nOur team is preparing your fresh order. Track updates on your Chocair Fresh profile!`;

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return { success: true, messageId: response.data.messages?.[0]?.id, isAdmin };
  } catch (error) {
    console.error(`⚠️ [WhatsApp Order Notification Error]:`, error.response?.data || error.message);
    return { success: false, error: error.message, isAdmin };
  }
};
