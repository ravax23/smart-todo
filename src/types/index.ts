// カテゴリの型定義
export interface Category {
  id: string;
  name: string;
  color: string;
}

// Todoアイテムの型定義
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  due: string | null;
  categoryId: string | null;
}
