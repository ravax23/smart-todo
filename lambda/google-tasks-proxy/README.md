# Google Tasks API Proxy

Google Tasks APIをラップするAWS Lambda + API Gateway実装です。

## 概要

このプロキシは、クライアントアプリケーションからのリクエストを受け取り、Google Tasks APIに転送します。これにより、CORSの問題を解決し、クライアントアプリケーションとGoogle Tasks APIの間の通信を安定させます。

## デプロイ方法

### 前提条件

- AWS CLIがインストールされていること
- AWS CLIが設定されていること（`aws configure`で設定）
- Node.jsとnpmがインストールされていること

### デプロイ手順

1. このディレクトリに移動します：

```bash
cd lambda/google-tasks-proxy
```

2. デプロイスクリプトを実行します：

```bash
./deploy.sh
```

3. デプロイが完了すると、API GatewayのURLが表示されます。このURLは自動的に`.env`ファイルに保存されます。

## 使用方法

デプロイ後、クライアントアプリケーションは以下のエンドポイントを使用してGoogle Tasks APIにアクセスできます：

```
https://{api-id}.execute-api.{region}.amazonaws.com/prod/api/tasks/{path}
```

例えば、タスクリストを取得するには：

```
GET https://{api-id}.execute-api.{region}.amazonaws.com/prod/api/tasks/tasks/v1/users/@me/lists
```

## セキュリティ

このプロキシは、クライアントアプリケーションから送信された認証トークンをそのままGoogle Tasks APIに転送します。トークンはLambda関数内で保存されず、ログにも記録されません。

## トラブルシューティング

デプロイや実行中に問題が発生した場合は、以下を確認してください：

1. AWS CLIが正しく設定されているか
2. Lambda関数のログ（AWS CloudWatch Logs）
3. API GatewayのログとCORS設定
4. クライアントアプリケーションの環境変数が正しく設定されているか

## カスタマイズ

必要に応じて、以下の部分をカスタマイズできます：

- `index.js`: Lambda関数のコード
- `deploy.sh`: デプロイスクリプト（リージョンやステージ名など）
- `api-gateway-config.yaml`: API Gatewayの設定
