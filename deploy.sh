#!/bin/bash

# SmartTodo App Deployment Script
# AWS S3 + CloudFront deployment

set -e

echo "🚀 Starting SmartTodo App deployment..."

# Configuration
BUCKET_NAME="smarttodo-app-static-hosting"
CLOUDFRONT_DISTRIBUTION_ID="E2E6NVYTYW4IE8"

# Build the React app
echo "📦 Building React application..."
npm run build

# Sync files to S3
echo "📤 Uploading files to S3..."
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is available at: https://d1yqrgdl6vrr4q.cloudfront.net"
