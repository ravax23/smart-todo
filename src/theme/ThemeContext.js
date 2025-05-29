import React, { createContext, useContext, useState, useEffect } from 'react';

// テーマコンテキストの作成
const ThemeContext = createContext();

// テーマプロバイダーコンポーネント
export const ThemeProvider = ({ children }) => {
  // ローカルストレージからテーマ設定を取得、なければライトモード
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // テーマが変更されたらHTMLのdata-theme属性を更新
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // テーマの切り替え関数
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // システムのダークモード設定を検出して自動的に適用
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // システム設定が変更されたときのハンドラー
    const handleChange = (e) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      // 'system'設定の場合のみ自動的に変更
      if (localStorage.getItem('themePreference') === 'system') {
        setTheme(systemTheme);
      }
    };

    // 初期設定
    if (localStorage.getItem('themePreference') === 'system') {
      setTheme(mediaQuery.matches ? 'dark' : 'light');
    }

    // イベントリスナーの登録
    mediaQuery.addEventListener('change', handleChange);
    
    // クリーンアップ
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // テーマ設定の変更（light, dark, system）
  const setThemePreference = (preference) => {
    localStorage.setItem('themePreference', preference);
    
    if (preference === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } else {
      setTheme(preference);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

// テーマコンテキストを使用するためのカスタムフック
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
