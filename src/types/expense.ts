export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'coffee'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'etc'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '🍚 식비',
  transport: '🚌 교통',
  coffee: '☕ 카페',
  shopping: '🛍️ 쇼핑',
  entertainment: '🎮 오락',
  health: '💊 건강',
  etc: '📦 기타',
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  category: ExpenseCategory
  memo: string | null
  nag_result: string | null
  spent_at: string
  created_at: string
}

export interface CreateExpenseInput {
  amount: number
  category: ExpenseCategory
  memo?: string
}
