# 🚀 BarReservas - Deploy Checklist

## ⚡ QUICK DEPLOY (15 minutes)

### 1. Frontend Deploy (Vercel) - 5 min
- [ ] Go to https://vercel.com/new
- [ ] Import GitHub repository
- [ ] Build Command: `mkdir -p dist && cp index.html dist/`
- [ ] Output Directory: `dist`
- [ ] Deploy!
- [ ] **Result**: https://barreservas.vercel.app

### 2. Backend Deploy (Railway) - 5 min
- [ ] Go to https://railway.app/new
- [ ] Deploy from GitHub
- [ ] Root Directory: `backend`
- [ ] Add PostgreSQL service
- [ ] Add Redis service
- [ ] **Result**: https://barreservas-production.up.railway.app

### 3. Environment Variables - 2 min
```bash
# Required
NODE_ENV=production
PORT=3000
DATABASE_URL=<from_railway_dashboard>
REDIS_URL=<from_railway_dashboard>
JWT_SECRET=barreservas-super-secret-jwt-key-2024
ENCRYPTION_KEY=barreservas-32-byte-encryption-key
```

### 4. Database Setup - 2 min
```bash
# Get DATABASE_URL from Railway dashboard
psql $DATABASE_URL -f backend/schema.sql
psql $DATABASE_URL -f database/multi-tenant-schema.sql
```

### 5. Create Admin User - 1 min
```bash
curl -X POST https://your-railway-app.railway.app/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barreservas.com","password":"admin123"}'
```

## ✅ VERIFICATION

### Health Checks
- [ ] Frontend: https://barreservas.vercel.app
- [ ] Backend: https://your-app.railway.app/health
- [ ] API: https://your-app.railway.app/api/tables
- [ ] Admin: https://barreservas.vercel.app/admin

### Test Flow
- [ ] Create reservation
- [ ] Generate QR code
- [ ] Register member
- [ ] Check-in process
- [ ] View tables

## 🎯 PRODUCTION URLS

**Frontend**: https://barreservas.vercel.app
**Backend**: https://barreservas-production.up.railway.app
**Admin**: https://barreservas.vercel.app/admin
**Health**: https://barreservas-production.up.railway.app/health

## 🔧 TROUBLESHOOTING

**Frontend not loading?**
- Check Vercel build logs
- Verify build command
- Check environment variables

**Backend errors?**
- Check Railway logs
- Verify DATABASE_URL
- Check environment variables

**Database connection failed?**
- Verify PostgreSQL service is running
- Check DATABASE_URL format
- Run schema setup commands

## 🎉 SUCCESS!

Your BarReservas system is now LIVE in production!

**Next Steps:**
1. Share with first customers
2. Monitor metrics
3. Collect feedback
4. Scale up!