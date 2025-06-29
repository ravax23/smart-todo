#!/bin/bash

# SmartTodo App Deployment Script for AWS Amplify
# Deploys to feature-issue31-mobile-support branch

set -e

echo "🚀 Starting SmartTodo App deployment to AWS Amplify..."

# Configuration
AMPLIFY_APP_ID="d2faejhttni566"
BRANCH_NAME="feature-issue31-mobile-support"

# Build the React app
echo "📦 Building React application..."
npm run build

# Create a zip file of the build directory
echo "📦 Creating zip file of build directory..."
cd build
zip -r ../deploy.zip .
cd ..

# Deploy to AWS Amplify
echo "📤 Deploying to AWS Amplify..."
aws amplify start-deployment --app-id $AMPLIFY_APP_ID --branch-name $BRANCH_NAME --source-url fileb://$(pwd)/deploy.zip

echo "✅ Deployment initiated successfully!"
echo "🌐 Your app will be available at: https://feature-issue31-mobile-support.d2faejhttni566.amplifyapp.com/"
