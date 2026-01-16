const express = require('express');
const at = require('../config/at');
const { generateReply } = require('../services/ai');
const supplierService = require('../services/supplierService');
const orderService = require('../services/orderService');
const db = require('../services/database');

const router = express.Router();
const sms = at.SMS;

// SMS session storage (use Redis in production)
const smsSessions = new Map();

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

    // AgriTrust command handling with session management
    let agriResponse = null;
    if (from && typeof text === 'string') {
      const upperText = text.trim().toUpperCase();
      
      // Get or create session
      let session = smsSessions.get(from) || { step: 'idle' };
      
      // Handle based on current session step
      if (session.step === 'idle') {
        // No active session - check for commands
        
        if (upperText.startsWith('ORDER ')) {
          // ORDER MAIZE 50KG - direct order
          try {
            const parts = upperText.split(' ');
            const productType = parts[1]?.toLowerCase();
            const quantity = parts[2]?.replace(/[^\d]/g, '');
            
            if (productType && quantity) {
              const suppliers = await supplierService.listSuppliers(productType);
              if (suppliers.length > 0) {
                agriResponse = `${suppliers.length} suppliers found:\n`;
                suppliers.slice(0, 3).forEach((s, i) => {
                  agriResponse += `${i + 1}. ${s.name} ${s.stars} TZS${s.price}\n`;
                });
                agriResponse += 'Reply with number to order';
                
                // Save session
                session = {
                  step: 'select_supplier',
                  productType,
                  quantity,
                  suppliers
                };
                smsSessions.set(from, session);
              } else {
                agriResponse = `No suppliers available for ${productType}`;
              }
            }
          } catch (e) {
            console.error('[AgriTrust][ORDER] error:', e);
          }
        }
        else if (upperText === 'BUY' || upperText === 'ORDER') {
          // Start order flow
          agriResponse = 'Welcome to AgriTrust & Trade! 🌾\n\nSelect Category:\n1. Agriculture\n2. Electronics\n3. Retail\n4. Hardware\n5. Wholesale';
          session = { step: 'select_category' };
          smsSessions.set(from, session);
        }
        else if (upperText.startsWith('TRACK ')) {
          // TRACK ORD-1234
          try {
            const orderId = upperText.split(' ')[1];
            const status = await orderService.trackOrder(orderId);
            agriResponse = `Order: ${orderId}\nStatus: ${status.status}\nProduct: ${status.quantity} ${status.productType}`;
          } catch (e) {
            agriResponse = 'Order not found';
          }
        }
        else if (upperText === 'HELP' || upperText === 'MENU') {
          agriResponse = 'Welcome to AgriTrust & Trade! 🌾\n\nCommands:\nBUY - Start ordering\nORDER [product] [qty] - Quick order\nTRACK [order-id] - Track order\n\nOr dial *384*34153# for USSD menu';
        }
        else {
          agriResponse = 'Hello! Welcome to AgriTrust & Trade 🌾\n\nSend BUY to start ordering or HELP for commands.\n\nDial *384*34153# for full menu.';
        }
      }
      else if (session.step === 'select_category') {
        // User selected category
        const categoryMap = {
          '1': { name: 'agriculture', products: ['Maize', 'Rice', 'Seeds', 'Fertilizer'] },
          '2': { name: 'electronics', products: ['Phones', 'Laptops', 'Accessories'] },
          '3': { name: 'retail', products: ['Clothing', 'Cosmetics', 'Shoes'] },
          '4': { name: 'hardware', products: ['Cement', 'Tools', 'Paint'] },
          '5': { name: 'wholesale', products: ['Sugar', 'Cooking Oil', 'Rice'] }
        };
        
        const category = categoryMap[upperText];
        if (category) {
          agriResponse = `Select Product:\n`;
          category.products.forEach((p, i) => {
            agriResponse += `${i + 1}. ${p}\n`;
          });
          session.step = 'select_product';
          session.category = category;
          smsSessions.set(from, session);
        } else {
          agriResponse = 'Invalid choice. Send HELP to start over.';
          smsSessions.delete(from);
        }
      }
      else if (session.step === 'select_product') {
        // User selected product
        const productIndex = parseInt(upperText) - 1;
        if (productIndex >= 0 && productIndex < session.category.products.length) {
          const productType = session.category.products[productIndex].toLowerCase().replace(/ /g, '-');
          
          try {
            const suppliers = await supplierService.listSuppliers(productType);
            if (suppliers.length > 0) {
              agriResponse = `${productType.toUpperCase()} Suppliers:\n`;
              suppliers.slice(0, 3).forEach((s, i) => {
                agriResponse += `${i + 1}. ${s.name} ${s.stars} TZS${s.price}\n`;
              });
              agriResponse += 'Reply with number';
              
              session.step = 'select_supplier';
              session.productType = productType;
              session.suppliers = suppliers;
              smsSessions.set(from, session);
            } else {
              agriResponse = `No suppliers for ${productType}. Send HELP to start over.`;
              smsSessions.delete(from);
            }
          } catch (e) {
            agriResponse = 'Error loading suppliers. Send HELP to try again.';
            smsSessions.delete(from);
          }
        } else {
          agriResponse = 'Invalid choice. Send HELP to start over.';
          smsSessions.delete(from);
        }
      }
      else if (session.step === 'select_supplier') {
        // User selected supplier
        const supplierIndex = parseInt(upperText) - 1;
        if (supplierIndex >= 0 && supplierIndex < session.suppliers.length) {
          agriResponse = 'Enter quantity (e.g., 50):';
          session.step = 'enter_quantity';
          session.selectedSupplier = session.suppliers[supplierIndex];
          smsSessions.set(from, session);
        } else {
          agriResponse = 'Invalid choice. Send HELP to start over.';
          smsSessions.delete(from);
        }
      }
      else if (session.step === 'enter_quantity') {
        // User entered quantity
        const quantity = upperText.replace(/[^\d]/g, '');
        if (quantity && parseInt(quantity) > 0) {
          const total = session.selectedSupplier.price * parseInt(quantity);
          agriResponse = `Confirm Order:\n${quantity} ${session.productType}\nFrom: ${session.selectedSupplier.name}\nTotal: TZS${total}\nReply YES to confirm or NO to cancel`;
          
          session.step = 'confirm_order';
          session.quantity = quantity;
          session.total = total;
          smsSessions.set(from, session);
        } else {
          agriResponse = 'Invalid quantity. Enter a number (e.g., 50):';
        }
      }
      else if (session.step === 'confirm_order') {
        // User confirms order
        if (upperText === 'YES') {
          try {
            const order = await orderService.createOrder({
              buyerPhone: from,
              productType: session.productType,
              quantity: session.quantity,
              supplierId: session.selectedSupplier.supplierId
            });
            
            agriResponse = `Order ${order.orderId} created!\nPay TZS${session.total} to 34059\nDelivery code will be sent after payment.`;
            smsSessions.delete(from); // Clear session
          } catch (e) {
            agriResponse = 'Error creating order. Send HELP to try again.';
            smsSessions.delete(from);
          }
        } else if (upperText === 'NO') {
          agriResponse = 'Order cancelled. Send BUY to start over.';
          smsSessions.delete(from);
        } else {
          agriResponse = 'Reply YES to confirm or NO to cancel';
        }
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
