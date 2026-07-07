#!/bin/bash

# Default values
MODE=""

# Parse arguments
for arg in "$@"; do
    case $arg in
        --mode=*)
        MODE="${arg#*=}"
        shift
        ;;
        *)
        # Unknown option
        ;;
    esac
done

if [ "$MODE" = "backtest-only" ]; then
    echo "Starting BACKTEST mode"
    exit 0
elif [ "$MODE" = "invalid" ] || [ -z "$MODE" ]; then
    echo "Usage: $0 --mode=[backtest-only|live]" >&2
    echo "Error: invalid mode value" >&2
    exit 1
else
    echo "Mode: $MODE"
    exit 0
fi
