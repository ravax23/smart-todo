import { getAccessToken } from './authService';

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const CALENDAR_ID = 'primary';  // ユーザーのプライマリカレンダーを使用
const BASE_URL = 'https://www.googleapis.com/calendar/v3';

/**
 * Google Calendar APIクライアント
 */
class CalendarService {
  /**
   * APIリクエストの共通ヘッダーを取得
   */
  static async getHeaders() {
    const token = getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * カレンダーからTodoリストを取得
   * @param {string} timeMin - 開始日時（ISO 8601形式）
   * @param {string} timeMax - 終了日時（ISO 8601形式）
   */
  static async getTodos(timeMin, timeMax) {
    try {
      const headers = await this.getHeaders();
      const params = new URLSearchParams({
        calendarId: CALENDAR_ID,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const response = await fetch(`${BASE_URL}/calendars/${CALENDAR_ID}/events?${params}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items.map(this.convertEventToTodo);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      throw error;
    }
  }

  /**
   * 新しいTodoを作成
   * @param {Object} todo - Todoデータ
   */
  static async createTodo(todo) {
    try {
      const headers = await this.getHeaders();
      const event = this.convertTodoToEvent(todo);

      const response = await fetch(`${BASE_URL}/calendars/${CALENDAR_ID}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return this.convertEventToTodo(data);
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
      const headers = await this.getHeaders();
      const event = this.convertTodoToEvent(todo);

      const response = await fetch(`${BASE_URL}/calendars/${CALENDAR_ID}/events/${todoId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return this.convertEventToTodo(data);
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
      const headers = await this.getHeaders();

      const response = await fetch(`${BASE_URL}/calendars/${CALENDAR_ID}/events/${todoId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
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
      title: event.summary,
      description: event.description || '',
      completed: event.status === 'completed',
      dueDate: event.start.dateTime || event.start.date,
      category: event.colorId || 'default',
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
        dateTime: todo.dueDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: todo.dueDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      status: todo.completed ? 'completed' : 'confirmed',
      colorId: todo.category,
    };
  }
}

export default CalendarService;
