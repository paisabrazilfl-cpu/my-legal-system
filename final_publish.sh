#!/bin/bash

echo "=== Legal Portal Auto Builder ==="

# Rebuild folder
if [ -d "legal-portal" ]; then
  echo "Folder legal-portal exists. Delete and rebuild? (y/n):"
  read answer
  if [ "$answer" != "y" ]; then
    exit
  fi
  rm -rf legal-portal
fi

mkdir legal-portal
cd legal-portal

# Create site structure
mkdir -p backend api db static css js auth encryption secure-messages legal-data audits logs

# Create homepage
cat <<EOF > index.html
<html>
<head><title>My Legal System</title></head>
<body>
<h1>Welcome to My Legal System Portal</h1>
<p>Secure Attorney Messaging</p>
</body>
</html>
EOF

# Git init + push

git init
git remote add origin https://github.com/paisabrazilfl-cpu/MY-LEGAL-SYSTEM.git
git add .
git commit -m "Initial automated build"
git branch -M main
git push -u origin main

