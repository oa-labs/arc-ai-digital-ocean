#!/bin/bash

# Script to tag a Podman image with a specified version as 'production'

# Check if a version tag argument is provided
if [ $# -ne 1 ]; then
    echo "Error: Exactly one argument (version tag) is required."
    echo "Usage: $0 <version-tag>"
    echo "Example: $0 v1.2.3"
    exit 1
fi

# Assign the provided version tag to a variable
VERSION="$1"

set_production_container() {
    CONTAINER="$1"

    # Define the source and target image tags
    SOURCE_IMAGE="ghcr.io/oa-labs/${CONTAINER}:${VERSION}"
    TARGET_IMAGE="ghcr.io/oa-labs/${CONTAINER}:production"

    # Ensure image pull
    echo "Pulling ${SOURCE_IMAGE}..."
    podman image pull ${SOURCE_IMAGE}

    # Print the operation being performed
    echo "Tagging ${SOURCE_IMAGE} as ${TARGET_IMAGE}..."

    # Execute the podman tag command
    podman tag "${SOURCE_IMAGE}" "${TARGET_IMAGE}"

    # Check if the tag command was successful
    if [ $? -eq 0 ]; then
        echo "Successfully tagged ${SOURCE_IMAGE} as ${TARGET_IMAGE}."
        echo "Current images:"
        podman image ls
    else
        echo "Error: Failed to tag ${SOURCE_IMAGE} as ${TARGET_IMAGE}."
        echo "Possible reasons:"
        echo "  - The source image ${SOURCE_IMAGE} does not exist locally."
        echo "  - Podman is not installed or accessible."
        echo "Try pulling the image first with: podman pull ${SOURCE_IMAGE}"
        exit 1
    fi
}

set_production_container "arcai-web-frontend"
set_production_container "arcai-web-backend"
set_production_container "arcai-slack-bot"

exit 0