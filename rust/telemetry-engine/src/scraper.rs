use crate::config::ScrapeTarget;
use crate::parser::{ParsedMetric, PrometheusParser};
use chrono::Utc;
use std::time::Duration;
use tokio::task::JoinSet;

#[derive(Debug, Clone)]
pub struct ScrapeResult {
    pub service: String,
    pub metrics: Vec<ParsedMetric>,
    pub error: Option<String>,
}

#[derive(Debug, Clone)]
pub struct Scraper {
    client: reqwest::Client,
    parser: PrometheusParser,
}

impl Scraper {
    pub fn new(timeout: Duration) -> anyhow::Result<Self> {
        let client = reqwest::Client::builder().timeout(timeout).build()?;

        Ok(Self {
            client,
            parser: PrometheusParser::new(),
        })
    }

    pub async fn scrape_all(&self, targets: &[ScrapeTarget]) -> Vec<ScrapeResult> {
        let mut tasks = JoinSet::new();

        for target in targets.iter().cloned() {
            let scraper = self.clone();
            tasks.spawn(async move { scraper.scrape_target(target).await });
        }

        let mut results = Vec::with_capacity(targets.len());
        while let Some(result) = tasks.join_next().await {
            match result {
                Ok(scrape) => results.push(scrape),
                Err(err) => results.push(ScrapeResult {
                    service: "unknown".to_string(),
                    metrics: Vec::new(),
                    error: Some(format!("scrape task failed: {}", err)),
                }),
            }
        }

        results
    }

    pub async fn scrape_target(&self, target: ScrapeTarget) -> ScrapeResult {
        let response = match self.client.get(&target.url).send().await {
            Ok(response) => response,
            Err(err) => {
                return ScrapeResult {
                    service: target.service,
                    metrics: Vec::new(),
                    error: Some(err.to_string()),
                };
            }
        };

        let status = response.status();
        if !status.is_success() {
            return ScrapeResult {
                service: target.service,
                metrics: Vec::new(),
                error: Some(format!("HTTP status {}", status.as_u16())),
            };
        }

        match response.text().await {
            Ok(body) => ScrapeResult {
                service: target.service,
                metrics: self.parser.parse(&body, Utc::now()),
                error: None,
            },
            Err(err) => ScrapeResult {
                service: target.service,
                metrics: Vec::new(),
                error: Some(err.to_string()),
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpListener;

    #[tokio::test]
    async fn scrapes_local_prometheus_fixture() {
        let url = spawn_fixture_server("# TYPE fixture_counter counter\nfixture_counter 3\n").await;
        let scraper = Scraper::new(Duration::from_secs(2)).unwrap();
        let result = scraper
            .scrape_target(ScrapeTarget {
                service: "fixture".to_string(),
                url,
            })
            .await;

        assert!(result.error.is_none());
        assert_eq!(result.metrics.len(), 1);
        assert_eq!(result.metrics[0].name, "fixture_counter");
    }

    async fn spawn_fixture_server(body: &'static str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buffer = [0_u8; 1024];
            let _ = socket.read(&mut buffer).await.unwrap();
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{}",
                body.len(),
                body
            );
            socket.write_all(response.as_bytes()).await.unwrap();
        });

        format!("http://{}", addr)
    }
}
