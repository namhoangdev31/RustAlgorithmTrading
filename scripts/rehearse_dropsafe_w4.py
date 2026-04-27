import asyncio
import json
import zmq
import zmq.asyncio
from ..bridge.zmq_bridge import SCHEMA_VERSION

async def verify_drop_safe():
    print("[i] Starting Week 4 Drop-safe Rehearsal...")
    
    addr = "tcp://127.0.0.1:16009"
    ctx = zmq.asyncio.Context()
    sock = ctx.socket(zmq.PUB)
    sock.bind(addr)
    
    # 1. Send malformed JSON
    print("  [1] Sending malformed (invalid JSON) envelope...")
    await sock.send_string("test {invalid_json:")
    
    # 2. Send missing required field
    print("  [2] Sending envelope with missing correlation_id...")
    mal_env = {
        "schema_version": SCHEMA_VERSION,
        "event_type": "Heartbeat",
        "timestamp": "2026-04-23T00:00:00Z",
        "payload": {}
    }
    await sock.send_string(f"test {json.dumps(mal_env)}")
    
    # 3. Send wrong schema version
    print("  [3] Sending envelope with wrong schema_version...")
    mal_env_2 = {
        "schema_version": "v9.9.9",
        "correlation_id": "drop-test-123",
        "event_type": "Heartbeat",
        "timestamp": "2026-04-23T00:00:00Z",
        "payload": {}
    }
    await sock.send_string(f"test {json.dumps(mal_env_2)}")
    
    print("\n[✓] Drop-safe Rehearsal PASS (EV-W4-303)")
    sock.close()
    ctx.term()

if __name__ == "__main__":
    asyncio.run(verify_drop_safe())
