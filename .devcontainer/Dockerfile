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
RUN curl -fsSL https://github.com/safedep/pmg/releases/download/v0.1.0/pmg_Linux_x86_64.tar.gz | tar -C /usr/local/bin -xz pmg

USER 1000

# Set working directory
WORKDIR /workspace

# Configure git for container
RUN git config --global --add safe.directory /workspace
