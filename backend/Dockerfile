# ============================================
# Stage 1: Build Rust binary
# ============================================
FROM rust:1.75-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy source for dependency caching
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (cached layer)
RUN cargo build --release && rm -rf src

# Copy actual source code
COPY src ./src

# Build the actual binary
RUN touch src/main.rs && cargo build --release

# ============================================
# Stage 2: Runtime image
# ============================================
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (Python, Node.js, Java)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    python3-pip \
    nodejs \
    npm \
    default-jdk-headless \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Verify installations
RUN python3 --version && node --version && java -version

# Copy binary from builder
COPY --from=builder /app/target/release/chill-space-backend /app/chill-space-backend

# Create non-root user for security
RUN useradd -m -u 1000 runner
USER runner

# Hugging Face Spaces expects port 7860
ENV PORT=7860
ENV HOST=0.0.0.0
ENV RUST_LOG=info

EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7860/api/v1/health || exit 1

CMD ["/app/chill-space-backend"]
