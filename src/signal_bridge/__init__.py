"""
Rust-powered signal processing bridge.

This package provides high-performance technical indicators and 
feature computation via PyO3-compiled Rust bindings.
"""

from .signal_bridge import Bar, FeatureComputer

__all__ = ["Bar", "FeatureComputer"]
