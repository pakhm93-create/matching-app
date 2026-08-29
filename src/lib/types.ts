/**
 * 앱 전체에서 쓰는 데이터 모양(타입) 정의.
 *
 * 핵심 원칙 (사용자 결정):
 * 기본 정보에서는 **객관적인 사실만** 받는다. (나이·키·사는 곳·성별·찾는 성별)
 * 흡연, 음주, 종교, 결혼 의향, 자녀 계획, 정치 성향 같은 것은
 * 본인에게 직접 묻지 않고 **설문 응답으로 우리가 판단한다.**
 */

export type Gender = 'male' | 'female' | 'other';

/** 설문에서 뽑아내는 속성들 — 하드 필터가 이 값을 본다 */
export type FactKey =
  | 'smoking' | 'drinking' | 'religion' | 'marriage' | 'children' | 'exercise';

export type Smoking = 'none' | 'sometimes' | 'yes';
export type Drinking = 'none' | 'sometimes' | 'often';
export type Marriage = 'yes' | 'no' | 'undecided';
export type Children = 'want' | 'not' | 'undecided';
export type Religion = 'none' | 'protestant' | 'catholic' | 'buddhist' | 'other';
export type Exercise = 'often' | 'sometimes' | 'rarely';

/** 설문에서 파생된 속성 묶음 */
export interface Facts {
  smoking?: Smoking;
  drinking?: Drinking;
  religion?: Religion;
  marriage?: Marriage;
  children?: Children;
  exercise?: Exercise;
  /** 정치 성향 1(진보) ~ 5(보수). 이슈 문항들의 평균으로 계산. 답이 없으면 null */
  politics: number | null;
}

/** 기본 정보 — 객관적 사실만 */
export interface Profile {
  id: string;
  nickname: string;
  /** 출생 연월 — 한국 나이 혼동을 피하려고 나이 대신 받는다 */
  birthYear: number;
  birthMonth: number;
  gender: Gender;
  seeking: Gender[];
  /** 사는 곳 (시/도 + 시/군/구) */
  sido: string;
  sigungu: string;
  /**
   * 만날 수 있는 지역 (시/도 단위, 복수).
   * "사는 곳"과 별개다. 경기 살아도 서울에서 만날 수 있으면 둘 다 고른다.
   * 겹치는 지역이 하나라도 있으면 매칭 가능.
   */
  areas: string[];
  heightCm: number;
  /** 선택 입력 — 안 넣어도 된다 */
  education?: string;
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
  | { key: 'exercise'; allowed: Exercise[] }
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
  /**
   * 이 문항이 어떤 사실을 알려주는가.
   * options와 같은 순서로 factValues를 두면 응답이 그 값으로 번역된다.
   */
  fact?: FactKey;
  factValues?: string[];
  /**
   * 정치 성향 계산에 얼마나 기여하는가 (0~1). 없으면 기여하지 않는다.
   *
   * 한 문항이 하나의 축만 재야 하는 것은 아니다.
   * "집안일은 성별과 무관하게 나눠야 한다"는 역할관을 묻는 문항이지만
   * 정치 성향과도 상관이 있다. 그런 문항은 낮은 기여도로 함께 반영한다.
   */
  politicsWeight?: number;
  /** 동의할수록 진보 쪽이면 true (계산할 때 뒤집어서 "높을수록 보수"로 맞춘다) */
  politicsReverse?: boolean;
  /** 이 문항이 어떤 절대 조건과 연결되는가 (선택 시 가중치 상승) */
  stanceGroup?: string;
}

export type AnswerValue = number | string | string[];
export type Answers = Record<string, AnswerValue>;

/** 얼마나 깐깐하게 매칭할지 — 설문을 마친 뒤 사용자가 고른다 */
export type Strictness = 'strict' | 'balanced' | 'relaxed';

/**
 * 각 기준이 요구하는 최소 궁합 점수.
 *
 * 점수 자체가 백분위로 정의돼 있어서(matching.ts 참고) 이 숫자들은
 * 곧 "상위 몇 %까지 볼 것인가"와 같은 말이다.
 */
export const STRICTNESS_THRESHOLD: Record<Strictness, number> = {
  strict: 90,
  balanced: 80,
  relaxed: 65,
};

/** 각 기준이 대략 상위 몇 %인지 — 화면에 함께 보여준다 */
export const STRICTNESS_PERCENTILE: Record<Strictness, string> = {
  strict: '상위 3%',
  balanced: '상위 10%',
  relaxed: '상위 25%',
};

export interface User {
  profile: Profile;
  /** 사용자가 고른 절대 조건 태그 id (0~3개) */
  stanceIds: string[];
  /** 매칭 기준. 정하지 않았으면 balanced로 본다 */
  strictness?: Strictness;
  /** 나이 범위. null이면 상관없음 */
  ageRange: { min: number; max: number } | null;
  /** 키 범위 (절대 조건으로 키를 골랐을 때만) */
  heightRange?: { min: number; max: number } | null;
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
