const express = require('express');
const at = require('../config/at');
const { generateReply } = require('../services/ai');
const supplierService = require('../services/supplierService');
const orderService = require('../services/orderService');

const router = express.Router();
const sms = at.SMS;

// Verbose request logger for all /sms routes
router.use((req, res, next) => {
  try {
    const info = {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        host: req.get('host'),
        'content-type': req.get('content-type'),
        'user-agent': req.get('user-agent'),
        'x-forwarded-for': req.get('x-forwarded-for'),
      },
      body: req.body,
    };
    console.log('[SMS Route][Request]', info);
  } catch (e) {
    console.warn('[SMS Route][Request] log failed:', e.message);
  }
  next();
});

// POST /sms/send - 1-way SMS
router.post('/send', async (req, res) => {
  try {
    const { to, message, from } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'to and message are required' });
    }

    const isSandbox = (process.env.AT_USERNAME || 'sandbox') === 'sandbox';
    const options = {
      to: Array.isArray(to) ? to : String(to).split(',').map(s => s.trim()).filter(Boolean),
      message,
    };

    if (from) {
      options.from = from; // explicit senderId/shortcode
    } else if (!isSandbox && process.env.AT_FROM_SHORTCODE) {
      options.from = String(process.env.AT_FROM_SHORTCODE);
    } else if (!isSandbox) {
      console.warn('[SMS Send] No 2-way sender configured. Replies may NOT be delivered to your webhook. Set AT_FROM_SHORTCODE in .env or pass "from".');
    }

    console.log('[SMS Send][Prepare]', {
      isSandbox,
      toCount: options.to.length,
      from: options.from || '(default)',
      length: String(message).length,
    });

    const response = await sms.send(options);
    const firstRecipient = response?.SMSMessageData?.Recipients?.[0];
    console.log('[SMS Send][Sent]', {
      status: firstRecipient?.status || 'UNKNOWN',
      statusCode: firstRecipient?.statusCode,
      messageId: firstRecipient?.messageId,
      cost: firstRecipient?.cost,
    });
    return res.json({ ok: true, response });
  } catch (err) {
    console.error('SMS send error', err);
    return res.status(500).json({ error: 'Failed to send SMS', details: err.message });
  }
});

// POST /sms/bulk - Bulk SMS
router.post('/bulk', async (req, res) => {
  try {
    const { recipients, message, from } = req.body;
    if (!recipients || !message) {
      return res.status(400).json({ error: 'recipients and message are required' });
    }

    const isSandbox = (process.env.AT_USERNAME || 'sandbox') === 'sandbox';
    const toList = Array.isArray(recipients)
      ? recipients
      : String(recipients).split(',').map(s => s.trim()).filter(Boolean);

    const options = { to: toList, message };
    if (from) {
      options.from = from;
    } else if (!isSandbox && process.env.AT_FROM_SHORTCODE) {
      options.from = String(process.env.AT_FROM_SHORTCODE);
    }

    console.log('[SMS Bulk][Prepare]', {
      isSandbox,
      toCount: toList.length,
      from: options.from || '(default)',
      length: String(message).length,
    });

    const response = await sms.send(options);
    const firstRecipient = response?.SMSMessageData?.Recipients?.[0];
    console.log('[SMS Bulk][Sent]', {
      status: firstRecipient?.status || 'UNKNOWN',
      statusCode: firstRecipient?.statusCode,
      messageId: firstRecipient?.messageId,
      cost: firstRecipient?.cost,
    });
    return res.json({ ok: true, count: toList.length, response });
  } catch (err) {
    console.error('Bulk SMS error', err);
    return res.status(500).json({ error: 'Failed to send bulk SMS', details: err.message });
  }
});

// POST /sms/inbound - 2-way SMS webhook
// Africa's Talking will POST fields like: text, date, id, linkId, to, from
router.post('/inbound', async (req, res) => {
  try {
    const { text, from, to, date, id, linkId } = req.body;
    const debug = req.query.debug === '1' || req.header('x-debug') === '1';
    console.log('[Inbound SMS]', { text, from, to, date, id, linkId, debug });
    const isSandbox = (process.env.AT_USERNAME || 'sandbox') === 'sandbox';
    console.log('[Inbound SMS][Env]', { isSandbox, username: process.env.AT_USERNAME || 'sandbox' });

    if (!from) {
      console.warn('[Inbound SMS][Guard] Missing "from" in payload');
    }
    if (typeof text !== 'string') {
      console.warn('[Inbound SMS][Guard] Missing or invalid "text" in payload');
    }

    // AgriTrust command handling
    let agriResponse = null;
    if (from && typeof text === 'string') {
      const upperText = text.trim().toUpperCase();
      
      // ORDER command: ORDER MAIZE 50KG
      if (upperText.startsWith('ORDER ')) {
        try {
          const parts = upperText.split(' ');
          const productType = parts[1]?.toLowerCase();
          const quantity = parts[2]?.replace(/[^\d]/g, '');
          
          if (productType && quantity) {
            const suppliers = await supplierService.listSuppliers(productType);
            if (suppliers.length > 0) {
              agriResponse = `${suppliers.length} suppliers found:\n`;
              suppliers.slice(0, 3).forEach((s, i) => {
                agriResponse += `${i + 1}. ${s.name} ${s.stars} KES${s.price}\n`;
              });
              agriResponse += 'Reply with number to order';
            } else {
              agriResponse = `No suppliers available for ${productType}`;
            }
          }
        } catch (e) {
          console.error('[AgriTrust][ORDER] error:', e);
        }
      }
      
      // TRACK command: TRACK ORD-1234
      else if (upperText.startsWith('TRACK ')) {
        try {
          const orderId = upperText.split(' ')[1];
          const status = await orderService.trackOrder(orderId);
          agriResponse = `Order: ${orderId}\nStatus: ${status.status}\nProduct: ${status.quantity}kg ${status.productType}`;
        } catch (e) {
          agriResponse = 'Order not found';
        }
      }
      
      // YES/NO for supplier confirmation
      else if (upperText === 'YES' || upperText === 'NO') {
        agriResponse = 'Command received. Use USSD *384*123# for full ordering.';
      }
      
      // HELP command
      else if (upperText === 'HELP' || upperText === 'MENU') {
        agriResponse = 'AgriTrust Commands:\nORDER [product] [qty] - Place order\nTRACK [order-id] - Track order\nDial *384*123# for full menu';
      }
      
      // Unknown command - provide help
      else {
        agriResponse = 'Unknown command. Send HELP for available commands or dial *384*34153# for full menu.';
      }
    }

    // Send AgriTrust response if command was recognized
    if (agriResponse && from) {
      try {
        const replyFrom = (!isSandbox && process.env.AT_FROM_SHORTCODE) ? String(process.env.AT_FROM_SHORTCODE) : (to || undefined);
        const sendOptions = { to: [from], message: agriResponse };
        if (replyFrom) sendOptions.from = replyFrom;
        if (linkId) sendOptions.linkId = linkId;
        console.log('[AgriTrust Reply][Prepare]', { to: from, from: replyFrom || '(default)' });
        const sendResult = await sms.send(sendOptions);
        const firstRecipient = sendResult?.SMSMessageData?.Recipients?.[0];
        console.log('[AgriTrust Reply][Sent]', {
          status: firstRecipient?.status || 'UNKNOWN',
          statusCode: firstRecipient?.statusCode,
          messageId: firstRecipient?.messageId,
        });
        return res.status(200).send('OK');
      } catch (e) {
        console.error('[AgriTrust Reply] failed:', e);
      }
    }

    // AI-powered reply using Gemini (fallback for non-agri commands)
    let aiText;
    if (from && typeof text === 'string' && !agriResponse) {
      try {
        aiText = await generateReply(text, from);
        const replyFrom = (!isSandbox && process.env.AT_FROM_SHORTCODE) ? String(process.env.AT_FROM_SHORTCODE) : (to || undefined);
        const sendOptions = { to: [from], message: aiText };
        if (replyFrom) sendOptions.from = replyFrom;
        if (linkId) sendOptions.linkId = linkId; // required for premium 2-way continuity
        console.log('[AI Reply][Prepare]', {
          to: from,
          from: replyFrom || '(default)',
          linkIdPresent: Boolean(linkId),
          length: (aiText || '').length,
        });
        const sendResult = await sms.send(sendOptions);
        const firstRecipient = sendResult?.SMSMessageData?.Recipients?.[0];
        console.log('[AI Reply][Sent]', {
          status: firstRecipient?.status || 'UNKNOWN',
          statusCode: firstRecipient?.statusCode,
          messageId: firstRecipient?.messageId,
          cost: firstRecipient?.cost,
        });
      } catch (e) {
        console.warn('AI reply failed; falling back to simple ack:', e.message);
        try {
          const replyFrom = (!isSandbox && process.env.AT_FROM_SHORTCODE) ? String(process.env.AT_FROM_SHORTCODE) : (to || undefined);
          const sendOptions = { to: [from], message: `Ack: ${text}` };
          if (replyFrom) sendOptions.from = replyFrom;
          if (linkId) sendOptions.linkId = linkId;
          console.log('[AI Reply][Fallback][Prepare]', { to: from, from: replyFrom || '(default)', linkIdPresent: Boolean(linkId) });
          const sendResult = await sms.send(sendOptions);
          const firstRecipient = sendResult?.SMSMessageData?.Recipients?.[0];
          console.log('[AI Reply][Fallback][Sent]', {
            status: firstRecipient?.status || 'UNKNOWN',
            statusCode: firstRecipient?.statusCode,
            messageId: firstRecipient?.messageId,
            cost: firstRecipient?.cost,
          });
        } catch (e2) {
          console.warn('Fallback reply failed', e2.message);
        }
      }
    }

    // Must respond 200 quickly
    if (debug && (aiText || agriResponse)) {
      return res.status(200).json({ ok: true, aiText, agriResponse });
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Inbound SMS error', err);
    res.status(200).send('OK');
  }
});

module.exports = router;
