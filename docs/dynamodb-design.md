# DynamoDB設計ドキュメント

## 概要

SmartTodoアプリケーションのデータ管理をAWS DynamoDBで実装するための設計ドキュメントです。このドキュメントでは、テーブル設計、アクセスパターン、インデックス設計について説明します。

## テーブル設計

### 1. SmartTodo-TaskLists テーブル

タスクリスト（カテゴリ）を管理するテーブルです。

**主キー構成:**
- パーティションキー: `userId` (String)
- ソートキー: `listId` (String)

**属性:**
- `userId`: ユーザーID
- `listId`: リストID
- `title`: リストのタイトル
- `color`: リストの色
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

### 2. SmartTodo-Tasks テーブル

タスクを管理するテーブルです。

**主キー構成:**
- パーティションキー: `userId` (String)
- ソートキー: `taskId` (String)

**属性:**
- `userId`: ユーザーID
- `taskId`: タスクID
- `title`: タスクのタイトル
- `notes`: タスクの詳細
- `due`: 期限日時
- `status`: タスクの状態（"needsAction" または "completed"）
- `starred`: スター状態（Boolean）
- `listId`: 所属するリストID
- `userListId`: ユーザーIDとリストIDの複合キー（GSI用）
- `starredDue`: スター状態と期限の複合キー（GSI用）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

## グローバルセカンダリインデックス (GSI)

### 1. UserListIndex

特定のリストに属するタスクを取得するためのインデックスです。

**キー構成:**
- パーティションキー: `userListId` (String)
- ソートキー: `due` (String)

**用途:**
- 特定のユーザーの特定のリストに属するタスクを期限順に取得

### 2. StarredTasksIndex

スター付きタスクを取得するためのインデックスです。

**キー構成:**
- パーティションキー: `userId` (String)
- ソートキー: `starredDue` (String)

**用途:**
- 特定のユーザーのスター付きタスクを期限順に取得

### 3. DueDateIndex

タスクを期限順に取得するためのインデックスです。

**キー構成:**
- パーティションキー: `userId` (String)
- ソートキー: `due` (String)

**用途:**
- 特定のユーザーのすべてのタスクを期限順に取得

## アクセスパターン

1. **ユーザーのすべてのタスクリストを取得**
   ```
   Query on SmartTodo-TaskLists
   KeyConditionExpression: userId = :userId
   ```

2. **特定のタスクリストを取得**
   ```
   GetItem on SmartTodo-TaskLists
   Key: { userId, listId }
   ```

3. **ユーザーのすべてのタスクを取得**
   ```
   Query on SmartTodo-Tasks
   KeyConditionExpression: userId = :userId
   ```

4. **特定のリストに属するタスクを取得**
   ```
   Query on SmartTodo-Tasks using UserListIndex
   KeyConditionExpression: userListId = :userListId
   ```

5. **スター付きタスクを取得**
   ```
   Query on SmartTodo-Tasks using StarredTasksIndex
   KeyConditionExpression: userId = :userId AND begins_with(starredDue, :starred)
   ExpressionAttributeValues: { ':starred': 'true#' }
   ```

6. **期限順にタスクを取得**
   ```
   Query on SmartTodo-Tasks using DueDateIndex
   KeyConditionExpression: userId = :userId
   ```

7. **特定のタスクを取得**
   ```
   GetItem on SmartTodo-Tasks
   Key: { userId, taskId }
   ```

## データ形式の例

### タスクリストの例

```json
{
  "userId": "user123",
  "listId": "list001",
  "title": "仕事タスク",
  "color": "blue",
  "createdAt": "2025-06-20T09:00:00.000Z",
  "updatedAt": "2025-06-20T09:00:00.000Z"
}
```

### タスクの例

```json
{
  "userId": "user123",
  "taskId": "task001",
  "title": "プレゼン資料の作成",
  "notes": "経営会議用の資料を準備する",
  "due": "2025-06-21T23:59:59.999Z",
  "status": "needsAction",
  "starred": true,
  "listId": "list001",
  "userListId": "user123#list001",
  "starredDue": "true#2025-06-21T23:59:59.999Z",
  "createdAt": "2025-06-20T09:10:00.000Z",
  "updatedAt": "2025-06-20T09:10:00.000Z"
}
```

## 複合キーの形式

1. **userListId**: `${userId}#${listId}`
   - 例: `user123#list001`

2. **starredDue**: `${starred}#${due}`
   - 例: `true#2025-06-21T23:59:59.999Z`

## 注意事項

1. **日付形式**: すべての日時はISO 8601形式（`YYYY-MM-DDTHH:mm:ss.sssZ`）で保存
2. **スター状態**: Boolean型で保存（`true` または `false`）
3. **タスク状態**: String型で保存（`needsAction` または `completed`）
4. **複合キー**: GSIで使用する複合キーは文字列連結で作成

## 移行戦略

Google Tasks APIからDynamoDBへの移行は以下の手順で行います：

1. **デュアルライト方式**: 一定期間、Google Tasks APIとDynamoDBの両方にデータを書き込む
2. **読み取り移行**: UIからの読み取りをDynamoDBに切り替える
3. **書き込み移行**: 書き込み操作をDynamoDBのみに切り替える
4. **データ同期の終了**: Google Tasks APIとの同期を停止
