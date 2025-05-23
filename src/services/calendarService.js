import { getAccessToken } from './authService';

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const CALENDAR_ID = 'primary';  // ユーザーのプライマリカレンダーを使用
const BASE_URL = 'https://www.googleapis.com/calendar/v3';

/**
 * Google Calendar APIクライアント
 * 読み取り専用の操作のみを提供
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
        maxResults: 100
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
