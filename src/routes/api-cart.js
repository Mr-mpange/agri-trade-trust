const express = require('express');
const router = express.Router();
const db = require('../services/database');

// In-memory cart storage (use Redis in production)
const carts = new Map();

// Get user cart
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const cart = carts.get(userId) || { items: [], total: 0 };
    
    res.json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add item to cart
router.post('/:userId/add', (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'productId and quantity are required' 
      });
    }
    
    // Get product details
    const [supplierId, productType] = productId.split('-');
    const supplier = db.suppliers.get(supplierId);
    
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const product = supplier.products.find(p => p.type === productType);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check stock
    if (product.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: `Only ${product.quantity} ${product.unit} available` 
      });
    }
    
    // Get or create cart
    let cart = carts.get(userId) || { items: [], total: 0 };
    
    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += parseInt(quantity);
      cart.items[existingItemIndex].subtotal = 
        cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].price;
    } else {
      // Add new item
      cart.items.push({
        productId,
        name: product.name || product.type,
        type: product.type,
        category: product.category,
        price: product.price,
        unit: product.unit,
        quantity: parseInt(quantity),
        subtotal: product.price * parseInt(quantity),
        supplier: {
          id: supplier.id,
          name: supplier.name,
          location: supplier.location
        }
      });
    }
    
    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Save cart
    carts.set(userId, cart);
    
    res.json({
      success: true,
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update cart item quantity
router.put('/:userId/update', (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;
    
    const cart = carts.get(userId);
    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex < 0) {
      return res.status(404).json({ success: false, error: 'Item not in cart' });
    }
    
    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = parseInt(quantity);
      cart.items[itemIndex].subtotal = 
        cart.items[itemIndex].quantity * cart.items[itemIndex].price;
    }
    
    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    carts.set(userId, cart);
    
    res.json({
      success: true,
      message: 'Cart updated',
      cart
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove item from cart
router.delete('/:userId/remove/:productId', (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    const cart = carts.get(userId);
    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    carts.set(userId, cart);
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear cart
router.delete('/:userId/clear', (req, res) => {
  try {
    const { userId } = req.params;
    carts.delete(userId);
    
    res.json({
      success: true,
      message: 'Cart cleared',
      cart: { items: [], total: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Checkout - convert cart to order
router.post('/:userId/checkout', async (req, res) => {
  try {
    const { userId } = req.params;
    const { buyerPhone, deliveryAddress } = req.body;
    
    const cart = carts.get(userId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cart is empty' 
      });
    }
    
    // Create orders (one per supplier)
    const ordersBySupplier = {};
    cart.items.forEach(item => {
      const supplierId = item.supplier.id;
      if (!ordersBySupplier[supplierId]) {
        ordersBySupplier[supplierId] = {
          supplier: item.supplier,
          items: [],
          total: 0
        };
      }
      ordersBySupplier[supplierId].items.push(item);
      ordersBySupplier[supplierId].total += item.subtotal;
    });
    
    const orders = [];
    const orderService = require('../services/orderService');
    
    for (const supplierId in ordersBySupplier) {
      const orderData = ordersBySupplier[supplierId];
      
      // Create order for each item (simplified - in production, handle multi-item orders)
      for (const item of orderData.items) {
        const order = await orderService.createOrder({
          buyerPhone,
          productType: item.type,
          quantity: item.quantity,
          supplierId,
          deliveryAddress
        });
        orders.push(order);
      }
    }
    
    // Clear cart after successful checkout
    carts.delete(userId);
    
    res.json({
      success: true,
      message: 'Orders created successfully',
      orders,
      totalAmount: cart.total
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
