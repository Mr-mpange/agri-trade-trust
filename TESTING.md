# AgriTrust & Trade - Testing Guide

## Quick Start Testing

### 1. Health Check
```powershell
curl http://localhost:3000/health
```

Expected response:
```json
{
  "ok": true,
  "service": "AgriTrust & Trade - Agricultural Supply Chain Platform",
  "version": "1.0.0",
  "features": ["USSD", "SMS", "Voice", "Payments", "Trust Scoring"],
  "time": "2026-01-16T..."
}
```

---

## USSD Testing

### Test USSD Menu Flow (Local Simulation)

#### 1. Main Menu
```powershell
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text='
```

Expected: Welcome menu with options

#### 2. Buy Products Menu
```powershell
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text=1'
```

Expected: Product selection (Maize, Rice, Seeds, Fertilizer)

#### 3. Select Maize
```powershell
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text=1*1'
```

Expected: List of suppliers with trust scores

#### 4. Select Supplier
```powershell
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text=1*1*1'
```

Expected: Prompt to enter quantity

#### 5. Enter Quantity
```powershell
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text=1*1*1*50'
```

Expected: Order confirmation screen

#### 6. Confirm Order
```powershell
curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_123&serviceCode=*384*123#&phoneNumber=%2B254712345678&text=1*1*1*50*1'
```

Expected: Order created with order ID

---

## SMS Testing

### 1. Send Order via SMS
```powershell
curl -Method POST -Uri http://localhost:3000/sms/inbound -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'text=ORDER+MAIZE+50KG&from=%2B254712345678&to=12345'
```

Expected: SMS reply with supplier list

### 2. Track Order via SMS
```powershell
curl -Method POST -Uri http://localhost:3000/sms/inbound -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'text=TRACK+ORD-1234&from=%2B254712345678&to=12345'
```

Expected: Order status information

### 3. Help Command
```powershell
curl -Method POST -Uri http://localhost:3000/sms/inbound -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'text=HELP&from=%2B254712345678&to=12345'
```

Expected: List of available commands

### 4. Send SMS Notification (Outbound)
```powershell
curl -Method POST -Uri http://localhost:3000/sms/send -Headers @{"Content-Type"="application/json"} -Body '{
  "to": "+254712345678",
  "message": "Your order ORD-1234 has been dispatched!"
}'
```

---

## Order Management Testing

### 1. Create Order
```powershell
curl -Method POST -Uri http://localhost:3000/orders/create -Headers @{"Content-Type"="application/json"} -Body '{
  "buyerPhone": "+254712345678",
  "productType": "maize",
  "quantity": "50",
  "supplierId": "SUP001"
}'
```

Expected: Order created with order ID and delivery code

### 2. Track Order
```powershell
curl -Method GET -Uri http://localhost:3000/orders/ORD-1234/track
```

Expected: Order status and details

### 3. Supplier Confirms Dispatch
```powershell
curl -Method POST -Uri http://localhost:3000/orders/ORD-1234/dispatch -Headers @{"Content-Type"="application/json"} -Body '{
  "supplierPhone": "+254711000001"
}'
```

Expected: Order status updated to "dispatched"

### 4. Buyer Confirms Delivery
```powershell
curl -Method POST -Uri http://localhost:3000/orders/ORD-1234/confirm-delivery -Headers @{"Content-Type"="application/json"} -Body '{
  "deliveryCode": "8473",
  "buyerPhone": "+254712345678"
}'
```

Expected: Delivery confirmed, payment released

---

## Supplier Management Testing

### 1. Get Supplier Trust Score
```powershell
curl -Method GET -Uri http://localhost:3000/suppliers/SUP001/trust-score
```

Expected: Trust score with stars and statistics

### 2. List Suppliers by Product
```powershell
curl -Method GET -Uri http://localhost:3000/suppliers/list/maize
```

Expected: List of suppliers sorted by trust score

### 3. Update Supplier Inventory
```powershell
curl -Method POST -Uri http://localhost:3000/suppliers/SUP001/inventory -Headers @{"Content-Type"="application/json"} -Body '{
  "productType": "maize",
  "quantity": 500,
  "price": 4500
}'
```

Expected: Inventory updated confirmation

---

## Payment Testing

### 1. Initiate Payment (Buyer to Escrow)
```powershell
curl -Method POST -Uri http://localhost:3000/payments/checkout -Headers @{"Content-Type"="application/json"} -Body '{
  "orderId": "ORD-1234",
  "phoneNumber": "+254712345678",
  "amount": 4500
}'
```

Expected: Payment initiated (sandbox mode)

### 2. Simulate Payment Callback
```powershell
curl -Method POST -Uri http://localhost:3000/payments/callback -Headers @{"Content-Type"="application/json"} -Body '{
  "transactionId": "TXN123456",
  "status": "Success",
  "phoneNumber": "+254712345678",
  "value": "4500",
  "requestMetadata": {
    "orderId": "ORD-1234"
  }
}'
```

Expected: Payment processed, order status updated

### 3. Release Payment to Supplier
```powershell
curl -Method POST -Uri http://localhost:3000/payments/release -Headers @{"Content-Type"="application/json"} -Body '{
  "orderId": "ORD-1234",
  "supplierPhone": "+254711000001",
  "amount": 4500
}'
```

Expected: Payment released to supplier

---

## Voice/IVR Testing

### 1. Initiate Voice Call
```powershell
curl -Method POST -Uri http://localhost:3000/voice/call -Headers @{"Content-Type"="application/json"} -Body '{
  "callFrom": "+254711000000",
  "callTo": "+254712345678"
}'
```

Expected: Call initiated (sandbox mode)

### 2. Voice Actions Webhook
```powershell
curl -Method POST -Uri http://localhost:3000/voice/actions -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=123&isActive=1&callerNumber=%2B254712345678'
```

Expected: IVR XML response

---

## Airtime Rewards Testing

### 1. Send Loyalty Airtime
```powershell
curl -Method POST -Uri http://localhost:3000/airtime/send -Headers @{"Content-Type"="application/json"} -Body '{
  "phoneNumber": "+254712345678",
  "amount": "50",
  "currencyCode": "KES"
}'
```

Expected: Airtime sent (sandbox mode)

---

## End-to-End User Journey Test

### Complete Buyer Flow

1. **Browse Products via USSD**
   ```powershell
   # Dial *384*123# → Select 1 (Buy Products) → Select 1 (Maize)
   curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_e2e&serviceCode=*384*123#&phoneNumber=%2B254700000001&text=1*1'
   ```

2. **Select Supplier**
   ```powershell
   curl -Method POST -Uri http://localhost:3000/ussd -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'sessionId=ATUid_e2e&serviceCode=*384*123#&phoneNumber=%2B254700000001&text=1*1*1*50*1'
   ```

3. **Receive SMS Confirmation**
   - Check logs for SMS sent to +254700000001

4. **Make Payment**
   ```powershell
   curl -Method POST -Uri http://localhost:3000/payments/checkout -Headers @{"Content-Type"="application/json"} -Body '{
     "orderId": "ORD-XXXX",
     "phoneNumber": "+254700000001",
     "amount": 4500
   }'
   ```

5. **Supplier Dispatches Order**
   ```powershell
   curl -Method POST -Uri http://localhost:3000/orders/ORD-XXXX/dispatch -Headers @{"Content-Type"="application/json"} -Body '{
     "supplierPhone": "+254711000001"
   }'
   ```

6. **Track Order via SMS**
   ```powershell
   curl -Method POST -Uri http://localhost:3000/sms/inbound -Headers @{"Content-Type"="application/x-www-form-urlencoded"} -Body 'text=TRACK+ORD-XXXX&from=%2B254700000001&to=12345'
   ```

7. **Confirm Delivery**
   ```powershell
   curl -Method POST -Uri http://localhost:3000/orders/ORD-XXXX/confirm-delivery -Headers @{"Content-Type"="application/json"} -Body '{
     "deliveryCode": "XXXX",
     "buyerPhone": "+254700000001"
   }'
   ```

8. **Payment Released to Supplier**
   - Automatic trigger after delivery confirmation

---

## Testing with Ngrok (Real Webhooks)

### 1. Start Ngrok
```powershell
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 2. Configure Africa's Talking Dashboard

- **USSD**: `https://abc123.ngrok.io/ussd`
- **SMS Inbound**: `https://abc123.ngrok.io/sms/inbound`
- **Voice Actions**: `https://abc123.ngrok.io/voice/actions`
- **Payment Callback**: `https://abc123.ngrok.io/payments/callback`

### 3. Test with Real Phone

1. Dial your USSD code (e.g., `*384*123#`)
2. Send SMS to your shortcode
3. Receive voice call

---

## Troubleshooting

### Issue: "Order not found"
- Check if order was created successfully
- Verify order ID format (ORD-XXXX)

### Issue: "Supplier not found"
- Database is in-memory, restart server to reset
- Check supplier IDs: SUP001, SUP002, SUP003

### Issue: "Payment failed"
- Verify AT credentials in .env
- Check sandbox vs production mode
- Review payment callback logs

### Issue: "SMS not received"
- Verify phone number format (+254...)
- Check AT_SENDER_ID in .env
- Review SMS send logs

---

## Sample Test Data

### Pre-seeded Suppliers
- **SUP001**: Kamau Farms (⭐⭐⭐⭐⭐ 98%)
  - Maize: KES 4,500/kg
  - Rice: KES 8,000/kg
  
- **SUP002**: Njeri Supplies (⭐⭐⭐⭐ 87%)
  - Maize: KES 4,200/kg
  - Fertilizer: KES 3,500/kg
  
- **SUP003**: Mwangi Seeds Co (⭐⭐⭐ 72%)
  - Seeds: KES 2,500/kg
  - Maize: KES 4,300/kg

### Test Phone Numbers
- Buyer: +254712345678
- Supplier 1: +254711000001
- Supplier 2: +254711000002
- Supplier 3: +254711000003

---

## Performance Testing

### Load Test Orders
```powershell
# Create 10 orders rapidly
for ($i=1; $i -le 10; $i++) {
  curl -Method POST -Uri http://localhost:3000/orders/create -Headers @{"Content-Type"="application/json"} -Body "{
    `"buyerPhone`": `"+25471234567$i`",
    `"productType`": `"maize`",
    `"quantity`": `"50`",
    `"supplierId`": `"SUP001`"
  }"
}
```

---

## Next Steps

1. ✅ Test all endpoints locally
2. ✅ Set up ngrok for webhook testing
3. ✅ Configure Africa's Talking dashboard
4. ✅ Test with real phone numbers
5. ✅ Monitor logs for errors
6. ✅ Deploy to production server
7. ✅ Set up monitoring and alerts

---

**Happy Testing! 🌾**
