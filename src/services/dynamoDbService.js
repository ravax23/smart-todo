/**
 * DynamoDB操作用のサービスクラス
 * AWS SDK v3を使用
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';

// AWS設定
const REGION = 'us-east-1';
const TASK_LISTS_TABLE = 'SmartTodo-TaskLists';
const TASKS_TABLE = 'SmartTodo-Tasks';

class DynamoDbService {
  constructor() {
    // DynamoDBクライアントの初期化
    this.client = new DynamoDBClient({ region: REGION });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  /**
   * ユーザーIDを設定
   * @param {string} userId - ユーザーID
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * ユーザーのすべてのタスクリストを取得
   * @returns {Promise<Array>} タスクリストの配列
   */
  async getTaskLists() {
    try {
      const command = new QueryCommand({
        TableName: TASK_LISTS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': this.userId
        }
      });

      const response = await this.docClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('Error fetching task lists:', error);
      throw error;
    }
  }

  /**
   * 特定のタスクリストを取得
   * @param {string} listId - タスクリストID
   * @returns {Promise<Object>} タスクリスト
   */
  async getTaskList(listId) {
    try {
      const command = new GetCommand({
        TableName: TASK_LISTS_TABLE,
        Key: {
          userId: this.userId,
          listId
        }
      });

      const response = await this.docClient.send(command);
      return response.Item;
    } catch (error) {
      console.error(`Error fetching task list ${listId}:`, error);
      throw error;
    }
  }

  /**
   * タスクリストを作成
   * @param {Object} taskList - タスクリストデータ
   * @returns {Promise<Object>} 作成されたタスクリスト
   */
  async createTaskList(taskList) {
    try {
      const timestamp = new Date().toISOString();
      const newTaskList = {
        userId: this.userId,
        listId: `list_${Date.now()}`,
        title: taskList.title,
        color: taskList.color || 'blue',
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const command = new PutCommand({
        TableName: TASK_LISTS_TABLE,
        Item: newTaskList
      });

      await this.docClient.send(command);
      return newTaskList;
    } catch (error) {
      console.error('Error creating task list:', error);
      throw error;
    }
  }

  /**
   * タスクリストを更新
   * @param {string} listId - タスクリストID
   * @param {Object} updates - 更新データ
   * @returns {Promise<Object>} 更新されたタスクリスト
   */
  async updateTaskList(listId, updates) {
    try {
      const timestamp = new Date().toISOString();
      
      // 更新式とパラメータを構築
      let updateExpression = 'set updatedAt = :updatedAt';
      const expressionAttributeValues = {
        ':updatedAt': timestamp
      };

      if (updates.title) {
        updateExpression += ', title = :title';
        expressionAttributeValues[':title'] = updates.title;
      }

      if (updates.color) {
        updateExpression += ', color = :color';
        expressionAttributeValues[':color'] = updates.color;
      }

      const command = new UpdateCommand({
        TableName: TASK_LISTS_TABLE,
        Key: {
          userId: this.userId,
          listId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const response = await this.docClient.send(command);
      return response.Attributes;
    } catch (error) {
      console.error(`Error updating task list ${listId}:`, error);
      throw error;
    }
  }

  /**
   * タスクリストを削除
   * @param {string} listId - タスクリストID
   * @returns {Promise<void>}
   */
  async deleteTaskList(listId) {
    try {
      // まず、このリストに属するすべてのタスクを取得
      const tasksInList = await this.getTasksByList(listId);
      
      // タスクを削除
      for (const task of tasksInList) {
        await this.deleteTask(task.taskId);
      }
      
      // リストを削除
      const command = new DeleteCommand({
        TableName: TASK_LISTS_TABLE,
        Key: {
          userId: this.userId,
          listId
        }
      });

      await this.docClient.send(command);
    } catch (error) {
      console.error(`Error deleting task list ${listId}:`, error);
      throw error;
    }
  }

  /**
   * ユーザーのすべてのタスクを取得
   * @returns {Promise<Array>} タスクの配列
   */
  async getTasks() {
    try {
      const command = new QueryCommand({
        TableName: TASKS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': this.userId
        }
      });

      const response = await this.docClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  /**
   * 特定のリストに属するタスクを取得
   * @param {string} listId - タスクリストID
   * @returns {Promise<Array>} タスクの配列
   */
  async getTasksByList(listId) {
    try {
      const userListId = `${this.userId}#${listId}`;
      
      const command = new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: 'UserListIndex',
        KeyConditionExpression: 'userListId = :userListId',
        ExpressionAttributeValues: {
          ':userListId': userListId
        }
      });

      const response = await this.docClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error(`Error fetching tasks for list ${listId}:`, error);
      throw error;
    }
  }

  /**
   * スター付きタスクを取得
   * @returns {Promise<Array>} スター付きタスクの配列
   */
  async getStarredTasks() {
    try {
      const command = new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: 'StarredTasksIndex',
        KeyConditionExpression: 'userId = :userId AND begins_with(starredDue, :starred)',
        ExpressionAttributeValues: {
          ':userId': this.userId,
          ':starred': 'true#'
        }
      });

      const response = await this.docClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('Error fetching starred tasks:', error);
      throw error;
    }
  }

  /**
   * 期限順にタスクを取得
   * @returns {Promise<Array>} 期限順のタスクの配列
   */
  async getTasksByDueDate() {
    try {
      const command = new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: 'DueDateIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': this.userId
        }
      });

      const response = await this.docClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('Error fetching tasks by due date:', error);
      throw error;
    }
  }

  /**
   * 特定のタスクを取得
   * @param {string} taskId - タスクID
   * @returns {Promise<Object>} タスク
   */
  async getTask(taskId) {
    try {
      const command = new GetCommand({
        TableName: TASKS_TABLE,
        Key: {
          userId: this.userId,
          taskId
        }
      });

      const response = await this.docClient.send(command);
      return response.Item;
    } catch (error) {
      console.error(`Error fetching task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * タスクを作成
   * @param {Object} task - タスクデータ
   * @param {string} listId - タスクリストID
   * @returns {Promise<Object>} 作成されたタスク
   */
  async createTask(task, listId) {
    try {
      const timestamp = new Date().toISOString();
      const taskId = `task_${Date.now()}`;
      const userListId = `${this.userId}#${listId}`;
      const starredDue = `${!!task.starred}#${task.due || '9999-12-31T23:59:59.999Z'}`;
      
      const newTask = {
        userId: this.userId,
        taskId,
        title: task.title,
        notes: task.notes || '',
        due: task.due || null,
        status: task.status || 'needsAction',
        starred: !!task.starred,
        listId,
        userListId,
        starredDue,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const command = new PutCommand({
        TableName: TASKS_TABLE,
        Item: newTask
      });

      await this.docClient.send(command);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * タスクを更新
   * @param {string} taskId - タスクID
   * @param {Object} updates - 更新データ
   * @returns {Promise<Object>} 更新されたタスク
   */
  async updateTask(taskId, updates) {
    try {
      // 現在のタスクを取得
      const currentTask = await this.getTask(taskId);
      if (!currentTask) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      const timestamp = new Date().toISOString();
      
      // 更新式とパラメータを構築
      let updateExpression = 'set updatedAt = :updatedAt';
      const expressionAttributeValues = {
        ':updatedAt': timestamp
      };

      // 各フィールドの更新
      if (updates.title !== undefined) {
        updateExpression += ', title = :title';
        expressionAttributeValues[':title'] = updates.title;
      }
      
      if (updates.notes !== undefined) {
        updateExpression += ', notes = :notes';
        expressionAttributeValues[':notes'] = updates.notes || '';
      }
      
      if (updates.due !== undefined) {
        updateExpression += ', due = :due';
        expressionAttributeValues[':due'] = updates.due;
      }
      
      if (updates.status !== undefined) {
        updateExpression += ', #status = :status';
        expressionAttributeValues[':status'] = updates.status;
      }
      
      // スター状態が変更された場合
      if (updates.starred !== undefined) {
        updateExpression += ', starred = :starred';
        expressionAttributeValues[':starred'] = updates.starred;
        
        // starredDueも更新
        const due = updates.due !== undefined ? updates.due : currentTask.due;
        const starredDue = `${!!updates.starred}#${due || '9999-12-31T23:59:59.999Z'}`;
        updateExpression += ', starredDue = :starredDue';
        expressionAttributeValues[':starredDue'] = starredDue;
      }
      
      const command = new UpdateCommand({
        TableName: TASKS_TABLE,
        Key: {
          userId: this.userId,
          taskId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: {
          '#status': 'status' // statusは予約語なので、属性名を使用
        },
        ReturnValues: 'ALL_NEW'
      });

      const response = await this.docClient.send(command);
      return response.Attributes;
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * タスクをあるリストから別のリストに移動
   * @param {string} taskId - タスクID
   * @param {string} newListId - 新しいリストID
   * @returns {Promise<Object>} 更新されたタスク
   */
  async moveTaskToList(taskId, newListId) {
    try {
      // 現在のタスクを取得
      const currentTask = await this.getTask(taskId);
      if (!currentTask) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      const timestamp = new Date().toISOString();
      const userListId = `${this.userId}#${newListId}`;
      
      const command = new UpdateCommand({
        TableName: TASKS_TABLE,
        Key: {
          userId: this.userId,
          taskId
        },
        UpdateExpression: 'set listId = :listId, userListId = :userListId, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':listId': newListId,
          ':userListId': userListId,
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      });

      const response = await this.docClient.send(command);
      return response.Attributes;
    } catch (error) {
      console.error(`Error moving task ${taskId} to list ${newListId}:`, error);
      throw error;
    }
  }

  /**
   * タスクを削除
   * @param {string} taskId - タスクID
   * @returns {Promise<void>}
   */
  async deleteTask(taskId) {
    try {
      const command = new DeleteCommand({
        TableName: TASKS_TABLE,
        Key: {
          userId: this.userId,
          taskId
        }
      });

      await this.docClient.send(command);
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * タスクの完了状態を切り替え
   * @param {string} taskId - タスクID
   * @param {boolean} completed - 完了状態
   * @returns {Promise<Object>} 更新されたタスク
   */
  async toggleTaskCompletion(taskId, completed) {
    try {
      const status = completed ? 'completed' : 'needsAction';
      return await this.updateTask(taskId, { status });
    } catch (error) {
      console.error(`Error toggling completion for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * タスクのスター状態を切り替え
   * @param {string} taskId - タスクID
   * @returns {Promise<Object>} 更新されたタスク
   */
  async toggleTaskStar(taskId) {
    try {
      // 現在のタスクを取得
      const currentTask = await this.getTask(taskId);
      if (!currentTask) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      // スター状態を反転
      const starred = !currentTask.starred;
      
      return await this.updateTask(taskId, { starred });
    } catch (error) {
      console.error(`Error toggling star for task ${taskId}:`, error);
      throw error;
    }
  }
}

export default new DynamoDbService();
