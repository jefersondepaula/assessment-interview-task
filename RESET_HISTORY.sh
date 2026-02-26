#!/bin/bash
# Script to reset Git history and create a clean initial commit
# Run this from the project root directory

echo "⚠️  WARNING: This will delete all Git history!"
echo "Make sure you've saved any interviewer materials you need locally."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Removing Git history..."
rm -rf .git

echo "Step 2: Initializing new Git repository..."
git init

echo "Step 3: Adding all files..."
git add .

echo "Step 4: Creating initial commit..."
git commit -m "Initial commit"

echo ""
echo "✅ Local Git history has been reset!"
echo ""
echo "Next steps:"
echo "1. Make sure your GitHub repo is ready (public/private, description, etc.)"
echo "2. Set your remote: git remote add origin https://github.com/USERNAME/REPO.git"
echo "3. Force push: git push -u origin master --force"
echo ""
echo "⚠️  Note: If you already have a GitHub repo, the --force will overwrite it!"
