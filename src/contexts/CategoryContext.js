import React, { createContext, useContext, useState, useEffect } from 'react';

const CategoryContext = createContext();

export function useCategories() {
  return useContext(CategoryContext);
}

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([
    { id: 'default', name: 'デフォルト', color: '#1976d2' },
    { id: 'work', name: '仕事', color: '#f44336' },
    { id: 'personal', name: 'プライベート', color: '#4caf50' },
    { id: 'shopping', name: '買い物', color: '#ff9800' },
  ]);

  // ローカルストレージからマイリストを読み込む
  useEffect(() => {
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error('マイリストの読み込みに失敗しました', e);
      }
    }
  }, []);

  // マイリストが変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // マイリストを追加
  const addCategory = (category) => {
    setCategories([...categories, { ...category, id: Date.now().toString() }]);
  };

  // マイリストを更新
  const updateCategory = (id, updatedCategory) => {
    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, ...updatedCategory } : cat))
    );
  };

  // マイリストを削除
  const deleteCategory = (id) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  };

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}
