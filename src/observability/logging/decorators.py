"""
Logging Decorators and Helpers - Utility functions for common logging patterns

Provides:
- log_execution_time: Decorator to log function execution time
- log_trade_decision: Helper to log trade decisions
- log_error_with_context: Helper to log errors with full context
"""

import asyncio
import logging
import functools
import inspect
import time
import traceback
from typing import Any, Callable, Dict, Optional, Literal
from .structured_logger import get_logger
from .correlations import correlation_id, get_correlation_id


def log_execution_time(
    logger_name: Optional[str] = None,
    level: str = "debug",
    threshold_ms: Optional[float] = None,
    log_args: bool = False,
    log_result: bool = False,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """
    Decorator to log function execution time

    Args:
        logger_name: Logger name (uses function module if None)
        level: Log level ('debug', 'info', 'warning')
        threshold_ms: Only log if execution exceeds this threshold
        log_args: Include function arguments in log
        log_result: Include function result in log

    Example:
        >>> @log_execution_time(threshold_ms=100)
        >>> async def fetch_data(symbol: str):
        ...     # Logs if execution takes > 100ms
        ...     return await data_source.fetch(symbol)
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        # Get logger
        log_name = logger_name or f"{func.__module__}.{func.__name__}"
        logger = get_logger(log_name)
        log_method = getattr(logger, level)

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = time.perf_counter()
            error = None
            result = None

            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                duration_ms = (time.perf_counter() - start_time) * 1000

                # Only log if threshold met
                if threshold_ms is None or duration_ms >= threshold_ms:
                    extra = {
                        "function": func.__name__,
                        "duration_ms": duration_ms,
                        "error": str(error) if error else None,
                    }

                    if log_args:
                        extra["args"] = str(args)
                        extra["kwargs"] = str(kwargs)

                    if log_result and result is not None:
                        extra["result"] = str(result)[:200]  # Truncate

                    if error:
                        logger.error(
                            f"[cid:INIT] Function {func.__name__} failed after "
                            f"{duration_ms:.2f}ms",
                            extra=extra,
                        )
                    else:
                        log_method(
                            f"Function {func.__name__} executed in {duration_ms:.2f}ms", extra=extra
                        )

        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = time.perf_counter()
            error = None
            result = None

            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                duration_ms = (time.perf_counter() - start_time) * 1000

                if threshold_ms is None or duration_ms >= threshold_ms:
                    extra = {
                        "function": func.__name__,
                        "duration_ms": duration_ms,
                        "error": str(error) if error else None,
                    }

                    if log_args:
                        extra["args"] = str(args)
                        extra["kwargs"] = str(kwargs)

                    if log_result and result is not None:
                        extra["result"] = str(result)[:200]

                    if error:
                        logger.error(
                            f"[cid:INIT] Async function {func.__name__} failed "
                            f"after {duration_ms:.2f}ms",
                            extra=extra,
                        )
                    else:
                        log_method(
                            f"Async function {func.__name__} executed in " f"{duration_ms:.2f}ms",
                            extra=extra,
                        )

        # Return appropriate wrapper
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def log_trade_decision(
    strategy_name: str,
    symbol: str,
    action: str,
    quantity: float,
    price: Optional[float] = None,
    rationale: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    logger_name: str = "trading.strategy",
) -> None:
    """
    Helper function to log trade decisions with standard format

    Args:
        strategy_name: Name of the strategy
        symbol: Trading symbol
        action: Trade action (buy, sell, hold)
        quantity: Trade quantity
        price: Trade price (optional)
        rationale: Decision rationale
        context: Additional context dictionary
        logger_name: Logger name to use

    Example:
        >>> log_trade_decision(
        ...     strategy_name="momentum",
        ...     symbol="BTCUSDT",
        ...     action="buy",
        ...     quantity=0.5,
        ...     price=45000.0,
        ...     rationale="Strong upward momentum detected",
        ...     context={'momentum_score': 0.85}
        ... )
    """
    logger = get_logger(logger_name)

    extra = {
        "event_type": "trade_decision",
        "strategy": strategy_name,
        "symbol": symbol,
        "action": action,
        "quantity": quantity,
        "price": price,
        "rationale": rationale,
    }

    if context:
        extra["context"] = context

    # Add correlation ID if present
    cid = get_correlation_id()
    if cid:
        extra["correlation_id"] = cid

    logger.info(
        f"[cid:INIT] Trade Decision: {strategy_name} - {action} {quantity} {symbol}"
        + (f" @ {price}" if price else ""),
        extra=extra,
    )


def log_error_with_context(
    error: Exception,
    context: Dict[str, Any],
    logger_name: str = "trading.system",
    include_traceback: bool = True,
    severity: str = "error",
) -> None:
    """
    Helper function to log errors with full context

    Args:
        error: Exception that occurred
        context: Context dictionary with relevant information
        logger_name: Logger name to use
        include_traceback: Include full traceback
        severity: Log severity ('error' or 'critical')

    Example:
        >>> try:
        ...     result = risky_operation()
        ... except Exception as e:
        ...     log_error_with_context(
        ...         error=e,
        ...         context={
        ...             'operation': 'order_submission',
        ...             'order_id': order_id,
        ...             'symbol': symbol,
        ...         }
        ...     )
    """
    logger = get_logger(logger_name)
    log_method = getattr(logger, severity)

    extra = {"error_type": type(error).__name__, "error_message": str(error), **context}

    if include_traceback:
        extra["traceback"] = traceback.format_exc()

    # Add correlation ID if present
    cid = get_correlation_id()
    if cid:
        extra["correlation_id"] = cid

    log_method(
        f"Error in {context.get('operation', 'unknown')}: {error}",
        exc_info=include_traceback,
        extra=extra,
    )


class LogContext:
    """
    Context manager for temporary logger context enrichment

    Example:
        >>> with LogContext({'order_id': '123', 'user_id': '456'}):
        ...     # Includes order_id and user_id
        ...     logger.info("[cid:INIT] Processing order")
    """

    def __init__(self, context: Dict[str, Any]) -> None:
        """
        Initialize log context

        Args:
            context: Context dictionary to add to all logs
        """
        self.context = context
        self._original_factory: Optional[Callable[..., logging.LogRecord]] = None

    def __enter__(self) -> "LogContext":
        """Enter context and enrich log records"""
        old_factory = logging.getLogRecordFactory()

        def record_factory(*args: Any, **kwargs: Any) -> logging.LogRecord:
            record = old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record

        self._original_factory = old_factory
        logging.setLogRecordFactory(record_factory)
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> Literal[False]:
        """Exit context and restore original factory"""
        if self._original_factory:
            logging.setLogRecordFactory(self._original_factory)
        return False


def with_correlation_id(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator to automatically create correlation ID for function

    Example:
        >>> @with_correlation_id
        >>> async def handle_request(request):
        ...     # All logs in this function will have correlation_id
        ...     logger.info("[cid:INIT] Processing request")
    """

    @functools.wraps(func)
    def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
        with correlation_id():
            return func(*args, **kwargs)

    @functools.wraps(func)
    async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
        with correlation_id():
            return await func(*args, **kwargs)

    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper
