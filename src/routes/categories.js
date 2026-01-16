const express = require('express');
const router = express.Router();
const db = require('../services/database');

// Get all product categories
router.get('/', (req, res) => {
  try {
    const categories = Array.from(db.categories.values());
    const activeCategories = categories.filter(c => c.active);
    res.json({ 
      success: true, 
      total: categories.length,
      active: activeCategories.length,
      categories: activeCategories 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single category by slug
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const category = db.categories.get(slug);
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    // Get suppliers in this category
    const suppliers = Array.from(db.suppliers.values())
      .filter(s => s.category === slug);
    
    res.json({ 
      success: true, 
      category,
      suppliersCount: suppliers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get suppliers by category
router.get('/:slug/suppliers', (req, res) => {
  try {
    const { slug } = req.params;
    const category = db.categories.get(slug);
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    const suppliers = Array.from(db.suppliers.values())
      .filter(s => s.category === slug)
      .map(s => ({
        id: s.id,
        name: s.name,
        location: s.location,
        productsCount: s.products.length,
        trustScore: calculateTrustScore(s)
      }));
    
    res.json({ 
      success: true, 
      category: category.name,
      suppliers 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function
function calculateTrustScore(supplier) {
  const totalOrders = supplier.completedOrders + supplier.failedOrders;
  if (totalOrders === 0) return 50;
  
  const deliveryRate = (supplier.completedOrders / totalOrders) * 40;
  const avgRating = (supplier.totalRating / supplier.ratingCount) * 30;
  const responseTime = Math.max(0, 15 - (supplier.avgResponseHours / 24) * 15);
  const orderVolume = Math.min(10, (totalOrders / 100) * 10);
  const disputeScore = Math.max(0, 5 - supplier.disputes);
  
  return Math.round(deliveryRate + avgRating + responseTime + orderVolume + disputeScore);
}

module.exports = router;
