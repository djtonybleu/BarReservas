# 🚀 Vercel Deployment - Step by Step

## 📋 **Exact Steps**

### 1. Go to Vercel
**URL**: https://vercel.com/new

### 2. Import Repository
- Click **"Import Git Repository"**
- Search: `djtonybleu/BarReservas`
- Click **"Import"**

### 3. Configure Project
**Framework Preset**: Other
**Root Directory**: `.` (leave default)

### 4. Build Settings
**Build Command**: 
```bash
mkdir -p dist && cp index.html dist/ && cp -r src dist/ && cp -r public/* dist/ 2>/dev/null || true
```

**Output Directory**: 
```
dist
```

### 5. Environment Variables
Click **"Environment Variables"** and add:
```
VITE_REACT_APP_API_URL = https://barreservas-production.up.railway.app
```

### 6. Deploy
Click **"Deploy"**

## ✅ **Expected Result**
- **URL**: https://barreservas-[random].vercel.app
- **Time**: ~2-3 minutes
- **Status**: ✅ Deployed successfully

---
**Next**: Deploy Backend on Railway