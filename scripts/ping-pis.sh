#!/bin/bash

echo "=== Pi Connectivity Test ==="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

TARGET_HOST="${1:-$PI_HOST}"
TARGET_USER="${2:-$PI_USER}"

if [ -z "$TARGET_HOST" ]; then
    echo "Error: No PI_HOST configured in .env"
    echo "Usage: $0 [host] [user]"
    exit 1
fi

echo "Testing $TARGET_USER@$TARGET_HOST..."

if ping -c 1 -W 2 "$TARGET_HOST" > /dev/null 2>&1; then
    echo "  ✓ Ping successful"
    if nc -z -w 2 "$TARGET_HOST" 22 2>/dev/null; then
        echo "  ✓ SSH port (22) open"
        if [ -n "$PATH_TO_KEY" ]; then
            if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$PATH_TO_KEY" "$TARGET_USER@$TARGET_HOST" "echo '  ✓ SSH connection OK'" 2>/dev/null; then
                echo "  ✓ SSH connection successful"
            else
                echo "  ✗ SSH connection failed"
            fi
        else
            echo "  ℹ SSH available (no key configured)"
        fi
    else
        echo "  ✗ SSH port not reachable"
    fi
else
    echo "  ✗ Ping failed (host unreachable)"
    echo "  Note: If running in WSL, check WSL networking config"
fi

echo ""
echo "=== Test complete ==="
