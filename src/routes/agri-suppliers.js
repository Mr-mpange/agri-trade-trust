const express = require('express');
const router = express.Router();
const supplierService = require('../services/supplierService');

// Get supplier trust score
router.get('/:supplierId/trust-score', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const trustScore = await supplierService.getTrustScore(supplierId);
    res.json({ success: true, trustScore });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List suppliers by product
router.get('/list/:productType', async (req, res) => {
  try {
    const { productType } = req.params;
    const suppliers = await supplierService.listSuppliers(productType);
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update supplier inventory
router.post('/:supplierId/inventory', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { productType, quantity, price } = req.body;
    const result = await supplierService.updateInventory(supplierId, { productType, quantity, price });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
