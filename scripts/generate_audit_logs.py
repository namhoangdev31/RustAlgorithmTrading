import sys
import os
import time

# Add src to path
sys.path.append("/Users/hoangnam/Developer/RustAlgorithmTrading/src")

from observability.logging import structured_logger
from observability.logging.correlations import set_correlation_id

def generate_logs():
    print("Generating audit logs...")
    
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Configure logger to use a specific stream
    logger = structured_logger.get_logger("trading.system")
    
    # Set correlation ID
    set_correlation_id("audit-drill-123")
    
    for i in range(10):
        logger.info(f"Audit log entry {i}", extra={"test_key": "test_val"})
        time.sleep(0.1)
    
    print("✓ Generated 10 log entries in logs/system/trading.system.log")

if __name__ == "__main__":
    generate_logs()
