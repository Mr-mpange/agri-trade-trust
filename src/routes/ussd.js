const express = require('express');
const at = require('../config/at');
const axios = require('axios');
const supplierService = require('../services/supplierService');
const orderService = require('../services/orderService');
const db = require('../services/database');

const router = express.Router();
const voice = at.VOICE;
const sms = at.SMS;

// USSD Endpoint
// AT sends: sessionId, serviceCode, phoneNumber, text
router.post('/', async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  console.log('[USSD]', { sessionId, serviceCode, phoneNumber, text });

  // Use shortcode only in LIVE. In SANDBOX, omit 'from' so SMS comes from sandbox number
  const isSandbox = (process.env.AT_USERNAME || 'sandbox') === 'sandbox';

  // Simple menu flow
  if (!text || text === '') {
    const response = 'CON Welcome to AgriTrust & Trade\n1. Buy Products\n2. Track Order\n3. My Account\n4. Demo Menu';
    return res.send(response);
  }
  
  // AgriTrust Menu - Buy Products - Show Categories
  if (text === '1') {
    const response = 'CON Select Category:\n1. Agriculture 🌾\n2. Electronics 📱\n3. Retail Goods 🏪\n4. Hardware 🔧\n5. Wholesale 📦\n0. More...';
    return res.send(response);
  }
  
  // Category selected - show products
  if (text.match(/^1\*[1-5]$/)) {
    const categoryMap = { 
      '1': { name: 'agriculture', products: ['Maize', 'Rice', 'Seeds', 'Fertilizer'] },
      '2': { name: 'electronics', products: ['Phones', 'Laptops', 'Accessories', 'Tablets'] },
      '3': { name: 'retail', products: ['Clothing', 'Cosmetics', 'Shoes', 'Household'] },
      '4': { name: 'hardware', products: ['Cement', 'Iron Sheets', 'Tools', 'Paint'] },
      '5': { name: 'wholesale', products: ['Sugar', 'Cooking Oil', 'Rice Bulk', 'Flour'] }
    };
    const categoryChoice = text.split('*')[1];
    const category = categoryMap[categoryChoice];
    
    if (!category) {
      return res.send('END Invalid category');
    }
    
    // Store category in session
    db.ussdSessions.set(sessionId, { category: category.name });
    
    let response = `CON Select Product:\n`;
    category.products.forEach((p, i) => {
      response += `${i + 1}. ${p}\n`;
    });
    return res.send(response);
  }
  
  // Product selected - show suppliers
  if (text.match(/^1\*[1-5]\*[1-4]$/)) {
    const parts = text.split('*');
    const categoryChoice = parts[1];
    const productChoice = parts[2];
    
    const categoryMap = { 
      '1': { name: 'agriculture', products: ['maize', 'rice', 'seeds', 'fertilizer'] },
      '2': { name: 'electronics', products: ['phone', 'laptop', 'accessories', 'tablet'] },
      '3': { name: 'retail', products: ['clothing', 'cosmetics', 'shoes', 'household'] },
      '4': { name: 'hardware', products: ['cement', 'iron-sheets', 'tools', 'paint'] },
      '5': { name: 'wholesale', products: ['sugar', 'cooking-oil', 'rice', 'flour'] }
    };
    
    const category = categoryMap[categoryChoice];
    const productType = category.products[parseInt(productChoice) - 1];
    
    try {
      const suppliers = await supplierService.listSuppliers(productType);
      if (suppliers.length === 0) {
        return res.send('END No suppliers available for this product.');
      }
      
      // Store session data
      db.ussdSessions.set(sessionId, { 
        category: category.name,
        productType, 
        suppliers 
      });
      
      let response = `CON ${productType.toUpperCase()} Suppliers:\n`;
      suppliers.slice(0, 3).forEach((s, i) => {
        response += `${i + 1}. ${s.name} ${s.stars} KES${s.price}\n`;
      });
      return res.send(response);
    } catch (error) {
      console.error('[USSD] Supplier list error:', error);
      return res.send('END Error loading suppliers. Try again.');
    }
  }
  
  // Supplier selected - enter quantity
  if (text.match(/^1\*[1-5]\*[1-4]\*[1-3]$/)) {
    const response = 'CON Enter quantity:';
    return res.send(response);
  }
  
  // Quantity entered - confirm order
  if (text.match(/^1\*[1-5]\*[1-4]\*[1-3]\*\d+$/)) {
    const parts = text.split('*');
    const supplierIndex = parseInt(parts[3]) - 1;
    const quantity = parts[4];
    
    const session = db.ussdSessions.get(sessionId);
    if (!session || !session.suppliers[supplierIndex]) {
      return res.send('END Session expired. Please try again.');
    }
    
    const supplier = session.suppliers[supplierIndex];
    const total = supplier.price * parseInt(quantity);
    
    const response = `CON Confirm Order:\n${quantity} ${session.productType}\nFrom: ${supplier.name}\nTotal: KES${total}\n1. Confirm\n2. Cancel`;
    
    // Store order details in session
    session.selectedSupplier = supplier;
    session.quantity = quantity;
    session.total = total;
    db.ussdSessions.set(sessionId, session);
    
    return res.send(response);
  }
  
  // Order confirmed
  if (text.match(/^1\*[1-5]\*[1-4]\*[1-3]\*\d+\*1$/)) {
    const session = db.ussdSessions.get(sessionId);
    if (!session) {
      return res.send('END Session expired. Please try again.');
    }
    
    try {
      const order = await orderService.createOrder({
        buyerPhone: phoneNumber,
        productType: session.productType,
        quantity: session.quantity,
        supplierId: session.selectedSupplier.supplierId
      });
      
      // Clean up session
      db.ussdSessions.delete(sessionId);
      
      return res.send(`END Order ${order.orderId} created!\nPay KES${session.total} to complete.\nCheck SMS for details.`);
    } catch (error) {
      console.error('[USSD] Order creation error:', error);
      return res.send('END Error creating order. Try again.');
    }
  }
  
  // Track Order
  if (text === '2') {
    const response = 'CON Enter Order ID (e.g., ORD-1234):';
    return res.send(response);
  }
  
  if (text.match(/^2\*ORD-\d+$/)) {
    const orderId = text.split('*')[1];
    try {
      const status = await orderService.trackOrder(orderId);
      return res.send(`END Order: ${orderId}\nStatus: ${status.status}\nProduct: ${status.quantity}kg ${status.productType}`);
    } catch (error) {
      return res.send('END Order not found.');
    }
  }
  
  // My Account
  if (text === '3') {
    const response = 'CON My Account:\n1. Order History\n2. Trust Score\n3. Settings';
    return res.send(response);
  }
  
  // Demo Menu (original functionality)
  if (text === '4') {
    const response = 'CON Demo Menu:\n1. Balance\n2. Buy Airtime\n3. Help\n4. Call Assistance';
    return res.send(response);
  }
  
  if (text === '4*1') {
    const response = 'END Your balance is KES 123.45 (sandbox)';
    // Fire-and-forget SMS confirmation
    try {
      const options = { to: [phoneNumber], message: 'Your balance is KES 123.45 (sandbox)' };
      if (!isSandbox && process.env.AT_FROM_SHORTCODE) {
        options.from = String(process.env.AT_FROM_SHORTCODE);
      }
      sms.send(options).catch(e => console.warn('[USSD][SMS][1] send failed:', e.message));
    } catch (e) {
      console.warn('[USSD][SMS][1] setup failed:', e.message);
    }
    return res.send(response);
  }

  if (text === '4*2') {
    const response = 'CON Enter amount:';
    return res.send(response);
  }

  // e.g., '4*2*100'
  if (text.startsWith('4*2*')) {
    const amount = text.split('*')[2] || '0';
    const response = `END Airtime purchase of KES ${amount} processed (sandbox).`;
    // Fire-and-forget SMS confirmation
    try {
      const options = { to: [phoneNumber], message: `Airtime purchase of KES ${amount} processed (sandbox).` };
      if (!isSandbox && process.env.AT_FROM_SHORTCODE) {
        options.from = String(process.env.AT_FROM_SHORTCODE);
      }
      sms.send(options).catch(e => console.warn('[USSD][SMS][2*] send failed:', e.message));
    } catch (e) {
      console.warn('[USSD][SMS][2*] setup failed:', e.message);
    }
    return res.send(response);
  }

  if (text === '4*3') {
    // Fire-and-forget SMS help message
    try {
      const options = { to: [phoneNumber], message: 'For assistance, reply via SMS or choose option 4 to get a call.' };
      if (!isSandbox && process.env.AT_FROM_SHORTCODE) {
        options.from = String(process.env.AT_FROM_SHORTCODE);
      }
      sms.send(options).catch(e => console.warn('[USSD][SMS][3] send failed:', e.message));
    } catch (e) {
      console.warn('[USSD][SMS][3] setup failed:', e.message);
    }
    return res.send('END For assistance, reply via SMS or choose option 4 to get a call.');
  }

  if (text === '4*4') {
    // Trigger outbound voice call from AT number to the USSD caller
    const callFrom = process.env.AT_VOICE_PHONE_NUMBER;
    const callTo = phoneNumber; // MSISDN of USSD caller
    if (!callFrom) {
      console.warn('[USSD] AT_VOICE_PHONE_NUMBER missing. Cannot initiate call.');
      return res.send('END Calling is not configured.');
    }
    try {
      try {
        await voice.call({ callFrom, callTo });
        console.log('[USSD] Voice call initiated via SDK', { callFrom, callTo });
      } catch (sdkErr) {
        console.warn('[USSD] SDK call failed, using REST fallback:', sdkErr.message);
        const { AT_USERNAME, AT_API_KEY } = process.env;
        if (!AT_USERNAME || !AT_API_KEY) {
          console.warn('[USSD] Missing AT credentials for REST fallback');
          return res.send('END Could not initiate the call.');
        }
        const form = new URLSearchParams();
        form.append('username', AT_USERNAME);
        form.append('from', callFrom);
        form.append('to', callTo);
        await axios.post('https://voice.africastalking.com/call', form.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            apikey: AT_API_KEY,
          },
          timeout: 15000,
        });
        console.log('[USSD] Voice call initiated via REST', { callFrom, callTo });
      }
      // Fire-and-forget SMS confirmation of call
      try {
        const options = { to: [phoneNumber], message: 'We are calling you now. Please pick up.' };
        if (!isSandbox && process.env.AT_FROM_SHORTCODE) {
          options.from = String(process.env.AT_FROM_SHORTCODE);
        }
        sms.send(options).catch(e => console.warn('[USSD][SMS][4] send failed:', e.message));
      } catch (e) {
        console.warn('[USSD][SMS][4] setup failed:', e.message);
      }
      return res.send('END We are calling you now. Please pick up.');
    } catch (err) {
      console.error('[USSD] Failed to initiate call', err.message);
      return res.send('END Sorry, failed to initiate the call.');
    }
  }

  return res.send('END Invalid choice');
});

module.exports = router;
