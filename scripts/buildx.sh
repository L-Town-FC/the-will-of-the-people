#!/bin/bash
echo 'Running buildx for multi-arch build and push'
. $PWD/scripts/time_info.sh
. $PWD/scripts/image_version.sh

resolve_image_tags "${1:-}"
print_image_selection
docker_tag_args=()
for tag in "${IMAGE_TAGS[@]}"; do
    docker_tag_args+=(--tag "$repo/$name:$tag")
done
docker buildx ls
docker buildx create --name mybuilder --use --bootstrap
docker buildx build \
    --push \
    --platform linux/amd64,linux/arm64 \
    --build-arg APP_VERSION="$APP_VERSION" \
    "${docker_tag_args[@]}" \
    .
