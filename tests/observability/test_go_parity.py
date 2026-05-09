"""
Phase 3 parity checks for Go control-plane endpoints and websocket behavior.
"""

import asyncio
from typing import Any

import httpx
import pytest
import pytest_asyncio
import websockets


GO_API_URL = "http://localhost:8081"
GO_WS_URL = "ws://localhost:8081/ws/metrics"

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def http_client() -> Any:
    async with httpx.AsyncClient(timeout=5.0) as client:
        yield client


async def _get_or_skip(client: httpx.AsyncClient, url: str, **kwargs: Any) -> httpx.Response:
    try:
        return await client.get(url, **kwargs)
    except httpx.ConnectError:
        pytest.skip(f"Service unavailable: {url}")


class TestGoControlPlaneParity:
    async def test_health_contract(self, http_client: httpx.AsyncClient) -> None:
        go_resp = await _get_or_skip(http_client, f"{GO_API_URL}/health")
        assert go_resp.status_code == 200
        body = go_resp.json()
        assert "status" in body
        assert "service" in body

    async def test_health_ready_contract(self, http_client: httpx.AsyncClient) -> None:
        go_resp = await _get_or_skip(http_client, f"{GO_API_URL}/health/ready")
        assert go_resp.status_code in (200, 503)
        body = go_resp.json()
        assert isinstance(body.get("ready"), bool)
        assert "collectors" in body
        assert "timestamp" in body

    async def test_health_live_contract(self, http_client: httpx.AsyncClient) -> None:
        go_resp = await _get_or_skip(http_client, f"{GO_API_URL}/health/live")
        assert go_resp.status_code == 200
        body = go_resp.json()
        assert "alive" in body
        assert "websocket_connections" in body
        assert "uptime_seconds" in body

    async def test_root_contract_standalone_shape(self, http_client: httpx.AsyncClient) -> None:
        go_resp = await _get_or_skip(http_client, f"{GO_API_URL}/")
        assert go_resp.status_code == 200

        go = go_resp.json()
        for key in ("service", "version", "websocket", "endpoints"):
            assert key in go, f"Key {key} missing in Go response"
        assert isinstance(go["endpoints"], dict)
        assert go["service"] == "Trading Observability API"

    async def test_api_auth_contract(self, http_client: httpx.AsyncClient) -> None:
        # This test validates response behavior when key is missing.
        # Deployments with no OBSERVABILITY_API_KEY remain permissive.
        resp = await _get_or_skip(http_client, f"{GO_API_URL}/api/metrics/current")
        assert resp.status_code in (200, 401)

    async def test_metrics_symbols_contract(self, http_client: httpx.AsyncClient) -> None:
        resp = await _get_or_skip(http_client, f"{GO_API_URL}/api/metrics/symbols")
        assert resp.status_code in (200, 401)
        if resp.status_code == 200:
            data = resp.json()
            assert "symbols" in data
            assert "count" in data

    async def test_cors_headers(self, http_client: httpx.AsyncClient) -> None:
        try:
            resp = await http_client.options(
                f"{GO_API_URL}/health",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "GET",
                },
            )
        except httpx.ConnectError:
            pytest.skip("Go API not running")
        assert resp.status_code in (200, 204)
        assert "access-control-allow-origin" in {k.lower(): v for k, v in resp.headers.items()}

    async def test_websocket_ping_pong(self) -> None:
        try:
            async with websockets.connect(GO_WS_URL) as ws:
                # connected message
                connected = await asyncio.wait_for(ws.recv(), timeout=3.0)
                assert connected
                await ws.send("ping")
                pong = await asyncio.wait_for(ws.recv(), timeout=3.0)
                assert pong == "pong"
        except OSError:
            pytest.skip("Go websocket not running")

    async def test_websocket_stream_shape(self) -> None:
        try:
            async with websockets.connect(GO_WS_URL) as ws:
                # skip connected payload
                _ = await asyncio.wait_for(ws.recv(), timeout=3.0)
                # next metric frame
                frame = await asyncio.wait_for(ws.recv(), timeout=3.0)
        except OSError:
            pytest.skip("Go websocket not running")

        # payload should be JSON object with standard metric groups
        import json

        payload = json.loads(frame)
        assert "timestamp" in payload
        assert "market_data" in payload
        assert "strategy" in payload
        assert "execution" in payload
        assert "system" in payload
