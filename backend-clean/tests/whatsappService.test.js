import axios from 'axios';
import {
  normalizePhoneForWhatsApp,
  sendWhatsAppOrderNotification,
  sendWhatsAppOtp,
} from '../utils/whatsappService.js';

const environmentKeys = [
  'NODE_ENV',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_OTP_TEMPLATE',
  'WHATSAPP_TEMPLATE_LANG',
  'WHATSAPP_GRAPH_API_VERSION',
];
const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]])
);
const originalAxiosPost = axios.post;

beforeEach(() => {
  process.env.NODE_ENV = 'production';
  process.env.WHATSAPP_ACCESS_TOKEN = 'test-access-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';
  process.env.WHATSAPP_TEMPLATE_LANG = 'en_US';
  delete process.env.WHATSAPP_OTP_TEMPLATE;
  delete process.env.WHATSAPP_GRAPH_API_VERSION;
});

afterEach(() => {
  axios.post = originalAxiosPost;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('WhatsApp Cloud API service', () => {
  it('normalizes Lebanese local and international phone numbers to digits only', () => {
    expect(normalizePhoneForWhatsApp('+961 70 123 456')).toBe('96170123456');
    expect(normalizePhoneForWhatsApp('+961 03 123 456')).toBe('9613123456');
    expect(normalizePhoneForWhatsApp('070-123-456')).toBe('96170123456');
    expect(normalizePhoneForWhatsApp('70 123 456')).toBe('96170123456');
    expect(normalizePhoneForWhatsApp('+1 (202) 555-0123')).toBe('12025550123');
    expect(normalizePhoneForWhatsApp('0033 6 12 34 56 78')).toBe('33612345678');
  });

  it('rejects malformed phone numbers rather than sending to a stripped value', () => {
    expect(() => normalizePhoneForWhatsApp('phone 96170123456')).toThrow(
      'Invalid WhatsApp recipient phone number'
    );
    expect(() => normalizePhoneForWhatsApp('123')).toThrow(
      'Invalid WhatsApp recipient phone number'
    );
  });

  it('sends the configured authentication template and Copy code OTP parameters', async () => {
    let requestArgs;
    axios.post = async (...args) => {
      requestArgs = args;
      return { data: { messages: [{ id: 'wamid.accepted' }] } };
    };

    const result = await sendWhatsAppOtp('070 123 456', '123456');

    expect(result).toEqual({ success: true, messageId: 'wamid.accepted' });
    expect(requestArgs[0]).toBe('https://graph.facebook.com/v26.0/123456789/messages');
    expect(requestArgs[2].headers).toEqual({
      Authorization: 'Bearer test-access-token',
      'Content-Type': 'application/json',
    });
    expect(requestArgs[1]).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '96170123456',
      type: 'template',
      template: {
        name: 'chocair_otp',
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: '123456' }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: '123456' }],
          },
        ],
      },
    });
  });

  it('uses an explicitly configured Graph API version and template language', async () => {
    let requestArgs;
    process.env.WHATSAPP_GRAPH_API_VERSION = 'v25.0';
    process.env.WHATSAPP_OTP_TEMPLATE = 'custom_approved_otp';
    process.env.WHATSAPP_TEMPLATE_LANG = 'en';
    axios.post = async (...args) => {
      requestArgs = args;
      return { data: { messages: [{ id: 'wamid.accepted' }] } };
    };

    await sendWhatsAppOtp('+96170123456', '654321');

    expect(requestArgs[0]).toBe('https://graph.facebook.com/v25.0/123456789/messages');
    expect(requestArgs[1].template.name).toBe('custom_approved_otp');
    expect(requestArgs[1].template.language.code).toBe('en');
  });

  it('fails safely when credentials or the approved template language are missing', async () => {
    const axiosCalls = [];
    axios.post = async (...args) => {
      axiosCalls.push(args);
      return { data: { messages: [{ id: 'wamid.unexpected' }] } };
    };

    delete process.env.WHATSAPP_ACCESS_TOKEN;
    await expect(sendWhatsAppOtp('+96170123456', '123456')).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('WHATSAPP_ACCESS_TOKEN'),
    });
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-access-token';

    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    await expect(sendWhatsAppOtp('+96170123456', '123456')).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('WHATSAPP_PHONE_NUMBER_ID'),
    });
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';

    delete process.env.WHATSAPP_TEMPLATE_LANG;
    await expect(sendWhatsAppOtp('+96170123456', '123456')).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('WHATSAPP_TEMPLATE_LANG'),
    });

    expect(axiosCalls).toHaveLength(0);
  });

  it('does not fall back to ordinary text and preserves Meta error codes without leaking secrets', async () => {
    const recipient = '96170123456';
    const otp = '937204';
    const secret = process.env.WHATSAPP_ACCESS_TOKEN;
    const calls = [];
    const logged = [];
    const originalError = console.error;
    axios.post = async (...args) => {
      calls.push(args);
      const error = new Error('request failed');
      error.response = {
        status: 400,
        data: {
          error: {
            message: 'Template language mismatch',
            code: 132001,
            error_subcode: 2388001,
          },
        },
      };
      throw error;
    };
    console.error = (...args) => logged.push(JSON.stringify(args));

    try {
      const result = await sendWhatsAppOtp(`+${recipient}`, otp);

      expect(result).toMatchObject({ success: false, code: 132001, subcode: 2388001 });
      expect(calls).toHaveLength(1);
      expect(calls[0][1].type).toBe('template');
      expect(logged.join('\n')).toContain('132001');
      expect(logged.join('\n')).toContain('2388001');
      expect(logged.join('\n')).not.toContain(recipient);
      expect(logged.join('\n')).not.toContain(otp);
      expect(logged.join('\n')).not.toContain(secret);
      expect(JSON.stringify(result)).not.toContain(recipient);
      expect(JSON.stringify(result)).not.toContain(otp);
      expect(JSON.stringify(result)).not.toContain(secret);
    } finally {
      console.error = originalError;
    }
  });

  it('keeps order notifications as text messages on the configured Graph API version', async () => {
    let requestArgs;
    axios.post = async (...args) => {
      requestArgs = args;
      return { data: { messages: [{ id: 'wamid.order' }] } };
    };
    const order = {
      _id: '0123456789abcdef01234567',
      orderItems: [{ name: 'Apples', qty: 2, unit: 'kg', price: 3 }],
      customerInfo: {
        name: 'Test Customer',
        phone: '+96170123456',
        address: 'Test address',
      },
      totalPrice: 6,
      paymentMethod: 'Cash',
    };

    const result = await sendWhatsAppOrderNotification(
      '+96170111222',
      order,
      { isAdmin: false }
    );

    expect(result).toMatchObject({ success: true, messageId: 'wamid.order', isAdmin: false });
    expect(requestArgs[0]).toBe('https://graph.facebook.com/v26.0/123456789/messages');
    expect(requestArgs[1]).toMatchObject({
      messaging_product: 'whatsapp',
      to: '96170111222',
      type: 'text',
      text: { preview_url: false },
    });
    expect(requestArgs[1].text.body).toContain('Order Confirmation');
    expect(requestArgs[1].text.body).toContain('Apples (2x kg)');
    expect(requestArgs[1]).not.toHaveProperty('template');
  });
});
