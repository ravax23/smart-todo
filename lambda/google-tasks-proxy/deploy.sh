#!/bin/bash

# 環境変数の設定
AWS_REGION="us-east-1"
FUNCTION_NAME="google-tasks-proxy"
API_NAME="google-tasks-api"
STAGE_NAME="prod"

# 現在のディレクトリを保存
CURRENT_DIR=$(pwd)

# Lambda関数のディレクトリに移動
cd "$(dirname "$0")"

# 依存関係のインストール
echo "Installing dependencies..."
npm install

# デプロイパッケージの作成
echo "Creating deployment package..."
zip -r deployment.zip index.js node_modules package.json

# AWS CLIが設定されているか確認
if ! aws sts get-caller-identity &> /dev/null; then
  echo "Error: AWS CLI is not configured. Please run 'aws configure' first."
  exit 1
fi

# AWS アカウントIDを取得
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# Lambda関数が存在するか確認
FUNCTION_EXISTS=$(aws lambda list-functions --region $AWS_REGION --query "Functions[?FunctionName=='$FUNCTION_NAME'].FunctionName" --output text)

if [ -z "$FUNCTION_EXISTS" ]; then
  # Lambda実行ロールが存在するか確認
  ROLE_EXISTS=$(aws iam list-roles --query "Roles[?RoleName=='lambda-execution-role'].RoleName" --output text)
  
  if [ -z "$ROLE_EXISTS" ]; then
    # Lambda実行ロールを作成
    echo "Creating Lambda execution role..."
    
    # 信頼ポリシードキュメントを作成
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    # ロールを作成
    aws iam create-role \
      --role-name lambda-execution-role \
      --assume-role-policy-document file://trust-policy.json
    
    # 基本的なLambda実行ポリシーをアタッチ
    aws iam attach-role-policy \
      --role-name lambda-execution-role \
      --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    # ロールが伝播するまで少し待機
    echo "Waiting for role to propagate..."
    sleep 10
  fi
  
  # Lambda実行ロールのARNを取得
  ROLE_ARN=$(aws iam get-role --role-name lambda-execution-role --query "Role.Arn" --output text)
  
  # Lambda関数の作成
  echo "Creating Lambda function..."
  aws lambda create-function \
    --region $AWS_REGION \
    --function-name $FUNCTION_NAME \
    --runtime nodejs16.x \
    --handler index.handler \
    --zip-file fileb://deployment.zip \
    --role $ROLE_ARN \
    --timeout 30 \
    --memory-size 256
else
  # Lambda関数の更新
  echo "Updating Lambda function..."
  aws lambda update-function-code \
    --region $AWS_REGION \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://deployment.zip
fi

# API Gatewayが存在するか確認
API_ID=$(aws apigateway get-rest-apis --region $AWS_REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
  # API Gatewayの作成
  echo "Creating API Gateway..."
  API_ID=$(aws apigateway create-rest-api \
    --region $AWS_REGION \
    --name $API_NAME \
    --endpoint-configuration types=REGIONAL \
    --query "id" --output text)
  
  # API Gatewayのルート設定
  ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --query "items[?path=='/'].id" --output text)
  
  # /api リソースの作成
  API_RESOURCE_ID=$(aws apigateway create-resource \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part "api" \
    --query "id" --output text)
  
  # /api/tasks リソースの作成
  TASKS_RESOURCE_ID=$(aws apigateway create-resource \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --parent-id $API_RESOURCE_ID \
    --path-part "tasks" \
    --query "id" --output text)
  
  # /api/tasks/{proxy+} リソースの作成
  PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --parent-id $TASKS_RESOURCE_ID \
    --path-part "{proxy+}" \
    --query "id" --output text)
  
  # ANY メソッドの設定
  aws apigateway put-method \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE
  
  # Lambda統合の設定
  aws apigateway put-integration \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$AWS_REGION:$AWS_ACCOUNT_ID:function:$FUNCTION_NAME/invocations
  
  # OPTIONSメソッドの設定（CORS用）
  aws apigateway put-method \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE
  
  # OPTIONSメソッドのレスポンス設定
  aws apigateway put-method-response \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Headers=true"
  
  # OPTIONSメソッドの統合設定
  aws apigateway put-integration \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\":200}"}'
  
  # OPTIONSメソッドの統合レスポンス設定
  aws apigateway put-integration-response \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin='*',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS',method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Requested-With'" \
    --response-templates '{"application/json":"{}"}'
  
  # Lambda関数にAPI Gatewayからの呼び出し許可を付与
  aws lambda add-permission \
    --region $AWS_REGION \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-any \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:$API_ID/*/*/*"
  
  # APIのデプロイ
  aws apigateway create-deployment \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME
else
  # APIの更新とデプロイ
  echo "Updating API Gateway..."
  aws apigateway create-deployment \
    --region $AWS_REGION \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME
fi

# API URLの表示
API_URL="https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/$STAGE_NAME"
echo "API deployed at: $API_URL"

# 環境変数ファイルの作成/更新
echo "REACT_APP_API_GATEWAY_URL=$API_URL" > ../../.env

# 一時ファイルの削除
rm -f trust-policy.json deployment.zip

# 元のディレクトリに戻る
cd "$CURRENT_DIR"

echo "Deployment completed successfully!"
