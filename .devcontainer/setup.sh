#!/bin/bash
set -e

# Install make (should already be available but ensure it's there)
sudo apt-get update
sudo apt-get install -y make uidmap

# Set up subuid and subgid for user namespace mapping
# First, remove any existing entries for vscode user to avoid conflicts
sudo sed -i '/^vscode:/d' /etc/subuid /etc/subgid 2>/dev/null || true

# Add new entries with non-conflicting ranges
echo "vscode:100000:65536" | sudo tee -a /etc/subuid
echo "vscode:100000:65536" | sudo tee -a /etc/subgid

# Ensure proper permissions on subuid/subgid files
sudo chmod 644 /etc/subuid /etc/subgid

# Configure Git user settings
echo "Configuring Git..."

# Configure Git user.name and user.email from environment variables or fallback to host git config
if [ -n "$GIT_USER_NAME" ] && [ -n "$GIT_USER_EMAIL" ]; then
    echo "Setting Git user configuration from environment variables..."
    git config --global user.name "$GIT_USER_NAME"
    git config --global user.email "$GIT_USER_EMAIL"
    echo "Git user configured: $GIT_USER_NAME <$GIT_USER_EMAIL>"
else
    echo "Git user environment variables not set. Attempting to read from host git config..."

    # Try to read from mounted .gitconfig if available
    if [ -f ~/.gitconfig ]; then
        HOST_USER_NAME=$(git config --global user.name 2>/dev/null || echo "")
        HOST_USER_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

        if [ -n "$HOST_USER_NAME" ] && [ -n "$HOST_USER_EMAIL" ]; then
            echo "Found Git user configuration from host: $HOST_USER_NAME <$HOST_USER_EMAIL>"
        else
            echo "Warning: Git user.name and user.email not configured."
            echo "Please set them manually with:"
            echo "  git config --global user.name 'Your Name'"
            echo "  git config --global user.email 'your.email@example.com'"
            echo "Or set GIT_USER_NAME and GIT_USER_EMAIL environment variables in your host system."
        fi
    else
        echo "Warning: No .gitconfig found and no environment variables set."
        echo "Please configure Git user settings manually or set environment variables:"
        echo "  export GIT_USER_NAME='Your Name'"
        echo "  export GIT_USER_EMAIL='your.email@example.com'"
    fi
fi

# Configure Git SSH if SSH keys are available
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "SSH keys found, configuring SSH for Git..."

    # Set proper permissions on SSH directory and keys
    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/id_* 2>/dev/null || true
    chmod 644 ~/.ssh/*.pub 2>/dev/null || true

    # Start SSH agent and add keys
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/id_rsa 2>/dev/null || true
    ssh-add ~/.ssh/id_ed25519 2>/dev/null || true

    # Test GitHub SSH connection
    ssh -T git@github.com -o StrictHostKeyChecking=no 2>&1 | head -1
else
    echo "No SSH keys found. Consider using HTTPS authentication or adding SSH keys."
    echo "To use HTTPS with token authentication, you can configure Git with:"
    echo "  git config --global credential.helper store"
    echo "  git config --global url.\"https://github.com/\".insteadOf git@github.com:"
fi

# Configure Git to use HTTPS instead of SSH (fallback option)
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_USERNAME" ]; then
    echo "Configuring Git to use HTTPS with token authentication..."
    git config --global credential.helper store
    git config --global url."https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:"
    echo "Git configured to use HTTPS authentication with GitHub token"
fi

sudo chown $(whoami) /var/run/docker.sock

# Make deploy.sh available in PATH
sudo cp .devcontainer/deploy.sh /usr/local/bin/deploy
sudo chmod +x /usr/local/bin/deploy

echo "Development environment setup complete!"
