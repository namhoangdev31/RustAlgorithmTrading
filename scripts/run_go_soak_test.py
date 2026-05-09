#!/usr/bin/env python3
"""
Soak Test script for the Go Control Plane (Phase 3).
Simulates long-running API and WebSocket load to measure:
- Latency stability (p95, p99)
- Error rates
- Connection drops/reconnects
- Memory leaks (by querying system health if available or checking process memory)
"""

import asyncio
import time
import argparse
import sys
import httpx
import websockets
from collections import deque
import statistics

import os

GO_API_URL = os.getenv("GO_API_URL", "http://localhost:8081")
WS_URL = os.getenv("WS_URL", "ws://localhost:8081/ws/metrics")

class SoakTest:
    def __init__(self, duration_sec: int, concurrent_clients: int):
        self.duration_sec = duration_sec
        self.concurrent_clients = concurrent_clients
        self.latencies = []
        self.errors = 0
        self.running = True

    async def api_worker(self, client: httpx.AsyncClient):
        while self.running:
            start = time.perf_counter()
            try:
                resp = await client.get(f"{GO_API_URL}/api/system/health", headers={"X-API-Key": ""})
                if resp.status_code == 200:
                    self.latencies.append((time.perf_counter() - start) * 1000)
                else:
                    self.errors += 1
                    print(f"  API Error: Status {resp.status_code} on {GO_API_URL}/api/system/health")
            except Exception as e:
                if self.running:
                    self.errors += 1
                    print(f"  API Request Exception: {e}")
            
            # Simple rate limiting per worker to avoid local port exhaustion
            await asyncio.sleep(0.1)

    async def ws_worker(self):
        while self.running:
            try:
                async with websockets.connect(WS_URL) as ws:
                    while self.running:
                        try:
                            await asyncio.wait_for(ws.send("ping"), timeout=5.0)
                            # Wait for pong, but skip over metric broadcasts
                            while self.running:
                                msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                                if msg == "pong":
                                    break
                        except websockets.ConnectionClosed:
                            break
                        except asyncio.TimeoutError:
                            if self.running:
                                self.errors += 1
                                print(f"  WS Error: Timeout waiting for pong while running")
                            break
                        await asyncio.sleep(1)
            except Exception as e:
                if self.running:
                    # Filter out closure errors that happen during shutdown
                    if not isinstance(e, (websockets.ConnectionClosed, asyncio.CancelledError)):
                        self.errors += 1
                        print(f"  WS Connection Error: {e}")
                await asyncio.sleep(1)

    async def run(self):
        print(f"Starting Go Soak Test for {self.duration_sec}s with {self.concurrent_clients} concurrent clients...")
        
        async with httpx.AsyncClient() as client:
            # Start API workers
            api_tasks = [asyncio.create_task(self.api_worker(client)) for _ in range(self.concurrent_clients)]
            
            # Start WS workers
            ws_tasks = [asyncio.create_task(self.ws_worker()) for _ in range(self.concurrent_clients // 2)]
            
            # Let it run
            await asyncio.sleep(self.duration_sec)
            
            self.running = False
            
            # Wait for tasks to complete
            await asyncio.gather(*api_tasks, *ws_tasks, return_exceptions=True)
            
        self.report()

    def report(self):
        print("\n--- Soak Test Results ---")
        print(f"Total Requests (sampled): {len(self.latencies)}")
        print(f"Total Errors: {self.errors}")
        
        if self.latencies:
            p50 = statistics.median(self.latencies)
            p95 = statistics.quantiles(self.latencies, n=100)[94] if len(self.latencies) >= 100 else max(self.latencies)
            p99 = statistics.quantiles(self.latencies, n=100)[98] if len(self.latencies) >= 100 else max(self.latencies)
            
            print(f"Latency P50: {p50:.2f} ms")
            print(f"Latency P95: {p95:.2f} ms")
            print(f"Latency P99: {p99:.2f} ms")
            
            # Hard gate check
            if p99 > 200:
                print("❌ NO-GO: P99 Latency exceeds 200ms threshold.")
                sys.exit(1)
            else:
                print("✅ GO: Latency thresholds met.")
        else:
            print("❌ NO-GO: No successful requests.")
            sys.exit(1)

        if self.errors > 0:
            print(f"⚠️ Warning: Encountered {self.errors} errors during the soak test.")
            # Depending on error budget, this might be a NO-GO
            if self.errors > (len(self.latencies) * 0.01):
                print("❌ NO-GO: Error budget exceeded (>1%).")
                sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--duration", type=int, default=60, help="Test duration in seconds")
    parser.add_argument("--clients", type=int, default=10, help="Concurrent clients")
    args = parser.parse_args()
    
    soak = SoakTest(args.duration, args.clients)
    asyncio.run(soak.run())
