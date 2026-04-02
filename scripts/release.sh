#!/bin/bash
set -e

# Prompt Composer Release Script
# Usage: ./scripts/release.sh

cd "$(dirname "$0")/.."

# Get current version
CURRENT=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT"
echo ""

# Ask for new version
read -p "New version (e.g., 1.1.0): " VERSION
if [ -z "$VERSION" ]; then
  echo "No version provided. Aborting."
  exit 1
fi

# Ask for change description
read -p "What changed? (one line): " DESCRIPTION
if [ -z "$DESCRIPTION" ]; then
  echo "No description provided. Aborting."
  exit 1
fi

echo ""
echo "Will release v$VERSION: $DESCRIPTION"
read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Aborting."
  exit 1
fi

# 1. Bump version in package.json
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
echo "✓ Bumped version to $VERSION"

# 2. Commit
git add -A
git commit -m "v$VERSION: $DESCRIPTION"
echo "✓ Committed"

# 3. Build
echo "Building .dmg (this takes a minute)..."
npm run package:mac
echo "✓ Built"

# 4. Tag and push
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"
echo "✓ Pushed to GitHub"

# 5. Find the .dmg
DMG=$(find dist -name "*.dmg" -type f | head -1)
if [ -z "$DMG" ]; then
  echo "⚠ No .dmg found in dist/. Create the GitHub Release manually."
  exit 1
fi

# 6. Create GitHub Release
gh release create "v$VERSION" "$DMG" \
  --title "Prompt Composer v$VERSION" \
  --notes "**$DESCRIPTION**

Download the \`.dmg\` below, open it, and drag Prompt Composer to Applications.

If you already have Prompt Composer installed, this replaces the old version."

echo ""
echo "✓ Release created: https://github.com/BillyIntuit/prompt-composer/releases/tag/v$VERSION"
echo "Done!"
