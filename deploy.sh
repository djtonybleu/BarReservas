#!/bin/bash

echo "🚀 Deploying BarReservas to Production..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${2}${1}${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "🔍 Checking prerequisites..." $YELLOW
    
    if ! command -v railway &> /dev/null; then
        print_status "❌ Railway CLI not found. Install: npm install -g @railway/cli" $RED
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_status "❌ Vercel CLI not found. Install: npm install -g vercel" $RED
        exit 1
    fi
    
    print_status "✅ Prerequisites check passed" $GREEN
}

# Deploy backend to Railway
deploy_backend() {
    print_status "🚂 Deploying Backend to Railway..." $YELLOW
    
    # Login to Railway (if not already)
    railway login
    
    # Create new project or link existing
    railway link
    
    # Add PostgreSQL and Redis services
    railway add postgresql
    railway add redis
    
    # Set environment variables
    railway variables set NODE_ENV=production
    railway variables set PORT=3000
    railway variables set FRONTEND_URL=https://barreservas.vercel.app
    
    # Deploy
    railway up
    
    if [ $? -eq 0 ]; then
        print_status "✅ Backend deployed successfully!" $GREEN
        BACKEND_URL=$(railway status --json | jq -r '.deployments[0].url')
        print_status "🔗 Backend URL: $BACKEND_URL" $GREEN
    else
        print_status "❌ Backend deployment failed!" $RED
        exit 1
    fi
}

# Setup database
setup_database() {
    print_status "🗃️ Setting up Production Database..." $YELLOW
    
    # Get database URL from Railway
    DB_URL=$(railway variables get DATABASE_URL)
    
    if [ -n "$DB_URL" ]; then
        psql "$DB_URL" -f deploy-db.sql
        print_status "✅ Database setup completed!" $GREEN
    else
        print_status "❌ Could not get database URL" $RED
        exit 1
    fi
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "⚡ Deploying Frontend to Vercel..." $YELLOW
    
    # Build frontend
    npm run build
    
    # Deploy to Vercel
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        print_status "✅ Frontend deployed successfully!" $GREEN
        FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url')
        print_status "🔗 Frontend URL: https://$FRONTEND_URL" $GREEN
    else
        print_status "❌ Frontend deployment failed!" $RED
        exit 1
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "📊 Setting up Production Monitoring..." $YELLOW
    
    # Deploy monitoring stack to Railway
    cd monitoring
    railway up --service monitoring
    
    print_status "✅ Monitoring setup completed!" $GREEN
    print_status "📊 Grafana: https://monitoring-production.up.railway.app:3001" $GREEN
}

# Create admin user
create_admin() {
    print_status "👤 Creating Admin User..." $YELLOW
    
    read -p "Enter admin email: " ADMIN_EMAIL
    read -s -p "Enter admin password: " ADMIN_PASSWORD
    echo
    
    curl -X POST "$BACKEND_URL/api/auth/setup-admin" \
         -H "Content-Type: application/json" \
         -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
    
    print_status "✅ Admin user created!" $GREEN
}

# Run health checks
health_check() {
    print_status "🏥 Running Health Checks..." $YELLOW
    
    # Check backend health
    BACKEND_HEALTH=$(curl -s "$BACKEND_URL/health" | jq -r '.status')
    if [ "$BACKEND_HEALTH" = "healthy" ]; then
        print_status "✅ Backend is healthy" $GREEN
    else
        print_status "❌ Backend health check failed" $RED
    fi
    
    # Check frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_URL")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        print_status "✅ Frontend is accessible" $GREEN
    else
        print_status "❌ Frontend health check failed" $RED
    fi
}

# Main deployment flow
main() {
    print_status "🎯 Starting BarReservas Production Deployment" $GREEN
    
    check_prerequisites
    deploy_backend
    setup_database
    deploy_frontend
    setup_monitoring
    create_admin
    health_check
    
    print_status "🎉 Deployment Completed Successfully!" $GREEN
    print_status "🔗 Frontend: https://barreservas.vercel.app" $GREEN
    print_status "🔗 Backend: $BACKEND_URL" $GREEN
    print_status "📊 Monitoring: https://monitoring-production.up.railway.app:3001" $GREEN
    print_status "📚 Admin Panel: https://barreservas.vercel.app/admin" $GREEN
}

# Handle script arguments
case "${1:-deploy}" in
    "backend")
        deploy_backend
        ;;
    "frontend")
        deploy_frontend
        ;;
    "database")
        setup_database
        ;;
    "monitoring")
        setup_monitoring
        ;;
    "health")
        health_check
        ;;
    "deploy"|*)
        main
        ;;
esac