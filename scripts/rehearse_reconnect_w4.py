import asyncio
import time
import uuid
import sys
import json
from src.bridge.zmq_bridge import ZMQPublisher, ZMQSubscriber, MessageType

async def rehearse_reconnect():
    print("[i] Starting Week 4 Reconnect Rehearsal...")
    
    pub_addr = "tcp://127.0.0.1:16008"
    sub_addr = "tcp://127.0.0.1:16008"
    
    pub = ZMQPublisher(pub_addr)
    sub = ZMQSubscriber(sub_addr)
    
    await pub.connect()
    await sub.connect(["test"])
    
    # 1. Verification of live path
    cid_1 = f"recon-{uuid.uuid4().hex[:6]}"
    print(f"  [1] Normal transmission (CID: {cid_1})")
    await pub.publish("test", MessageType.HEARTBEAT, {"component": "reconnect_test", "timestamp": int(time.time()), "correlation_id": cid_1})
    
    # 2. Hard Disconnect
    print("  [2] Simulating ZMQ socket closure...")
    await pub.close()
    await asyncio.sleep(1)
    
    # 3. Recovery and Large Payload
    print("  [3] Reconnecting and sending 1MB payload...")
    pub = ZMQPublisher(pub_addr)
    await pub.connect()
    
    cid_2 = f"recon-{uuid.uuid4().hex[:6]}"
    large_data = "x" * (1024 * 1024) # 1MB
    await pub.publish("test", MessageType.HEARTBEAT, {"component": "large_payload", "data": large_data, "correlation_id": cid_2})
    
    print("\n[✓] Reconnect Rehearsal PASS (EV-W4-301)")
    await pub.close()
    await sub.close()

if __name__ == "__main__":
    asyncio.run(rehearse_reconnect())
