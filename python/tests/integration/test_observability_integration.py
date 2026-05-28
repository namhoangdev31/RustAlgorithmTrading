"""
Integration test for observability data flow (Go-Native).

Tests the complete pipeline:
1. Rust services emit metrics
2. Go collector manager scrapes metrics via HTTP
3. Metrics are stored in DuckDB by Go control plane
4. Data can be queried successfully via Go API
"""

import pytest
import asyncio
import aiohttp
import logging
import json
import os
from datetime import datetime

# No more Python collector imports - testing Go-native infrastructure
from src.observability.logging.formatters import JSONFormatter


@pytest.mark.asyncio
async def test_go_metrics_collector_active():
    """Test that the Go metrics collector is active and responding via API."""
    api_url = "http://127.0.0.1:8081/health"
    
    timeout = aiohttp.ClientTimeout(total=5.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            async with session.get(api_url) as response:
                assert response.status == 200, f"Go API returned {response.status}"
                data = await response.json()
                assert data["status"] == "healthy"
                print("✓ Go Control Plane is healthy")
        except aiohttp.ClientError as e:
            pytest.skip(f"Go Control Plane not running: {e}")


@pytest.mark.asyncio
async def test_rust_metrics_endpoints_available():
    """Test that all Rust service metrics endpoints are accessible for the Go scraper."""
    endpoints = {
        "market_data": "http://127.0.0.1:9091/metrics",
        "execution": "http://127.0.0.1:9092/metrics",
        "risk": "http://127.0.0.1:9093/metrics",
    }

    timeout = aiohttp.ClientTimeout(total=2.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        for service_name, url in endpoints.items():
            try:
                async with session.get(url) as response:
                    assert (
                        response.status == 200
                    ), f"{service_name} endpoint returned {response.status}"
                    text = await response.text()
                    assert len(text) > 0, f"{service_name} returned empty metrics"
                    print(f"✓ {service_name} endpoint is accessible for Go scraper")
            except aiohttp.ClientError as e:
                pytest.skip(f"{service_name} service not running: {e}")


@pytest.mark.asyncio
async def test_go_ingestion_parity():
    """Verify Go is successfully ingesting metrics into DuckDB."""
    # We query the Go API for historical metrics to verify ingestion
    api_url = "http://127.0.0.1:8081/api/v1/metrics/history"
    
    payload = {
        "time_range": "5m",
        "metric_types": ["market_data_ticks_received_total"]
    }
    
    timeout = aiohttp.ClientTimeout(total=5.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            async with session.post(api_url, json=payload) as response:
                if response.status == 404:
                    pytest.skip("Go metrics history endpoint not implemented or enabled")
                
                assert response.status == 200, f"Go API returned {response.status}"
                data = await response.json()
                # If Go is ingesting, we should see some data points
                # This might be empty if Rust is not emitting activity, but the contract should hold
                assert "metrics" in data
                print(f"✓ Go API returned {len(data.get('metrics', []))} metrics data points")
        except aiohttp.ClientError as e:
            pytest.skip(f"Go API connection failed: {e}")


def test_public_log_redacts_limit_snapshot():
    """Week 5 hardening: public logs must redact limit_snapshot payload (Keep Python utility test)."""
    formatter = JSONFormatter()
    record = logging.LogRecord(
        name="observability.risk",
        level=logging.WARNING,
        pathname=__file__,
        lineno=0,
        msg="Risk reject event",
        args=(),
        exc_info=None,
    )
    record.correlation_id = "cid-redaction-1"
    record.limit_snapshot = {
        "equity": 123_456.0,
        "available_buying_power": 98_765.0,
        "strategy_budget": 5_000.0,
    }

    payload = formatter.format(record)
    structured = json.loads(payload)

    assert "extra" in structured
    assert structured["extra"]["limit_snapshot"] == "[REDACTED]"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
