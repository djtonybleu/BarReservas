#!/bin/bash

echo "🔧 Setting up BarReservas Integrations..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${2}${1}${NC}"
}

# Install integration dependencies
install_dependencies() {
    print_status "📦 Installing integration dependencies..." $YELLOW
    npm install stripe @stripe/stripe-js @stripe/react-stripe-js mixpanel
    print_status "✅ Dependencies installed!" $GREEN
}

# Setup database schema
setup_database() {
    print_status "🗃️ Setting up multi-tenant schema..." $YELLOW
    if [ -n "$DATABASE_URL" ]; then
        psql $DATABASE_URL -f database/multi-tenant-schema.sql
        print_status "✅ Database schema updated!" $GREEN
    else
        print_status "⚠️ DATABASE_URL not set, skipping database setup" $YELLOW
    fi
}

# Create PWA icons (placeholder)
create_pwa_icons() {
    print_status "📱 Creating PWA icons..." $YELLOW
    mkdir -p public/icons
    # In production, you would generate actual icons here
    touch public/icons/icon-192x192.png
    touch public/icons/icon-512x512.png
    print_status "✅ PWA icons created!" $GREEN
}

# Update HTML for PWA
update_html() {
    print_status "📝 Updating HTML for PWA..." $YELLOW
    
    # Add PWA meta tags to index.html if not present
    if ! grep -q "manifest.json" index.html; then
        sed -i '' '/<head>/a\
    <link rel="manifest" href="/manifest.json">\
    <meta name="theme-color" content="#8b5cf6">\
    <meta name="apple-mobile-web-app-capable" content="yes">\
    <meta name="apple-mobile-web-app-status-bar-style" content="default">\
    <meta name="apple-mobile-web-app-title" content="BarReservas">
' index.html
    fi
    
    print_status "✅ HTML updated for PWA!" $GREEN
}

# Setup instructions
show_setup_instructions() {
    print_status "📋 Integration Setup Instructions:" $YELLOW
    echo ""
    echo "1. Stripe Setup:"
    echo "   - Create account at https://stripe.com"
    echo "   - Get API keys from dashboard"
    echo "   - Update STRIPE_* variables in .env"
    echo ""
    echo "2. WhatsApp Business API:"
    echo "   - Apply for WhatsApp Business API"
    echo "   - Get phone number ID and access token"
    echo "   - Update WHATSAPP_* variables in .env"
    echo ""
    echo "3. Analytics (Mixpanel):"
    echo "   - Create account at https://mixpanel.com"
    echo "   - Get project token"
    echo "   - Update MIXPANEL_TOKEN in .env"
    echo ""
    echo "4. PWA Testing:"
    echo "   - Serve over HTTPS"
    echo "   - Test 'Add to Home Screen'"
    echo "   - Verify offline functionality"
    echo ""
}

# Main execution
main() {
    install_dependencies
    setup_database
    create_pwa_icons
    update_html
    show_setup_instructions
    
    print_status "🎉 Integration setup completed!" $GREEN
    print_status "🔗 Next: Configure API keys in .env file" $YELLOW
}

main