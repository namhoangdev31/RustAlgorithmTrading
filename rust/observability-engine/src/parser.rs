use chrono::{DateTime, Utc};
use database::MetricRecord;
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MetricKind {
    Counter,
    Gauge,
    Histogram,
    Summary,
    Unknown,
}

impl MetricKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Counter => "counter",
            Self::Gauge => "gauge",
            Self::Histogram => "histogram",
            Self::Summary => "summary",
            Self::Unknown => "unknown",
        }
    }
}

impl From<&str> for MetricKind {
    fn from(value: &str) -> Self {
        match value.to_ascii_lowercase().as_str() {
            "counter" => Self::Counter,
            "gauge" => Self::Gauge,
            "histogram" => Self::Histogram,
            "summary" => Self::Summary,
            _ => Self::Unknown,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParsedMetric {
    pub name: String,
    pub kind: MetricKind,
    pub value: f64,
    pub labels: HashMap<String, String>,
    pub timestamp: DateTime<Utc>,
}

impl ParsedMetric {
    pub fn into_record(self, service: &str) -> MetricRecord {
        let mut labels = self.labels;
        let symbol = labels.get("symbol").cloned();
        labels.insert("service".to_string(), service.to_string());
        labels.insert("metric_type".to_string(), self.kind.as_str().to_string());

        MetricRecord {
            timestamp: self.timestamp,
            metric_name: self.name,
            value: self.value,
            symbol,
            labels: Some(labels),
        }
    }
}

#[derive(Debug, Default, Clone)]
pub struct PrometheusParser;

impl PrometheusParser {
    pub fn new() -> Self {
        Self
    }

    pub fn parse(&self, text: &str, timestamp: DateTime<Utc>) -> Vec<ParsedMetric> {
        let mut metrics = Vec::new();
        let mut type_hints = HashMap::new();

        for line in text.lines().map(str::trim) {
            if line.is_empty() {
                continue;
            }

            if let Some((name, kind)) = parse_type_hint(line) {
                type_hints.insert(name, kind);
                continue;
            }

            if line.starts_with('#') {
                continue;
            }

            if let Some(metric) = parse_metric_line(line, &type_hints, timestamp) {
                metrics.push(metric);
            }
        }

        metrics
    }
}

fn parse_type_hint(line: &str) -> Option<(String, MetricKind)> {
    let mut parts = line.split_whitespace();
    match (parts.next(), parts.next(), parts.next(), parts.next()) {
        (Some("#"), Some("TYPE"), Some(name), Some(kind)) => {
            Some((name.to_string(), MetricKind::from(kind)))
        }
        _ => None,
    }
}

fn parse_metric_line(
    line: &str,
    type_hints: &HashMap<String, MetricKind>,
    timestamp: DateTime<Utc>,
) -> Option<ParsedMetric> {
    let mut parts = line.split_whitespace();
    let name_and_labels = parts.next()?;
    let value = parts.next()?.parse::<f64>().ok()?;

    let (name, labels) = parse_name_and_labels(name_and_labels);
    let kind = type_hints.get(&name).copied().unwrap_or(MetricKind::Gauge);

    Some(ParsedMetric {
        name,
        kind,
        value,
        labels,
        timestamp,
    })
}

fn parse_name_and_labels(input: &str) -> (String, HashMap<String, String>) {
    let Some(start) = input.find('{') else {
        return (input.to_string(), HashMap::new());
    };
    let Some(end) = input.rfind('}') else {
        return (input.to_string(), HashMap::new());
    };
    if end <= start {
        return (input.to_string(), HashMap::new());
    }

    let name = input[..start].to_string();
    let labels = parse_labels(&input[start + 1..end]);
    (name, labels)
}

fn parse_labels(input: &str) -> HashMap<String, String> {
    split_label_pairs(input)
        .into_iter()
        .filter_map(|pair| {
            let (key, value) = pair.split_once('=')?;
            Some((key.trim().to_string(), unquote_label_value(value.trim())))
        })
        .collect()
}

fn split_label_pairs(input: &str) -> Vec<String> {
    let mut pairs = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut escaped = false;

    for ch in input.chars() {
        match ch {
            '\\' if in_quotes && !escaped => {
                escaped = true;
                current.push(ch);
            }
            '"' if !escaped => {
                in_quotes = !in_quotes;
                current.push(ch);
            }
            ',' if !in_quotes => {
                pairs.push(current.trim().to_string());
                current.clear();
            }
            _ => {
                escaped = false;
                current.push(ch);
            }
        }
    }

    if !current.trim().is_empty() {
        pairs.push(current.trim().to_string());
    }

    pairs
}

fn unquote_label_value(value: &str) -> String {
    let value = value.strip_prefix('"').unwrap_or(value);
    let value = value.strip_suffix('"').unwrap_or(value);
    value.replace("\\\"", "\"").replace("\\\\", "\\")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_type_comments_labels_and_symbol() {
        let parser = PrometheusParser::new();
        let now = Utc::now();
        let metrics = parser.parse(
            r#"
# HELP order_latency Order latency
# TYPE order_latency_seconds histogram
order_latency_seconds{symbol="AAPL",route="paper"} 0.42
# TYPE active_orders gauge
active_orders 7
"#,
            now,
        );

        assert_eq!(metrics.len(), 2);
        assert_eq!(metrics[0].name, "order_latency_seconds");
        assert_eq!(metrics[0].kind, MetricKind::Histogram);
        assert_eq!(metrics[0].labels["symbol"], "AAPL");
        assert_eq!(metrics[1].kind, MetricKind::Gauge);
    }

    #[test]
    fn skips_invalid_metric_lines() {
        let parser = PrometheusParser::new();
        let metrics = parser.parse("bad_line\nvalid_metric 1.5\nother nope\n", Utc::now());

        assert_eq!(metrics.len(), 1);
        assert_eq!(metrics[0].name, "valid_metric");
    }

    #[test]
    fn record_includes_service_and_metric_type_labels() {
        let parser = PrometheusParser::new();
        let metric = parser
            .parse(
                r#"# TYPE pnl gauge
pnl{symbol="MSFT"} 2.5"#,
                Utc::now(),
            )
            .pop()
            .unwrap()
            .into_record("execution");

        let labels = metric.labels.unwrap();
        assert_eq!(metric.symbol.as_deref(), Some("MSFT"));
        assert_eq!(labels["service"], "execution");
        assert_eq!(labels["metric_type"], "gauge");
    }
}
