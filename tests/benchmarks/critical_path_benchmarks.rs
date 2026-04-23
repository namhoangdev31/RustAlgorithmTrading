/// Performance benchmarks for critical trading paths
/// Uses criterion for statistical analysis of performance

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use common::types::*;
use market_data::orderbook::OrderBookManager;
use chrono::Utc;

fn benchmark_order_creation(c: &mut Criterion) {
    c.bench_function("order_creation", |b| {
        b.iter(|| {
            let order = Order {
                order_id: "bench-order".to_string(),
                client_order_id: "client-bench-1".to_string(),
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                order_type: OrderType::Limit,
                quantity: Quantity(black_box(100.0)),
                price: Some(Price(black_box(150.00))),
                stop_price: None,
                status: OrderStatus::Pending,
                filled_quantity: Quantity(0.0),
                average_price: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            black_box(order);
        });
    });
}

fn benchmark_order_serialization(c: &mut Criterion) {
    let order = Order {
        order_id: "serialize-bench".to_string(),
        client_order_id: "client-serialize-1".to_string(),
        symbol: Symbol("TSLA".to_string()),
        side: Side::Bid,
        order_type: OrderType::Market,
        quantity: Quantity(50.0),
        price: None,
        stop_price: None,
        status: OrderStatus::Pending,
        filled_quantity: Quantity(0.0),
        average_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    c.bench_function("order_serialization", |b| {
        b.iter(|| {
            let json = serde_json::to_string(black_box(&order)).unwrap();
            black_box(json);
        });
    });
}

fn benchmark_order_deserialization(c: &mut Criterion) {
    let order = Order {
        order_id: "deserialize-bench".to_string(),
        client_order_id: "client-deserialize-1".to_string(),
        symbol: Symbol("NVDA".to_string()),
        side: Side::Ask,
        order_type: OrderType::Limit,
        quantity: Quantity(25.0),
        price: Some(Price(450.00)),
        stop_price: None,
        status: OrderStatus::Filled,
        filled_quantity: Quantity(25.0),
        average_price: Some(Price(450.00)),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    let json = serde_json::to_string(&order).unwrap();

    c.bench_function("order_deserialization", |b| {
        b.iter(|| {
            let order: Order = serde_json::from_str(black_box(&json)).unwrap();
            black_box(order);
        });
    });
}

fn benchmark_orderbook_updates(c: &mut Criterion) {
    let mut group = c.benchmark_group("orderbook_updates");

    for depth in [10, 100, 1000].iter() {
        group.bench_with_input(
            BenchmarkId::from_parameter(depth),
            depth,
            |b, &depth| {
                let mut manager = OrderBookManager::new();
                let symbol = "BENCH";

                b.iter(|| {
                    for i in 0..depth {
                        manager.update_bid(symbol, Price(100.00 + (i as f64 * 0.01)), Quantity(100.0));
                    }
                });
            },
        );
    }

    group.finish();
}

fn benchmark_position_pnl_calculation(c: &mut Criterion) {
    c.bench_function("position_pnl", |b| {
        b.iter(|| {
            let quantity = black_box(100.0);
            let avg_price = black_box(150.00);
            let current_price = black_box(155.00);

            let unrealized_pnl = (current_price - avg_price) * quantity;

            let position = Position {
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                quantity: Quantity(quantity),
                entry_price: Price(avg_price),
                current_price: Price(current_price),
                unrealized_pnl,
                realized_pnl: 0.0,
                opened_at: Utc::now(),
                updated_at: Utc::now(),
            };

            black_box(position);
        });
    });
}

fn benchmark_bar_creation(c: &mut Criterion) {
    c.bench_function("bar_creation", |b| {
        b.iter(|| {
            let bar = Bar {
                symbol: Symbol("TSLA".to_string()),
                open: Price(black_box(250.00)),
                high: Price(black_box(255.00)),
                low: Price(black_box(248.00)),
                close: Price(black_box(252.00)),
                volume: Quantity(black_box(50000.0)),
                timestamp: Utc::now(),
            };
            black_box(bar);
        });
    });
}

fn benchmark_concurrent_order_creation(c: &mut Criterion) {
    use std::sync::Arc;
    use std::sync::atomic::{AtomicU64, Ordering};

    c.bench_function("concurrent_orders", |b| {
        let counter = Arc::new(AtomicU64::new(0));

        b.iter(|| {
            let handles: Vec<_> = (0..10)
                .map(|_| {
                    let counter_clone = Arc::clone(&counter);
                    std::thread::spawn(move || {
                        for _ in 0..100 {
                            let order = Order {
                                order_id: format!("order-{}", counter_clone.fetch_add(1, Ordering::SeqCst)),
                                client_order_id: format!("client-{}", counter_clone.load(Ordering::SeqCst)),
                                symbol: Symbol("AAPL".to_string()),
                                side: Side::Bid,
                                order_type: OrderType::Market,
                                quantity: Quantity(10.0),
                                price: None,
                                stop_price: None,
                                status: OrderStatus::Pending,
                                filled_quantity: Quantity(0.0),
                                average_price: None,
                                created_at: Utc::now(),
                                updated_at: Utc::now(),
                            };
                            black_box(order);
                        }
                    })
                })
                .collect();

            for handle in handles {
                handle.join().unwrap();
            }
        });
    });
}

fn benchmark_spread_calculation(c: &mut Criterion) {
    c.bench_function("spread_calculation", |b| {
        b.iter(|| {
            let bid = black_box(150.00);
            let ask = black_box(150.50);
            let spread = ask - bid;
            let spread_bps = (spread / bid) * 10000.0;
            black_box(spread_bps);
        });
    });
}

fn benchmark_order_validation(c: &mut Criterion) {
    let order = Order {
        order_id: "validate-bench".to_string(),
        client_order_id: "client-val-1".to_string(),
        symbol: Symbol("GOOG".to_string()),
        side: Side::Bid,
        order_type: OrderType::Limit,
        quantity: Quantity(10.0),
        price: Some(Price(2500.00)),
        stop_price: None,
        status: OrderStatus::Pending,
        filled_quantity: Quantity(0.0),
        average_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    c.bench_function("order_validation", |b| {
        b.iter(|| {
            // Validation checks
            let valid = order.quantity.0 > 0.0
                && order.price.is_some()
                && !order.symbol.0.is_empty();
            black_box(valid);
        });
    });
}

fn benchmark_memory_allocation(c: &mut Criterion) {
    c.bench_function("order_vector_allocation", |b| {
        b.iter(|| {
            let mut orders = Vec::with_capacity(1000);
            for i in 0..1000 {
                orders.push(Order {
                    order_id: format!("order-{}", i),
                    client_order_id: format!("client-{}", i),
                    symbol: Symbol("AAPL".to_string()),
                    side: Side::Bid,
                    order_type: OrderType::Market,
                    quantity: Quantity(10.0),
                    price: None,
                    stop_price: None,
                    status: OrderStatus::Pending,
                    filled_quantity: Quantity(0.0),
                    average_price: None,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                });
            }
            black_box(orders);
        });
    });
}

criterion_group!(
    benches,
    benchmark_order_creation,
    benchmark_order_serialization,
    benchmark_order_deserialization,
    benchmark_orderbook_updates,
    benchmark_position_pnl_calculation,
    benchmark_bar_creation,
    benchmark_concurrent_order_creation,
    benchmark_spread_calculation,
    benchmark_order_validation,
    benchmark_memory_allocation
);

criterion_main!(benches);
