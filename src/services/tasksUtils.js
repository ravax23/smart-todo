/**
 * Google Tasks APIのレスポンスからスター状態を抽出する
 * Google Tasks APIでは、スターの情報が異なるプロパティに格納されている可能性がある
 */
export function extractStarredStatus(taskData) {
  // Google Tasks APIのレスポンスを詳細に調査
  console.log('Extracting starred status from:', JSON.stringify(taskData, null, 2));
  
  // 可能性のあるプロパティをチェック
  if (taskData.starred !== undefined) {
    console.log(`  Found 'starred' property: ${taskData.starred}`);
    return taskData.starred;
  }
  
  // Google Tasks APIでは、優先度が別のプロパティに格納されている可能性がある
  if (taskData.priority !== undefined) {
    const isStarred = taskData.priority === 'high';
    console.log(`  Found 'priority' property: ${taskData.priority} -> isStarred: ${isStarred}`);
    return isStarred;
  }
  
  // その他の可能性のあるプロパティをチェック
  if (taskData.flagged !== undefined) {
    console.log(`  Found 'flagged' property: ${taskData.flagged}`);
    return taskData.flagged;
  }
  
  console.log('  No star property found, returning false');
  // デフォルトはfalse
  return false;
}

/**
 * タスクデータにスター状態を設定する
 * Google Tasks APIで認識される可能性のあるすべてのプロパティを設定
 */
export function setStarredStatus(taskData, isStarred) {
  console.log(`Setting starred status to ${isStarred} for task:`, taskData.title || taskData.id);
  
  const updatedTask = { ...taskData };
  
  // スター状態を設定
  updatedTask.starred = isStarred;
  
  // 優先度プロパティも設定（Google Tasks APIで使用される可能性がある）
  updatedTask.priority = isStarred ? 'high' : 'normal';
  
  console.log('Updated task with star properties:', {
    title: updatedTask.title,
    starred: updatedTask.starred,
    priority: updatedTask.priority
  });
  
  return updatedTask;
}
