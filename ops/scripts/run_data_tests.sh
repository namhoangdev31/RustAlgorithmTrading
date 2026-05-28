#!/bin/bash

# Test runner script for data downloader validation
# Runs comprehensive test suite with coverage reporting

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$PROJECT_ROOT/python"

echo "=========================================="
echo "Data Downloader Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest not found${NC}"
    echo "Install with: pip install pytest pytest-cov pytest-mock"
    exit 1
fi

# Check if required dependencies are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
python -c "import pandas, numpy, alpaca" 2>/dev/null || {
    echo -e "${RED}Error: Required dependencies not found${NC}"
    echo "Install with: pip install -r requirements.txt"
    exit 1
}

echo -e "${GREEN}✓ Dependencies OK${NC}"
echo ""

# Run tests with different options based on arguments
case "${1:-all}" in
    "unit")
        echo "Running unit tests only..."
        pytest tests/unit/test_download_data.py::TestAlpacaDataDownloader \
               tests/unit/test_data_handler.py::TestDataLoading \
               -v --tb=short
        ;;

    "integration")
        echo "Running integration tests only..."
        pytest tests/unit/test_download_data.py \
               -v --tb=short
        ;;

    "performance")
        echo "Running performance tests only..."
        pytest tests/unit/test_data_handler.py \
               -v --tb=short
        ;;

    "coverage")
        echo "Running all tests with coverage..."
        pytest tests/unit/test_download_data.py tests/unit/test_data_handler.py \
               --cov=src.api.alpaca_client \
               --cov=src.data.fetcher \
               --cov=src.data.loader \
               --cov=src.backtesting.data_handler \
               --cov-report=html \
               --cov-report=term-missing \
               -v

        echo ""
        echo -e "${GREEN}Coverage report generated: htmlcov/index.html${NC}"
        ;;

    "quick")
        echo "Running quick smoke tests..."
        pytest tests/unit/test_download_data.py \
               -v -x --tb=line \
               -k "test_initialization or test_save_csv"
        ;;

    "all"|*)
        echo "Running all tests..."
        pytest tests/unit/test_download_data.py tests/unit/test_data_handler.py -v --tb=short
        ;;
esac

EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi
echo "=========================================="

exit $EXIT_CODE
