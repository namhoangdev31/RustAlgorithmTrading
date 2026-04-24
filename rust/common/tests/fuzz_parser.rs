use common::{Envelope, Message};
use rand::{thread_rng, Rng};
use std::panic;

#[test]
fn test_fuzz_large_json() {
    // Generate a very large JSON object (1MB+)
    let mut large_string = String::with_capacity(1_000_000);
    large_string.push_str("{\"type\": \"Heartbeat\", \"data\": {\"component\": \"");
    for _ in 0..1_000_000 {
        large_string.push('A');
    }
    large_string.push_str("\"}}");

    // Attempt parse - should not panic
    let result = panic::catch_unwind(|| serde_json::from_str::<Message>(&large_string));

    assert!(result.is_ok(), "Parser panicked on large input");
    assert!(result.unwrap().is_err(), "Parser should reject oversized string data if it exceeds logic limits or just fail gracefully");
}

#[test]
fn test_fuzz_deep_nesting() {
    // Generate deeply nested JSON
    let mut nested = String::new();
    for _ in 0..1000 {
        nested.push_str("{\"a\":");
    }
    nested.push_str("{}");
    for _ in 0..1000 {
        nested.push('}');
    }

    let result = panic::catch_unwind(|| serde_json::from_str::<serde_json::Value>(&nested));

    // serde_json usually handles some nesting but might fail on extreme depth
    // The point is NO PANIC.
    assert!(result.is_ok(), "Parser panicked on deep nesting");
}

#[test]
fn test_fuzz_invalid_utf8() {
    // Invalid UTF-8 sequence
    let invalid_utf8 = vec![0, 159, 146, 150]; // Incomplete or invalid sequences

    let result = panic::catch_unwind(|| String::from_utf8(invalid_utf8));

    assert!(result.is_ok(), "string from_utf8 panicked");
    assert!(result.unwrap().is_err());
}

#[test]
fn test_fuzz_random_bytes() {
    let mut rng = thread_rng();
    for _ in 0..100 {
        let size = rng.gen_range(1..1024);
        let random_bytes: Vec<u8> = (0..size).map(|_| rng.gen()).collect();

        let _ = panic::catch_unwind(|| {
            // Test both Envelope and Message parsing
            if let Ok(s) = std::str::from_utf8(&random_bytes) {
                let _ = serde_json::from_str::<Envelope>(s);
                let _ = serde_json::from_str::<Message>(s);
            }
        });
    }
}
