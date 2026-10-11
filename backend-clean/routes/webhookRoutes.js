import express from 'express';

const router = express.Router();

/**
 * GET /api/webhook/whatsapp
 * Meta WhatsApp Webhook verification handshake.
 * Meta calls this when you click "تحقق وحفظ" (Verify and Save).
 */
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'choucair_fresh_webhook_secret';

  if (mode && token) {
    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✅ [WhatsApp Webhook] Verification successful with Meta!');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ [WhatsApp Webhook] Verification token mismatch');
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400);
});

/**
 * POST /api/webhook/whatsapp
 * Meta WhatsApp Webhook notification events (message deliveries, incoming replies).
 */
router.post('/whatsapp', (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      // Acknowledge receipt immediately to satisfy Meta SLA (within 3 seconds)
      res.status(200).send('EVENT_RECEIVED');

      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value;
            if (value?.messages) {
              for (const msg of value.messages) {
                console.log(`💬 [WhatsApp Incoming] From: ${msg.from} | Text: ${msg.text?.body || msg.type}`);
              }
            }
            if (value?.statuses) {
              for (const status of value.statuses) {
                console.log(`📊 [WhatsApp Status] Message ${status.id} -> ${status.status} (Recipient: ${status.recipient_id})`);
              }
            }
          }
        }
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ [WhatsApp Webhook Error]:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
