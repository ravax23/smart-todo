console.log("アクセストークンを取得中...");
try {
  const token = localStorage.getItem("google_access_token");
  if (token) {
    console.log("アクセストークン:", token);
  } else {
    console.log("アクセストークンが見つかりません");
  }
} catch (e) {
  console.error("エラー:", e);
}
