#!/bin/bash

echo "🚀 DEPLOYING BARRESERVAS TO PRODUCTION NOW!"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${2}${1}${NC}"
}

# Step 1: Prepare for deployment
prepare_deployment() {
    print_status "📦 Preparing deployment files..." $YELLOW
    
    # Ensure dist exists
    mkdir -p dist
    cp index.html dist/
    cp -r src dist/ 2>/dev/null || true
    cp -r public/* dist/ 2>/dev/null || true
    
    print_status "✅ Files prepared!" $GREEN
}

# Step 2: Deploy to Vercel (using CLI if available, otherwise manual)
deploy_frontend() {
    print_status "⚡ Deploying Frontend..." $YELLOW
    
    if command -v vercel &> /dev/null; then
        print_status "🔄 Using Vercel CLI..." $BLUE
        vercel --prod --yes || {
            print_status "📝 Vercel CLI failed, use manual deployment:" $YELLOW
            show_manual_vercel_steps
        }
    else
        show_manual_vercel_steps
    fi
}

# Manual Vercel deployment steps
show_manual_vercel_steps() {
    print_status "📋 Manual Vercel Deployment:" $YELLOW
    echo "1. Go to: https://vercel.com/new"
    echo "2. Import from GitHub: your-repo/BarReservas"
    echo "3. Framework: Other"
    echo "4. Build Command: mkdir -p dist && cp index.html dist/ && cp -r src dist/"
    echo "5. Output Directory: dist"
    echo "6. Environment Variables:"
    echo "   VITE_REACT_APP_API_URL=https://barreservas-production.up.railway.app"
    echo "7. Click Deploy!"
    echo ""
}

# Step 3: Deploy Backend to Railway
deploy_backend() {
    print_status "🚂 Backend Deployment Instructions:" $YELLOW
    echo "1. Go to: https://railway.app/new"
    echo "2. Deploy from GitHub repo"
    echo "3. Select 'backend' as root directory"
    echo "4. Add PostgreSQL service"
    echo "5. Add Redis service (optional)"
    echo "6. Environment Variables:"
    echo "   NODE_ENV=production"
    echo "   PORT=3000"
    echo "   DATABASE_URL=<from_railway>"
    echo "   JWT_SECRET=barreservas-jwt-secret-2024"
    echo "   ENCRYPTION_KEY=barreservas-32-byte-key-here"
    echo "7. Deploy!"
    echo ""
}

# Step 4: Database setup
setup_database() {
    print_status "🗃️ Database Setup:" $YELLOW
    echo "After Railway deployment:"
    echo "1. Get DATABASE_URL from Railway dashboard"
    echo "2. Run: psql \$DATABASE_URL -f backend/schema.sql"
    echo "3. Run: psql \$DATABASE_URL -f database/multi-tenant-schema.sql"
    echo ""
}

# Step 5: Create admin user
create_admin() {
    print_status "👤 Create Admin User:" $YELLOW
    echo "After backend is live:"
    echo "curl -X POST https://your-railway-app.railway.app/api/auth/setup-admin \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"admin@barreservas.com\",\"password\":\"admin123\"}'"
    echo ""
}

# Step 6: Final verification
final_verification() {
    print_status "✅ Verification Checklist:" $YELLOW
    echo "□ Frontend loads: https://your-app.vercel.app"
    echo "□ Backend health: https://your-app.railway.app/health"
    echo "□ API works: https://your-app.railway.app/api/tables"
    echo "□ Admin login: https://your-app.vercel.app/admin"
    echo "□ Create test reservation"
    echo "□ Test QR generation"
    echo "□ Test member registration"
    echo "□ Test check-in flow"
    echo ""
}

# Main execution
main() {
    print_status "🎯 BARRESERVAS PRODUCTION DEPLOYMENT" $BLUE
    echo "=========================================="
    
    prepare_deployment
    deploy_frontend
    deploy_backend
    setup_database
    create_admin
    final_verification
    
    print_status "🎉 DEPLOYMENT INSTRUCTIONS COMPLETE!" $GREEN
    print_status "⏱️  Follow the steps above to go live!" $YELLOW
    print_status "🌐 Your app will be live in ~10 minutes" $BLUE
}

main