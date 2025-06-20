/**
 * DynamoDBのサンプルデータ作成スクリプト
 * 
 * 使用方法:
 * 1. AWS CLIがインストールされていることを確認
 * 2. AWS認証情報が設定されていることを確認
 * 3. `node dynamodb-sample-data.js` を実行
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// サンプルユーザーID
const userId = 'user123';

// タスクリストのサンプルデータ
const taskLists = [
  {
    listId: 'list001',
    title: '仕事タスク',
    color: 'blue',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    listId: 'list002',
    title: '個人タスク',
    color: 'green',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// タスクのサンプルデータ
const tasks = [
  {
    taskId: 'task001',
    title: 'プレゼン資料の作成',
    notes: '経営会議用の資料を準備する',
    due: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    status: 'needsAction',
    starred: true,
    listId: 'list001',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    taskId: 'task002',
    title: '週次ミーティングの準備',
    notes: 'チームメンバーと進捗確認',
    due: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    status: 'needsAction',
    starred: false,
    listId: 'list001',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    taskId: 'task003',
    title: '買い物に行く',
    notes: '牛乳と卵を買う',
    due: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    status: 'needsAction',
    starred: true,
    listId: 'list002',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    taskId: 'task004',
    title: '運動する',
    notes: 'ジムでトレーニング',
    due: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    status: 'needsAction',
    starred: false,
    listId: 'list002',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// DynamoDBにデータを挿入する関数
async function insertData() {
  try {
    console.log('タスクリストのサンプルデータを挿入中...');
    for (const list of taskLists) {
      const command = `aws dynamodb put-item --table-name SmartTodo-TaskLists --item '${JSON.stringify({
        "userId": { "S": list.userId },
        "listId": { "S": list.listId },
        "title": { "S": list.title },
        "color": { "S": list.color },
        "createdAt": { "S": list.createdAt },
        "updatedAt": { "S": list.updatedAt }
      }).replace(/"/g, '\\"')}'`;
      
      await execPromise(command);
      console.log(`リスト "${list.title}" を挿入しました`);
    }

    console.log('\nタスクのサンプルデータを挿入中...');
    for (const task of tasks) {
      // GSIで使用する複合キーを作成
      const userListId = `${task.userId}#${task.listId}`;
      const starredDue = `${task.starred}#${task.due}`;
      
      const command = `aws dynamodb put-item --table-name SmartTodo-Tasks --item '${JSON.stringify({
        "userId": { "S": task.userId },
        "taskId": { "S": task.taskId },
        "title": { "S": task.title },
        "notes": { "S": task.notes },
        "due": { "S": task.due },
        "status": { "S": task.status },
        "starred": { "BOOL": task.starred },
        "listId": { "S": task.listId },
        "userListId": { "S": userListId },
        "starredDue": { "S": starredDue },
        "createdAt": { "S": task.createdAt },
        "updatedAt": { "S": task.updatedAt }
      }).replace(/"/g, '\\"')}'`;
      
      await execPromise(command);
      console.log(`タスク "${task.title}" を挿入しました`);
    }

    console.log('\nサンプルデータの挿入が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトの実行
insertData();
