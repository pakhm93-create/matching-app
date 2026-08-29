/**
 * 앱 전체에서 쓰는 데이터 모양(타입) 정의.
 * 여기서 정한 형태대로 설문 응답과 프로필이 저장된다.
 */

export type Gender = 'male' | 'female' | 'other';

/** 설문 시작 전 "절대 양보 못 하는 조건 TOP 3"에서 고를 수 있는 항목들 */
export type PriorityKey =
  | 'age' | 'region' | 'smoking' | 'drinking' | 'religion' | 'politics'
  | 'marriage' | 'children' | 'job' | 'height' | 'education' | 'tattoo' | 'pet';

export type Smoking = 'none' | 'sometimes' | 'yes' | 'vape';
export type Drinking = 'none' | 'sometimes' | 'often';
export type Marriage = 'yes' | 'no' | 'undecided';
export type Children = 'want' | 'not' | 'undecided';
export type Pet = 'has' | 'none' | 'allergic';
export type Religion = 'none' | 'protestant' | 'catholic' | 'buddhist' | 'other';

/** 기본 프로필 — 설문 점수 계산이 아니라 필터·표시에 쓰인다 */
export interface Profile {
  id: string;
  nickname: string;
  age: number;
  gender: Gender;
  /** 찾는 상대의 성별 (복수 선택 가능하게 배열로 둠) */
  seeking: Gender[];
  region: string;
  height: number;
  job: string;
  education: string;
  smoking: Smoking;
  drinking: Drinking;
  tattoo: boolean;
  pet: Pet;
  marriage: Marriage;
  children: Children;
  religion: Religion;
  /** 정치 성향 1(매우 진보) ~ 5(매우 보수) */
  politics: number;
}

/**
 * TOP 3으로 고른 조건 하나. 항목마다 "허용 범위"의 모양이 달라서
 * key에 따라 필요한 필드가 정해지는 형태로 정의한다.
 */
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
  | { key: 'education'; allowed: string[] }
  | { key: 'tattoo'; allowed: boolean[] };

export type Section = 'values' | 'relationship' | 'lifestyle' | 'personality' | 'taste';

export type QuestionType = 'scale' | 'choice' | 'multi';

/** Big Five 내부 축. 화면에는 절대 노출하지 않는다. */
export type BigFiveAxis = 'E' | 'A' | 'C' | 'N' | 'O';

export interface Question {
  id: string;
  section: Section;
  text: string;
  type: QuestionType;
  /** 선택지에 순서가 있는가 (예: 만남 빈도). 있으면 거리 기반으로 유사도 계산 */
  ordinal?: boolean;
  /** choice / multi 일 때의 선택지 */
  options?: string[];
  /** 점수를 뒤집어야 하는 문항 (예: "걱정이 많다" → 정서안정성은 반대) */
  reverse?: boolean;
  /** 내부 집계용. 화면 표시에 쓰지 말 것 */
  bigFive?: BigFiveAxis;
  /** TOP 3에서 이 항목이 선택되면 가중치 5배를 받는 문항 */
  priorityKey?: PriorityKey;
}

/** 설문 응답. scale은 숫자(1~5), choice는 문자열, multi는 문자열 배열 */
export type AnswerValue = number | string | string[];
export type Answers = Record<string, AnswerValue>;

/** 한 사용자의 전체 데이터 */
export interface User {
  profile: Profile;
  priorities: PriorityFilter[];
  answers: Answers;
}

/** 매칭 계산 결과 */
export interface MatchResult {
  user: User;
  /** 0 ~ 100 궁합 점수 (사용자에게 보여주는 보정된 값) */
  score: number;
  /** 보정 전 원점수 (튜닝·디버깅용, 화면에 노출하지 않음) */
  rawScore: number;
  /** 섹션별 점수 (0~1). "어디가 잘 맞는지" 설명에 사용 */
  bySection: Record<Section, number>;
  /** 가장 잘 맞은 섹션 / 가장 안 맞은 섹션 */
  bestSection: Section;
  worstSection: Section;
}
