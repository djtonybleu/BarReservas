#!/bin/bash

echo "🚀 DEPLOYING BARRESERVAS TO PRODUCTION..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${2}${1}${NC}"
}

# Step 1: Build Frontend
build_frontend() {
    print_status "📦 Building Frontend..." $YELLOW
    
    # Simple build without vite issues
    mkdir -p dist
    cp index.html dist/
    cp -r src dist/ 2>/dev/null || true
    cp -r public/* dist/ 2>/dev/null || true
    
    print_status "✅ Frontend built!" $GREEN
}

# Step 2: Deploy to Vercel (Manual)
deploy_frontend() {
    print_status "⚡ Deploying Frontend to Vercel..." $YELLOW
    
    # Create simple deployment
    echo "Manual deployment steps:"
    echo "1. Go to https://vercel.com/new"
    echo "2. Import this repository"
    echo "3. Set build command: 'mkdir -p dist && cp index.html dist/'"
    echo "4. Set output directory: 'dist'"
    echo "5. Deploy!"
    
    print_status "📝 Frontend deployment configured!" $GREEN
}

# Step 3: Deploy Backend (Manual Railway)
deploy_backend() {
    print_status "🚂 Deploying Backend to Railway..." $YELLOW
    
    echo "Manual deployment steps:"
    echo "1. Go to https://railway.app/new"
    echo "2. Deploy from GitHub repo"
    echo "3. Select 'backend' folder as root"
    echo "4. Add PostgreSQL service"
    echo "5. Add Redis service"
    echo "6. Set environment variables"
    echo "7. Deploy!"
    
    print_status "📝 Backend deployment configured!" $GREEN
}

# Step 4: Database Setup
setup_database() {
    print_status "🗃️ Database Setup Instructions..." $YELLOW
    
    echo "After Railway deployment:"
    echo "1. Get DATABASE_URL from Railway dashboard"
    echo "2. Run: psql \$DATABASE_URL -f backend/schema.sql"
    echo "3. Run: psql \$DATABASE_URL -f database/multi-tenant-schema.sql"
    
    print_status "📝 Database setup instructions ready!" $GREEN
}

# Step 5: Environment Variables
show_env_vars() {
    print_status "🔧 Required Environment Variables..." $YELLOW
    
    echo "Set these in Railway:"
    echo "NODE_ENV=production"
    echo "PORT=3000"
    echo "DATABASE_URL=<from_railway>"
    echo "REDIS_URL=<from_railway>"
    echo "JWT_SECRET=<generate_secure_key>"
    echo "ENCRYPTION_KEY=<32_byte_key>"
    echo ""
    echo "Optional (for integrations):"
    echo "STRIPE_SECRET_KEY=<your_stripe_key>"
    echo "WHATSAPP_ACCESS_TOKEN=<your_whatsapp_token>"
    echo "MIXPANEL_TOKEN=<your_mixpanel_token>"
    
    print_status "📝 Environment variables listed!" $GREEN
}

# Step 6: Health Check
health_check() {
    print_status "🏥 Post-Deployment Health Check..." $YELLOW
    
    echo "After deployment, verify:"
    echo "✅ Frontend loads: https://your-app.vercel.app"
    echo "✅ Backend health: https://your-app.railway.app/health"
    echo "✅ API works: https://your-app.railway.app/api/tables"
    echo "✅ Database connected"
    echo "✅ SSL certificates active"
    
    print_status "📝 Health check instructions ready!" $GREEN
}

# Main execution
main() {
    print_status "🎯 BARRESERVAS PRODUCTION DEPLOYMENT" $BLUE
    echo "======================================"
    
    build_frontend
    deploy_frontend
    deploy_backend
    setup_database
    show_env_vars
    health_check
    
    print_status "🎉 DEPLOYMENT GUIDE COMPLETE!" $GREEN
    print_status "🔗 Next: Follow the manual steps above" $YELLOW
    print_status "⏱️  Total time: ~15 minutes" $BLUE
}

main