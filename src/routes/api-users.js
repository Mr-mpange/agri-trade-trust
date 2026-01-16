const express = require('express');
const router = express.Router();
const db = require('../services/database');

// Register/Create user
router.post('/register', (req, res) => {
  try {
    const { phoneNumber, name, email, userType = 'buyer', location } = req.body;
    
    if (!phoneNumber || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'phoneNumber and name are required' 
      });
    }
    
    // Check if user exists
    if (db.users.has(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }
    
    const user = {
      phoneNumber,
      name,
      email,
      userType, // 'buyer' or 'supplier'
      location,
      createdAt: new Date(),
      orders: [],
      favorites: [],
      addresses: []
    };
    
    db.users.set(phoneNumber, user);
    
    res.json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile
router.get('/:phoneNumber', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = db.users.get(phoneNumber);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Get user's orders
    const userOrders = Array.from(db.orders.values())
      .filter(order => order.buyerPhone === phoneNumber);
    
    res.json({
      success: true,
      user: {
        ...user,
        totalOrders: userOrders.length,
        recentOrders: userOrders.slice(-5)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
router.put('/:phoneNumber', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const updates = req.body;
    
    const user = db.users.get(phoneNumber);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Update allowed fields
    const allowedFields = ['name', 'email', 'location'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });
    
    user.updatedAt = new Date();
    db.users.set(phoneNumber, user);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add delivery address
router.post('/:phoneNumber/addresses', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { label, address, city, region, isDefault = false } = req.body;
    
    const user = db.users.get(phoneNumber);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (!user.addresses) {
      user.addresses = [];
    }
    
    // If this is default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    const newAddress = {
      id: `ADDR-${Date.now()}`,
      label,
      address,
      city,
      region,
      isDefault,
      createdAt: new Date()
    };
    
    user.addresses.push(newAddress);
    db.users.set(phoneNumber, user);
    
    res.json({
      success: true,
      message: 'Address added successfully',
      address: newAddress
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to favorites
router.post('/:phoneNumber/favorites', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { productId, supplierId } = req.body;
    
    const user = db.users.get(phoneNumber);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    if (!user.favorites) {
      user.favorites = [];
    }
    
    // Check if already favorited
    const exists = user.favorites.some(fav => 
      fav.productId === productId || fav.supplierId === supplierId
    );
    
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already in favorites' 
      });
    }
    
    user.favorites.push({
      productId,
      supplierId,
      addedAt: new Date()
    });
    
    db.users.set(phoneNumber, user);
    
    res.json({
      success: true,
      message: 'Added to favorites',
      favorites: user.favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user order history
router.get('/:phoneNumber/orders', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { status, limit = 20 } = req.query;
    
    let orders = Array.from(db.orders.values())
      .filter(order => order.buyerPhone === phoneNumber);
    
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    // Sort by date (newest first)
    orders.sort((a, b) => b.createdAt - a.createdAt);
    
    // Limit results
    orders = orders.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      total: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user statistics
router.get('/:phoneNumber/stats', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const orders = Array.from(db.orders.values())
      .filter(order => order.buyerPhone === phoneNumber);
    
    const payments = Array.from(db.payments.values())
      .filter(payment => payment.phoneNumber === phoneNumber);
    
    const totalSpent = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const stats = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'paid').length,
      totalSpent,
      averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
      favoriteCategory: getMostFrequentCategory(orders)
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function
function getMostFrequentCategory(orders) {
  const categoryCount = {};
  orders.forEach(order => {
    const category = order.productType || 'unknown';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  let maxCategory = 'none';
  let maxCount = 0;
  for (const category in categoryCount) {
    if (categoryCount[category] > maxCount) {
      maxCount = categoryCount[category];
      maxCategory = category;
    }
  }
  
  return maxCategory;
}

module.exports = router;
