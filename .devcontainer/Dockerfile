FROM oven/bun:latest

# Install additional dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl \
        wget \
        git \
        unzip \
        sudo \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        postgresql-client \
        gnupg \
        lsb-release \
        jq \
        vim \
        nano \
        htop \
        tree \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Configure git for container
RUN git config --global --add safe.directory /workspace
