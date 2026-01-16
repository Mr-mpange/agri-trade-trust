const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

// Create new order
router.post('/create', async (req, res) => {
  try {
    const { buyerPhone, productType, quantity, supplierId } = req.body;
    const order = await orderService.createOrder({ buyerPhone, productType, quantity, supplierId });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track order
router.get('/:orderId/track', async (req, res) => {
  try {
    const { orderId } = req.params;
    const status = await orderService.trackOrder(orderId);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confirm delivery (buyer)
router.post('/:orderId/confirm-delivery', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryCode, buyerPhone } = req.body;
    const result = await orderService.confirmDelivery(orderId, deliveryCode, buyerPhone);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Supplier confirms dispatch
router.post('/:orderId/dispatch', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { supplierPhone } = req.body;
    const result = await orderService.confirmDispatch(orderId, supplierPhone);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
