# Africa's Talking Sandbox Guide

## 🎯 What is Sandbox?

Africa's Talking **Sandbox** is a **FREE testing environment** where you can test all APIs without spending money or using real phone numbers.

---

## 🔑 Getting Started

### 1. Create Account
1. Go to: https://account.africastalking.com/auth/register
2. Sign up (it's FREE!)
3. Verify your email

### 2. Get Sandbox Credentials
1. Login to: https://account.africastalking.com
2. Go to **Sandbox App**
3. Copy your credentials:
   - **Username**: `sandbox`
   - **API Key**: (long string like `atsk_abc123...`)

### 3. Configure Your App
```bash
# Copy example file
cp .env.example .env

# Edit .env and add your credentials
AT_USERNAME=sandbox
AT_API_KEY=atsk_your_actual_api_key_here
```

---

## 📱 Sandbox Phone Numbers

### For Tanzania Testing

**Sandbox uses FAKE phone numbers** - they don't send real SMS/calls!

**Test Numbers (Tanzania format):**
```
+255711000000
+255711000001
+255711000002
+255711000003
+255711000004
```

**Important:**
- ✅ These numbers work in sandbox for testing
- ❌ They DON'T send real SMS to actual phones
- ✅ You can see "sent" messages in the sandbox dashboard
- ❌ You can't receive actual SMS on your phone in sandbox

---

## 🧪 What You Can Test in Sandbox

### ✅ Works in Sandbox:
1. **SMS Sending** - See messages in dashboard (not real SMS)
2. **USSD** - Test USSD flows locally
3. **Voice** - Initiate calls (simulated)
4. **Airtime** - Test airtime API (no real airtime sent)
5. **Payments** - Test payment flows (no real money)

### ❌ Limitations:
1. **No Real SMS** - Messages don't reach actual phones
2. **No Real Calls** - Voice calls are simulated
3. **No Real Money** - Payments are simulated
4. **Limited Numbers** - Only sandbox test numbers work

---

## 🚀 Moving to Production

### When You're Ready for Real Users:

1. **Upgrade to Production**
   - Go to: https://account.africastalking.com
   - Click "Go Live" or "Production"
   - Add payment method

2. **Update Credentials**
   ```bash
   # In .env file
   AT_USERNAME=YourProductionUsername  # NOT "sandbox"
   AT_API_KEY=your_production_api_key
   ```

3. **Use Real Phone Numbers**
   ```
   +255712345678  # Real Tanzanian number
   +255700123456  # Real Tanzanian number
   ```

4. **Configure Webhooks**
   - Set your production domain URLs
   - Example: `https://yourdomain.com/ussd`

---

## 💰 Pricing (Production)

### Tanzania Rates (Approximate):
- **SMS**: ~TZS 30-50 per message
- **USSD**: ~TZS 5-10 per session
- **Voice**: ~TZS 100-200 per minute
- **Airtime**: Face value + small fee
- **Payments**: 1-3% transaction fee

**Sandbox is FREE - no charges!**

---

## 🧪 Testing Your App

### 1. Test SMS Sending
```bash
curl -X POST http://localhost:3000/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+255711000000",
    "message": "Test from sandbox"
  }'
```

**Result**: Message appears in sandbox dashboard, NOT on real phone

### 2. Test USSD
```bash
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=TEST123&serviceCode=*384*123#&phoneNumber=%2B255711000000&text="
```

**Result**: USSD menu response (works locally)

### 3. Test Order Creation
```bash
curl -X POST http://localhost:3000/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "buyerPhone": "+255711000000",
    "productType": "maize",
    "quantity": "50",
    "supplierId": "SUP001"
  }'
```

**Result**: Order created, SMS logged in sandbox (not sent to real phone)

---

## 🔍 Viewing Sandbox Activity

### Dashboard
1. Login to: https://account.africastalking.com
2. Go to **Sandbox App**
3. Click **Logs** to see:
   - SMS sent
   - USSD sessions
   - Voice calls
   - Payment attempts

---

## ❓ Common Questions

### Q: Why don't I receive SMS on my phone?
**A:** Sandbox doesn't send real SMS. Check the dashboard logs instead.

### Q: Can I test with my real phone number?
**A:** No, sandbox only works with test numbers like `+255711000000`.

### Q: Do I need to pay for sandbox?
**A:** No! Sandbox is completely FREE.

### Q: How do I test USSD on my phone?
**A:** You can't in sandbox. You need production account and USSD shortcode.

### Q: When should I move to production?
**A:** When you're ready to:
- Send real SMS to customers
- Accept real payments
- Have users dial your USSD code

---

## 🎯 Recommended Testing Flow

### Phase 1: Local Testing (Sandbox)
1. ✅ Test all API endpoints locally
2. ✅ Verify USSD menu flows
3. ✅ Test order creation and tracking
4. ✅ Test payment flows (simulated)
5. ✅ Check logs in sandbox dashboard

### Phase 2: Staging (Production with Test Numbers)
1. ✅ Upgrade to production
2. ✅ Test with 2-3 real phone numbers
3. ✅ Send real SMS to your team
4. ✅ Test real payments with small amounts
5. ✅ Configure webhooks with staging domain

### Phase 3: Production Launch
1. ✅ Deploy to production server
2. ✅ Configure production webhooks
3. ✅ Onboard real suppliers
4. ✅ Launch to real users
5. ✅ Monitor and optimize

---

## 📞 Support

- **Sandbox Issues**: Check dashboard logs first
- **Documentation**: https://developers.africastalking.com
- **Support**: support@africastalking.com
- **Community**: https://help.africastalking.com

---

## ✅ Quick Checklist

Before moving to production:

- [ ] All features tested in sandbox
- [ ] API credentials secured
- [ ] Webhooks configured
- [ ] Error handling implemented
- [ ] Logging and monitoring set up
- [ ] Payment method added to AT account
- [ ] Production domain ready
- [ ] SSL certificate installed
- [ ] Team trained on platform

---

**Remember**: Sandbox is for testing only. Real users need production account!

**Last Updated**: January 16, 2026
