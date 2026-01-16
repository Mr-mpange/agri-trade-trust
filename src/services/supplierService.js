const db = require('./database');

class SupplierService {
  calculateTrustScore(supplier) {
    const totalOrders = supplier.completedOrders + supplier.failedOrders;
    if (totalOrders === 0) return 50; // New supplier default
    
    const deliveryRate = (supplier.completedOrders / totalOrders) * 40;
    const avgRating = (supplier.totalRating / supplier.ratingCount) * 30;
    const responseTime = Math.max(0, 15 - (supplier.avgResponseHours / 24) * 15);
    const orderVolume = Math.min(10, (totalOrders / 100) * 10);
    const disputeScore = Math.max(0, 5 - supplier.disputes);
    
    return Math.round(deliveryRate + avgRating + responseTime + orderVolume + disputeScore);
  }
  
  getTrustStars(score) {
    if (score >= 95) return '⭐⭐⭐⭐⭐';
    if (score >= 85) return '⭐⭐⭐⭐';
    if (score >= 70) return '⭐⭐⭐';
    if (score >= 50) return '⭐⭐';
    return '⭐';
  }
  
  async getTrustScore(supplierId) {
    const supplier = db.suppliers.get(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    const score = this.calculateTrustScore(supplier);
    const stars = this.getTrustStars(score);
    
    return {
      supplierId,
      name: supplier.name,
      score,
      stars,
      completedOrders: supplier.completedOrders,
      totalOrders: supplier.completedOrders + supplier.failedOrders,
      avgRating: (supplier.totalRating / supplier.ratingCount).toFixed(1)
    };
  }
  
  async listSuppliers(productType) {
    const allSuppliers = Array.from(db.suppliers.values());
    const filtered = allSuppliers.filter(s => 
      s.products.some(p => p.type.toLowerCase() === productType.toLowerCase() && p.quantity > 0)
    );
    
    return filtered.map(supplier => {
      const product = supplier.products.find(p => p.type.toLowerCase() === productType.toLowerCase());
      const score = this.calculateTrustScore(supplier);
      const stars = this.getTrustStars(score);
      
      return {
        supplierId: supplier.id,
        name: supplier.name,
        trustScore: score,
        stars,
        price: product.price,
        available: product.quantity,
        location: supplier.location
      };
    }).sort((a, b) => b.trustScore - a.trustScore);
  }
  
  async updateInventory(supplierId, { productType, quantity, price }) {
    const supplier = db.suppliers.get(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    const productIndex = supplier.products.findIndex(p => p.type === productType);
    if (productIndex >= 0) {
      supplier.products[productIndex].quantity = quantity;
      supplier.products[productIndex].price = price;
    } else {
      supplier.products.push({ type: productType, quantity, price });
    }
    
    db.suppliers.set(supplierId, supplier);
    
    return {
      supplierId,
      productType,
      quantity,
      price,
      message: 'Inventory updated successfully'
    };
  }
}

module.exports = new SupplierService();
