import { EXPENSE_CATEGORY_LABELS, type Expense } from '@/types/expense'

interface ExpenseListProps {
  expenses: Expense[]
  todayTotal: number
  weekTotal: number
}

export default function ExpenseList({ expenses, todayTotal, weekTotal }: ExpenseListProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">오늘 지출</p>
          <p className="text-2xl font-black">{todayTotal.toLocaleString()}<span className="text-sm text-zinc-400 font-normal">원</span></p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">이번 주 지출</p>
          <p className="text-2xl font-black">{weekTotal.toLocaleString()}<span className="text-sm text-zinc-400 font-normal">원</span></p>
        </div>
      </div>

      {/* 오늘 지출 내역 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-zinc-400">오늘 지출 내역</h3>
        {expenses.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-zinc-500 text-sm">오늘은 아직 지출이 없어요</p>
            <p className="text-zinc-600 text-xs mt-1">진짜요? 정말요? 믿어도 돼요?</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expenses.map(expense => (
              <div
                key={expense.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {EXPENSE_CATEGORY_LABELS[expense.category]?.split(' ')[0]}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{EXPENSE_CATEGORY_LABELS[expense.category]?.split(' ')[1]}</p>
                    {expense.memo && (
                      <p className="text-xs text-zinc-500">{expense.memo}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold">{expense.amount.toLocaleString()}원</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
