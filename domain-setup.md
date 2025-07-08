# 🌐 Domain & SSL Setup

## 1. Purchase Domain
- Buy domain: `barreservas.com` (or your preferred domain)
- Recommended: Namecheap, GoDaddy, or Cloudflare

## 2. Configure DNS (Vercel)

### Frontend (barreservas.com)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### API Subdomain (api.barreservas.com)
```
Type: CNAME  
Name: api
Value: your-railway-app.up.railway.app
```

## 3. Vercel Domain Setup
```bash
# Add domain to Vercel project
vercel domains add barreservas.com
vercel domains add www.barreservas.com

# Verify domain
vercel domains verify barreservas.com
```

## 4. Railway Custom Domain
```bash
# Add custom domain to Railway
railway domain add api.barreservas.com
```

## 5. SSL Certificates
- **Vercel**: Automatic SSL (Let's Encrypt)
- **Railway**: Automatic SSL (Let's Encrypt)
- **Cloudflare**: Optional proxy for additional security

## 6. Update Environment Variables

### Frontend (.env.production)
```env
VITE_REACT_APP_API_URL=https://api.barreservas.com
```

### Backend (Railway)
```env
FRONTEND_URL=https://barreservas.com
CORS_ORIGIN=https://barreservas.com,https://www.barreservas.com
```

## 7. Security Headers (Vercel)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## 8. Monitoring URLs
- **Frontend**: https://barreservas.com
- **API**: https://api.barreservas.com
- **Health**: https://api.barreservas.com/health
- **Monitoring**: https://monitoring.barreservas.com

## 9. CDN Configuration (Optional)
- Enable Cloudflare for additional performance
- Configure caching rules for static assets
- Enable DDoS protection

## 10. Final Verification
```bash
# Test SSL
curl -I https://barreservas.com
curl -I https://api.barreservas.com

# Test API
curl https://api.barreservas.com/health

# Test CORS
curl -H "Origin: https://barreservas.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://api.barreservas.com/api/reservations
```