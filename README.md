# 💧 AquaBill — Water Billing SaaS Platform

A multi-tenant SaaS for automating water billing and WhatsApp delivery across multiple properties.

---

## 🏗️ Architecture

```
SuperAdmin (you)
  └── Creates & manages House Accounts
        └── Each House Account (caretaker/admin)
              └── Manages their own units & tenants
```

---

## 🔑 Required API Keys & Services

### 1. MongoDB Atlas (Database)
- Sign up at https://cloud.mongodb.com
- Create a free cluster → **Connect** → copy URI
- Replace `MONGODB_URI` in `backend/.env`

### 2. Redis Cloud (Job Queues)
- Sign up at https://redis.com/try-free/ (free 30MB)
- Create DB → copy endpoint + password
- Format: `redis://default:PASSWORD@host:port`
- Replace `REDIS_URL` in `backend/.env`

### 3. Meta WhatsApp Cloud API
- Go to **developers.facebook.com** → Create App → Business → add WhatsApp
- Under **WhatsApp → Getting Started** copy your **Phone Number ID**
- Go to **Business Settings → System Users** → create user → generate permanent token with `whatsapp_business_messaging` permission
- Replace `META_PHONE_NUMBER_ID` and `META_ACCESS_TOKEN` in `backend/.env`
- ~$0.005–0.008 per message to Kenyan numbers

---

## ⚙️ Setup

### 1. Configure environment
Edit `backend/.env`:
```
MONGODB_URI=...
REDIS_URL=...
META_PHONE_NUMBER_ID=...
META_ACCESS_TOKEN=...
SUPERADMIN_EMAIL=you@email.com
SUPERADMIN_PASSWORD=strongpassword
SUPERADMIN_PAYMENT_NUMBER=0712000000   ← your M-Pesa number
```

### 2. Install & run backend
```bash
cd backend
npm install
npm run seed          # creates superadmin account ONCE
npm run dev           # start server
```

### 3. Install & run frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Login
- Go to http://localhost:5173/login
- Login with your superadmin email/password
- You land on the **SuperAdmin panel**
- Add house accounts from there

---

## 👤 User Roles

| Role | Access |
|------|--------|
| **superadmin** | Platform overview, create/edit/suspend/delete house accounts, send payment reminders |
| **admin** | Their own houses, tenants, water input, invoices |

---

## 📲 SuperAdmin Features
- Platform stats (total accounts, rooms, revenue)
- Create house accounts (email, password, caretaker name + phone, price per room)
- Edit account details
- Suspend account (blocks caretaker login)
- Delete account (soft delete)
- Send WhatsApp payment reminder to caretaker — includes room count × price per room, sends to your `SUPERADMIN_PAYMENT_NUMBER`

---

## 🔄 Billing Flow
```
Admin enters meter readings
  → BullMQ queue
    → Generate invoice (water only)
    → Send WhatsApp to tenant
    → Schedule daily reminders (max 3)
```

## ❌ Intentionally excluded
- No payment tracking
- No rent totals
- No tenant onboarding

---

## 🚀 Production Deployment

**Backend** → Railway / Render / Fly.io
- Set all env vars in platform dashboard
- Build: `npm install && npm run seed`
- Start: `node src/server.js`

**Frontend** → Vercel / Netlify
- Build: `npm run build` / Output: `dist`
- Set `VITE_API_URL=https://your-backend.railway.app/api`
