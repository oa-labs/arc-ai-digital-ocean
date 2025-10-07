SHORT_HASH:=$(shell git rev-parse --short HEAD)
SEMVER:=$(shell node -p "require('./package.json').version")

container-registry-login:
	@echo "Checking GitHub Container Registry authentication..."
	@if ! podman login --get-login ghcr.io >/dev/null 2>&1; then \
		echo "Error: Not authenticated with ghcr.io"; \
		echo "Please ensure GITHUB_USERNAME and GITHUB_TOKEN environment variables are set"; \
		echo "and rebuild the devcontainer, or run: echo \$$GITHUB_TOKEN | podman login ghcr.io -u \$$GITHUB_USERNAME --password-stdin"; \
		exit 1; \
	fi

container-build:
# Build and push the Docker container for the web project
	cd .. && podman buildx build . -f web/Dockerfile -t ghcr.io/oa-labs/ichat-kb-manager:$(SEMVER)-$(SHORT_HASH) --platform linux/amd64 --push