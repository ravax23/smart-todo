import { getAccessToken } from './authService';
import { gapi } from 'gapi-script';

const CALENDAR_ID = 'primary';  // ユーザーのプライマリカレンダーを使用
const BASE_URL = 'https://www.googleapis.com/calendar/v3';

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
      
      // 2つの方法でAPIを呼び出す
      try {
        // 方法1: GAPIクライアントを使用
        if (gapi.client?.calendar) {
          console.log('Using GAPI client for API call');
          return await this.getTodosWithGapi(timeMin, timeMax);
        }
      } catch (gapiError) {
        console.error('GAPI client error:', gapiError);
        // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.getTodosWithFetch(timeMin, timeMax, token);
    } catch (error) {
      console.error('Calendar Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してTodoを取得
   */
  static async getTodosWithGapi(timeMin, timeMax) {
    try {
      console.log('Calling calendar.events.list API with GAPI...');
      const response = await gapi.client.calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Calendar API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result.items ? response.result.items.map(this.convertEventToTodo) : [];
    } catch (error) {
      console.error('Error fetching todos with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してTodoを取得
   */
  static async getTodosWithFetch(timeMin, timeMax, token) {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      console.log('Request Headers:', headers);

      const params = new URLSearchParams({
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100
      });

      const url = `${BASE_URL}/calendars/${CALENDAR_ID}/events?${params}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        headers,
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Calendar API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      return data.items ? data.items.map(this.convertEventToTodo) : [];
    } catch (error) {
      console.error('Error fetching todos with fetch:', error);
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
}

export default CalendarService;
