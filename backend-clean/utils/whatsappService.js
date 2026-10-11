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
    const errorMsg = 'Meta WhatsApp credentials (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID) are missing in environment variables.';
    console.warn(`⚠️ [WhatsApp Service] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const errors = [];

  // Strategy 1: Standard Meta Authentication OTP Template (with code button/copy)
  const customTemplate = process.env.WHATSAPP_OTP_TEMPLATE || 'choucair_otp';
  const langCode = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US';

  // 1a. Meta Authentication Template with Button / Component parameters
  try {
    const authTemplatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: customTemplate,
        language: { code: langCode },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: String(otp),
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              {
                type: 'text',
                text: String(otp),
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, authTemplatePayload, { headers, timeout: 10000 });
    console.log(`✅ [WhatsApp Service] Delivered OTP via Auth template '${customTemplate}' (with button) to +${recipient} (Message ID: ${response.data.messages?.[0]?.id})`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (err) {
    const metaErr = err.response?.data?.error;
    errors.push(`Auth Template (button): ${metaErr?.message || err.message}`);
  }

  // 1b. Meta Authentication/Utility Body-only Single Parameter ({{1}} = OTP)
  try {
    const bodyOnlyPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: customTemplate,
        language: { code: langCode },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: String(otp),
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, bodyOnlyPayload, { headers, timeout: 10000 });
    console.log(`✅ [WhatsApp Service] Delivered OTP via template '${customTemplate}' (body-only) to +${recipient} (Message ID: ${response.data.messages?.[0]?.id})`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (err) {
    const metaErr = err.response?.data?.error;
    errors.push(`Template '${customTemplate}' (body-only): ${metaErr?.message || err.message}`);
  }

  // 1c. Try language variant fallback (e.g. en instead of en_US or vice versa)
  const altLang = langCode === 'en_US' ? 'en' : 'en_US';
  try {
    const altLangPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: customTemplate,
        language: { code: altLang },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: String(otp),
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, altLangPayload, { headers, timeout: 10000 });
    console.log(`✅ [WhatsApp Service] Delivered OTP via template '${customTemplate}' (lang: ${altLang}) to +${recipient}`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (err) {
    const metaErr = err.response?.data?.error;
    errors.push(`Template '${customTemplate}' (lang ${altLang}): ${metaErr?.message || err.message}`);
  }

  // Strategy 2: Direct Text Message (works within 24h conversation window or in sandbox testing)
  try {
    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: false,
        body: `🍏 *Choucair Fresh Verification Code*\n\nYour verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
      },
    };

    const response = await axios.post(url, textPayload, { headers, timeout: 10000 });
    console.log(`✅ [WhatsApp Service] Direct WhatsApp text delivered to +${recipient}`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (err) {
    const metaErr = err.response?.data?.error;
    const directErrMsg = metaErr?.message || err.message;
    errors.push(`Direct text: ${directErrMsg}`);
    console.error(`❌ [WhatsApp Service Direct Text Error]:`, metaErr || err.message);
  }

  // Strategy 3: Built-in `hello_world` (fallback test to verify Meta API connection)
  if (!customTemplate) {
    try {
      const helloPayload = {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' },
        },
      };
      const response = await axios.post(url, helloPayload, { headers, timeout: 10000 });
      console.log(`ℹ️ [WhatsApp Service] Note: Delivered 'hello_world' sample message because custom OTP template is not yet created in Meta.`);
      return { 
        success: true, 
        messageId: response.data.messages?.[0]?.id,
        warning: 'Delivered hello_world template because custom OTP template is not yet created in Meta WhatsApp Manager.' 
      };
    } catch (helloErr) {
      const metaErr = helloErr.response?.data?.error;
      errors.push(`hello_world: ${metaErr?.message || helloErr.message}`);
    }
  }

  const finalError = errors[errors.length - 1] || 'Meta WhatsApp dispatch failed';
  console.error(`❌ [WhatsApp Service Diagnostics]:`, errors);
  return { success: false, error: finalError, allErrors: errors };
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
      .map((item) => `• ${item.name} (${item.qty}x ${item.unit || '1kg'}) - $${(item.price * item.qty).toFixed(2)}${item.instruction ? `\n   ↳ 📝 Note: "${item.instruction}"` : ''}`)
      .join('\n');

    const messageText = isAdmin
      ? `🚨 *Choucair Fresh - New Order Alert*\n\nA new order has been placed.\n\n*Order ID:* #${order._id.toString().slice(-6).toUpperCase()}\n*Customer:* ${order.customerInfo?.name || 'Guest'}\n*Phone:* ${order.customerInfo?.phone || 'Not provided'}\n*Total:* $${order.totalPrice?.toFixed(2)}\n*Payment Method:* ${order.paymentMethod}\n\n*Items:*\n${itemsSummary}\n\n*Delivery Address:* ${order.customerInfo?.address || 'Provided Location'}`
      : `🍏 *Choucair Fresh - Order Confirmation*\n\nThank you for your order, *${order.customerInfo?.name || 'Valued Customer'}*!\n\n*Order ID:* #${order._id.toString().slice(-6).toUpperCase()}\n*Total:* $${order.totalPrice?.toFixed(2)}\n*Payment Method:* ${order.paymentMethod}\n*Delivery Address:* ${order.customerInfo?.address || 'Provided Location'}\n\n*Items:*\n${itemsSummary}\n\nOur team is preparing your fresh order. Track updates on your Choucair Fresh profile!`;

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
