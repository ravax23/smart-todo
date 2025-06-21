/**
 * Google Tasks APIからDynamoDBへのデータ移行を実行するスクリプト
 */
const AWS = require('aws-sdk');
const axios = require('axios');

// AWS設定
AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// テーブル名
const TASK_LISTS_TABLE = 'SmartTodo-TaskLists';
const TASKS_TABLE = 'SmartTodo-Tasks';

// アクセストークン（実行時に引数から取得）
const ACCESS_TOKEN = process.argv[2];
if (!ACCESS_TOKEN) {
  console.error('アクセストークンが指定されていません。');
  console.error('使用方法: node migrate-data.js <アクセストークン>');
  process.exit(1);
}

// ユーザーID（実行時に引数から取得、指定がなければメールアドレスを使用）
const USER_ID = process.argv[3] || 'user@example.com';

/**
 * Google Tasks APIからタスクリストを取得
 */
async function getTaskLists() {
  try {
    const response = await axios.get('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('タスクリストの取得に失敗しました:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Google Tasks APIからタスクを取得
 */
async function getTasks(taskListId) {
  try {
    const response = await axios.get(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`タスクの取得に失敗しました (リストID: ${taskListId}):`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * DynamoDBにタスクリストを保存
 */
async function saveTaskList(listData) {
  try {
    await dynamodb.put({
      TableName: TASK_LISTS_TABLE,
      Item: listData
    }).promise();
    
    console.log(`タスクリスト "${listData.title}" を保存しました`);
  } catch (error) {
    console.error(`タスクリストの保存に失敗しました (ID: ${listData.listId}):`, error);
    throw error;
  }
}

/**
 * DynamoDBにタスクを保存
 */
async function saveTask(taskData) {
  try {
    await dynamodb.put({
      TableName: TASKS_TABLE,
      Item: taskData
    }).promise();
    
    console.log(`タスク "${taskData.title}" を保存しました`);
  } catch (error) {
    console.error(`タスクの保存に失敗しました (ID: ${taskData.taskId}):`, error);
    throw error;
  }
}

/**
 * ランダムな色を生成
 */
function getRandomColor() {
  const colors = ['blue', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'cyan'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * データ移行を実行
 */
async function migrateData() {
  try {
    console.log('データ移行を開始します...');
    console.log(`ユーザーID: ${USER_ID}`);
    
    // 1. タスクリストの移行
    console.log('タスクリストの移行を開始...');
    const taskLists = await getTaskLists();
    
    if (!taskLists || !taskLists.items) {
      throw new Error('タスクリストの取得に失敗しました。');
    }
    
    console.log(`${taskLists.items.length}個のタスクリストを移行します。`);
    
    for (const list of taskLists.items) {
      console.log(`タスクリスト "${list.title}" を処理中...`);
      
      // タスクリストをDynamoDBに保存
      const listData = {
        userId: USER_ID,
        listId: list.id,
        title: list.title,
        color: getRandomColor(),
        updatedAt: list.updated || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      await saveTaskList(listData);
      
      // 2. タスクの移行
      console.log(`リスト "${list.title}" のタスクを移行中...`);
      const tasks = await getTasks(list.id);
      
      if (tasks && tasks.items) {
        console.log(`${tasks.items.length}個のタスクを移行します。`);
        
        for (const task of tasks.items) {
          console.log(`タスク "${task.title}" を処理中...`);
          
          // スター状態を判定（Google Tasks APIではpriorityフィールドを使用）
          const starred = task.priority === 'high';
          
          // 期限日時の処理
          let due = task.due;
          if (due) {
            // Google Tasks APIの日付形式を調整（時間部分がない場合は23:59:59を追加）
            if (due.indexOf('T') === -1) {
              due = `${due}T23:59:59.999Z`;
            }
          }
          
          // スター状態と期限の複合キーを作成
          const starredDue = `${!!starred}#${due || '9999-12-31T23:59:59.999Z'}`;
          
          // ユーザーIDとリストIDの複合キーを作成
          const userListId = `${USER_ID}#${list.id}`;
          
          // タスクをDynamoDBに保存
          const taskData = {
            userId: USER_ID,
            taskId: task.id,
            title: task.title || '',
            notes: task.notes || '',
            due: due || null,
            status: task.status || 'needsAction',
            starred: starred,
            position: task.position || '',
            completedAt: task.completed || null,
            listId: list.id,
            userListId: userListId,
            starredDue: starredDue,
            updatedAt: task.updated || new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          
          await saveTask(taskData);
        }
      } else {
        console.log(`リスト "${list.title}" にはタスクがありません。`);
      }
    }
    
    console.log('データ移行が完了しました！');
    console.log(`移行されたリスト数: ${taskLists.items.length}`);
  } catch (error) {
    console.error('データ移行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// 移行を実行
migrateData();
