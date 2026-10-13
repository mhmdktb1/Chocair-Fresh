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

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!expectedToken) {
    console.error('WhatsApp webhook verification is not configured');
    return res.sendStatus(503);
  }

  if (mode && token) {
    if (mode === 'subscribe' && token === expectedToken) {
      console.log('WhatsApp webhook verification successful');
      return res.status(200).send(challenge);
    } else {
      console.warn('WhatsApp webhook verification token mismatch');
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
                console.log('WhatsApp incoming message received', { type: msg.type });
              }
            }
            if (value?.statuses) {
              for (const status of value.statuses) {
                console.log('WhatsApp message status updated', { status: status.status });
              }
            }
          }
        }
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('WhatsApp webhook event processing failed');
    res.status(500).send('Internal Server Error');
  }
});

export default router;
