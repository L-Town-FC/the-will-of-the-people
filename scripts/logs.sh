#!/bin/bash

CONTAINER_NAME=${CONTAINER_NAME:-the-will-of-the-people}
TAIL_LINES=${TAIL_LINES:-100}

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -t, --tail N    Show last N lines (default: 100)"
    echo "  -f, --follow    Follow log output (like tail -f)"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Environment:"
    echo "  CONTAINER_NAME    Container name (default: the-will-of-the-people)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Show last 100 lines"
    echo "  $0 -t 500             # Show last 500 lines"
    echo "  $0 -f                 # Follow logs"
    echo "  PI_HOST=192.168.1.1 $0 -f   # SSH to Pi and follow logs"
}

FOLLOW=""
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tail)
            TAIL_LINES="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW="-f"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

if [ -n "$PI_HOST" ]; then
    echo "Fetching logs from Raspberry Pi..."
    ssh -o StrictHostKeyChecking=no "$PI_USER@$PI_HOST" "docker logs --tail $TAIL_LINES $FOLLOW $CONTAINER_NAME"
elif [ -n "$EC2_HOST" ]; then
    echo "Fetching logs from AWS EC2..."
    ssh -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "docker logs --tail $TAIL_LINES $FOLLOW $CONTAINER_NAME"
else
    docker logs --tail $TAIL_LINES $FOLLOW $CONTAINER_NAME
fi
