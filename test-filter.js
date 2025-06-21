// フィルタリングロジックをテストするスクリプト
const { parseISO, startOfDay } = require('date-fns');
const { format } = require('date-fns');

// テスト用のタスクを作成
const createTestTask = (dateStr) => ({
  id: `task-${dateStr}`,
  title: `Task for ${dateStr}`,
  startDate: dateStr ? new Date(dateStr).toISOString() : null,
  status: 'needsAction'
});

// テスト用のタスクリスト
const todos = [
  createTestTask('2025-06-15'), // 日曜日
  createTestTask('2025-06-16'), // 月曜日
  createTestTask('2025-06-17'), // 火曜日
  createTestTask('2025-06-18'), // 水曜日
  createTestTask('2025-06-19'), // 木曜日
  createTestTask('2025-06-20'), // 金曜日（今日）
  createTestTask('2025-06-21'), // 土曜日（明日）
  createTestTask('2025-06-22'), // 翌週の日曜日
  createTestTask(null)          // 日付なし
];

// 今週のフィルタリングロジック
const filterThisWeek = (todo) => {
  if (!todo.startDate) return false;
  try {
    const date = parseISO(todo.startDate);
    const today = new Date();
    const startOfWeek = startOfDay(new Date(today));
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // 時間を23:59:59.999に設定
    
    console.log(`Task ${todo.id} date: ${format(date, 'yyyy-MM-dd')}`);
    console.log(`  Is in range: ${date >= startOfWeek && date <= endOfWeek}`);
    console.log(`  date >= startOfWeek: ${date >= startOfWeek}`);
    console.log(`  date <= endOfWeek: ${date <= endOfWeek}`);
    
    return date >= startOfWeek && date <= endOfWeek;
  } catch (e) {
    console.error('Error parsing date:', e);
    return false;
  }
};

// 今週のタスクをフィルタリング
console.log('今週のタスクをフィルタリング:');
const thisWeekTasks = todos.filter(filterThisWeek);

// 結果を表示
console.log('\n今週のタスク:');
thisWeekTasks.forEach(task => {
  console.log(`- ${task.title} (${task.startDate ? format(parseISO(task.startDate), 'yyyy-MM-dd') : 'No date'})`);
});

// 明日のタスクが含まれているか確認
const tomorrowTask = thisWeekTasks.find(task => task.id === 'task-2025-06-21');
console.log('\n明日のタスクが今週のフィルターに含まれているか:', !!tomorrowTask);
