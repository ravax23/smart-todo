import { getAccessToken } from './authService';
import { gapi } from 'gapi-script';

const CALENDAR_ID = 'primary';  // ユーザーのプライマリカレンダーを使用

/**
 * Google Calendar APIクライアント
 */
class CalendarService {
  /**
   * カレンダーからTodoリストを取得
   * @param {string} timeMin - 開始日時（ISO 8601形式）
   * @param {string} timeMax - 終了日時（ISO 8601形式）
   */
  static async getTodos(timeMin, timeMax) {
    try {
      console.log('Fetching todos with timeRange:', { timeMin, timeMax });
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // GAPIクライアントが初期化されているか確認
      if (!gapi.client?.calendar) {
        console.log('Calendar API client not initialized, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!gapi.client?.calendar) {
          throw new Error('Calendar API client is not initialized');
        }
      }
      
      console.log('Calling calendar.events.list API...');
      const response = await gapi.client.calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100
      });
      
      console.log('API Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Calendar API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result.items ? response.result.items.map(this.convertEventToTodo) : [];
    } catch (error) {
      console.error('Calendar Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * 新しいTodoを作成
   * @param {Object} todo - Todoデータ
   */
  static async createTodo(todo) {
    try {
      const event = this.convertTodoToEvent(todo);
      
      const response = await gapi.client.calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: event
      });
      
      if (response.status !== 200) {
        throw new Error(`Calendar API error: ${response.status} - ${response.statusText}`);
      }
      
      return this.convertEventToTodo(response.result);
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    }
  }
  
  /**
   * Todoを更新
   * @param {string} todoId - TodoのID
   * @param {Object} todo - 更新するTodoデータ
   */
  static async updateTodo(todoId, todo) {
    try {
      const event = this.convertTodoToEvent(todo);
      
      const response = await gapi.client.calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: todoId,
        resource: event
      });
      
      if (response.status !== 200) {
        throw new Error(`Calendar API error: ${response.status} - ${response.statusText}`);
      }
      
      return this.convertEventToTodo(response.result);
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  }
  
  /**
   * Todoを削除
   * @param {string} todoId - 削除するTodoのID
   */
  static async deleteTodo(todoId) {
    try {
      const response = await gapi.client.calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: todoId
      });
      
      if (response.status !== 204 && response.status !== 200) {
        throw new Error(`Calendar API error: ${response.status} - ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  }

  /**
   * GoogleカレンダーのイベントをTodoオブジェクトに変換
   * @param {Object} event - Googleカレンダーのイベント
   */
  static convertEventToTodo(event) {
    return {
      id: event.id,
      title: event.summary || '(タイトルなし)',
      description: event.description || '',
      status: event.status || 'confirmed',
      startDate: event.start?.dateTime || event.start?.date || '',
      endDate: event.end?.dateTime || event.end?.date || '',
      created: event.created || '',
      updated: event.updated || '',
      creator: event.creator?.email || '',
      organizer: event.organizer?.email || '',
    };
  }

  /**
   * TodoオブジェクトをGoogleカレンダーのイベントに変換
   * @param {Object} todo - Todoオブジェクト
   */
  static convertTodoToEvent(todo) {
    return {
      summary: todo.title,
      description: todo.description,
      start: {
        dateTime: todo.startDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: todo.endDate || todo.startDate, // 終了日時がない場合は開始日時と同じに
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      status: todo.status || 'confirmed',
    };
  }
}

export default CalendarService;
