/**
 * 앱 전체에서 쓰는 데이터 모양(타입) 정의.
 */

export type Gender = 'male' | 'female' | 'other';

export type PriorityKey =
  | 'age' | 'region' | 'smoking' | 'drinking' | 'religion' | 'politics'
  | 'marriage' | 'children' | 'job' | 'height' | 'education' | 'pet';

/** 전자담배는 흡연에 포함시켰다 (사용자 피드백) */
export type Smoking = 'none' | 'sometimes' | 'yes';
export type Drinking = 'none' | 'sometimes' | 'often';
export type Marriage = 'yes' | 'no' | 'undecided';
export type Children = 'want' | 'not' | 'undecided';
export type Pet = 'has' | 'none' | 'allergic';
export type Religion = 'none' | 'protestant' | 'catholic' | 'buddhist' | 'other';

/** 정치 성향: 1(매우 진보) ~ 5(매우 보수), null = 잘 모름 */
export type Politics = number | null;

export interface Profile {
  id: string;
  nickname: string;
  /** 출생 연월 — 한국 나이 혼동을 피하려고 나이 대신 받는다 */
  birthYear: number;
  birthMonth: number;
  gender: Gender;
  seeking: Gender[];
  /**
   * 만날 수 있는 지역 (복수).
   * "사는 곳"이 아니라 "활동 범위"다. 경기 거주자가 서울에서 만날 수 있으면
   * 둘 다 고르면 된다. 매칭은 겹치는 지역이 하나라도 있으면 통과.
   */
  areas: string[];
  height: number;
  job: string;
  education: string;
  smoking: Smoking;
  drinking: Drinking;
  pet: Pet;
  marriage: Marriage;
  children: Children;
  religion: Religion;
  politics: Politics;
}

/** 출생 연월로 만 나이 계산 */
export function calcAge(birthYear: number, birthMonth: number, today = new Date()): number {
  let age = today.getFullYear() - birthYear;
  if (today.getMonth() + 1 < birthMonth) age -= 1;
  return age;
}

export type PriorityFilter =
  | { key: 'age'; min: number; max: number }
  | { key: 'height'; min: number; max: number }
  | { key: 'politics'; min: number; max: number }
  | { key: 'region'; allowed: string[] }
  | { key: 'smoking'; allowed: Smoking[] }
  | { key: 'drinking'; allowed: Drinking[] }
  | { key: 'religion'; allowed: Religion[] }
  | { key: 'marriage'; allowed: Marriage[] }
  | { key: 'children'; allowed: Children[] }
  | { key: 'pet'; allowed: Pet[] }
  | { key: 'job'; allowed: string[] }
  | { key: 'education'; allowed: string[] };

export type Section = 'values' | 'relationship' | 'lifestyle' | 'personality' | 'taste';
export type QuestionType = 'scale' | 'choice' | 'multi';
export type BigFiveAxis = 'E' | 'A' | 'C' | 'N' | 'O';

export interface Question {
  id: string;
  section: Section;
  text: string;
  type: QuestionType;
  /** 선택지에 순서가 있는가 (예: 만남 빈도). 있으면 거리 기반으로 유사도 계산 */
  ordinal?: boolean;
  options?: string[];
  reverse?: boolean;
  bigFive?: BigFiveAxis;
  priorityKey?: PriorityKey;
}

export type AnswerValue = number | string | string[];
export type Answers = Record<string, AnswerValue>;

export interface User {
  profile: Profile;
  /** 하드 필터 목록. 지역·나이는 항상 들어가고, 여기에 선언형 조건 3개가 더해진다 */
  priorities: PriorityFilter[];
  /** 사용자가 고른 선언형 조건의 id 목록 (화면 표시용) */
  stanceIds?: string[];
  answers: Answers;
}

export interface MatchResult {
  user: User;
  score: number;
  rawScore: number;
  bySection: Record<Section, number>;
  bestSection: Section;
  worstSection: Section;
}
