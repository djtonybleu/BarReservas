#!/bin/bash

echo "🧪 Running BarReservas Test Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if services are running
check_services() {
    print_status "🔍 Checking services..." $YELLOW
    
    # Check if backend is running
    if ! curl -s http://localhost:3000/health > /dev/null; then
        print_status "❌ Backend not running. Starting backend..." $RED
        cd backend && npm run dev &
        BACKEND_PID=$!
        sleep 5
    fi
    
    # Check if frontend is running
    if ! curl -s http://localhost:5173 > /dev/null; then
        print_status "❌ Frontend not running. Starting frontend..." $RED
        npm run dev &
        FRONTEND_PID=$!
        sleep 5
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "🔬 Running Unit Tests..." $YELLOW
    npm run test:unit
    UNIT_EXIT_CODE=$?
    
    if [ $UNIT_EXIT_CODE -eq 0 ]; then
        print_status "✅ Unit tests passed!" $GREEN
    else
        print_status "❌ Unit tests failed!" $RED
    fi
}

# Run integration tests
run_integration_tests() {
    print_status "🔌 Running Integration Tests..." $YELLOW
    npm run test:integration
    INTEGRATION_EXIT_CODE=$?
    
    if [ $INTEGRATION_EXIT_CODE -eq 0 ]; then
        print_status "✅ Integration tests passed!" $GREEN
    else
        print_status "❌ Integration tests failed!" $RED
    fi
}

# Run E2E tests
run_e2e_tests() {
    print_status "🎭 Running E2E Tests..." $YELLOW
    npm run test:e2e
    E2E_EXIT_CODE=$?
    
    if [ $E2E_EXIT_CODE -eq 0 ]; then
        print_status "✅ E2E tests passed!" $GREEN
    else
        print_status "❌ E2E tests failed!" $RED
    fi
}

# Generate coverage report
generate_coverage() {
    print_status "📊 Generating Coverage Report..." $YELLOW
    npm run test:coverage
    print_status "📋 Coverage report generated in ./coverage/" $GREEN
}

# Cleanup function
cleanup() {
    print_status "🧹 Cleaning up..." $YELLOW
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
}

# Trap cleanup on script exit
trap cleanup EXIT

# Main execution
main() {
    case "${1:-all}" in
        "unit")
            run_unit_tests
            exit $UNIT_EXIT_CODE
            ;;
        "integration")
            check_services
            run_integration_tests
            exit $INTEGRATION_EXIT_CODE
            ;;
        "e2e")
            check_services
            run_e2e_tests
            exit $E2E_EXIT_CODE
            ;;
        "coverage")
            generate_coverage
            ;;
        "all"|*)
            check_services
            run_unit_tests
            run_integration_tests
            run_e2e_tests
            generate_coverage
            
            # Final status
            if [ $UNIT_EXIT_CODE -eq 0 ] && [ $INTEGRATION_EXIT_CODE -eq 0 ] && [ $E2E_EXIT_CODE -eq 0 ]; then
                print_status "🎉 All tests passed!" $GREEN
                exit 0
            else
                print_status "💥 Some tests failed!" $RED
                exit 1
            fi
            ;;
    esac
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [unit|integration|e2e|coverage|all]"
    echo ""
    echo "Options:"
    echo "  unit        Run only unit tests"
    echo "  integration Run only integration tests"
    echo "  e2e         Run only E2E tests"
    echo "  coverage    Generate coverage report"
    echo "  all         Run all tests (default)"
    echo "  --help, -h  Show this help message"
    exit 0
fi

main "$1"