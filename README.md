# AgriTrust & Trade

**A trust-enabled agricultural supply chain platform for African buyers and retailers**

## 🌾 Problem Statement

African agricultural supply chains face critical challenges:
- **Trust Deficit**: Buyers cannot verify supplier authenticity or product quality before purchase
- **Limited Access**: 70% of rural users rely on 2G feature phones without internet
- **Payment Risk**: No secure escrow mechanisms lead to fraud and disputes
- **Information Gap**: Low-literacy farmers and buyers struggle with complex digital systems
- **Tracking Failures**: No visibility into order status and delivery progress
- **Financial Exclusion**: Small-scale buyers lack access to credit and flexible payment options

**Result**: $4B+ annual losses in African agriculture due to fraud, spoilage, and supply chain inefficiencies.

## 💡 Solution Overview

**AgriTrust & Trade** is a feature-phone-first platform that enables:
- ✅ **Supplier Verification**: Trust scores based on delivery history, ratings, and certifications
- 📦 **Product Ordering**: USSD-based ordering for maize, rice, seeds, and fertilizer
- 💰 **Secure Payments**: Mobile money escrow with automated release after delivery confirmation
- 📍 **Real-time Tracking**: SMS updates on order status and delivery progress
- 🎤 **Voice Access**: IVR for low-literacy users to hear product details and place orders
- 📊 **Analytics Dashboard**: Suppliers track sales, buyers monitor spending and trust scores

### Why It's Unique
- **Zero Internet Required**: Full functionality via USSD (*384*123#), SMS, and voice calls
- **Trust-First Design**: Blockchain-inspired trust scoring without blockchain complexity
- **Escrow Protection**: Payments held until delivery confirmed by buyer
- **Multi-Channel**: Same transaction accessible via USSD, SMS, voice, and web dashboard

---

## 👥 User Flows

### **Buyer Journey (Feature Phone)**

#### Via USSD (*384*123#)
```
1. Dial *384*123#
2. Select: 1. Buy Products
3. Choose: 1. Maize | 2. Rice | 3. Seeds | 4. Fertilizer
4. Enter quantity (e.g., 50 kg)
5. View suppliers with trust scores:
   - Kamau Farms ⭐⭐⭐⭐⭐ (98%) - KES 4,500
   - Njeri Supplies ⭐⭐⭐⭐ (87%) - KES 4,200
6. Select supplier
7. Confirm order
8. Pay via M-Pesa (escrow held)
9. Receive SMS confirmation with tracking code
```

#### Via SMS
```
Buyer sends: ORDER MAIZE 50KG
System replies: 
"3 suppliers found:
1. Kamau Farms ⭐98% KES4,500
2. Njeri Supplies ⭐87% KES4,200
Reply with number to order"

Buyer: 1
System: "Order confirmed. Pay KES4,500 to 12345. Code: ORD-2847"
```

#### Via Voice/IVR
```
1. Call 0711-AGRITRUST
2. Press 1 for English | 2 for Swahili
3. Press 1 to buy products
4. Press 1 for maize
5. Enter quantity using keypad
6. Listen to supplier options with trust scores
7. Press number to select supplier
8. Confirm order
9. Receive payment instructions via SMS
```

### **Supplier Journey**

#### Via USSD
```
1. Dial *384*123#
2. Select: 2. Supplier Menu
3. Options:
   - 1. View Orders
   - 2. Update Inventory
   - 3. Confirm Delivery
   - 4. View Trust Score
   - 5. Withdraw Earnings
```

#### Via SMS
```
Supplier receives: "New order #ORD-2847: 50kg Maize from +254712345678. Deliver to Nairobi by 20/01/2026. Confirm: YES/NO"

Supplier: YES
System: "Order accepted. Payment in escrow. Deliver & get code from buyer to release funds."

After delivery:
Supplier: DELIVER ORD-2847 CODE-8473
System: "Delivery confirmed. KES4,500 released to your M-Pesa. Trust score: 98% (+2%)"
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACES                          │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   USSD       │     SMS      │    Voice     │  Web Dashboard│
│  *384*123#   │   Shortcode  │  IVR System  │  (Optional)   │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬───────┘
       │              │              │               │
       └──────────────┴──────────────┴───────────────┘
                      │
         ┌────────────▼────────────┐
         │   API GATEWAY/ROUTER    │
         │   (Express.js Server)   │
         └────────────┬────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐    ┌───────▼────────┐   ┌───▼────┐
│ Order  │    │   Payment      │   │ Trust  │
│ Service│    │   Service      │   │ Engine │
└───┬────┘    └───────┬────────┘   └───┬────┘
    │                 │                │
    └─────────────────┼────────────────┘
                      │
         ┌────────────▼────────────┐
         │   DATABASE LAYER        │
         │   PostgreSQL/MongoDB    │
         │   - Users               │
         │   - Products            │
         │   - Orders              │
         │   - Transactions        │
         │   - Trust Scores        │
         └─────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │  AFRICASTALKING APIs    │
         ├─────────────────────────┤
         │ • USSD API              │
         │ • SMS API               │
         │ • Voice/IVR API         │
         │ • Mobile Money API      │
         │ • Airtime API           │
         │ • Webhooks              │
         └─────────────────────────┘
```

### **Payment Flow (Escrow)**
```
1. Buyer places order → Payment request sent via M-Pesa
2. Payment received → Funds held in escrow account
3. Supplier confirms order → Delivery initiated
4. Supplier delivers → Buyer receives delivery code
5. Buyer confirms delivery → Code validated
6. System releases payment → Supplier receives funds
7. Trust scores updated → Both parties rated
```

### **Trust Scoring Algorithm**
```javascript
Trust Score = (
  Delivery Success Rate × 40% +
  Average Rating × 30% +
  Response Time × 15% +
  Order Volume × 10% +
  Dispute Resolution × 5%
)

Ranges:
95-100%: ⭐⭐⭐⭐⭐ (Excellent)
85-94%:  ⭐⭐⭐⭐ (Very Good)
70-84%:  ⭐⭐⭐ (Good)
50-69%:  ⭐⭐ (Fair)
<50%:    ⭐ (Poor)
```

---

## ✨ Core Features

### 1. **Supplier Verification System**
- Trust score visible to all buyers
- Certification badges (organic, fair trade, etc.)
- Delivery history and ratings
- Real-time inventory updates

### 2. **Multi-Channel Ordering**
- USSD: Interactive menus for product browsing
- SMS: Quick order via keywords (ORDER, BUY, CHECK)
- Voice: IVR for low-literacy users
- Web: Dashboard for bulk orders

### 3. **Secure Payment & Escrow**
- M-Pesa/Airtel Money integration
- Funds held until delivery confirmed
- Automated release with delivery codes
- Dispute resolution mechanism

### 4. **Real-Time Tracking**
- SMS updates: Order confirmed → Dispatched → In Transit → Delivered
- USSD tracking: Check order status anytime
- Voice: Call to hear order status

### 5. **Trust & Safety**
- Buyer and supplier ratings
- Fraud detection algorithms
- Blacklist management
- Dispute escalation

### 6. **Analytics & Insights**
- Supplier: Sales trends, popular products, earnings
- Buyer: Spending patterns, favorite suppliers
- Platform: Market demand, pricing trends, fraud alerts

### 7. **Loyalty & Incentives** (Airtime API)
- Buyers earn airtime for completed orders
- Suppliers get bonuses for high trust scores
- Referral rewards

---

## 🛠️ Technical Stack

### **Backend**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript (CommonJS)

### **Database**
- **Primary**: PostgreSQL (structured data: users, orders, transactions)
- **Cache**: Redis (session management, USSD state)
- **Optional**: MongoDB (analytics, logs)

### **APIs & Integrations**
- **AfricasTalking SDK**: `africastalking` npm package
  - USSD API
  - SMS API (send, bulk, inbound webhooks)
  - Voice/IVR API
  - Mobile Money API (payments, B2C, C2B)
  - Airtime API
- **Payment**: M-Pesa, Airtel Money via AT Mobile Money API
- **AI** (Optional): Google Gemini for smart SMS replies

### **Infrastructure**
- **Hosting**: AWS EC2, DigitalOcean, or Heroku
- **Webhooks**: Ngrok (dev), public domain (prod)
- **Monitoring**: Morgan (logging), Sentry (error tracking)

### **Security**
- Environment variables (`.env`)
- Webhook signature verification
- Rate limiting (express-rate-limit)
- Input validation (express-validator)

---

## 🎯 AfricasTalking API Usage

### **USSD API**
```javascript
// Buyer browses products
POST /ussd
Body: { sessionId, serviceCode, phoneNumber, text }

Response:
"CON Welcome to AgriTrust & Trade
1. Buy Products
2. Track Order
3. My Account
4. Help"
```

### **SMS API**
```javascript
// Order confirmation
africastalking.SMS.send({
  to: ['+254712345678'],
  message: 'Order #ORD-2847 confirmed! 50kg Maize from Kamau Farms. Pay KES4,500 to 12345. Track: *384*123#',
  from: 'AGRITRUST'
});

// Inbound webhook
POST /sms/inbound
Body: { text, from, to, date, id, linkId }
```

### **Voice/IVR API**
```javascript
// Initiate call to buyer
africastalking.VOICE.call({
  callFrom: '+254711000000',
  callTo: '+254712345678'
});

// IVR response
POST /voice/actions
Response: `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to AgriTrust. Press 1 to buy maize.</Say>
  <GetDigits timeout="30" finishOnKey="#">
    <Say>Enter quantity in kilograms</Say>
  </GetDigits>
</Response>
`
```

### **Mobile Money API**
```javascript
// Receive payment (C2B)
africastalking.PAYMENTS.mobileCheckout({
  productName: 'AgriTrust',
  phoneNumber: '+254712345678',
  currencyCode: 'KES',
  amount: 4500,
  metadata: { orderId: 'ORD-2847', type: 'escrow' }
});

// Release payment to supplier (B2C)
africastalking.PAYMENTS.mobileB2C({
  productName: 'AgriTrust',
  recipients: [{
    phoneNumber: '+254711000000',
    currencyCode: 'KES',
    amount: 4500,
    reason: 'SalaryPayment',
    metadata: { orderId: 'ORD-2847', supplier: 'Kamau Farms' }
  }]
});
```

### **Webhooks**
```javascript
// Payment confirmation
POST /payments/callback
Body: { transactionId, status, phoneNumber, amount, ... }

// Delivery confirmation
POST /orders/delivery-webhook
Body: { orderId, deliveryCode, timestamp, ... }
```

### **Airtime API** (Loyalty)
```javascript
// Reward buyer with airtime
africastalking.AIRTIME.send({
  recipients: [{
    phoneNumber: '+254712345678',
    currencyCode: 'KES',
    amount: 50
  }]
});
```

---

## 🚀 Impact & Hackathon Alignment

### **Social Impact**
- **Financial Inclusion**: 2M+ unbanked farmers access secure payments
- **Trust Building**: 40% reduction in agricultural fraud
- **Market Access**: Small-scale suppliers reach 10x more buyers
- **Food Security**: Efficient supply chains reduce post-harvest losses by 25%

### **Hackathon Tracks**
1. **POS & Payments**: Mobile money escrow, secure transactions
2. **Supply Chain**: End-to-end tracking, supplier verification
3. **Consumer Protection**: Trust scores, dispute resolution, fraud detection
4. **Financial Inclusion**: Feature phone access, flexible payments, credit scoring
5. **Agriculture**: Market linkages, price transparency, quality assurance

### **Scalability**
- **Horizontal**: Expand to livestock, dairy, horticulture
- **Geographic**: Pan-African deployment (Kenya → Uganda → Nigeria)
- **Vertical**: Add logistics partners, insurance, credit facilities

### **Business Model**
- Transaction fee: 2% per order
- Supplier subscription: KES 500/month for premium features
- Data insights: Sell anonymized market trends to agribusinesses
- Advertising: Promote agri-input suppliers to buyers

---

## 🔮 Future Expansion

### **Phase 2: Financial Services**
- **Buy Now Pay Later (BNPL)**: Credit scoring based on trust scores
- **Micro-insurance**: Crop insurance integrated into orders
- **Savings Groups**: Digital chamas for collective purchasing

### **Phase 3: AI & Analytics**
- **Predictive Analytics**: Forecast demand, optimize pricing
- **Smart Recommendations**: Suggest products based on buying history
- **Fraud Detection**: ML models to identify suspicious patterns

### **Phase 4: Sustainability**
- **Carbon Credits**: Track and reward sustainable farming practices
- **Traceability**: Blockchain-lite for farm-to-fork transparency
- **Impact Reporting**: ESG metrics for investors and donors

### **Phase 5: Ecosystem Integration**
- **Logistics API**: Partner with delivery services (Sendy, Glovo)
- **Weather API**: Send alerts for planting and harvest seasons
- **Market Prices**: Real-time commodity pricing from exchanges

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Africa's Talking account (Sandbox or Production)
- Ngrok (for local webhook testing)
- PostgreSQL or MongoDB

### Installation
```bash
# Clone repository
git clone https://github.com/Mr-mpange/agri-trade-trust.git
cd agri-trade-trust

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your AT credentials

# Run server
npm run dev

# Expose webhooks (separate terminal)
ngrok http 3000
```

### Configure Africa's Talking Dashboard
1. **USSD**: Set callback URL to `https://<ngrok>/ussd`
2. **SMS**: Set inbound URL to `https://<ngrok>/sms/inbound`
3. **Voice**: Set callback URL to `https://<ngrok>/voice/actions`
4. **Payments**: Set validation URL to `https://<ngrok>/payments/validate`

### Test Endpoints
```powershell
# Health check
curl http://localhost:3000/health

# USSD simulation
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text='

# Place order via SMS
curl -Method POST -Uri http://localhost:3000/sms/inbound -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'text=ORDER+MAIZE+50KG&from=%2B254712345678&to=12345'
```

---

## 📄 API Documentation

Import `requests.postman_collection.json` into Postman for complete API examples.

### Key Endpoints
- `POST /ussd` - USSD session handler
- `POST /sms/send` - Send SMS
- `POST /sms/inbound` - Receive SMS webhook
- `POST /voice/call` - Initiate voice call
- `POST /voice/actions` - IVR menu handler
- `POST /payments/checkout` - Initiate payment
- `POST /payments/callback` - Payment webhook
- `POST /orders/create` - Create order
- `GET /orders/:id/track` - Track order
- `GET /suppliers/:id/trust-score` - Get trust score
- `POST /airtime/reward` - Send loyalty airtime

---

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Email**: support@agritrust.africa
- **WhatsApp**: +254-XXX-XXXXXX
- **Docs**: https://docs.agritrust.africa
- **Africa's Talking**: https://africastalking.com/docs

---

## 📜 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for African farmers and traders**

*Powered by Africa's Talking APIs*
