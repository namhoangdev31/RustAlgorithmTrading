"""
Shared redaction utility for observability logging.

This module centralizes sensitive-field masking so it can be reused by
formatters and future external sinks (Sentry/Telegram/etc.).
"""

from typing import Any, Set

REDACTION_TOKEN = "[REDACTED]"

# Sensitive fields that must be redacted in public logs
SENSITIVE_FIELDS: Set[str] = {
    "limit_snapshot",
    "payload_preview",
    "api_key",
    "api_secret",
    "password",
    "token",
}


def redact_sensitive_data(data: Any) -> Any:
    """
    Recursively redact sensitive fields from dictionaries/lists.
    """
    if isinstance(data, dict):
        return {
            key: (REDACTION_TOKEN if key in SENSITIVE_FIELDS else redact_sensitive_data(value))
            for key, value in data.items()
        }
    if isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data
