import type { LeaderboardEntry } from '@/app/actions/leaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

interface LeaderboardSectionProps {
  title: string
  subtitle: string
  entries: LeaderboardEntry[]
  valueLabel: (entry: LeaderboardEntry) => string
  emptyText: string
}

function LeaderboardSection({ title, subtitle, entries, valueLabel, emptyText }: LeaderboardSectionProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-black">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-4">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry, i) => (
            <div key={entry.anonymousId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{MEDALS[i] ?? '🎖️'}</span>
                <div>
                  <p className="text-sm font-bold">{entry.anonymousId}</p>
                  <p className="text-xs text-zinc-500">체크인 {entry.checkinCount}일</p>
                </div>
              </div>
              <p className="text-sm font-black text-right">{valueLabel(entry)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface LeaderboardCardProps {
  honorRoll: LeaderboardEntry[]
  shameRoll: LeaderboardEntry[]
  totalUsers: number
}

export default function LeaderboardCard({ honorRoll, shameRoll, totalUsers }: LeaderboardCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-zinc-600 text-center">
        전체 {totalUsers}명 참여 중 · 최근 7일 기준
      </p>

      <LeaderboardSection
        title="🏆 명예의 전당"
        subtitle="체크인 × 절약률 TOP 3"
        entries={honorRoll}
        valueLabel={e => `${e.score}점`}
        emptyText="아직 참여자가 없어요 — 체크인하면 등록됩니다"
      />

      <LeaderboardSection
        title="💸 굴욕의 전당"
        subtitle="주간 최다 지출 TOP 3"
        entries={shameRoll}
        valueLabel={e => `${e.weekTotal.toLocaleString()}원`}
        emptyText="과소비 기록이 없어요 (모두 절약 중?)"
      />
    </div>
  )
}
