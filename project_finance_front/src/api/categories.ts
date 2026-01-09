import { api } from './config';
import type { Category } from '../types';

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

/**
 * Получение списка категорий
 */
export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories/');
  return response.data;
}

/**
 * Получение категорий по типу
 */
export async function getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
  const categories = await getCategories();
  return categories.filter((cat) => cat.type === type);
}

/**
 * Создание новой категории
 */
export async function createCategory(data: CreateCategoryData): Promise<Category> {
  const response = await api.post<Category>('/categories/', data);
  return response.data;
}

/**
 * Удаление категории
 */
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}







