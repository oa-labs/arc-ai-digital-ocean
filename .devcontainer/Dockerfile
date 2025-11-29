FROM node:24-trixie-slim

# Enable pnpm via corepack (must run as root before switching user)
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install additional dependencies (using apt for Debian)
RUN apt update && apt install --no-install-recommends -y \
        curl \
        wget \
        git \
        unzip \
        sudo \
        build-essential \
        postgresql-client \
        jq \
        vim \
        nano \
        htop \
        tree \
        docker-buildx docker-cli \
        ca-certificates \
        diffstat \
        uidmap

# Install pmg (package manager tool)
# Set the version as an ARG for easy updates
ARG PMG_VERSION=v0.1.0

RUN ARCH=$(uname -m) && \
    # Map aarch64 to arm64, keep x86_64 as is
    if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi && \
    curl -fsSL "https://github.com/safedep/pmg/releases/download/${PMG_VERSION}/pmg_Linux_${ARCH}.tar.gz" | tar -C /usr/local/bin -xz pmg

USER 1000

# Set working directory
WORKDIR /workspace

# Configure git for container
RUN git config --global --add safe.directory /workspace
