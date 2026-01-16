const africastalking = require('../config/at');
const db = require('./database');

const sms = africastalking.SMS;

class OrderService {
  async createOrder({ buyerPhone, productType, quantity, supplierId }) {
    // Generate order ID
    const orderId = `ORD-${Date.now().toString().slice(-4)}`;
    const deliveryCode = Math.floor(1000 + Math.random() * 9000);
    
    // Store in database (mock for now)
    const order = {
      orderId,
      buyerPhone,
      productType,
      quantity,
      supplierId,
      status: 'pending',
      deliveryCode,
      createdAt: new Date()
    };
    
    db.orders.set(orderId, order);
    
    // Send SMS confirmation to buyer
    await sms.send({
      to: [buyerPhone],
      message: `Order ${orderId} confirmed! ${quantity}kg ${productType}. Pay to complete order. Track: *384*123#`,
      from: process.env.AT_SENDER_ID || 'AGRITRUST'
    });
    
    // Notify supplier
    const supplier = db.suppliers.get(supplierId);
    if (supplier) {
      await sms.send({
        to: [supplier.phone],
        message: `New order ${orderId}: ${quantity}kg ${productType}. Reply YES to accept.`,
        from: process.env.AT_SENDER_ID || 'AGRITRUST'
      });
    }
    
    return order;
  }
  
  async trackOrder(orderId) {
    const order = db.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    return {
      orderId: order.orderId,
      status: order.status,
      productType: order.productType,
      quantity: order.quantity,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery
    };
  }
  
  async confirmDelivery(orderId, deliveryCode, buyerPhone) {
    const order = db.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.buyerPhone !== buyerPhone) {
      throw new Error('Unauthorized');
    }
    
    if (parseInt(deliveryCode) !== order.deliveryCode) {
      throw new Error('Invalid delivery code');
    }
    
    // Update order status
    order.status = 'delivered';
    order.deliveredAt = new Date();
    db.orders.set(orderId, order);
    
    // Send confirmation SMS
    await sms.send({
      to: [buyerPhone],
      message: `Delivery confirmed for ${orderId}. Payment released to supplier. Rate your experience: *384*123#`,
      from: process.env.AT_SENDER_ID || 'AGRITRUST'
    });
    
    // Trigger payment release (handled by payment service)
    return { orderId, status: 'delivered', message: 'Payment released to supplier' };
  }
  
  async confirmDispatch(orderId, supplierPhone) {
    const order = db.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const supplier = db.suppliers.get(order.supplierId);
    if (!supplier || supplier.phone !== supplierPhone) {
      throw new Error('Unauthorized');
    }
    
    // Update status
    order.status = 'dispatched';
    order.dispatchedAt = new Date();
    order.estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days
    db.orders.set(orderId, order);
    
    // Notify buyer
    await sms.send({
      to: [order.buyerPhone],
      message: `Your order ${orderId} has been dispatched! Expected delivery: ${order.estimatedDelivery.toDateString()}. Delivery code: ${order.deliveryCode}`,
      from: process.env.AT_SENDER_ID || 'AGRITRUST'
    });
    
    return { orderId, status: 'dispatched', estimatedDelivery: order.estimatedDelivery };
  }
}

module.exports = new OrderService();
