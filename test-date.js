// 日付の範囲をテストするスクリプト
const { format } = require('date-fns');

// 現在の日付を取得
const today = new Date();
console.log('今日の日付:', format(today, 'yyyy-MM-dd'));
console.log('今日の曜日:', today.getDay()); // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日

// 今週の範囲を計算
const startOfWeek = new Date(today);
const dayOfWeek = today.getDay();
startOfWeek.setDate(today.getDate() - dayOfWeek); // 日曜日まで戻る
startOfWeek.setHours(0, 0, 0, 0); // 時間を0:00:00に設定

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6); // 土曜日
endOfWeek.setHours(23, 59, 59, 999); // 時間を23:59:59に設定

console.log('今週の開始日 (日曜日):', format(startOfWeek, 'yyyy-MM-dd'));
console.log('今週の終了日 (土曜日):', format(endOfWeek, 'yyyy-MM-dd'));

// 明日の日付を計算
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
console.log('明日の日付:', format(tomorrow, 'yyyy-MM-dd'));
console.log('明日の曜日:', tomorrow.getDay());

// 明日が今週の範囲内かチェック
const isTomorrowInThisWeek = tomorrow >= startOfWeek && tomorrow <= endOfWeek;
console.log('明日は今週の範囲内か:', isTomorrowInThisWeek);

// 日付の比較テスト
const tomorrowISOString = tomorrow.toISOString();
const tomorrowDate = new Date(tomorrowISOString);
console.log('明日のISOString:', tomorrowISOString);
console.log('ISOStringから変換した明日の日付:', format(tomorrowDate, 'yyyy-MM-dd'));

// 日付の比較
console.log('tomorrow >= startOfWeek:', tomorrow >= startOfWeek);
console.log('tomorrow <= endOfWeek:', tomorrow <= endOfWeek);

// 時間を含めた詳細な比較
console.log('tomorrow (詳細):', format(tomorrow, 'yyyy-MM-dd HH:mm:ss.SSS'));
console.log('startOfWeek (詳細):', format(startOfWeek, 'yyyy-MM-dd HH:mm:ss.SSS'));
console.log('endOfWeek (詳細):', format(endOfWeek, 'yyyy-MM-dd HH:mm:ss.SSS'));
