# Todo App

Google Todoカレンダーと連携するカスタムUIのTodoアプリケーション

## 機能

- Google認証によるログイン
- カテゴリ別タスク管理
- 日付別フィルタリング
- Google Calendarとの同期（開発中）

## セットアップ

### 前提条件

- Node.js 14.x以上
- npm 6.x以上
- Google Cloud Projectのアカウント

### インストール

1. リポジトリをクローン

```bash
git clone https://github.com/ravax23/todo-app.git
cd todo-app
```

2. 依存パッケージをインストール

```bash
npm install
```

3. 環境変数の設定

`.env.example`ファイルを`.env`にコピーし、必要な環境変数を設定します。

```bash
cp .env.example .env
```

`.env`ファイルを編集し、以下の変数を設定します：

- `REACT_APP_GOOGLE_CLIENT_ID`: Google Cloud ConsoleのOAuth 2.0クライアントID
- `REACT_APP_GOOGLE_API_KEY`: Google Cloud ConsoleのAPIキー（オプション）

### Google Cloud Projectの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. OAuth同意画面を設定
   - ユーザータイプ: 外部
   - アプリ名、ユーザーサポートメール、デベロッパーの連絡先情報を入力
   - スコープは`profile`と`email`を追加
4. 認証情報ページでOAuth 2.0クライアントIDを作成
   - アプリケーションタイプ: ウェブアプリケーション
   - 名前: Todo App
   - 承認済みのJavaScript生成元: `http://localhost:3000`（開発環境の場合）
   - 承認済みのリダイレクトURI: 不要
5. 作成されたクライアントIDを`.env`ファイルの`REACT_APP_GOOGLE_CLIENT_ID`に設定

### 開発サーバーの起動

```bash
npm start
```

アプリケーションは http://localhost:3000 で実行されます。

## 開発

### ブランチ戦略

- `main`: 本番環境用のブランチ
- `feature/*`: 新機能開発用のブランチ
- `bugfix/*`: バグ修正用のブランチ

### コミットメッセージの形式

```
[タイプ]: [説明]

[詳細な説明（オプション）]
```

タイプ:
- `Feature`: 新機能
- `Fix`: バグ修正
- `Docs`: ドキュメントのみの変更
- `Style`: コードの意味に影響しない変更（フォーマットなど）
- `Refactor`: バグ修正や機能追加ではないコード変更
- `Test`: テストの追加・修正
- `Chore`: ビルドプロセスやツールの変更

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
