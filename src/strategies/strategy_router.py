"""
Strategy Router - Intelligent Strategy Selection

Routes each symbol to the optimal strategy based on:
1. Market regime detection (trending/ranging/volatile)
2. Symbol characteristics (volatility, liquidity)
3. Strategy performance history

This maximizes alpha generation by using the right strategy for each market condition.
"""

from typing import Dict, List, Any, Optional
import pandas as pd
from loguru import logger

from ..strategies.base import Strategy, Signal, SignalType
from ..strategies.momentum_simplified import SimplifiedMomentumStrategy
from ..strategies.mean_reversion import MeanReversion
from ..strategies.trend_following import TrendFollowingStrategy
from ..strategies.market_regime import RegimeDetector, MarketRegime


class StrategyRouter:
    """
    Intelligent strategy router that selects optimal strategy per symbol

    Features:
    - Market regime detection
    - Per-symbol strategy selection
    - Performance tracking
    - Automatic strategy switching
    """

    def __init__(
        self,
        regime_detector: Optional[RegimeDetector] = None,
        enable_regime_detection: bool = True,
        min_confidence: float = 0.6,
    ):
        """
        Initialize strategy router

        Args:
            regime_detector: Custom RegimeDetector instance
            enable_regime_detection: Whether to use regime detection
            min_confidence: Minimum confidence for regime-based routing
        """
        self.regime_detector = regime_detector or RegimeDetector()
        self.enable_regime_detection = enable_regime_detection
        self.min_confidence = min_confidence

        # Initialize all strategies
        self.strategies = {
            'momentum': SimplifiedMomentumStrategy(),
            'mean_reversion': MeanReversion(),
            'trend_following': TrendFollowingStrategy(),
        }

        # Track routing decisions
        # {symbol: [{'timestamp': ..., 'strategy': ..., 'regime': ...}]}
        self.routing_history = {}

        logger.info(
            f"StrategyRouter initialized with {len(self.strategies)} strategies | "
            f"Regime detection: {enable_regime_detection}"
        )

    def select_strategy(self, symbol: str, data: pd.DataFrame) -> Strategy:
        """
        Select optimal strategy for given symbol and market data

        Args:
            symbol: Stock symbol
            data: Historical price data

        Returns:
            Optimal Strategy instance
        """
        if not self.enable_regime_detection or len(data) < 100:
            # Default to momentum if regime detection disabled or insufficient data
            msg = (
                f"{symbol}: Using default Momentum strategy "
                "(regime detection disabled)"
            )
            logger.info(msg)
            self._record_routing(symbol, 'momentum', MarketRegime.UNKNOWN, 0.0)
            return self.strategies['momentum']

        # Detect market regime
        regime_info = self.regime_detector.detect_regime(data)
        regime = regime_info['regime']
        confidence = regime_info['confidence']

        # Select strategy based on regime
        if confidence < self.min_confidence:
            # Low confidence - use default momentum
            strategy_name = 'momentum'
            logger.info(
                f"{symbol}: Low confidence ({confidence:.2f}) - "
                "using default Momentum strategy"
            )
        else:
            # High confidence - use regime-optimal strategy
            strategy_map = {
                MarketRegime.TRENDING: 'trend_following',
                MarketRegime.RANGING: 'mean_reversion',
                MarketRegime.VOLATILE: 'momentum',
                MarketRegime.UNKNOWN: 'momentum',
            }
            strategy_name = strategy_map[regime]
            logger.info(
                f"{symbol}: Regime={regime.value.upper()} (conf={confidence:.2f}) → "
                f"Strategy={strategy_name.upper()} | {regime_info['recommendation']}"
            )

        # Record routing decision
        self._record_routing(symbol, strategy_name, regime, confidence)

        return self.strategies[strategy_name]

    def generate_signals(
        self,
        symbols_data: Dict[str, pd.DataFrame],
        force_strategy: Optional[str] = None
    ) -> List[Signal]:
        """
        Generate signals for multiple symbols using optimal strategies

        Args:
            symbols_data: Dictionary {symbol: DataFrame}
            force_strategy: Optional strategy name to force for all symbols

        Returns:
            Combined list of signals from all strategies
        """
        all_signals = []

        for symbol, data in symbols_data.items():
            # Set symbol attribute on dataframe
            data = data.copy()
            data.attrs['symbol'] = symbol

            # Select optimal strategy
            if force_strategy and force_strategy in self.strategies:
                strategy = self.strategies[force_strategy]
                logger.info(f"{symbol}: Using forced strategy: {force_strategy}")
            else:
                strategy = self.select_strategy(symbol, data)

            # Generate signals
            try:
                signals = strategy.generate_signals(data)
                all_signals.extend(signals)
                log_success = (
                    f"{symbol}: Generated {len(signals)} signals using "
                    f"{strategy.name}"
                )
                logger.info(log_success)
            except Exception as e:
                log_msg = (
                    f"{symbol}: Failed to generate signals with "
                    f"{strategy.name}: {e}"
                )
                logger.error(log_msg)

        log_finish = (
            f"Total signals generated: {len(all_signals)} across "
            f"{len(symbols_data)} symbols"
        )
        logger.info(log_finish)
        return all_signals

    def _record_routing(
        self,
        symbol: str,
        strategy_name: str,
        regime: MarketRegime,
        confidence: float
    ):
        """Record routing decision for analysis"""
        if symbol not in self.routing_history:
            self.routing_history[symbol] = []

        self.routing_history[symbol].append({
            'timestamp': pd.Timestamp.now(),
            'strategy': strategy_name,
            'regime': regime.value,
            'confidence': confidence,
        })

    def get_routing_summary(self) -> Dict[str, Any]:
        """
        Get summary of routing decisions

        Returns:
            Dictionary with routing statistics
        """
        summary = {
            'total_symbols': len(self.routing_history),
            'strategy_usage': {
                'momentum': 0,
                'mean_reversion': 0,
                'trend_following': 0,
            },
            'regime_distribution': {
                'trending': 0,
                'ranging': 0,
                'volatile': 0,
                'unknown': 0,
            },
            'avg_confidence': 0.0,
        }

        total_decisions = 0
        total_confidence = 0.0

        for symbol, history in self.routing_history.items():
            for decision in history:
                # Count strategy usage
                strategy = decision['strategy']
                if strategy in summary['strategy_usage']:
                    summary['strategy_usage'][strategy] += 1

                # Count regime distribution
                regime = decision['regime']
                if regime in summary['regime_distribution']:
                    summary['regime_distribution'][regime] += 1

                # Sum confidence
                total_confidence += decision['confidence']
                total_decisions += 1

        if total_decisions > 0:
            summary['avg_confidence'] = total_confidence / total_decisions

        return summary

    def print_routing_summary(self):
        """Print formatted routing summary"""
        summary = self.get_routing_summary()

        logger.info("\n" + "=" * 80)
        logger.info("STRATEGY ROUTER SUMMARY")
        logger.info("=" * 80)

        logger.info(f"\nTotal Symbols: {summary['total_symbols']}")

        logger.info("\nStrategy Usage:")
        for strategy, count in summary['strategy_usage'].items():
            logger.info(f"  {strategy:20s}: {count:3d} symbols")

        logger.info("\nRegime Distribution:")
        for regime, count in summary['regime_distribution'].items():
            logger.info(f"  {regime:20s}: {count:3d} decisions")

        logger.info(f"\nAverage Confidence: {summary['avg_confidence']:.2%}")
        logger.info("=" * 80 + "\n")

    def generate_signals_per_symbol(
        self,
        symbol: str,
        data: pd.DataFrame,
        force_strategy: Optional[str] = None
    ) -> List[Signal]:
        """
        Generate signals for a single symbol (for backtesting compatibility)

        Args:
            symbol: Stock symbol
            data: Historical price data
            force_strategy: Optional strategy name to force

        Returns:
            List of signals for the symbol
        """
        logger.info(f"[{symbol}] Generating signals for single symbol backtest")

        # Set symbol attribute
        data = data.copy()
        data.attrs['symbol'] = symbol

        # Select optimal strategy
        if force_strategy and force_strategy in self.strategies:
            strategy = self.strategies[force_strategy]
            logger.info(f"[{symbol}] Using forced strategy: {force_strategy}")
        else:
            strategy = self.select_strategy(symbol, data)

        # Generate signals
        try:
            signals = strategy.generate_signals(data)
            num_long = sum(1 for s in signals if s.signal_type == SignalType.LONG)
            num_short = sum(
                1 for s in signals if s.signal_type == SignalType.SHORT
            )
            num_exit = sum(1 for s in signals if s.signal_type == SignalType.EXIT)

            log_msg = (
                f"[{symbol}] Generated {len(signals)} signals using "
                f"{strategy.name} | LONG={num_long}, SHORT={num_short}, "
                f"EXIT={num_exit}"
            )
            logger.info(log_msg)
            return signals
        except Exception as e:
            logger.error(
                f"[{symbol}] Failed to generate signals with "
                f"{strategy.name}: {e}"
            )
            import traceback
            traceback.print_exc()
            return []
