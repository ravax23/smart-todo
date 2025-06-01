#!/bin/bash

# GitHub認証情報とリポジトリ情報
GITHUB_TOKEN="ghp_your_token_here"  # 実際のトークンに置き換える必要があります
REPO_OWNER="ravax23"
REPO_NAME="todo-app"

# Issue 1: 完了タスク表示バグ
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/issues \
  -d '{
    "title": "完了タスクを表示バグ修正",
    "body": "### 概要\n\"完了タスクを表示\" にチェックがついていないにも関わらず、画面表示する際に完了タスクが表示される\n\n### 現状\n\"完了タスクを表示\" のチェックボックスがオフになっている状態でも、完了済みのタスクが画面に表示されてしまう\n\n### 期待される動作\n\"完了タスクを表示\" のチェックボックスがオフの場合は、完了済みのタスクが画面に表示されないようにする\n\n### 再現手順\n1. アプリケーションにログインする\n2. \"完了タスクを表示\" のチェックボックスがオフになっていることを確認する\n3. タスク一覧を確認すると、完了済みのタスクも表示されている\n\n### 環境\n- ブラウザ: Chrome, Firefox, Safari など\n- バージョン: 現行バージョン\n\n### 追加情報\n- 優先度: 中\n- タスク表示のフィルタリング機能に関するバグ",
    "labels": ["bug", "medium-priority"]
  }'

# Issue 2: 保存ボタンデザイン
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/issues \
  -d '{
    "title": "タスク保存ボタンのデザイン改善",
    "body": "### 概要\nタスク変更時に保存ボタンが文言なく白ボタンである\n\n### 現状\nタスクを編集する際、保存ボタンにテキストラベルがなく、単なる白いボタンとして表示されている\n\n### 期待される動作\n保存ボタンには「保存」などの明確なテキストラベルがあり、ユーザーが機能を識別しやすいデザインであるべき\n\n### 再現手順\n1. アプリケーションにログインする\n2. 任意のタスクの編集モードに入る\n3. 保存ボタンを確認すると、テキストラベルがなく白いボタンのみになっている\n\n### 環境\n- ブラウザ: すべてのブラウザで発生\n- バージョン: 現行バージョン\n\n### 追加情報\n- 優先度: 低\n- UI/UX改善に関する問題\n- アクセシビリティの観点からも、ボタンには適切なラベルが必要",
    "labels": ["enhancement", "low-priority", "ui-ux"]
  }'

# Issue 3: AI タスク自動化機能
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/issues \
  -d '{
    "title": "AI タスク自動化機能の実装",
    "body": "### 概要\n高度なタスク自動化機能の実装\n\n### 現状\n現在のアプリケーションでは、ユーザーが手動でタスクの優先順位付けや繰り返しタスクの設定を行う必要があります。\n\n### 期待される動作\nAIを活用した自動タスク管理機能により、以下の機能を提供します：\n- タスクの重要度と緊急度に基づく自動優先順位付け\n- 過去の行動パターンに基づく繰り返しタスクの自動生成\n- タスク完了予測と最適なスケジュール提案\n- 類似タスクの自動グループ化と効率化提案\n\n### 環境\n- フロントエンド: React\n- バックエンド: Node.js\n- AI/ML: TensorFlow.js または外部APIの活用検討\n\n### 追加情報\n- 機械学習モデルのトレーニングには、ユーザーの許可を得た上でのタスク完了パターンデータが必要\n- プライバシーに配慮した設計が必須\n- 有償プランの中核機能として位置づけ",
    "labels": ["enhancement", "feature-request", "high-priority"]
  }'

echo "GitHub Issuesの作成が完了しました。"
