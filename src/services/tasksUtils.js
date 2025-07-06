/**
 * Google Tasks APIのレスポンスからスター状態を抽出する
 * @param {Object} taskData - タスクデータ
 * @returns {boolean} スター状態
 */
export function extractStarredStatus(taskData) {
  // 明示的なstarredプロパティがある場合はそれを使用
  if (taskData.starred !== undefined) {
    return !!taskData.starred;
  }
  
  // Google Tasks APIでは、優先度プロパティでスター状態を管理
  if (taskData.priority !== undefined) {
    const isStarred = taskData.priority === 'high';
    return isStarred;
  }
  
  // デフォルトはfalse
  return false;
}

/**
 * タスクデータにスター状態を設定する
 * Google Tasks APIではpriorityプロパティを使用してスター状態を表現する
 * 
 * 注意: Google Tasks APIには公式にstarredプロパティが存在しないため、
 * priorityプロパティを使用してスター状態を表現する必要がある
 * 
 * 参考: https://issuetracker.google.com/issues/236524523
 */
export function setStarredStatus(taskData, isStarred) {
  console.log(`Setting starred status to ${isStarred} for task:`, taskData.title || taskData.id);
  
  const updatedTask = { ...taskData };
  
  // Google Tasks APIに合わせて、priorityプロパティのみを使用
  if (isStarred) {
    updatedTask.priority = 'high';
  } else {
    updatedTask.priority = 'normal';
  }
  
  console.log('Updated task with star properties:', {
    title: updatedTask.title,
    priority: updatedTask.priority
  });
  
  return updatedTask;
}

/**
 * タスクリストIDを検証する
 * @param {string} id - 検証するタスクリストID
 * @returns {string} 検証済みのタスクリストID
 * @throws {Error} IDが無効な場合
 */
export function validateTaskListId(id) {
  // IDの型チェック
  if (id === undefined || id === null) {
    console.error('Task list ID is undefined or null:', id);
    throw new Error('Missing task list ID');
  }
  
  // 文字列に変換
  const strId = String(id);
  
  // 空文字チェック
  if (!strId.trim()) {
    console.error('Task list ID is empty after trimming:', id);
    throw new Error('Missing task list ID');
  }
  
  // 一時的なIDかどうかをチェック
  if (strId.trim().startsWith('temp-list-')) {
    console.error('Cannot use temporary task list ID:', id);
    throw new Error('Cannot update task list with temporary ID');
  }
  
  // 空白を除去して返す
  return strId.trim();
}

/**
 * タスクリストIDをURLエンコードする
 * @param {string} id - エンコードするタスクリストID
 * @returns {string} エンコードされたタスクリストID
 */
export function encodeTaskListId(id) {
  const validId = validateTaskListId(id);
  return encodeURIComponent(validId);
}
