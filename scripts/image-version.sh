#!/bin/bash

repo="${DOCKER_REPO:-atmollohan}"
name="${IMAGE_NAME:-bot}"

resolve_image_tags() {
    local explicit_tag="${1:-${IMAGE_TAG:-}}"
    local short_sha

    if git rev-parse --short=7 HEAD >/dev/null 2>&1; then
        short_sha="$(git rev-parse --short=7 HEAD)"
    else
        short_sha="unknown"
    fi

    if [ -n "$explicit_tag" ]; then
        APP_VERSION="$explicit_tag"
        IMAGE_TAGS=("$explicit_tag")
    else
        APP_VERSION="$short_sha"
        IMAGE_TAGS=("latest" "$short_sha")
    fi
}

print_image_selection() {
    echo "Docker repository: $repo/$name"
    echo "App version: $APP_VERSION"
    echo "Docker tags: ${IMAGE_TAGS[*]}"
}
