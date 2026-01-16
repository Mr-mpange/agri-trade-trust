# AgriTrust & Trade - System Architecture

## Overview

AgriTrust & Trade is built on a modular, scalable architecture that leverages Africa's Talking APIs to provide feature-phone-first agricultural supply chain services.

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript (CommonJS)
- **Dependencies**:
  - `africastalking`: Official SDK for AT APIs
  - `express`: Web framework
  - `dotenv`: Environment configuration
  - `axios`: HTTP client
  - `cors`: Cross-origin resource sharing
  - `morgan`: HTTP request logger

### Data Layer
- **Current**: In-memory Map (development/demo)
- **Production**: PostgreSQL or MongoDB recommended
- **Session Management**: In-memory (use Redis in production)

## System Components

### 1. API Gateway (`src/server.js`)
Entry point for all requests. Routes traffic to appropriate handlers.

**Responsibilities**:
- Request routing
- Middleware management (CORS, JSON parsing, logging)
- Health check endpoint
- Error handling

### 2. Route Handlers (`src/routes/`)

#### Core Routes (Original Demo)
- **`sms.js`**: SMS sending and inbound webhook handling
- **`ussd.js`**: USSD session management
- **`voice.js`**: Voice call initiation and IVR
- **`airtime.js`**: Airtime distribution
- **`whatsapp.js`**: WhatsApp messaging

#### AgriTrust Routes (New)
- **`agri-orders.js`**: Order creation, tracking, delivery confirmation
- **`agri-suppliers.js`**: Supplier listing, trust scores, inventory
- **`agri-payments.js`**: Payment initiation, escrow, release

### 3. Business Logic (`src/services/`)

#### `orderService.js`
Manages the complete order lifecycle:
- Order creation with unique IDs
- Delivery code generation
- Status tracking (pending → paid → dispatched → delivered)
- SMS notifications to buyers and suppliers
- Delivery confirmation validation

#### `supplierService.js`
Handles supplier operations:
- Trust score calculation (5-factor algorithm)
- Supplier listing and filtering by product
- Inventory management
- Star rating conversion

#### `paymentService.js`
Manages payment flows:
- Mobile money checkout (C2B)
- Escrow holding
- Payment callback processing
- Payment release to suppliers (B2C)
- Transaction logging

#### `database.js`
Mock in-memory database with:
- Orders storage
- Suppliers storage (pre-seeded with 3 suppliers)
- Payments storage
- USSD session storage
- User storage

### 4. Configuration (`src/config/`)
- **`africastalking.js`**: AT SDK initialization
- Environment variables via `.env`

## Data Models

### Order
```javascript
{
  orderId: "ORD-1234",
  buyerPhone: "+254712345678",
  productType: "maize",
  quantity: 50,
  supplierId: "SUP001",
  status: "pending|paid|dispatched|delivered",
  deliveryCode: 8473,
  createdAt: Date,
  paidAt: Date,
  dispatchedAt: Date,
  deliveredAt: Date,
  estimatedDelivery: Date
}
```

### Supplier
```javascript
{
  id: "SUP001",
  name: "Kamau Farms",
  phone: "+254711000001",
  location: "Nairobi",
  products: [
    { type: "maize", quantity: 500, price: 4500 }
  ],
  completedOrders: 98,
  failedOrders: 2,
  totalRating: 490,
  ratingCount: 100,
  avgResponseHours: 2,
  disputes: 0
}
```

### Payment
```javascript
{
  orderId: "ORD-1234",
  phoneNumber: "+254712345678",
  amount: 4500,
  status: "pending|completed|released",
  transactionId: "TXN123456",
  createdAt: Date,
  completedAt: Date,
  releasedAt: Date,
  releasedTo: "+254711000001"
}
```

## API Flow Diagrams

### Order Creation Flow
```
Buyer (USSD) → /ussd → orderService.createOrder()
                ↓
        Generate Order ID & Delivery Code
                ↓
        Store in Database
                ↓
        Send SMS to Buyer (confirmation)
                ↓
        Send SMS to Supplier (new order notification)
                ↓
        Return Order Details
```

### Payment Escrow Flow
```
Buyer → /payments/checkout → AT Mobile Money API (C2B)
                ↓
        Payment Prompt on Phone
                ↓
        Buyer Enters PIN
                ↓
AT → /payments/callback → paymentService.handlePaymentCallback()
                ↓
        Update Payment Status
                ↓
        Update Order Status to "paid"
                ↓
        Send SMS Confirmation
```

### Delivery Confirmation Flow
```
Supplier Delivers → Buyer Receives Delivery Code
                ↓
Buyer → /orders/:id/confirm-delivery
                ↓
        Validate Delivery Code
                ↓
        Update Order Status to "delivered"
                ↓
        Trigger Payment Release
                ↓
AT Mobile Money API (B2C) → Supplier Account
                ↓
        Send SMS to Both Parties
                ↓
        Update Trust Scores
```

### Trust Score Calculation
```
Trust Score = (
  Delivery Success Rate × 40% +
  Average Rating × 30% +
  Response Time × 15% +
  Order Volume × 10% +
  Dispute Resolution × 5%
)

Example:
- Completed: 98, Failed: 2 → 98% × 40% = 39.2
- Avg Rating: 4.9/5 → 98% × 30% = 29.4
- Response: 2 hours → (15 - 2/24*15) × 1 = 13.75
- Volume: 100 orders → min(10, 100/100*10) = 10
- Disputes: 0 → 5 - 0 = 5

Total: 39.2 + 29.4 + 13.75 + 10 + 5 = 97.35 ≈ 97% ⭐⭐⭐⭐⭐
```

## Integration Points

### Africa's Talking APIs

#### 1. USSD API
- **Endpoint**: `/ussd`
- **Method**: POST
- **Payload**: `{ sessionId, serviceCode, phoneNumber, text }`
- **Response**: `CON ...` (continue) or `END ...` (terminate)

#### 2. SMS API
- **Send**: `africastalking.SMS.send()`
- **Inbound Webhook**: `/sms/inbound`
- **Payload**: `{ text, from, to, date, id, linkId }`

#### 3. Voice API
- **Call**: `africastalking.VOICE.call()`
- **Actions Webhook**: `/voice/actions`
- **Response**: XML with `<Say>`, `<GetDigits>`, etc.

#### 4. Mobile Money API
- **Checkout (C2B)**: `africastalking.PAYMENTS.mobileCheckout()`
- **B2C**: `africastalking.PAYMENTS.mobileB2C()`
- **Callback**: `/payments/callback`

#### 5. Airtime API
- **Send**: `africastalking.AIRTIME.send()`
- **Use Case**: Loyalty rewards

## Security Considerations

### Current Implementation
- Environment variables for credentials
- Input validation on critical endpoints
- Delivery code verification
- Phone number authorization checks

### Production Recommendations
1. **Authentication**: JWT tokens for web dashboard
2. **Rate Limiting**: Prevent abuse (express-rate-limit)
3. **Webhook Verification**: Validate AT signatures
4. **Input Sanitization**: Prevent injection attacks
5. **HTTPS Only**: Enforce SSL/TLS
6. **Database Encryption**: Encrypt sensitive data at rest
7. **Audit Logging**: Track all transactions
8. **PCI Compliance**: For payment handling

## Scalability Strategy

### Horizontal Scaling
- Stateless API design (move sessions to Redis)
- Load balancer (Nginx, AWS ALB)
- Multiple server instances

### Database Optimization
- Indexing on frequently queried fields (orderId, phoneNumber)
- Read replicas for analytics
- Caching layer (Redis) for trust scores

### Message Queue
- RabbitMQ or AWS SQS for async SMS/payment processing
- Prevents blocking on AT API calls

### Monitoring
- Application: PM2, New Relic
- Infrastructure: CloudWatch, Datadog
- Errors: Sentry
- Logs: ELK Stack (Elasticsearch, Logstash, Kibana)

## Deployment Architecture

### Development
```
Local Machine
├── Node.js Server (localhost:3000)
├── Ngrok (webhook tunneling)
└── Africa's Talking Sandbox
```

### Production
```
AWS/DigitalOcean
├── Load Balancer (HTTPS)
├── App Servers (PM2 cluster mode)
│   ├── Instance 1
│   ├── Instance 2
│   └── Instance 3
├── PostgreSQL (RDS/Managed)
├── Redis (ElastiCache/Managed)
└── Africa's Talking Production
```

## Future Enhancements

### Phase 2: Advanced Features
- Real-time order tracking with GPS
- Multi-language support (Swahili, French, etc.)
- Dispute resolution workflow
- Supplier onboarding automation

### Phase 3: AI/ML
- Demand forecasting
- Dynamic pricing recommendations
- Fraud detection models
- Chatbot for customer support

### Phase 4: Ecosystem
- Integration with logistics providers
- Weather API for farming insights
- Market price feeds
- Credit scoring for BNPL

## Development Guidelines

### Code Structure
```
src/
├── config/          # Configuration files
├── routes/          # API route handlers
├── services/        # Business logic
├── models/          # Data models (future)
├── middleware/      # Custom middleware (future)
└── utils/           # Helper functions (future)
```

### Naming Conventions
- Routes: kebab-case (`agri-orders.js`)
- Services: camelCase (`orderService.js`)
- Functions: camelCase (`createOrder()`)
- Constants: UPPER_SNAKE_CASE (`MAX_QUANTITY`)

### Error Handling
- Always catch async errors
- Return consistent error format
- Log errors with context
- Never expose internal errors to users

### Testing Strategy
- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Manual + automated scripts
- Load tests: Artillery or k6

## Maintenance

### Regular Tasks
- Monitor error logs daily
- Review trust score accuracy weekly
- Update supplier data monthly
- Security patches as released

### Backup Strategy
- Database: Daily automated backups
- Code: Git version control
- Configuration: Encrypted backup of .env

---

**Last Updated**: January 16, 2026
**Version**: 1.0.0
**Maintainer**: AgriTrust Team
