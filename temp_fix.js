// getTasksWithFetch メソッドの修正
static async getTasksWithFetch(taskListId, token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // 開発環境ではプロキシを使用し、本番環境では直接APIを呼び出す
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = '/tasks-api'; // プロキシを使用
    } else {
      baseUrl = 'https://tasks.googleapis.com';
    }
    
    const url = `${baseUrl}/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`;
    const response = await fetch(url, { 
      headers,
      credentials: 'same-origin',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching tasks with fetch:', error);
    throw error;
  }
}

// createTaskWithFetch メソッドの修正
static async createTaskWithFetch(taskListId, taskData, token) {
  try {
    console.log('Creating task with fetch:', JSON.stringify(taskData, null, 2));
    
    // スター状態を適切なプロパティに設定
    let apiTaskData = { ...taskData };
    if ('starred' in taskData) {
      apiTaskData = setStarredStatus(apiTaskData, taskData.starred);
    }
    
    // Google Tasks APIの仕様に合わせてリクエストボディを構築
    const requestBody = {
      title: apiTaskData.title,
      notes: apiTaskData.notes || '',
      due: apiTaskData.due,
      status: apiTaskData.status || 'needsAction',
      // スター関連のプロパティを明示的に設定（priorityのみ）
      priority: apiTaskData.priority
    };
    
    console.log('Final fetch create request body:', JSON.stringify(requestBody, null, 2));
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // 開発環境ではプロキシを使用し、本番環境では直接APIを呼び出す
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = '/tasks-api'; // プロキシを使用
    } else {
      baseUrl = 'https://tasks.googleapis.com';
    }
    
    const url = `${baseUrl}/tasks/v1/lists/${taskListId}/tasks`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      credentials: 'same-origin',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    console.log('Fetch create response data:', JSON.stringify(responseData, null, 2));
    return responseData;
  } catch (error) {
    console.error('Error creating task with fetch:', error);
    throw error;
  }
}

// updateTaskWithFetch メソッドの修正
static async updateTaskWithFetch(taskListId, taskId, updates, token) {
  try {
    // 現在のタスクを取得
    const currentTask = await this.getTask(taskListId, taskId);
    console.log('Current task before update:', JSON.stringify(currentTask, null, 2));
    
    // 更新データをマージ
    const updatedTask = { ...currentTask };
    
    // 明示的に各フィールドを更新
    if (updates.title !== undefined) updatedTask.title = updates.title;
    if (updates.notes !== undefined) updatedTask.notes = updates.notes || '';
    
    // 期限の更新を明示的に処理
    if (updates.due !== undefined) {
      console.log(`Explicitly updating due date from ${currentTask.due} to ${updates.due}`);
      
      // Google Tasks APIの仕様に合わせて、dueプロパティを設定
      // RFC 3339形式の日付文字列である必要がある
      if (updates.due) {
        try {
          // 日付が有効かチェック
          const dueDate = new Date(updates.due);
          if (!isNaN(dueDate.getTime())) {
            // 有効な日付の場合、RFC 3339形式に変換
            updatedTask.due = dueDate.toISOString();
          } else {
            // 無効な日付の場合はそのまま使用
            updatedTask.due = updates.due;
          }
        } catch (dateError) {
          console.error('Error formatting due date:', dateError);
          // エラーが発生した場合はそのまま使用
          updatedTask.due = updates.due;
        }
      } else {
        // nullの場合は明示的にnullを設定
        updatedTask.due = null;
      }
    }
    
    if (updates.status !== undefined) updatedTask.status = updates.status;
    if (updates.completed !== undefined) updatedTask.completed = updates.completed;
    
    // スター状態を適切に設定
    if ('starred' in updates) {
      // スター状態を直接設定せず、priorityプロパティを使用
      updatedTask.priority = updates.starred ? 'high' : 'normal';
      console.log(`Setting priority to ${updatedTask.priority} based on starred=${updates.starred}`);
    }
    
    console.log('Updating task with fetch:', JSON.stringify(updatedTask, null, 2));
    
    // Google Tasks APIの仕様に合わせてリクエストボディを構築
    // 現在のタスクデータをそのまま使用し、必要なフィールドのみを更新
    const requestBody = updatedTask;
    
    console.log('Final fetch request body:', JSON.stringify(requestBody, null, 2));
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // 開発環境ではプロキシを使用し、本番環境では直接APIを呼び出す
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = '/tasks-api'; // プロキシを使用
    } else {
      baseUrl = 'https://tasks.googleapis.com';
    }
    
    const url = `${baseUrl}/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody),
      credentials: 'same-origin',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    console.log('Fetch response data:', JSON.stringify(responseData, null, 2));
    return responseData;
  } catch (error) {
    console.error('Error updating task with fetch:', error);
    throw error;
  }
}

// deleteTaskWithFetch メソッドの修正
static async deleteTaskWithFetch(taskListId, taskId, token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // 開発環境ではプロキシを使用し、本番環境では直接APIを呼び出す
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = '/tasks-api'; // プロキシを使用
    } else {
      baseUrl = 'https://tasks.googleapis.com';
    }
    
    const url = `${baseUrl}/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'same-origin',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting task with fetch:', error);
    throw error;
  }
}

// moveTaskWithFetch メソッドの修正
static async moveTaskWithFetch(taskListId, taskId, previousTaskId, token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // 開発環境ではプロキシを使用し、本番環境では直接APIを呼び出す
    let baseUrl = '';
    if (process.env.NODE_ENV === 'development') {
      baseUrl = '/tasks-api'; // プロキシを使用
    } else {
      baseUrl = 'https://tasks.googleapis.com';
    }
    
    let url = `${baseUrl}/tasks/v1/lists/${taskListId}/tasks/${taskId}/move`;
    if (previousTaskId) {
      url += `?previous=${previousTaskId}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error moving task with fetch:', error);
    throw error;
  }
}
