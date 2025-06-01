/**
 * Google Tasks APIのレスポンスからスター状態を抽出する
 * Google Tasks APIでは、スターの情報はpriorityプロパティに格納されている
 */
export function extractStarredStatus(taskData) {
  // Google Tasks APIのレスポンスを詳細に調査
  console.log('Extracting starred status from:', JSON.stringify(taskData, null, 2));
  
  // Google Tasks APIでは、優先度プロパティでスター状態を管理
  if (taskData.priority !== undefined) {
    const isStarred = taskData.priority === 'high';
    console.log(`  Found 'priority' property: ${taskData.priority} -> isStarred: ${isStarred}`);
    return isStarred;
  }
  
  console.log('  No priority property found, returning false');
  // デフォルトはfalse
  return false;
}

/**
 * タスクデータにスター状態を設定する
 * Google Tasks APIではpriorityプロパティを使用してスター状態を表現する
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
