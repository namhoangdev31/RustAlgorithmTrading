"""
FastAPI main application with WebSocket streaming for real-time dashboard.

Features:
- REST API endpoints for historical data
- WebSocket endpoint for real-time metric streaming
- CORS configuration for frontend
- Health check and status endpoints
- Graceful startup/shutdown handlers
"""
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Optional, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from .websocket_manager import WebSocketManager
from .routes import metrics, trades, system
from ..metrics.market_data_collector import MarketDataCollector
from ..metrics.strategy_collector import StrategyCollector
from ..metrics.execution_collector import ExecutionCollector
from ..metrics.system_collector import SystemCollector


class ObservabilityAPI:
    """Central API state and coordination."""

    def __init__(self) -> None:
        self.websocket_manager = WebSocketManager()
        self.collectors: Dict[str, Any] = {}
        self.metrics_task: Optional[asyncio.Task] = None
        self.running = False

    async def start(self) -> None:
        """Start API services and metric collection."""
        logger.info("[cid:INIT] Starting Observability API...")

        # Start WebSocket manager
        await self.websocket_manager.start()

        # Initialize collectors
        self.collectors["market_data"] = MarketDataCollector()
        self.collectors["strategy"] = StrategyCollector()
        self.collectors["execution"] = ExecutionCollector()
        self.collectors["system"] = SystemCollector()

        # Start collectors
        for name, collector in self.collectors.items():
            try:
                await collector.start()
                logger.info(f"[cid:INIT] Started {name} collector")
            except Exception as e:
                logger.error(f"[cid:INIT] Failed to start {name} collector: {e}")

        # Start metric streaming task
        self.running = True
        self.metrics_task = asyncio.create_task(self._stream_metrics())

        logger.info("[cid:INIT] Observability API started successfully")

    async def stop(self) -> None:
        """Stop API services gracefully."""
        logger.info("[cid:INIT] Stopping Observability API...")

        self.running = False

        # Cancel streaming task
        if self.metrics_task:
            self.metrics_task.cancel()
            try:
                await self.metrics_task
            except asyncio.CancelledError:
                pass

        # Stop collectors
        for name, collector in self.collectors.items():
            try:
                await collector.stop()
                logger.info(f"[cid:INIT] Stopped {name} collector")
            except Exception as e:
                logger.error(f"[cid:INIT] Error stopping {name} collector: {e}")

        # Close all WebSocket connections
        await self.websocket_manager.disconnect_all()

        logger.info("[cid:INIT] Observability API stopped")

    async def _stream_metrics(self) -> None:
        """Background task to stream metrics to connected clients at 10Hz."""
        try:
            while self.running:
                # Collect current metrics from all collectors
                metrics = await self._collect_all_metrics()

                # Broadcast to all connected WebSocket clients
                await self.websocket_manager.broadcast(metrics)

                # 10Hz = 100ms interval
                await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            logger.info("[cid:INIT] Metrics streaming task cancelled")
        except Exception as e:
            logger.error(f"[cid:INIT] Error in metrics streaming: {e}")

    async def _collect_all_metrics(self) -> dict:
        """Collect metrics from all collectors."""
        metrics = {
            "timestamp": asyncio.get_event_loop().time(),
            "market_data": {},
            "strategy": {},
            "execution": {},
            "system": {}
        }

        try:
            # Collect from each collector concurrently
            results = await asyncio.gather(
                self.collectors["market_data"].get_current_metrics(),
                self.collectors["strategy"].get_current_metrics(),
                self.collectors["execution"].get_current_metrics(),
                self.collectors["system"].get_current_metrics(),
                return_exceptions=True
            )

            metrics["market_data"] = results[0] if not isinstance(results[0], Exception) else {}
            metrics["strategy"] = results[1] if not isinstance(results[1], Exception) else {}
            metrics["execution"] = results[2] if not isinstance(results[2], Exception) else {}
            metrics["system"] = results[3] if not isinstance(results[3], Exception) else {}
        except Exception as e:
            logger.error(f"[cid:INIT] Error collecting metrics: {e}")

        return metrics


# Global API instance
api_state = ObservabilityAPI()


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    """Manage application lifecycle."""
    # Startup
    await api_state.start()
    yield
    # Shutdown
    await api_state.stop()


# Create FastAPI app
app = FastAPI(
    title="Trading Observability API",
    description="Real-time observability and monitoring API for algorithmic trading system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React/Vite dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# WebSocket endpoint for real-time streaming
@app.websocket("/ws/metrics")
async def websocket_metrics_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time metric streaming.

    Streams metrics at 10Hz with < 50ms latency.
    Supports automatic reconnection and heartbeat.
    """
    client_id = await api_state.websocket_manager.connect(websocket)

    try:
        # Keep connection alive and handle client messages
        while True:
            try:
                # Receive ping/pong for connection health
                data = await websocket.receive_text()

                if data == "ping":
                    await websocket.send_text("pong")
                elif data == "pong":
                    # Client-side heartbeat response
                    api_state.websocket_manager.update_connection_ping(client_id)
                elif data.startswith("subscribe:"):
                    # Handle selective metric subscriptions
                    topic = data.split(":", 1)[1]
                    logger.info(f"[cid:INIT] Client {client_id} subscribed to {topic}")
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"[cid:INIT] WebSocket error for client {client_id}: {e}")
                break
    finally:
        await api_state.websocket_manager.disconnect(client_id)


# Health check endpoints
@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Basic health check."""
    return {"status": "healthy", "service": "observability-api"}


@app.get("/health/ready")
async def readiness_check() -> JSONResponse:
    """Readiness check - are all services ready?"""
    collectors_status = {}
    for name, collector in api_state.collectors.items():
        status = await collector.get_status() if hasattr(collector, 'get_status') else {"status": "unknown"}
        collectors_status[name] = {
            "ready": collector.is_ready(),
            "status": status
        }

    ready = all(s["ready"] for s in collectors_status.values())
    status_code = 200 if ready else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "ready": ready,
            "collectors": collectors_status,
            "timestamp": asyncio.get_event_loop().time()
        }
    )


@app.get("/health/live")
async def liveness_check() -> Dict[str, Any]:
    """Liveness check - is the service alive?"""
    return {
        "alive": api_state.running,
        "websocket_connections": api_state.websocket_manager.connection_count(),
        "uptime_seconds": asyncio.get_event_loop().time()
    }


# Include routers
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(trades.router, prefix="/api/trades", tags=["trades"])
app.include_router(system.router, prefix="/api/system", tags=["system"])


# --- Incident Management ---
@app.get("/incidents")
async def get_incidents() -> Dict[str, Any]:
    """Retrieve active incidents (Lane A)."""
    system_collector = api_state.collectors.get("system")
    if not system_collector or not hasattr(system_collector, "escalation"):
        return {}
    escalation = system_collector.escalation
    return {k: v.to_dict() for k, v in escalation.incidents.items()}


@app.post("/incidents/{incident_id}/acknowledge")
async def acknowledge_incident(incident_id: str, owner: str) -> Dict[str, str]:
    """Acknowledge incident (Phase 3)."""
    system_collector = api_state.collectors.get("system")
    if not system_collector or not hasattr(system_collector, "escalation"):
        raise HTTPException(status_code=503, detail="Escalation service not available")
    escalation = system_collector.escalation
    if not await escalation.acknowledge_incident(incident_id, owner):
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return {"status": "ACKNOWLEDGED"}


@app.post("/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str, evidence: str) -> Dict[str, str]:
    """Resolve incident with evidence (Lane C)."""
    system_collector = api_state.collectors.get("system")
    if not system_collector or not hasattr(system_collector, "escalation"):
        raise HTTPException(status_code=503, detail="Escalation service not available")
    escalation = system_collector.escalation
    try:
        if not await escalation.resolve_incident(incident_id, evidence):
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        return {"status": "RESOLVED"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint with API information."""
    return {
        "service": "Trading Observability API",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "/ws/metrics",
        "endpoints": {
            "metrics": "/api/metrics",
            "trades": "/api/trades",
            "system": "/api/system"
        }
    }
