#!/bin/bash

# マイルストーン1のJSONを作成
cat > milestone1.json << EOF
{
  "title": "基本機能実装",
  "state": "open",
  "description": "基本的なTodo管理機能とGoogle Calendar APIとの連携",
  "due_on": "$(date -d '+2 weeks' '+%Y-%m-%dT%H:%M:%SZ')"
}
EOF

# マイルストーン2のJSONを作成
cat > milestone2.json << EOF
{
  "title": "UI改善とモバイル対応",
  "state": "open",
  "description": "UIの改善とレスポンシブデザインの実装",
  "due_on": "$(date -d '+4 weeks' '+%Y-%m-%dT%H:%M:%SZ')"
}
EOF

# Issue 1のJSONを作成
cat > issue1.json << EOF
{
  "title": "プロジェクト設定と基本構造",
  "body": "## 説明\nプロジェクトの初期設定、ディレクトリ構造の作成、必要なライブラリのインストール\n\n## タスク\n- [ ] Reactプロジェクトの初期化\n- [ ] 必要なパッケージのインストール\n- [ ] 基本的なディレクトリ構造の作成\n- [ ] ESLintとPrettierの設定",
  "milestone": 1
}
EOF

# Issue 2のJSONを作成
cat > issue2.json << EOF
{
  "title": "Google OAuth認証の実装",
  "body": "## 説明\nGoogle APIとの連携のための認証機能の実装\n\n## タスク\n- [ ] Google Cloud Projectの作成\n- [ ] OAuth 2.0クライアントIDの取得\n- [ ] ログイン/ログアウト機能の実装\n- [ ] 認証状態の管理",
  "milestone": 1
}
EOF

# Issue 3のJSONを作成
cat > issue3.json << EOF
{
  "title": "Google Calendar APIとの連携",
  "body": "## 説明\nGoogle Calendar APIを使用してTodoデータの取得と更新\n\n## タスク\n- [ ] Calendar APIの呼び出し機能の実装\n- [ ] Todoリストの取得機能\n- [ ] Todoの作成、更新、削除機能\n- [ ] APIレスポンスのエラーハンドリング",
  "milestone": 1
}
EOF

# Issue 4のJSONを作成
cat > issue4.json << EOF
{
  "title": "Todoリスト表示UI",
  "body": "## 説明\nTodoリストを表示するUIコンポーネントの実装\n\n## タスク\n- [ ] リスト表示コンポーネントの作成\n- [ ] フィルタリング機能の実装\n- [ ] ソート機能の実装\n- [ ] 完了/未完了の表示切り替え",
  "milestone": 1
}
EOF

# Issue 5のJSONを作成
cat > issue5.json << EOF
{
  "title": "Todo編集機能",
  "body": "## 説明\nTodoの追加、編集、削除機能のUI実装\n\n## タスク\n- [ ] 新規Todo追加フォームの作成\n- [ ] Todo編集モーダルの実装\n- [ ] 削除確認ダイアログの実装\n- [ ] 入力バリデーションの実装",
  "milestone": 1
}
EOF

# Issue 6のJSONを作成
cat > issue6.json << EOF
{
  "title": "UIデザインの改善",
  "body": "## 説明\nユーザビリティとデザインの改善\n\n## タスク\n- [ ] カラースキームの設定\n- [ ] アイコンとビジュアル要素の追加\n- [ ] アニメーションの追加\n- [ ] ダークモード対応",
  "milestone": 2
}
EOF

# Issue 7のJSONを作成
cat > issue7.json << EOF
{
  "title": "レスポンシブデザイン",
  "body": "## 説明\nモバイルデバイス対応のレスポンシブデザイン実装\n\n## タスク\n- [ ] モバイルレイアウトの設計\n- [ ] メディアクエリの実装\n- [ ] タッチ操作の最適化\n- [ ] モバイル表示のテスト",
  "milestone": 2
}
EOF

# Issue 8のJSONを作成
cat > issue8.json << EOF
{
  "title": "オフライン対応",
  "body": "## 説明\nオフライン時の動作とデータ同期の実装\n\n## タスク\n- [ ] ローカルストレージの実装\n- [ ] オフライン状態の検出\n- [ ] データ同期機能の実装\n- [ ] 競合解決の仕組み",
  "milestone": 2
}
EOF

# Issue 9のJSONを作成
cat > issue9.json << EOF
{
  "title": "パフォーマンス最適化",
  "body": "## 説明\nアプリケーションのパフォーマンス改善\n\n## タスク\n- [ ] コンポーネントの最適化\n- [ ] メモ化の実装\n- [ ] バンドルサイズの最適化\n- [ ] レンダリングパフォーマンスの改善",
  "milestone": 2
}
EOF

# Issue 10のJSONを作成
cat > issue10.json << EOF
{
  "title": "テストとデバッグ",
  "body": "## 説明\nユニットテストとE2Eテストの実装\n\n## タスク\n- [ ] ユニットテストの作成\n- [ ] 統合テストの作成\n- [ ] E2Eテストの実装\n- [ ] バグ修正とリファクタリング",
  "milestone": 2
}
EOF

echo "Issue作成用のJSONファイルが生成されました。"
