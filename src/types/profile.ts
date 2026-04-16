export const AGE_GROUP_LABELS = {
  '10s': '10대',
  '20s': '20대',
  '30s': '30대',
  '40s': '40대',
  '50s_plus': '50대 이상',
} as const

export type AgeGroup = keyof typeof AGE_GROUP_LABELS

export const NEIGHBORHOOD_OPTIONS = [
  '서울 강남구', '서울 서초구', '서울 송파구', '서울 마포구', '서울 종로구',
  '서울 강북구', '서울 노원구', '서울 관악구', '서울 은평구', '서울 강서구',
  '부산 해운대구', '부산 사하구', '대구 수성구', '인천 연수구', '광주 북구',
  '대전 유성구', '울산 남구', '수원시', '성남시', '고양시', '기타',
] as const

export type Neighborhood = (typeof NEIGHBORHOOD_OPTIONS)[number]

export interface ProfileSettings {
  daily_budget: number
  neighborhood: string | null
  age_group: AgeGroup | null
}
