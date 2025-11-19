#!/bin/bash

# AlgoGainz Load Testing Runner
# Convenient script to run k6 load tests

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default API URL
API_BASE_URL=${API_BASE_URL:-http://localhost:3000}

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo "Please install k6 first:"
    echo "  macOS: brew install k6"
    echo "  Linux: See https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo -e "${GREEN}✅ k6 is installed${NC}"
echo "📍 Target API: $API_BASE_URL"
echo ""

# Function to run a test
run_test() {
    local test_file=$1
    local test_name=$2

    echo -e "${YELLOW}🚀 Running: $test_name${NC}"
    echo "-------------------------------------------"

    k6 run --env API_BASE_URL="$API_BASE_URL" "$test_file"

    echo ""
    echo -e "${GREEN}✅ $test_name completed${NC}"
    echo ""
}

# Main menu
show_menu() {
    echo "AlgoGainz Load Testing Menu"
    echo "============================"
    echo ""
    echo "1. Quick Test (Trading API - 1 min)"
    echo "2. Full Load Test (Trading API - 4 min)"
    echo "3. Authentication Test (~50 sec)"
    echo "4. Watchlist Test (~1.5 min)"
    echo "5. Stress Test (⚠️  14 min, AGGRESSIVE)"
    echo "6. Run All Tests (Sequential)"
    echo "7. Custom Test (specify file)"
    echo "8. Exit"
    echo ""
    read -p "Select option [1-8]: " choice

    case $choice in
        1)
            echo -e "${YELLOW}Running quick baseline test...${NC}"
            k6 run --vus 20 --duration 1m --env API_BASE_URL="$API_BASE_URL" load-tests/trading-api.js
            ;;
        2)
            run_test "load-tests/trading-api.js" "Full Trading API Load Test"
            ;;
        3)
            run_test "load-tests/authentication.js" "Authentication Load Test"
            ;;
        4)
            run_test "load-tests/watchlist.js" "Watchlist Operations Load Test"
            ;;
        5)
            echo -e "${RED}⚠️  WARNING: This is an aggressive stress test!${NC}"
            read -p "Are you sure you want to continue? (yes/no): " confirm
            if [ "$confirm" == "yes" ]; then
                run_test "load-tests/stress-test.js" "Stress Test"
            else
                echo "Stress test cancelled."
            fi
            ;;
        6)
            echo -e "${YELLOW}Running all tests sequentially...${NC}"
            run_test "load-tests/trading-api.js" "Trading API Load Test"
            run_test "load-tests/authentication.js" "Authentication Load Test"
            run_test "load-tests/watchlist.js" "Watchlist Operations Load Test"
            echo -e "${GREEN}🎉 All tests completed!${NC}"
            ;;
        7)
            read -p "Enter test file path (e.g., load-tests/trading-api.js): " custom_file
            if [ -f "$custom_file" ]; then
                run_test "$custom_file" "Custom Test"
            else
                echo -e "${RED}❌ File not found: $custom_file${NC}"
            fi
            ;;
        8)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    # Interactive mode
    show_menu
else
    # Command line mode
    case $1 in
        quick)
            k6 run --vus 20 --duration 1m --env API_BASE_URL="$API_BASE_URL" load-tests/trading-api.js
            ;;
        trading)
            run_test "load-tests/trading-api.js" "Trading API Load Test"
            ;;
        auth)
            run_test "load-tests/authentication.js" "Authentication Load Test"
            ;;
        watchlist)
            run_test "load-tests/watchlist.js" "Watchlist Operations Load Test"
            ;;
        stress)
            echo -e "${RED}⚠️  Running stress test...${NC}"
            run_test "load-tests/stress-test.js" "Stress Test"
            ;;
        all)
            run_test "load-tests/trading-api.js" "Trading API Load Test"
            run_test "load-tests/authentication.js" "Authentication Load Test"
            run_test "load-tests/watchlist.js" "Watchlist Operations Load Test"
            ;;
        help)
            echo "Usage: ./run-tests.sh [option]"
            echo ""
            echo "Options:"
            echo "  quick      - Quick baseline test (1 min)"
            echo "  trading    - Full trading API test (4 min)"
            echo "  auth       - Authentication test"
            echo "  watchlist  - Watchlist operations test"
            echo "  stress     - Stress test (⚠️  aggressive)"
            echo "  all        - Run all tests sequentially"
            echo "  help       - Show this help"
            echo ""
            echo "Environment Variables:"
            echo "  API_BASE_URL  - API endpoint (default: http://localhost:3000)"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh quick"
            echo "  API_BASE_URL=https://api.algogainz.com ./run-tests.sh trading"
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Run './run-tests.sh help' for usage"
            exit 1
            ;;
    esac
fi
