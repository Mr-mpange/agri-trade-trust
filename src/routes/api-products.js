const express = require('express');
const router = express.Router();
const db = require('../services/database');

// Get all products across all categories
router.get('/', (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, limit = 50 } = req.query;
    
    let allProducts = [];
    const suppliers = Array.from(db.suppliers.values());
    
    suppliers.forEach(supplier => {
      supplier.products.forEach(product => {
        allProducts.push({
          productId: `${supplier.id}-${product.type}`,
          name: product.name || product.type,
          type: product.type,
          category: product.category,
          price: product.price,
          unit: product.unit,
          quantity: product.quantity,
          brand: product.brand,
          model: product.model,
          supplier: {
            id: supplier.id,
            name: supplier.name,
            location: supplier.location,
            phone: supplier.phone
          }
        });
      });
    });
    
    // Apply filters
    if (category) {
      allProducts = allProducts.filter(p => p.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower))
      );
    }
    
    if (minPrice) {
      allProducts = allProducts.filter(p => p.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      allProducts = allProducts.filter(p => p.price <= parseFloat(maxPrice));
    }
    
    // Limit results
    allProducts = allProducts.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      total: allProducts.length,
      products: allProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single product details
router.get('/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const [supplierId, productType] = productId.split('-');
    
    const supplier = db.suppliers.get(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const product = supplier.products.find(p => p.type === productType);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Calculate trust score
    const trustScore = calculateTrustScore(supplier);
    
    res.json({
      success: true,
      product: {
        productId,
        name: product.name || product.type,
        type: product.type,
        category: product.category,
        price: product.price,
        unit: product.unit,
        quantity: product.quantity,
        brand: product.brand,
        model: product.model,
        size: product.size,
        moq: product.moq,
        supplier: {
          id: supplier.id,
          name: supplier.name,
          location: supplier.location,
          phone: supplier.phone,
          trustScore,
          completedOrders: supplier.completedOrders,
          totalOrders: supplier.completedOrders + supplier.failedOrders
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search products
router.post('/search', (req, res) => {
  try {
    const { query, category, filters = {} } = req.body;
    
    let allProducts = [];
    const suppliers = Array.from(db.suppliers.values());
    
    suppliers.forEach(supplier => {
      const trustScore = calculateTrustScore(supplier);
      
      supplier.products.forEach(product => {
        allProducts.push({
          productId: `${supplier.id}-${product.type}`,
          name: product.name || product.type,
          type: product.type,
          category: product.category,
          price: product.price,
          unit: product.unit,
          quantity: product.quantity,
          brand: product.brand,
          model: product.model,
          supplier: {
            id: supplier.id,
            name: supplier.name,
            location: supplier.location,
            trustScore
          }
        });
      });
    });
    
    // Apply search query
    if (query) {
      const searchLower = query.toLowerCase();
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower)) ||
        (p.model && p.model.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (category) {
      allProducts = allProducts.filter(p => p.category === category);
    }
    
    // Apply additional filters
    if (filters.minPrice) {
      allProducts = allProducts.filter(p => p.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
      allProducts = allProducts.filter(p => p.price <= filters.maxPrice);
    }
    if (filters.location) {
      allProducts = allProducts.filter(p => 
        p.supplier.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.minTrustScore) {
      allProducts = allProducts.filter(p => p.supplier.trustScore >= filters.minTrustScore);
    }
    
    // Sort by trust score (highest first)
    allProducts.sort((a, b) => b.supplier.trustScore - a.supplier.trustScore);
    
    res.json({
      success: true,
      total: allProducts.length,
      products: allProducts
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
