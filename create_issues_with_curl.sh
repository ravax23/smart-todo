#!/bin/bash

# トークンを設定
TOKEN="$1"
REPO="ravax23/todo-app"

if [ -z "$TOKEN" ]; then
  echo "使用方法: $0 <GitHubトークン>"
  exit 1
fi

# マイルストーン1を作成
echo "マイルストーン1を作成中..."
MILESTONE1_RESPONSE=$(curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @milestone1.json \
  "https://api.github.com/repos/$REPO/milestones")

MILESTONE1_NUMBER=$(echo $MILESTONE1_RESPONSE | grep -o '"number": [0-9]*' | head -1 | cut -d' ' -f2)

if [ -z "$MILESTONE1_NUMBER" ]; then
  echo "マイルストーン1の作成に失敗しました。レスポンス: $MILESTONE1_RESPONSE"
  exit 1
fi

echo "マイルストーン1が作成されました。番号: $MILESTONE1_NUMBER"

# マイルストーン2を作成
echo "マイルストーン2を作成中..."
MILESTONE2_RESPONSE=$(curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @milestone2.json \
  "https://api.github.com/repos/$REPO/milestones")

MILESTONE2_NUMBER=$(echo $MILESTONE2_RESPONSE | grep -o '"number": [0-9]*' | head -1 | cut -d' ' -f2)

if [ -z "$MILESTONE2_NUMBER" ]; then
  echo "マイルストーン2の作成に失敗しました。レスポンス: $MILESTONE2_RESPONSE"
  exit 1
fi

echo "マイルストーン2が作成されました。番号: $MILESTONE2_NUMBER"

# Issue 1を作成
echo "Issue 1を作成中..."
sed -i "s/\"milestone\": 1/\"milestone\": $MILESTONE1_NUMBER/g" issue1.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue1.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 2を作成
echo "Issue 2を作成中..."
sed -i "s/\"milestone\": 1/\"milestone\": $MILESTONE1_NUMBER/g" issue2.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue2.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 3を作成
echo "Issue 3を作成中..."
sed -i "s/\"milestone\": 1/\"milestone\": $MILESTONE1_NUMBER/g" issue3.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue3.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 4を作成
echo "Issue 4を作成中..."
sed -i "s/\"milestone\": 1/\"milestone\": $MILESTONE1_NUMBER/g" issue4.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue4.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 5を作成
echo "Issue 5を作成中..."
sed -i "s/\"milestone\": 1/\"milestone\": $MILESTONE1_NUMBER/g" issue5.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue5.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 6を作成
echo "Issue 6を作成中..."
sed -i "s/\"milestone\": 2/\"milestone\": $MILESTONE2_NUMBER/g" issue6.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue6.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 7を作成
echo "Issue 7を作成中..."
sed -i "s/\"milestone\": 2/\"milestone\": $MILESTONE2_NUMBER/g" issue7.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue7.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 8を作成
echo "Issue 8を作成中..."
sed -i "s/\"milestone\": 2/\"milestone\": $MILESTONE2_NUMBER/g" issue8.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue8.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 9を作成
echo "Issue 9を作成中..."
sed -i "s/\"milestone\": 2/\"milestone\": $MILESTONE2_NUMBER/g" issue9.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue9.json \
  "https://api.github.com/repos/$REPO/issues"

# Issue 10を作成
echo "Issue 10を作成中..."
sed -i "s/\"milestone\": 2/\"milestone\": $MILESTONE2_NUMBER/g" issue10.json
curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d @issue10.json \
  "https://api.github.com/repos/$REPO/issues"

echo "すべてのIssueが作成されました。"
