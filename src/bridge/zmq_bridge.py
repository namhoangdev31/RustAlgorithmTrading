"""
ZeroMQ bridge for Python-Rust communication.

This module provides async publishers and subscribers for communication
between Python ML components and Rust trading engines.
"""

import asyncio
import json
import zmq
import zmq.asyncio
from typing import Callable, Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from enum import Enum
from loguru import logger


class MessageType(str, Enum):
    """Message types for inter-component communication."""

    ORDER_BOOK_UPDATE = "OrderBookUpdate"
    TRADE_UPDATE = "TradeUpdate"
    BAR_UPDATE = "BarUpdate"
    SIGNAL_GENERATED = "SignalGenerated"
    ORDER_REQUEST = "OrderRequest"
    ORDER_RESPONSE = "OrderResponse"
    POSITION_UPDATE = "PositionUpdate"
    RISK_CHECK = "RiskCheck"
    RISK_CHECK_RESULT = "RiskCheckResult"
    HEARTBEAT = "Heartbeat"
    SHUTDOWN = "Shutdown"


@dataclass
class Signal:
    """Trading signal structure."""

    symbol: str
    direction: str  # "long", "short", "neutral"
    strength: float  # 0.0 to 1.0
    timestamp: int
    features: Optional[List[float]] = None
    metadata: Optional[Dict[str, Any]] = None
    governance_verdict: Optional[str] = None
    governance_rationale: Optional[str] = None


@dataclass
class Position:
    """Position structure."""

    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float
    unrealized_pl: float
    timestamp: int


SCHEMA_VERSION = "v1.0.0"
SCHEMA_STRICT_MODE = True  # Default to strict for W3 cutover


class ZMQPublisher:
    """
    ZeroMQ publisher for sending messages to Rust components.

    Example:
        >>> publisher = ZMQPublisher("tcp://127.0.0.1:5556")
        >>> await publisher.connect()
        >>> await publisher.publish_signal(signal)
    """

    def __init__(self, address: str = "tcp://127.0.0.1:5556"):
        """
        Initialize publisher.

        Args:
            address: ZMQ endpoint to publish to
        """
        self.address = address
        self.context = zmq.asyncio.Context()
        self.socket: Optional[zmq.asyncio.Socket] = None
        self._connected = False
        logger.info(f"[cid:INIT] ZMQ Publisher initialized for {address}")

    async def connect(self):
        """Connect to ZMQ endpoint."""
        try:
            self.socket = self.context.socket(zmq.PUB)
            self.socket.bind(self.address)
            self._connected = True
            # Small delay to allow subscribers to connect
            await asyncio.sleep(0.1)
            logger.info(f"[cid:INIT] ✓ Publisher connected to {self.address}")
        except Exception as e:
            logger.error(f"[cid:INIT] Failed to connect publisher: {e}")
            raise

    async def publish(self, topic: str, message_type: MessageType, data: Dict[str, Any]):
        """
        Publish a message.

        Args:
            topic: Message topic (e.g., "signal", "order")
            message_type: Type of message
            data: Message data dictionary
        """
        if not self._connected or self.socket is None:
            raise RuntimeError("Publisher not connected. Call connect() first.")

        try:
            # Create message envelope matching Rust Envelope struct (v1.0.0)
            from observability.logging.correlations import get_correlation_id
            import datetime

            cid = get_correlation_id()
            if not cid:
                import uuid

                cid = str(uuid.uuid4())
                logger.warning(
                    f"[cid:{cid}] No correlation_id found in context, generated new one: {cid}"
                )

            # Structured payload matching Rust Message enum
            payload = {"type": message_type.value, "data": data}

            envelope = {
                "schema_version": SCHEMA_VERSION,
                "correlation_id": cid,
                "event_type": message_type.value,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "payload": payload,
            }

            # Serialize to JSON
            message_json = json.dumps(envelope)

            # Send with topic prefix for pub/sub filtering
            full_message = f"{topic} {message_json}"
            await self.socket.send_string(full_message)

            logger.debug(f"[cid:{cid}] Published {message_type.value} to topic '{topic}'")

        except Exception as e:
            logger.error(f"[cid:INIT] Error publishing message: {e}")
            raise

    async def publish_signal(self, signal: Signal):
        """
        Publish a trading signal.

        Args:
            signal: Signal object to publish
        """
        data = asdict(signal)
        await self.publish("signal", MessageType.SIGNAL_GENERATED, data)

    async def publish_heartbeat(self, component: str):
        """
        Publish heartbeat message.

        Args:
            component: Component name sending heartbeat
        """
        import time

        data = {"component": component, "timestamp": int(time.time() * 1000)}
        await self.publish("system", MessageType.HEARTBEAT, data)

    async def close(self):
        """Close the publisher."""
        if self.socket:
            self.socket.close()
            self._connected = False
            logger.info("[cid:INIT] Publisher closed")

    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()


class ZMQSubscriber:
    """
    ZeroMQ subscriber for receiving messages from Rust components.

    Example:
        >>> subscriber = ZMQSubscriber("tcp://127.0.0.1:5555")
        >>> await subscriber.connect(["market", "signal"])
        >>> async for topic, message in subscriber.receive():
        >>>     print(f"Received {message['type']} on {topic}")
    """

    def __init__(self, address: str = "tcp://127.0.0.1:5555"):
        """
        Initialize subscriber.

        Args:
            address: ZMQ endpoint to subscribe to
        """
        self.address = address
        self.context = zmq.asyncio.Context()
        self.socket: Optional[zmq.asyncio.Socket] = None
        self._connected = False
        self._running = False
        logger.info(f"[cid:INIT] ZMQ Subscriber initialized for {address}")

    @staticmethod
    def _normalize_decision_token(value: Any) -> str:
        """Normalize decision/disposition token for robust fail-fast checks."""
        if value is None:
            return ""
        return str(value).strip().upper()

    @classmethod
    def _is_reject_payload(cls, payload: Dict[str, Any]) -> bool:
        """Detect reject disposition from payload or nested data block."""
        top = cls._normalize_decision_token(payload.get("disposition") or payload.get("decision"))
        if top == "REJECT":
            return True

        data = payload.get("data")
        if isinstance(data, dict):
            nested = cls._normalize_decision_token(data.get("disposition") or data.get("decision"))
            if nested == "REJECT":
                return True
        return False

    async def connect(self, topics: Optional[List[str]] = None):
        """
        Connect to ZMQ endpoint and subscribe to topics.

        Args:
            topics: List of topics to subscribe to. None means subscribe to all.
        """
        try:
            self.socket = self.context.socket(zmq.SUB)
            self.socket.connect(self.address)

            # Subscribe to topics
            if topics is None or len(topics) == 0:
                # Subscribe to all messages
                self.socket.setsockopt_string(zmq.SUBSCRIBE, "")
                logger.info("[cid:INIT] Subscribed to ALL topics")
            else:
                for topic in topics:
                    self.socket.setsockopt_string(zmq.SUBSCRIBE, topic)
                logger.info(f"[cid:INIT] Subscribed to topics: {topics}")

            self._connected = True
            logger.info(f"[cid:INIT] ✓ Subscriber connected to {self.address}")

        except Exception as e:
            logger.error(f"[cid:INIT] Failed to connect subscriber: {e}")
            raise

    async def receive(self):
        """
        Receive messages asynchronously.

        Yields:
            Tuple of (topic, message_dict)
        """
        if not self._connected or self.socket is None:
            raise RuntimeError("Subscriber not connected. Call connect() first.")

        self._running = True

        try:
            while self._running:
                # Receive message with topic prefix
                message_str = await self.socket.recv_string()

                # Split topic and message
                parts = message_str.split(" ", 1)
                if len(parts) != 2:
                    logger.warning(f"[cid:INIT] Invalid message format: {message_str}")
                    continue

                topic, json_str = parts

                # Parse JSON
                try:
                    envelope = json.loads(json_str)

                    # Validate v1.0.0 Envelope
                    version = envelope.get("schema_version")
                    cid = envelope.get("correlation_id", "INIT")
                    if version != SCHEMA_VERSION:
                        error_msg = f"Schema mismatch: expected {SCHEMA_VERSION}, got {version}"
                        if SCHEMA_STRICT_MODE:
                            logger.error(f"[cid:{cid}] STRICT_MODE REJECTION: {error_msg}")
                            continue
                        else:
                            logger.warning(f"[cid:{cid}] LAX_MODE WARNING: {error_msg}")

                    # Extract correlation ID and set context
                    from observability.logging.correlations import set_correlation_id

                    if envelope.get("correlation_id"):
                        set_correlation_id(cid)

                    # Extract payload (Message enum variant)
                    payload = envelope.get("payload", {})
                    msg_type = payload.get("type", "Unknown")
                    data = payload.get("data", {})

                    # Normalization Layer: Handle legacy Signal formats and field names
                    if msg_type == MessageType.SIGNAL_GENERATED.value:
                        # Normalize direction: long/short/neutral -> Buy/Sell/Hold
                        # Normalize field names: action/confidence -> direction/strength
                        direction = data.get("direction", data.get("action"))
                        if direction == "long":
                            direction = "Buy"
                        elif direction == "short":
                            direction = "Sell"
                        elif direction == "neutral":
                            direction = "Hold"
                        data["direction"] = direction

                        if "strength" not in data and "confidence" in data:
                            data["strength"] = data.pop("confidence")

                        payload["data"] = data

                    # Week 5: Fail-fast for REJECT disposition on critical paths
                    if self._is_reject_payload(payload):
                        logger.warning(
                            f"[cid:{cid}] FAIL-FAST: Blocking REJECT message from topic '{topic}'"
                        )
                        continue

                    logger.debug(f"[cid:{cid}] Received {msg_type} on topic '{topic}'")
                    yield topic, payload

                except json.JSONDecodeError as e:
                    logger.error(f"[cid:INIT] Failed to parse message JSON: {e}")
                    continue

        except asyncio.CancelledError:
            logger.info("[cid:INIT] Subscriber receive loop cancelled")
        except Exception as e:
            logger.error(f"[cid:INIT] Error in receive loop: {e}")
            raise

    async def receive_one(self, timeout: Optional[float] = None) -> Optional[tuple]:
        """
        Receive a single message with optional timeout.

        Args:
            timeout: Timeout in seconds. None means wait indefinitely.

        Returns:
            Tuple of (topic, message_dict) or None if timeout
        """
        if not self._connected or self.socket is None:
            raise RuntimeError("Subscriber not connected. Call connect() first.")

        try:
            if timeout:
                # Set receive timeout
                self.socket.setsockopt(zmq.RCVTIMEO, int(timeout * 1000))

            message_str = await self.socket.recv_string()
            parts = message_str.split(" ", 1)

            if len(parts) == 2:
                topic, json_str = parts
                envelope = json.loads(json_str)

                # Validate v1.0.0 Envelope
                version = envelope.get("schema_version")
                cid = envelope.get("correlation_id", "INIT")
                if version != SCHEMA_VERSION:
                    error_msg = (
                        f"Schema mismatch in receive_one: expected {SCHEMA_VERSION}, got {version}"
                    )
                    if SCHEMA_STRICT_MODE:
                        logger.error(f"[cid:{cid}] STRICT_MODE REJECTION: {error_msg}")
                        return None
                    else:
                        logger.warning(f"[cid:{cid}] LAX_MODE WARNING: {error_msg}")

                # Payload extraction (simplified for receive_one)
                payload = envelope.get("payload", {})

                # Week 5: Fail-fast for REJECT disposition
                if self._is_reject_payload(payload):
                    logger.warning(f"[cid:{cid}] FAIL-FAST (receive_one): Blocking REJECT message")
                    return None

                return topic, payload

            return None

        except zmq.Again:
            # Timeout
            return None
        except Exception as e:
            logger.error(f"[cid:INIT] Error receiving message: {e}")
            raise
        finally:
            if timeout:
                # Reset timeout
                self.socket.setsockopt(zmq.RCVTIMEO, -1)

    def stop(self):
        """Stop the receive loop."""
        self._running = False

    async def close(self):
        """Close the subscriber."""
        self.stop()
        if self.socket:
            self.socket.close()
            self._connected = False
            logger.info("[cid:INIT] Subscriber closed")

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()


async def test_zmq_bridge():
    """Test ZMQ publisher and subscriber."""
    logger.info("[cid:INIT] Testing ZMQ bridge...")

    try:
        # Create publisher
        publisher = ZMQPublisher("tcp://127.0.0.1:15556")
        await publisher.connect()

        # Create subscriber
        subscriber = ZMQSubscriber("tcp://127.0.0.1:15556")
        await subscriber.connect(["signal", "system"])

        # Publish test signal
        signal = Signal(
            symbol="AAPL",
            direction="long",
            strength=0.8,
            timestamp=1234567890,
            features=[1.0, 2.0, 3.0],
            metadata={"strategy": "test"},
        )

        await publisher.publish_signal(signal)
        await publisher.publish_heartbeat("python-test")

        # Receive messages (with timeout)
        logger.info("[cid:INIT] Waiting for messages...")
        result = await subscriber.receive_one(timeout=2.0)

        if result:
            topic, message = result
            logger.info(f"[cid:INIT] ✓ Received message: {message['type']} on topic '{topic}'")
        else:
            logger.warning("[cid:INIT] No message received (timeout)")

        # Cleanup
        await publisher.close()
        await subscriber.close()

        logger.info("[cid:INIT] ZMQ bridge test passed!")
        return True

    except Exception as e:
        logger.error(f"[cid:INIT] ZMQ bridge test failed: {e}")
        return False


if __name__ == "__main__":
    import sys

    # Configure logging
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level="DEBUG",
    )

    # Run tests
    success = asyncio.run(test_zmq_bridge())
    sys.exit(0 if success else 1)
