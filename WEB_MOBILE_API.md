# AgriTrust & Trade - Web/Mobile API Documentation

## Overview

This API provides full REST endpoints for web and mobile applications (4G users) while maintaining consistency with the 2G USSD/SMS system. All data is synchronized across channels.

**Base URL**: `http://localhost:3000/api`  
**Production**: `https://api.agritrust.africa/api`

---

## Authentication

Currently using phone number as user identifier. In production, implement JWT tokens:

```javascript
Headers: {
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

---

## API Endpoints

### 1. Products API

#### GET /api/products
Get all products with optional filters

**Query Parameters:**
- `category` (string): Filter by category (agriculture, electronics, retail, hardware, wholesale)
- `search` (string): Search by product name, type, or brand
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `limit` (number): Limit results (default: 50)

**Example Request:**
```bash
GET /api/products?category=electronics&search=samsung&limit=10
```

**Response:**
```json
{
  "success": true,
  "total": 2,
  "products": [
    {
      "productId": "SUP004-phone",
      "name": "Samsung Galaxy A14",
      "type": "phone",
      "category": "electronics",
      "price": 450000,
      "unit": "piece",
      "quantity": 50,
      "brand": "Samsung",
      "model": "Galaxy A14",
      "supplier": {
        "id": "SUP004",
        "name": "TechHub Tanzania",
        "location": "Dar es Salaam",
        "phone": "+255712000004"
      }
    }
  ]
}
```

---

#### GET /api/products/:productId
Get single product details with supplier trust score

**Example Request:**
```bash
GET /api/products/SUP004-phone
```

**Response:**
```json
{
  "success": true,
  "product": {
    "productId": "SUP004-phone",
    "name": "Samsung Galaxy A14",
    "type": "phone",
    "category": "electronics",
    "price": 450000,
    "unit": "piece",
    "quantity": 50,
    "brand": "Samsung",
    "model": "Galaxy A14",
    "supplier": {
      "id": "SUP004",
      "name": "TechHub Tanzania",
      "location": "Dar es Salaam",
      "phone": "+255712000004",
      "trustScore": 98,
      "completedOrders": 156,
      "totalOrders": 160
    }
  }
}
```

---

#### POST /api/products/search
Advanced product search with filters

**Request Body:**
```json
{
  "query": "samsung",
  "category": "electronics",
  "filters": {
    "minPrice": 100000,
    "maxPrice": 500000,
    "location": "Dar es Salaam",
    "minTrustScore": 90
  }
}
```

**Response:**
```json
{
  "success": true,
  "total": 2,
  "products": [
    {
      "productId": "SUP004-phone",
      "name": "Samsung Galaxy A14",
      "price": 450000,
      "supplier": {
        "id": "SUP004",
        "name": "TechHub Tanzania",
        "location": "Dar es Salaam",
        "trustScore": 98
      }
    }
  ]
}
```

---

### 2. Cart API

#### GET /api/cart/:userId
Get user's shopping cart

**Example Request:**
```bash
GET /api/cart/+255700000001
```

**Response:**
```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "productId": "SUP004-phone",
        "name": "Samsung Galaxy A14",
        "type": "phone",
        "category": "electronics",
        "price": 450000,
        "unit": "piece",
        "quantity": 1,
        "subtotal": 450000,
        "supplier": {
          "id": "SUP004",
          "name": "TechHub Tanzania",
          "location": "Dar es Salaam"
        }
      }
    ],
    "total": 450000
  }
}
```

---

#### POST /api/cart/:userId/add
Add item to cart

**Request Body:**
```json
{
  "productId": "SUP004-phone",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": {
    "items": [...],
    "total": 450000
  }
}
```

---

#### PUT /api/cart/:userId/update
Update cart item quantity

**Request Body:**
```json
{
  "productId": "SUP004-phone",
  "quantity": 2
}
```

---

#### DELETE /api/cart/:userId/remove/:productId
Remove item from cart

**Example Request:**
```bash
DELETE /api/cart/+255700000001/remove/SUP004-phone
```

---

#### DELETE /api/cart/:userId/clear
Clear entire cart

**Example Request:**
```bash
DELETE /api/cart/+255700000001/clear
```

---

#### POST /api/cart/:userId/checkout
Convert cart to orders

**Request Body:**
```json
{
  "buyerPhone": "+255700000001",
  "deliveryAddress": "123 Main St, Dar es Salaam"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Orders created successfully",
  "orders": [
    {
      "orderId": "ORD-1234",
      "productType": "phone",
      "quantity": 1,
      "status": "pending",
      "deliveryCode": 8473
    }
  ],
  "totalAmount": 450000
}
```

---

### 3. Users API

#### POST /api/users/register
Register new user

**Request Body:**
```json
{
  "phoneNumber": "+255700000001",
  "name": "John Doe",
  "email": "john@example.com",
  "userType": "buyer",
  "location": "Dar es Salaam"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "phoneNumber": "+255700000001",
    "name": "John Doe",
    "email": "john@example.com",
    "userType": "buyer",
    "location": "Dar es Salaam",
    "createdAt": "2026-01-16T...",
    "orders": [],
    "favorites": [],
    "addresses": []
  }
}
```

---

#### GET /api/users/:phoneNumber
Get user profile

**Example Request:**
```bash
GET /api/users/+255700000001
```

**Response:**
```json
{
  "success": true,
  "user": {
    "phoneNumber": "+255700000001",
    "name": "John Doe",
    "email": "john@example.com",
    "location": "Dar es Salaam",
    "totalOrders": 5,
    "recentOrders": [...]
  }
}
```

---

#### PUT /api/users/:phoneNumber
Update user profile

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.new@example.com",
  "location": "Arusha"
}
```

---

#### POST /api/users/:phoneNumber/addresses
Add delivery address

**Request Body:**
```json
{
  "label": "Home",
  "address": "123 Main Street",
  "city": "Dar es Salaam",
  "region": "Dar es Salaam",
  "isDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address added successfully",
  "address": {
    "id": "ADDR-1234567890",
    "label": "Home",
    "address": "123 Main Street",
    "city": "Dar es Salaam",
    "region": "Dar es Salaam",
    "isDefault": true,
    "createdAt": "2026-01-16T..."
  }
}
```

---

#### POST /api/users/:phoneNumber/favorites
Add product/supplier to favorites

**Request Body:**
```json
{
  "productId": "SUP004-phone",
  "supplierId": "SUP004"
}
```

---

#### GET /api/users/:phoneNumber/orders
Get user order history

**Query Parameters:**
- `status` (string): Filter by order status
- `limit` (number): Limit results (default: 20)

**Example Request:**
```bash
GET /api/users/+255700000001/orders?status=delivered&limit=10
```

---

#### GET /api/users/:phoneNumber/stats
Get user statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 15,
    "completedOrders": 12,
    "pendingOrders": 3,
    "totalSpent": 2500000,
    "averageOrderValue": 166666,
    "favoriteCategory": "electronics"
  }
}
```

---

## Integration with 2G System

### Data Synchronization

All API endpoints share the same database with USSD/SMS system:

**2G User (USSD):**
```
Dial *384*123# → Select Product → Order
```

**4G User (Web/Mobile):**
```
Browse /api/products → Add to Cart → Checkout
```

**Result**: Both create the same order structure, visible to both channels.

---

### Cross-Channel Features

#### 1. Order Tracking
- **2G**: SMS `TRACK ORD-1234`
- **4G**: GET `/api/users/+255700000001/orders`

#### 2. Product Search
- **2G**: USSD menu navigation
- **4G**: POST `/api/products/search`

#### 3. Payment
- **2G**: M-Pesa prompt via USSD
- **4G**: Mobile money API integration

---

## Example Mobile App Flow

### 1. User Registration
```javascript
// Register user
POST /api/users/register
{
  "phoneNumber": "+255700000001",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 2. Browse Products
```javascript
// Get electronics
GET /api/products?category=electronics&limit=20

// Search for specific product
POST /api/products/search
{
  "query": "samsung phone",
  "filters": { "minTrustScore": 90 }
}
```

### 3. Add to Cart
```javascript
// Add Samsung phone
POST /api/cart/+255700000001/add
{
  "productId": "SUP004-phone",
  "quantity": 1
}

// Add maize
POST /api/cart/+255700000001/add
{
  "productId": "SUP001-maize",
  "quantity": 50
}
```

### 4. View Cart
```javascript
GET /api/cart/+255700000001

// Response shows both items
{
  "items": [
    { "productId": "SUP004-phone", "quantity": 1, "subtotal": 450000 },
    { "productId": "SUP001-maize", "quantity": 50, "subtotal": 2250000 }
  ],
  "total": 2700000
}
```

### 5. Checkout
```javascript
POST /api/cart/+255700000001/checkout
{
  "buyerPhone": "+255700000001",
  "deliveryAddress": "123 Main St, Dar es Salaam"
}

// Creates 2 orders (one per supplier)
```

### 6. Track Orders
```javascript
GET /api/users/+255700000001/orders

// Shows all orders with status
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

**Recommended limits:**
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Checkout: 10 requests/hour per user

---

## Testing with Postman

Import `AgriTrust-API.postman_collection.json` for complete API testing.

**Collection includes:**
- All product endpoints
- Cart management
- User registration and profile
- Order creation and tracking
- Payment integration

---

## Mobile App Integration Example

### React Native
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Get products
const getProducts = async (category) => {
  const response = await axios.get(`${API_BASE}/products`, {
    params: { category, limit: 20 }
  });
  return response.data.products;
};

// Add to cart
const addToCart = async (userId, productId, quantity) => {
  const response = await axios.post(`${API_BASE}/cart/${userId}/add`, {
    productId,
    quantity
  });
  return response.data.cart;
};

// Checkout
const checkout = async (userId, buyerPhone, deliveryAddress) => {
  const response = await axios.post(`${API_BASE}/cart/${userId}/checkout`, {
    buyerPhone,
    deliveryAddress
  });
  return response.data.orders;
};
```

### Flutter
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AgriTrustAPI {
  static const String baseUrl = 'http://localhost:3000/api';
  
  Future<List<Product>> getProducts(String category) async {
    final response = await http.get(
      Uri.parse('$baseUrl/products?category=$category')
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['products'] as List)
          .map((p) => Product.fromJson(p))
          .toList();
    }
    throw Exception('Failed to load products');
  }
  
  Future<Cart> addToCart(String userId, String productId, int quantity) async {
    final response = await http.post(
      Uri.parse('$baseUrl/cart/$userId/add'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'productId': productId,
        'quantity': quantity
      })
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Cart.fromJson(data['cart']);
    }
    throw Exception('Failed to add to cart');
  }
}
```

---

## Production Deployment

### Environment Variables
```bash
# API Configuration
API_BASE_URL=https://api.agritrust.africa
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/agritrust

# Redis (for cart/session)
REDIS_URL=redis://host:6379

# Africa's Talking
AT_USERNAME=your_username
AT_API_KEY=your_api_key

# JWT Secret
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d
```

### Security Recommendations
1. Implement JWT authentication
2. Add rate limiting (express-rate-limit)
3. Enable CORS with whitelist
4. Use HTTPS only
5. Validate all inputs
6. Sanitize user data
7. Implement request logging
8. Add API versioning (/api/v1/...)

---

## Support

- **Documentation**: https://docs.agritrust.africa
- **API Status**: https://status.agritrust.africa
- **Support Email**: api@agritrust.africa

---

**Last Updated**: January 16, 2026  
**API Version**: 1.0.0  
**Status**: Production Ready
