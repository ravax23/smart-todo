// リフレッシュトークンを使用して新しいアクセストークンを取得
export const refreshAccessToken = async (refreshToken) => {
  try {
    console.log('Refreshing access token');
    
    if (!refreshToken) {
      // 各ストレージからリフレッシュトークンを取得
      const storageOptions = [
        { type: 'localStorage', storage: localStorage },
        { type: 'sessionStorage', storage: sessionStorage },
        { type: 'cookie', storage: null }
      ];
      
      for (const option of storageOptions) {
        try {
          if (option.type === 'cookie') {
            // Cookieから取得
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === REFRESH_TOKEN_KEY) {
                refreshToken = value;
                break;
              }
            }
          } else {
            // localStorage または sessionStorage から取得
            const token = option.storage.getItem(REFRESH_TOKEN_KEY);
            if (token) {
              refreshToken = token;
              break;
            }
          }
        } catch (e) {
          console.error(`Error reading refresh token from ${option.type}:`, e);
        }
      }
    }
    
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }
    
    // トークン取得のためのエンドポイント
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    
    // リクエストボディの作成
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');
    
    // トークンリクエストの送信
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token refresh error:', errorData);
      throw new Error(`Token refresh failed: ${errorData.error}`);
    }
    
    // レスポンスからトークン情報を取得
    const tokenData = await response.json();
    console.log('Token refresh successful', tokenData);
    
    // トークン情報を保存
    const { access_token, expires_in, id_token } = tokenData;
    
    // アクセストークンの有効期限を計算（現在時刻 + expires_in秒）
    const expiryTime = Date.now() + (expires_in * 1000);
    
    // 複数のストレージに保存を試みる
    const storageOptions = [
      { type: 'localStorage', storage: localStorage },
      { type: 'sessionStorage', storage: sessionStorage },
      { type: 'cookie', storage: null }
    ];
    
    let savedSuccessfully = false;
    
    for (const option of storageOptions) {
      try {
        if (option.type === 'cookie') {
          // Cookieに保存
          document.cookie = `${ACCESS_TOKEN_KEY}=${access_token}; path=/; max-age=${expires_in}; SameSite=Strict`;
          document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryTime}; path=/; max-age=${expires_in}; SameSite=Strict`;
          
          if (id_token) {
            document.cookie = `${TOKEN_KEY}=${id_token}; path=/; max-age=${expires_in}; SameSite=Strict`;
          }
          
          // リフレッシュトークンは既に保存されているはずなので更新しない
          
          console.log('Refreshed tokens saved to cookies');
          savedSuccessfully = true;
        } else {
          // localStorage または sessionStorage に保存
          const storage = option.storage;
          
          storage.setItem(ACCESS_TOKEN_KEY, access_token);
          storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
          
          if (id_token) {
            storage.setItem(TOKEN_KEY, id_token);
            
            // JWTをデコードしてユーザー情報を取得
            try {
              const decodedToken = jwtDecode(id_token);
              storage.setItem(USER_KEY, JSON.stringify({
                id: decodedToken.sub,
                name: decodedToken.name,
                email: decodedToken.email,
                picture: decodedToken.picture
              }));
            } catch (decodeError) {
              console.error('Error decoding ID token:', decodeError);
            }
          }
          
          // リフレッシュトークンは既に保存されているはずなので更新しない
          
          console.log(`Refreshed tokens saved to ${option.type}`);
          savedSuccessfully = true;
        }
      } catch (storageError) {
        console.error(`Error saving refreshed tokens to ${option.type}:`, storageError);
      }
    }
    
    if (!savedSuccessfully) {
      console.error('Failed to save refreshed tokens to any storage');
    }
    
    return {
      accessToken: access_token,
      expiryTime,
      idToken: id_token
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
};
