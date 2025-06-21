/**
 * Google Tasks APIからDynamoDBへのデータ移行スクリプト
 */
import TasksService from '../services/tasksService';
import dynamoDbService from '../services/dynamoDbService';
import { getAccessToken } from '../services/authService';

/**
 * Google Tasks APIからDynamoDBへのデータ移行
 * @param {string} userId - ユーザーID
 * @returns {Promise<Object>} 移行結果
 */
export async function migrateTasksToDb(userId) {
  try {
    console.log('データ移行を開始します...');
    
    // アクセストークンの確認
    const token = getAccessToken();
    if (!token) {
      throw new Error('アクセストークンがありません。再度ログインしてください。');
    }
    
    // DynamoDBサービスにユーザーIDを設定
    dynamoDbService.setUserId(userId);
    
    // 1. タスクリストの移行
    console.log('タスクリストの移行を開始...');
    const taskLists = await TasksService.getTaskLists();
    
    if (!taskLists || !taskLists.items) {
      throw new Error('タスクリストの取得に失敗しました。');
    }
    
    console.log(`${taskLists.items.length}個のタスクリストを移行します。`);
    
    for (const list of taskLists.items) {
      console.log(`タスクリスト "${list.title}" を処理中...`);
      
      // タスクリストをDynamoDBに保存
      const listData = {
        listId: list.id,
        title: list.title,
        color: getRandomColor(), // リストの色をランダムに設定
        updatedAt: list.updated || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      await dynamoDbService.createTaskList(listData);
      
      // 2. タスクの移行
      console.log(`リスト "${list.title}" のタスクを移行中...`);
      const tasks = await TasksService.getTasks(list.id);
      
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
          const userListId = `${userId}#${list.id}`;
          
          // タスクをDynamoDBに保存
          const taskData = {
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
          
          await dynamoDbService.createTask(taskData);
        }
      } else {
        console.log(`リスト "${list.title}" にはタスクがありません。`);
      }
    }
    
    console.log('データ移行が完了しました！');
    return { success: true, message: 'データ移行が完了しました', stats: { lists: taskLists.items.length } };
  } catch (error) {
    console.error('データ移行中にエラーが発生しました:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ランダムな色を生成する補助関数
 * @returns {string} ランダムな色
 */
function getRandomColor() {
  const colors = ['blue', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'cyan'];
  return colors[Math.floor(Math.random() * colors.length)];
}
