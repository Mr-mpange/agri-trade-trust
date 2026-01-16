// Mock in-memory database
// In production, replace with PostgreSQL/MongoDB

class Database {
  constructor() {
    this.orders = new Map();
    this.suppliers = new Map();
    this.payments = new Map();
    this.users = new Map();
    this.ussdSessions = new Map();
    
    // Seed sample suppliers
    this.seedSuppliers();
  }
  
  seedSuppliers() {
    const sampleSuppliers = [
      {
        id: 'SUP001',
        name: 'Kamau Farms',
        phone: '+254711000001',
        location: 'Nairobi',
        products: [
          { type: 'maize', quantity: 500, price: 4500 },
          { type: 'rice', quantity: 300, price: 8000 }
        ],
        completedOrders: 98,
        failedOrders: 2,
        totalRating: 490,
        ratingCount: 100,
        avgResponseHours: 2,
        disputes: 0
      },
      {
        id: 'SUP002',
        name: 'Njeri Supplies',
        phone: '+254711000002',
        location: 'Nakuru',
        products: [
          { type: 'maize', quantity: 400, price: 4200 },
          { type: 'fertilizer', quantity: 200, price: 3500 }
        ],
        completedOrders: 87,
        failedOrders: 13,
        totalRating: 435,
        ratingCount: 100,
        avgResponseHours: 4,
        disputes: 1
      },
      {
        id: 'SUP003',
        name: 'Mwangi Seeds Co',
        phone: '+254711000003',
        location: 'Eldoret',
        products: [
          { type: 'seeds', quantity: 150, price: 2500 },
          { type: 'maize', quantity: 250, price: 4300 }
        ],
        completedOrders: 72,
        failedOrders: 8,
        totalRating: 360,
        ratingCount: 80,
        avgResponseHours: 6,
        disputes: 2
      }
    ];
    
    sampleSuppliers.forEach(supplier => {
      this.suppliers.set(supplier.id, supplier);
    });
  }
  
  clear() {
    this.orders.clear();
    this.payments.clear();
    this.users.clear();
    this.ussdSessions.clear();
    this.seedSuppliers();
  }
}

module.exports = new Database();
