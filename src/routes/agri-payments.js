const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// Initiate payment (buyer pays into escrow)
router.post('/checkout', async (req, res) => {
  try {
    const { orderId, phoneNumber, amount } = req.body;
    const result = await paymentService.initiatePayment({ orderId, phoneNumber, amount });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payment callback webhook (from Africa's Talking)
router.post('/callback', async (req, res) => {
  try {
    console.log('Payment callback received:', req.body);
    const result = await paymentService.handlePaymentCallback(req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payment validation webhook (optional)
router.post('/validate', async (req, res) => {
  try {
    console.log('Payment validation:', req.body);
    // Validate payment before processing
    res.json({ status: 'Validated' });
  } catch (error) {
    res.status(500).json({ status: 'Failed', error: error.message });
  }
});

// Release payment to supplier (after delivery confirmed)
router.post('/release', async (req, res) => {
  try {
    const { orderId, supplierPhone, amount } = req.body;
    const result = await paymentService.releasePayment({ orderId, supplierPhone, amount });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
