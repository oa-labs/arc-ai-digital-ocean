FROM node:24-trixie-slim

# Enable pnpm via corepack (must run as root before switching user)
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
        ca-certificates

USER 1000

# Set working directory
WORKDIR /workspace

# Configure git for container
RUN git config --global --add safe.directory /workspace
