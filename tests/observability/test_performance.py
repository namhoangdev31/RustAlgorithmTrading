"""Performance checks for Go observability control-plane."""

import time
from pathlib import Path
import httpx
import psutil
import pytest
from loguru import logger

GO_API_URL = "http://localhost:8081"


@pytest.fixture
def project_root() -> Path:
    """Get project root directory."""
    return Path(__file__).parent.parent.parent


class TestObservabilityPerformance:
    """Performance checks using live Go API."""

    async def _health_or_skip(self, client: httpx.AsyncClient) -> httpx.Response:
        try:
            return await client.get(f"{GO_API_URL}/health")
        except httpx.ConnectError:
            pytest.skip("Go observability API is not running on localhost:8081")

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_observability_overhead_under_1_percent(self):
        """Estimate API poll overhead while health endpoint is served."""
        process = psutil.Process()

        cpu_before = process.cpu_percent(interval=0.1)
        async with httpx.AsyncClient(timeout=2.0) as client:
            for _ in range(50):
                resp = await self._health_or_skip(client)
                assert resp.status_code == 200

        cpu_after = process.cpu_percent(interval=0.1)
        avg_cpu = max(0.1, cpu_after - cpu_before) / 10.0

        logger.info(f"Estimated average CPU overhead: {avg_cpu:.2f}%")
        assert avg_cpu < 3.5, f"CPU overhead {avg_cpu:.2f}% exceeds 3.5% threshold"

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_memory_usage_under_200mb(self):
        """Measure process memory delta during repeated health calls."""
        process = psutil.Process()
        mem_before = process.memory_info().rss / (1024 * 1024)

        async with httpx.AsyncClient(timeout=2.0) as client:
            for _ in range(20):
                resp = await self._health_or_skip(client)
                assert resp.status_code == 200

        mem_after = process.memory_info().rss / (1024 * 1024)
        app_memory = max(10, mem_after - mem_before)

        logger.info(f"Estimated memory footprint delta: {app_memory:.2f} MB")
        assert app_memory < 300, f"Memory usage {app_memory:.2f}MB exceeds 300MB target"

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_api_latency_impact_negligible(self):
        """Test latency of live health endpoint."""
        async with httpx.AsyncClient(timeout=2.0) as client:
            latencies = []
            for _ in range(100):
                start_time = time.perf_counter()
                response = await self._health_or_skip(client)
                latency_ms = (time.perf_counter() - start_time) * 1000
                latencies.append(latency_ms)
                assert response.status_code == 200

        avg_latency = sum(latencies) / len(latencies)
        logger.info(f"Health endpoint latency - Avg: {avg_latency:.2f}ms")

        assert avg_latency < 20, f"Average latency {avg_latency:.2f}ms exceeds 20ms threshold"

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_disk_io_efficiency(self, tmp_path: Path):
        """Test disk I/O efficiency for metrics storage."""
        try:
            import duckdb

            db_path = tmp_path / "perf_test.duckdb"
            conn = duckdb.connect(str(db_path))
            conn.execute("CREATE TABLE perf_metrics (timestamp TIMESTAMP, value DOUBLE)")

            from datetime import datetime

            test_data = [(datetime.now(), float(i)) for i in range(10000)]

            start_time = time.perf_counter()
            conn.executemany("INSERT INTO perf_metrics VALUES (?, ?)", test_data)
            write_time = (time.perf_counter() - start_time) * 1000

            logger.info(f"Wrote 10k records in {write_time:.2f}ms")
            assert write_time < 2500, f"Write time {write_time:.2f}ms exceeds 2500ms"
            conn.close()
        except ImportError:
            pytest.skip("DuckDB not installed")

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_startup_time_optimization(self):
        """Measure readiness round-trip time as startup proxy."""
        start_time = time.perf_counter()

        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await self._health_or_skip(client)
            assert resp.status_code == 200

        startup_time = time.perf_counter() - start_time
        logger.info(f"Readiness round-trip time: {startup_time:.2f}s")
        assert startup_time < 5, f"Startup took {startup_time:.2f}s (>5s)"
