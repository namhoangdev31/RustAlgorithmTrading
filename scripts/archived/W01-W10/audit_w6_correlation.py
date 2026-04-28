#!/usr/bin/env python3
import re
import sys
import os

def audit_logs(log_path):
    if not os.path.exists(log_path):
        print(f"[!] Log file not found: {log_path}")
        return

    print(f"[*] Auditing Week 6 Correlation IDs in {log_path}...")
    
    # Patterns for different stages
    patterns = {
        "signal": r"Trading signal received.*correlation_id\":\s*\"([^\"]+)\"",
        "stop_trigger": r"\[cid:([^\]]+)\] Stop-loss triggered",
        "execution": r"Creating stop-loss order for .* \[cid:([^\]]+)\]"
    }
    
    correlations = {} # cid -> set of stages found

    with open(log_path, 'r') as f:
        for line in f:
            for stage, pattern in patterns.items():
                match = re.search(pattern, line)
                if match:
                    cid = match.group(1)
                    if cid not in correlations:
                        correlations[cid] = set()
                    correlations[cid].add(stage)

    # Reporting
    print("-" * 50)
    print(f"{'Correlation ID':<40} | {'Status'}")
    print("-" * 50)
    
    complete = 0
    total = len(correlations)
    
    for cid, stages in correlations.items():
        if len(stages) == 3:
            status = "COMPLETE ✅"
            complete += 1
        else:
            missing = set(patterns.keys()) - stages
            status = f"MISSING: {', '.join(missing)} ❌"
        
        print(f"{cid[:38]:<40} | {status}")

    print("-" * 50)
    print(f"Summary: {complete}/{total} full traces found.")
    
    if total > 0 and complete == total:
        print("[PASS] 100% correlation trace integrity.")
    elif total > 0:
        print("[FAIL] Found broken correlation traces.")
        # sys.exit(1) # Don't exit 1 for now, just a report

if __name__ == "__main__":
    log_file = "logs/trading.log"
    if len(sys.argv) > 1:
        log_file = sys.argv[1]
    audit_logs(log_file)
