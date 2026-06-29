#!/bin/bash
# Auto-pull and redeploy when the remote branch has new commits.
# Placed at /opt/bachelor-V2/deploy/auto-pull.sh on the VPS.
# Scheduled via cron to run every minute.

set -euo pipefail

REPO_DIR="/opt/bachelor-V2"
BRANCH="main"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] auto-pull:"

cd "$REPO_DIR"

# Fetch latest refs without modifying working tree
git fetch origin "$BRANCH" --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0  # Nothing to do
fi

echo "$LOG_PREFIX new commits detected ($LOCAL -> $REMOTE), deploying..."

git pull origin "$BRANCH" --ff-only --quiet

# Rebuild only containers whose context changed; restart all
docker compose up --build -d --remove-orphans

echo "$LOG_PREFIX deployment complete."
