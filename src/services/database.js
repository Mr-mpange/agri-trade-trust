// Mock in-memory database
// In production, replace with PostgreSQL/MongoDB

class Database {
  constructor() {
    this.orders = new Map();
    this.suppliers = new Map();
    this.payments = new Map();
    this.users = new Map();
    this.ussdSessions = new Map();
    this.categories = new Map();
    
    // Seed product categories
    this.seedCategories();
    // Seed sample suppliers
    this.seedSuppliers();
  }
  
  seedCategories() {
    const productCategories = [
      {
        id: 'CAT001',
        name: 'Agriculture',
        slug: 'agriculture',
        icon: '🌾',
        description: 'Crops, seeds, fertilizer, livestock',
        subcategories: ['Crops', 'Seeds & Fertilizer', 'Livestock & Dairy', 'Fresh Produce'],
        active: true,
        commission: 2.0
      },
      {
        id: 'CAT002',
        name: 'Electronics',
        slug: 'electronics',
        icon: '📱',
        description: 'Phones, laptops, accessories',
        subcategories: ['Mobile Phones', 'Laptops & Computers', 'Accessories', 'Home Electronics'],
        active: true,
        commission: 4.0
      },
      {
        id: 'CAT003',
        name: 'Retail Goods',
        slug: 'retail',
        icon: '🏪',
        description: 'Clothing, cosmetics, household items',
        subcategories: ['Clothing & Fashion', 'Cosmetics & Beauty', 'Household Items', 'Personal Care'],
        active: true,
        commission: 3.0
      },
      {
        id: 'CAT004',
        name: 'Hardware',
        slug: 'hardware',
        icon: '🔧',
        description: 'Building materials, tools, equipment',
        subcategories: ['Building Materials', 'Tools & Equipment', 'Plumbing & Electrical', 'Paint & Finishing'],
        active: true,
        commission: 3.0
      },
      {
        id: 'CAT005',
        name: 'Wholesale',
        slug: 'wholesale',
        icon: '📦',
        description: 'Bulk goods, raw materials',
        subcategories: ['Food & Beverages', 'Raw Materials', 'Packaging', 'Industrial Supplies'],
        active: true,
        commission: 1.5
      },
      {
        id: 'CAT006',
        name: 'Health & Wellness',
        slug: 'health',
        icon: '💊',
        description: 'Medical supplies, wellness products',
        subcategories: ['OTC Medicines', 'Supplements', 'Medical Supplies', 'Wellness'],
        active: false, // Coming soon
        commission: 3.5
      },
      {
        id: 'CAT007',
        name: 'Books & Education',
        slug: 'education',
        icon: '📚',
        description: 'Textbooks, stationery, office supplies',
        subcategories: ['Textbooks', 'Stationery', 'Office Supplies', 'Educational Materials'],
        active: false, // Coming soon
        commission: 3.0
      },
      {
        id: 'CAT008',
        name: 'Crafts & Art',
        slug: 'crafts',
        icon: '🎨',
        description: 'Handmade crafts, traditional art',
        subcategories: ['Handmade Crafts', 'Traditional Art', 'Jewelry', 'Home Decor'],
        active: false, // Coming soon
        commission: 5.0
      }
    ];
    
    productCategories.forEach(category => {
      this.categories.set(category.slug, category);
    });
  }
  
  seedSuppliers() {
    const sampleSuppliers = [
      // Agriculture Suppliers
      {
        id: 'SUP001',
        name: 'Kamau Farms',
        phone: '+254711000001',
        location: 'Nairobi',
        category: 'agriculture',
        products: [
          { type: 'maize', category: 'agriculture', quantity: 500, price: 4500, unit: 'kg' },
          { type: 'rice', category: 'agriculture', quantity: 300, price: 8000, unit: 'kg' }
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
        name: 'Njeri Agro Supplies',
        phone: '+254711000002',
        location: 'Nakuru',
        category: 'agriculture',
        products: [
          { type: 'maize', category: 'agriculture', quantity: 400, price: 4200, unit: 'kg' },
          { type: 'fertilizer', category: 'agriculture', quantity: 200, price: 3500, unit: 'kg' }
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
        category: 'agriculture',
        products: [
          { type: 'seeds', category: 'agriculture', quantity: 150, price: 2500, unit: 'kg' },
          { type: 'maize', category: 'agriculture', quantity: 250, price: 4300, unit: 'kg' }
        ],
        completedOrders: 72,
        failedOrders: 8,
        totalRating: 360,
        ratingCount: 80,
        avgResponseHours: 6,
        disputes: 2
      },
      
      // Electronics Suppliers
      {
        id: 'SUP004',
        name: 'TechHub Kenya',
        phone: '+254711000004',
        location: 'Nairobi',
        category: 'electronics',
        products: [
          { type: 'phone', category: 'electronics', brand: 'Samsung', model: 'Galaxy A14', quantity: 50, price: 15000, unit: 'piece' },
          { type: 'phone', category: 'electronics', brand: 'Tecno', model: 'Spark 10', quantity: 80, price: 12000, unit: 'piece' },
          { type: 'laptop', category: 'electronics', brand: 'HP', model: '15s', quantity: 20, price: 45000, unit: 'piece' }
        ],
        completedOrders: 156,
        failedOrders: 4,
        totalRating: 780,
        ratingCount: 160,
        avgResponseHours: 1,
        disputes: 0
      },
      {
        id: 'SUP005',
        name: 'Gadget World',
        phone: '+254711000005',
        location: 'Mombasa',
        category: 'electronics',
        products: [
          { type: 'phone', category: 'electronics', brand: 'Samsung', model: 'Galaxy A14', quantity: 40, price: 14500, unit: 'piece' },
          { type: 'phone', category: 'electronics', brand: 'Infinix', model: 'Hot 30', quantity: 60, price: 11000, unit: 'piece' },
          { type: 'accessories', category: 'electronics', name: 'Earphones', quantity: 200, price: 500, unit: 'piece' }
        ],
        completedOrders: 134,
        failedOrders: 16,
        totalRating: 670,
        ratingCount: 150,
        avgResponseHours: 2,
        disputes: 1
      },
      
      // Retail Goods Suppliers
      {
        id: 'SUP006',
        name: 'Fashion Hub',
        phone: '+254711000006',
        location: 'Nairobi',
        category: 'retail',
        products: [
          { type: 'clothing', category: 'retail', name: 'T-Shirt', size: 'M', quantity: 100, price: 800, unit: 'piece' },
          { type: 'clothing', category: 'retail', name: 'Jeans', size: 'L', quantity: 50, price: 1500, unit: 'piece' },
          { type: 'shoes', category: 'retail', name: 'Sneakers', size: '42', quantity: 30, price: 2500, unit: 'pair' }
        ],
        completedOrders: 210,
        failedOrders: 10,
        totalRating: 1050,
        ratingCount: 220,
        avgResponseHours: 3,
        disputes: 2
      },
      {
        id: 'SUP007',
        name: 'Beauty Essentials',
        phone: '+254711000007',
        location: 'Kisumu',
        category: 'retail',
        products: [
          { type: 'cosmetics', category: 'retail', name: 'Lipstick', brand: 'MAC', quantity: 80, price: 1200, unit: 'piece' },
          { type: 'cosmetics', category: 'retail', name: 'Foundation', brand: 'Maybelline', quantity: 60, price: 1800, unit: 'piece' },
          { type: 'skincare', category: 'retail', name: 'Face Cream', quantity: 100, price: 900, unit: 'piece' }
        ],
        completedOrders: 189,
        failedOrders: 11,
        totalRating: 940,
        ratingCount: 200,
        avgResponseHours: 2,
        disputes: 1
      },
      
      // Hardware Suppliers
      {
        id: 'SUP008',
        name: 'BuildMart Hardware',
        phone: '+254711000008',
        location: 'Nairobi',
        category: 'hardware',
        products: [
          { type: 'cement', category: 'hardware', brand: 'Bamburi', quantity: 500, price: 650, unit: 'bag' },
          { type: 'iron-sheets', category: 'hardware', gauge: '30', quantity: 200, price: 850, unit: 'piece' },
          { type: 'paint', category: 'hardware', brand: 'Crown', quantity: 100, price: 1200, unit: 'litre' }
        ],
        completedOrders: 245,
        failedOrders: 5,
        totalRating: 1225,
        ratingCount: 250,
        avgResponseHours: 4,
        disputes: 0
      },
      {
        id: 'SUP009',
        name: 'Tools & More',
        phone: '+254711000009',
        location: 'Eldoret',
        category: 'hardware',
        products: [
          { type: 'tools', category: 'hardware', name: 'Hammer', quantity: 150, price: 500, unit: 'piece' },
          { type: 'tools', category: 'hardware', name: 'Drill Machine', quantity: 30, price: 8000, unit: 'piece' },
          { type: 'plumbing', category: 'hardware', name: 'PVC Pipes', size: '1inch', quantity: 200, price: 300, unit: 'metre' }
        ],
        completedOrders: 167,
        failedOrders: 13,
        totalRating: 835,
        ratingCount: 180,
        avgResponseHours: 5,
        disputes: 1
      },
      
      // Wholesale Suppliers
      {
        id: 'SUP010',
        name: 'Mega Wholesalers',
        phone: '+254711000010',
        location: 'Nairobi',
        category: 'wholesale',
        products: [
          { type: 'sugar', category: 'wholesale', brand: 'Mumias', quantity: 1000, price: 120, unit: 'kg', moq: 50 },
          { type: 'cooking-oil', category: 'wholesale', brand: 'Elianto', quantity: 500, price: 280, unit: 'litre', moq: 20 },
          { type: 'rice', category: 'wholesale', brand: 'Pishori', quantity: 800, price: 150, unit: 'kg', moq: 100 }
        ],
        completedOrders: 312,
        failedOrders: 8,
        totalRating: 1560,
        ratingCount: 320,
        avgResponseHours: 6,
        disputes: 1
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
