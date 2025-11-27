#!/bin/zsh
set -e

wget https://github.com/digitalocean/doctl/releases/download/v1.146.0/doctl-1.146.0-linux-amd64.tar.gz -O /tmp/doctl.tgz
tar -xzf /tmp/doctl.tgz -C /tmp && sudo mv /tmp/doctl /usr/local/bin/ && rm /tmp/doctl.tgz

# Set up subuid and subgid for user namespace mapping
# First, remove any existing entries for vscode user to avoid conflicts
sudo sed -i '/^vscode:/d' /etc/subuid /etc/subgid 2>/dev/null || true

# Add new entries with non-conflicting ranges
echo "vscode:100000:65536" | sudo tee -a /etc/subuid
echo "vscode:100000:65536" | sudo tee -a /etc/subgid

# Ensure proper permissions on subuid/subgid files
sudo chmod 644 /etc/subuid /etc/subgid

sudo chown $(whoami) /var/run/docker.sock

# login to docker so we can push images
docker login ghcr.io -u $GITHUB_USERNAME -p $GITHUB_TOKEN

# Make release.sh available in PATH
sudo cp .devcontainer/release.sh /usr/local/bin/release
sudo chmod +x /usr/local/bin/release
cp .devcontainer/zshrc /home/node/.zshrc

# Initialize pnpm and pmg
SHELL=zsh pnpm setup && source /home/node/.zshrc
pmg setup install

echo "Development environment setup complete!"
