# AgriTrust & Trade - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example config
cp .env.example .env

# Edit .env and add your Africa's Talking credentials:
# AT_USERNAME=sandbox
# AT_API_KEY=your_sandbox_api_key
```

### 3. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

### 4. Test It Works
```powershell
# Health check
curl http://localhost:3000/health
```

Expected response:
```json
{
  "ok": true,
  "service": "AgriTrust & Trade - Agricultural Supply Chain Platform",
  "version": "1.0.0"
}
```

---

## 🎯 Quick Test Commands

### Test USSD Menu
```powershell
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text='
```

### Test SMS Order
```powershell
curl -Method POST -Uri http://localhost:3000/sms/inbound -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'text=ORDER+MAIZE+50KG&from=%2B254712345678&to=12345'
```

### Create Order via API
```powershell
curl -Method POST -Uri http://localhost:3000/orders/create -Headers @{"Content-Type"="application/json"} -Body '{
  "buyerPhone": "+254712345678",
  "productType": "maize",
  "quantity": "50",
  "supplierId": "SUP001"
}'
```

### Get Supplier Trust Score
```powershell
curl http://localhost:3000/suppliers/SUP001/trust-score
```

---

## 📱 Test with Real Phone (Webhooks)

### 1. Start Ngrok
```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 2. Configure Africa's Talking Dashboard

Go to your AT dashboard and set:

- **USSD Callback**: `https://abc123.ngrok.io/ussd`
- **SMS Inbound**: `https://abc123.ngrok.io/sms/inbound`
- **Voice Actions**: `https://abc123.ngrok.io/voice/actions`
- **Payment Callback**: `https://abc123.ngrok.io/payments/callback`

### 3. Test with Your Phone

**USSD**: Dial your service code (e.g., `*384*123#`)  
**SMS**: Send `ORDER MAIZE 50KG` to your shortcode  
**Voice**: Call your AT number  

---

## 📚 Documentation

| File | What's Inside |
|------|---------------|
| **README.md** | Complete feature overview, user flows, architecture |
| **TESTING.md** | Detailed test cases with curl commands |
| **ARCHITECTURE.md** | Technical deep-dive, data models, algorithms |
| **HACKATHON_PITCH.md** | Business case, market opportunity, pitch deck |
| **SUMMARY.md** | Project overview and achievements |
| **QUICK_START.md** | This file - get started fast |

---

## 🔑 Key Endpoints

### Orders
- `POST /orders/create` - Create new order
- `GET /orders/:id/track` - Track order status
- `POST /orders/:id/dispatch` - Supplier confirms dispatch
- `POST /orders/:id/confirm-delivery` - Buyer confirms delivery

### Suppliers
- `GET /suppliers/:id/trust-score` - Get trust score
- `GET /suppliers/list/:product` - List suppliers by product
- `POST /suppliers/:id/inventory` - Update inventory

### Payments
- `POST /payments/checkout` - Initiate payment
- `POST /payments/callback` - Payment webhook (AT calls this)
- `POST /payments/release` - Release payment to supplier

### Communication
- `POST /sms/send` - Send SMS
- `POST /sms/inbound` - SMS webhook (AT calls this)
- `POST /ussd` - USSD webhook (AT calls this)
- `POST /voice/call` - Initiate voice call

---

## 🌾 Sample Suppliers (Pre-loaded)

| ID | Name | Trust Score | Products |
|----|------|-------------|----------|
| SUP001 | Kamau Farms | ⭐⭐⭐⭐⭐ 98% | Maize (KES 4,500), Rice (KES 8,000) |
| SUP002 | Njeri Supplies | ⭐⭐⭐⭐ 87% | Maize (KES 4,200), Fertilizer (KES 3,500) |
| SUP003 | Mwangi Seeds Co | ⭐⭐⭐ 72% | Seeds (KES 2,500), Maize (KES 4,300) |

---

## 🎮 USSD Menu Structure

```
*384*123#
├── 1. Buy Products
│   ├── 1. Maize
│   ├── 2. Rice
│   ├── 3. Seeds
│   └── 4. Fertilizer
│       └── [Select Supplier] → [Enter Quantity] → [Confirm]
├── 2. Track Order
│   └── [Enter Order ID]
├── 3. My Account
│   ├── 1. Order History
│   ├── 2. Trust Score
│   └── 3. Settings
└── 4. Demo Menu (Original)
    ├── 1. Balance
    ├── 2. Buy Airtime
    ├── 3. Help
    └── 4. Call Assistance
```

---

## 📝 SMS Commands

| Command | Example | Response |
|---------|---------|----------|
| ORDER | `ORDER MAIZE 50KG` | List of suppliers with trust scores |
| TRACK | `TRACK ORD-1234` | Order status and details |
| HELP | `HELP` | List of available commands |
| MENU | `MENU` | Same as HELP |

---

## 🐛 Troubleshooting

### Server won't start
- Check Node.js version: `node --version` (need 18+)
- Install dependencies: `npm install`
- Check port 3000 is free

### "Order not found"
- Database is in-memory, restart server to reset
- Check order ID format: `ORD-XXXX`

### "Supplier not found"
- Use pre-loaded IDs: SUP001, SUP002, SUP003
- Or check database seeding in `src/services/database.js`

### SMS/USSD not working
- Verify AT credentials in `.env`
- Check ngrok is running for webhooks
- Review AT dashboard callback URLs
- Check server logs for errors

---

## 🎯 Next Steps

1. ✅ **Test locally** - Run all quick test commands above
2. ✅ **Set up webhooks** - Use ngrok and configure AT dashboard
3. ✅ **Test with phone** - Dial USSD, send SMS
4. ✅ **Review docs** - Read README.md for full details
5. ✅ **Customize** - Modify for your specific use case

---

## 💡 Pro Tips

- **Logs**: Watch server logs to see AT webhook calls
- **Postman**: Import `requests.postman_collection.json` for API testing
- **Database**: Data resets on server restart (in-memory)
- **Production**: Replace in-memory DB with PostgreSQL
- **Sessions**: Use Redis for USSD session management in production

---

## 🆘 Need Help?

- **Full Docs**: See README.md
- **Testing Guide**: See TESTING.md
- **Architecture**: See ARCHITECTURE.md
- **GitHub Issues**: https://github.com/Mr-mpange/agri-trade-trust/issues

---

## ✨ Features at a Glance

✅ USSD ordering (*384*123#)  
✅ SMS commands (ORDER, TRACK, HELP)  
✅ Trust scoring (⭐⭐⭐⭐⭐)  
✅ Payment escrow (M-Pesa)  
✅ Order tracking  
✅ Delivery confirmation  
✅ Voice/IVR support  
✅ Supplier management  
✅ Real-time notifications  

---

**You're all set! Start testing and building amazing agri-tech solutions! 🌾**

---

**Built with ❤️ for African farmers and traders**  
**Powered by Africa's Talking APIs**
