export type PersonaStatus = 'free' | 'locked'

export interface Persona {
  id: string
  name: string
  emoji: string
  description: string
  sampleNag: string
  status: PersonaStatus
}

export const PERSONAS: Persona[] = [
  {
    id: 'drill_sergeant',
    name: '지옥의 조교',
    emoji: '🪖',
    description: '군기 바짝 든 잔소리. 용서 없음.',
    sampleNag: '이 돈으로 뭘 샀어?! 전방 30미터, 편의점 보이지?! 그냥 지나쳐!!',
    status: 'free',
  },
  {
    id: 'disappointed_parent',
    name: '실망한 부모님',
    emoji: '😔',
    description: '말없이 한숨 쉬는 그 눈빛.',
    sampleNag: '...그래. 네가 알아서 하겠지. 엄마는 괜찮아. 그냥 좀 쉬고 싶어서.',
    status: 'free',
  },
  {
    id: 'rich_friend',
    name: '부자 친구',
    emoji: '🤑',
    description: '나는 이미 은퇴했는데 너는 왜...',
    sampleNag: '야 나 오늘 배당금으로 그거 다섯 개 샀는데? 너는 월급 탈 때 뭐해?',
    status: 'locked',
  },
  {
    id: 'ai_accountant',
    name: 'AI 회계사',
    emoji: '🤖',
    description: '숫자로 말하는 냉정한 분석가.',
    sampleNag: '현재 지출 패턴 유지 시 월말 잔고: -23,000원. 시뮬레이션 종료.',
    status: 'locked',
  },
]
