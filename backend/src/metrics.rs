use std::sync::atomic::{AtomicU64, Ordering};

pub struct MetricsCollector {
    pub total_requests: AtomicU64,
    pub total_errors: AtomicU64,
    total_response_time_ms: AtomicU64,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self {
            total_requests: AtomicU64::new(0),
            total_errors: AtomicU64::new(0),
            total_response_time_ms: AtomicU64::new(0),
        }
    }

    pub fn record_request(&self, duration_ms: u64) {
        self.total_requests.fetch_add(1, Ordering::Relaxed);
        self.total_response_time_ms.fetch_add(duration_ms, Ordering::Relaxed);
    }

    pub fn record_error(&self) {
        self.total_errors.fetch_add(1, Ordering::Relaxed);
    }

    pub fn avg_response_time_ms(&self) -> u64 {
        let total = self.total_response_time_ms.load(Ordering::Relaxed);
        let count = self.total_requests.load(Ordering::Relaxed);
        if count > 0 { total / count } else { 0 }
    }
}
