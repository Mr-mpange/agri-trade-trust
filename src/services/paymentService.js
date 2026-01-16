const africastalking = require('../config/at');
const db = require('./database');

const payments = africastalking.PAYMENTS;
const sms = africastalking.SMS;

class PaymentService {
  async initiatePayment({ orderId, phoneNumber, amount }) {
    try {
      const result = await payments.mobileCheckout({
        productName: process.env.AT_USERNAME || 'AgriTrust',
        phoneNumber,
        currencyCode: 'KES',
        amount: parseFloat(amount),
        metadata: {
          orderId,
          type: 'escrow',
          timestamp: new Date().toISOString()
        }
      });
      
      // Store payment record
      db.payments.set(orderId, {
        orderId,
        phoneNumber,
        amount,
        status: 'pending',
        transactionId: result.transactionId,
        createdAt: new Date()
      });
      
      return {
        orderId,
        transactionId: result.transactionId,
        status: 'Payment initiated',
        message: 'Check your phone to complete payment'
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }
  
  async handlePaymentCallback(callbackData) {
    const { transactionId, status, phoneNumber, value, requestMetadata } = callbackData;
    
    console.log('Processing payment callback:', { transactionId, status });
    
    if (status === 'Success') {
      const orderId = requestMetadata?.orderId;
      if (orderId) {
        const payment = db.payments.get(orderId);
        if (payment) {
          payment.status = 'completed';
          payment.completedAt = new Date();
          db.payments.set(orderId, payment);
          
          // Update order status
          const order = db.orders.get(orderId);
          if (order) {
            order.status = 'paid';
            order.paidAt = new Date();
            db.orders.set(orderId, order);
            
            // Notify buyer
            await sms.send({
              to: [phoneNumber],
              message: `Payment received for ${orderId}. Your order is being processed. Track: *384*123#`,
              from: process.env.AT_SENDER_ID || 'AGRITRUST'
            });
          }
        }
      }
    }
    
    return { transactionId, status: 'processed' };
  }
  
  async releasePayment({ orderId, supplierPhone, amount }) {
    try {
      const result = await payments.mobileB2C({
        productName: process.env.AT_USERNAME || 'AgriTrust',
        recipients: [{
          phoneNumber: supplierPhone,
          currencyCode: 'KES',
          amount: parseFloat(amount),
          reason: 'SalaryPayment',
          metadata: {
            orderId,
            type: 'release',
            timestamp: new Date().toISOString()
          }
        }]
      });
      
      // Update payment record
      const payment = db.payments.get(orderId);
      if (payment) {
        payment.status = 'released';
        payment.releasedAt = new Date();
        payment.releasedTo = supplierPhone;
        db.payments.set(orderId, payment);
      }
      
      // Notify supplier
      await sms.send({
        to: [supplierPhone],
        message: `Payment released! KES ${amount} for order ${orderId}. Check your M-Pesa.`,
        from: process.env.AT_SENDER_ID || 'AGRITRUST'
      });
      
      return {
        orderId,
        status: 'Payment released',
        amount,
        recipient: supplierPhone
      };
    } catch (error) {
      console.error('Payment release error:', error);
      throw new Error(`Payment release failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
