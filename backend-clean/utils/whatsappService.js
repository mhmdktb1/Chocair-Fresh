import axios from 'axios';
import process from 'node:process';

const DEFAULT_GRAPH_API_VERSION = 'v26.0';

export const normalizePhoneForWhatsApp = (phone) => {
  if (typeof phone !== 'string') {
    throw new Error('A phone number is required');
  }

  const value = phone.trim();
  if (!value || !/^\+?[\d\s().-]+$/.test(value)) {
    throw new Error('Invalid WhatsApp recipient phone number');
  }

  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('9610') && (digits.length === 11 || digits.length === 12)) {
    digits = `961${digits.slice(4)}`;
  } else if (digits.startsWith('961')) {
    // An explicit Lebanese country code is already in international format.
  } else if (digits.startsWith('0') && (digits.length === 8 || digits.length === 9)) {
    digits = `961${digits.slice(1)}`;
  } else if (
    (digits.length === 8 && /^[1378]/.test(digits)) ||
    (digits.length === 7 && digits.startsWith('3'))
  ) {
    digits = `961${digits}`;
  }

  if (!/^\d{8,15}$/.test(digits)) {
    throw new Error('Invalid WhatsApp recipient phone number');
  }

  return digits;
};

const getGraphApiVersion = () => {
  const configuredVersion = (process.env.WHATSAPP_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION).trim();
  const version = configuredVersion.startsWith('v') ? configuredVersion : `v${configuredVersion}`;
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new Error('WHATSAPP_GRAPH_API_VERSION must be a Graph API version such as v26.0');
  }
  return version;
};

const getCredentials = () => ({
  token: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  version: getGraphApiVersion(),
});

const getMessagesUrl = (phoneNumberId, version) =>
  `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const getMetaErrorDetails = (error) => {
  const metaError = error.response?.data?.error;
  return {
    code: metaError?.code ?? error.code,
    subcode: metaError?.error_subcode,
    httpStatus: error.response?.status,
    message: metaError?.message,
    details: metaError?.error_data?.details,
    userTitle: metaError?.error_user_title,
    userMessage: metaError?.error_user_msg,
    traceId: metaError?.fbtrace_id,
  };
};

const redactSensitiveValue = (value, secrets) => {
  if (typeof value === 'string') {
    return secrets
      .filter((secret) => typeof secret === 'string' && secret.length > 0)
      .sort((a, b) => b.length - a.length)
      .reduce((message, secret) => message.split(secret).join('[REDACTED]'), value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValue(item, secrets));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactSensitiveValue(item, secrets)])
    );
  }
  return value;
};

const logMetaFailure = (label, details, secrets = []) => {
  console.error(label, {
    code: details.code,
    subcode: details.subcode,
    httpStatus: details.httpStatus,
    message: redactSensitiveValue(details.message, secrets),
    details: redactSensitiveValue(details.details, secrets),
    userTitle: redactSensitiveValue(details.userTitle, secrets),
    userMessage: redactSensitiveValue(details.userMessage, secrets),
    traceId: details.traceId,
  });
};

export const sendWhatsAppOtp = async (phone, otp) => {
  if (process.env.NODE_ENV === 'test') {
    return { success: true, mode: 'test' };
  }

  let recipient;
  let credentials;
  try {
    recipient = normalizePhoneForWhatsApp(phone);
    credentials = getCredentials();
  } catch (error) {
    return { success: false, error: error.message };
  }

  const templateName = (process.env.WHATSAPP_OTP_TEMPLATE || 'chocair_otp').trim();
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANG;
  if (!credentials.token || !credentials.phoneNumberId) {
    console.error('WhatsApp OTP delivery is not configured', {
      missing: [
        ...(!credentials.token ? ['WHATSAPP_ACCESS_TOKEN'] : []),
        ...(!credentials.phoneNumberId ? ['WHATSAPP_PHONE_NUMBER_ID'] : []),
      ],
    });
    return {
      success: false,
      error: 'WhatsApp credentials are missing (WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required).',
    };
  }
  if (!templateLanguage || !templateLanguage.trim()) {
    console.error('WhatsApp OTP delivery is not configured', {
      missing: ['WHATSAPP_TEMPLATE_LANG'],
    });
    return {
      success: false,
      error: 'WHATSAPP_TEMPLATE_LANG must match the approved Meta template language code.',
    };
  }
  if (!templateName) {
    console.error('WhatsApp OTP delivery is not configured', {
      missing: ['WHATSAPP_OTP_TEMPLATE'],
    });
    return {
      success: false,
      error: 'WHATSAPP_OTP_TEMPLATE must match the approved Meta authentication template name.',
    };
  }
  if (typeof otp !== 'string' || !otp.trim()) {
    return { success: false, error: 'A valid OTP is required.' };
  }

  const otpValue = otp.trim();
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLanguage.trim() },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otpValue }],
        },
        {
          // Meta's authentication-template send API uses subtype "url" for
          // OTP buttons, including templates configured with the Copy code OTP type.
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: otpValue }],
        },
      ],
    },
  };

  try {
    const response = await axios.post(
      getMessagesUrl(credentials.phoneNumberId, credentials.version),
      payload,
      { headers: getAuthHeaders(credentials.token), timeout: 10000 }
    );
    const messageId = response.data?.messages?.[0]?.id;
    if (!messageId) {
      logMetaFailure('WhatsApp OTP API returned no message ID', {});
      return { success: false, error: 'Meta WhatsApp API did not confirm message acceptance.' };
    }

    console.log('WhatsApp OTP template accepted by Meta');
    return { success: true, messageId };
  } catch (error) {
    const details = getMetaErrorDetails(error);
    logMetaFailure('WhatsApp OTP delivery failed', details, [
      credentials.token,
      credentials.phoneNumberId,
      recipient,
      otpValue,
    ]);
    return {
      success: false,
      error: 'Meta WhatsApp API rejected the OTP template request.',
      code: details.code,
      subcode: details.subcode,
    };
  }
};

export const sendWhatsAppOrderNotification = async (phone, order, options = {}) => {
  if (process.env.NODE_ENV === 'test') {
    return { success: true, mode: 'test' };
  }

  let recipient;
  let credentials;
  try {
    recipient = normalizePhoneForWhatsApp(phone);
    credentials = getCredentials();
  } catch (error) {
    return { success: false, error: error.message, isAdmin: !!options.isAdmin };
  }

  const isAdmin = !!options.isAdmin;

  if (!credentials.token || !credentials.phoneNumberId) {
    console.log(`WhatsApp credentials are not configured; order notification for #${order._id} was not sent.`);
    return { success: true, mode: 'dev_simulation' };
  }

  const itemsSummary = (order.orderItems || [])
    .map((item) => `• ${item.name} (${item.qty}x ${item.unit || '1kg'}) - $${(item.price * item.qty).toFixed(2)}${item.instruction ? `\n   ↳ 📝 Note: "${item.instruction}"` : ''}`)
    .join('\n');

  const messageText = isAdmin
    ? `🚨 *Choucair Fresh - New Order Alert*\n\nA new order has been placed.\n\n*Order ID:* #${order._id.toString().slice(-6).toUpperCase()}\n*Customer:* ${order.customerInfo?.name || 'Guest'}\n*Phone:* ${order.customerInfo?.phone || 'Not provided'}\n*Total:* $${order.totalPrice?.toFixed(2)}\n*Payment Method:* ${order.paymentMethod}\n\n*Items:*\n${itemsSummary}\n\n*Delivery Address:* ${order.customerInfo?.address || 'Provided Location'}`
    : `🍏 *Choucair Fresh - Order Confirmation*\n\nThank you for your order, *${order.customerInfo?.name || 'Valued Customer'}*!\n\n*Order ID:* #${order._id.toString().slice(-6).toUpperCase()}\n*Total:* $${order.totalPrice?.toFixed(2)}\n*Payment Method:* ${order.paymentMethod}\n*Delivery Address:* ${order.customerInfo?.address || 'Provided Location'}\n\n*Items:*\n${itemsSummary}\n\nOur team is preparing your fresh order. Track updates on your Choucair Fresh profile!`;

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

  try {
    const response = await axios.post(
      getMessagesUrl(credentials.phoneNumberId, credentials.version),
      payload,
      {
        headers: getAuthHeaders(credentials.token),
        timeout: 10000,
      }
    );

    return { success: true, messageId: response.data?.messages?.[0]?.id, isAdmin };
  } catch (error) {
    const details = getMetaErrorDetails(error);
    logMetaFailure('WhatsApp order notification failed', details, [
      credentials.token,
      credentials.phoneNumberId,
      recipient,
    ]);
    return {
      success: false,
      error: 'Meta WhatsApp API rejected the order notification.',
      code: details.code,
      subcode: details.subcode,
      isAdmin,
    };
  }
};
