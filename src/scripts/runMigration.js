/**
 * データ移行を即時に実行するスクリプト
 */
import { migrateTasksToDb } from './migrateToDb';

// テスト用のユーザーID
const TEST_USER_ID = 'test@example.com';

/**
 * 移行を実行する関数
 */
async function runMigration() {
  console.log('Google Tasks APIからDynamoDBへのデータ移行を開始します...');
  
  try {
    // 現在のユーザー情報を取得（ローカルストレージから）
    let userEmail = '';
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userEmail = userData.email || TEST_USER_ID;
      } else {
        userEmail = TEST_USER_ID;
      }
    } catch (e) {
      console.error('ユーザー情報の取得に失敗しました:', e);
      userEmail = TEST_USER_ID;
    }
    
    console.log(`ユーザーID: ${userEmail} のデータを移行します`);
    
    // データ移行を実行
    const result = await migrateTasksToDb(userEmail);
    
    if (result.success) {
      console.log('✅ データ移行が成功しました！');
      console.log(`移行されたリスト数: ${result.stats?.lists || 0}`);
    } else {
      console.error('❌ データ移行に失敗しました:', result.error);
    }
  } catch (error) {
    console.error('❌ 予期せぬエラーが発生しました:', error);
  }
}

// スクリプトを実行
runMigration();
