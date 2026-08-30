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
  | 'smoking' | 'drinking' | 'religion' | 'marriage' | 'children' | 'exercise' | 'pet';

export type Smoking = 'none' | 'sometimes' | 'yes';
export type Drinking = 'none' | 'sometimes' | 'often';
export type Marriage = 'yes' | 'no' | 'undecided';
export type Children = 'want' | 'not' | 'undecided';
export type Religion = 'none' | 'protestant' | 'catholic' | 'buddhist' | 'other';
export type Exercise = 'often' | 'sometimes' | 'rarely';
export type Pet = 'has' | 'likes' | 'none' | 'allergic';

/** 설문에서 파생된 속성 묶음 */
export interface Facts {
  smoking?: Smoking;
  drinking?: Drinking;
  religion?: Religion;
  marriage?: Marriage;
  children?: Children;
  exercise?: Exercise;
  pet?: Pet;
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
  heightCm: number;
  /** 선택 입력 — 안 넣어도 된다 */
  education?: string;
  /**
   * MBTI. **매칭 계산에는 쓰지 않는다.**
   * 같은 사람이 재검사하면 유형이 자주 바뀌어 근거로 삼기 어렵고,
   * 우리는 이미 설문으로 성향을 더 정확히 재고 있어 이중 측정이 된다.
   * 프로필에 보여주는 용도로만 받는다 — 알아두면 대화 소재가 되고 입력도 1초다.
   */
  mbti?: string;
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
  /** 서로의 사는 곳 사이 예상 이동 시간이 이 값 이하여야 한다 */
  | { key: 'travel'; maxMinutes: number }
  /** 복수선택 문항들에서 겹치는 항목이 합쳐서 최소 몇 개 이상이어야 한다 */
  | { key: 'sharedTags'; questionIds: string[]; min: number }
  /** 특정 문항들의 평균 응답 차이가 이 값 이하여야 한다 (1~5 척도 기준) */
  | { key: 'answerClose'; questionIds: string[]; maxDiff: number }
  | { key: 'smoking'; allowed: Smoking[] }
  | { key: 'drinking'; allowed: Drinking[] }
  | { key: 'religion'; allowed: Religion[] }
  | { key: 'marriage'; allowed: Marriage[] }
  | { key: 'children'; allowed: Children[] }
  | { key: 'exercise'; allowed: Exercise[] }
  | { key: 'pet'; allowed: Pet[] }
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
  /**
   * 애착 유형의 어느 축을 재는가.
   * 이 축만은 "비슷할수록 좋다"가 성립하지 않는다 — 불안형과 회피형이 만나면
   * 한쪽이 다가갈수록 다른 쪽이 물러선다. 나중에 궁합표로 따로 계산할 것.
   */
  attach?: 'anxious' | 'avoidant' | 'secure';
  /** 애착 문항 중 뒤집어 읽어야 하는 것 */
  attachReverse?: boolean;
  /**
   * 이 문항이 얼마나 무거운가 (1 가벼움 ~ 5 무거움).
   * 설문 순서를 정하는 데만 쓴다. 가벼운 것부터 물어야 이탈이 적다.
   */
  sensitivity: number;
  /**
   * 같은 영역 안에서 이 문항이 갖는 비중 배수 (기본 1).
   * 모든 문항이 똑같이 중요하지는 않다. 음주·종교·정치처럼
   * 관계를 실제로 갈라놓는 항목은 더 크게 잡는다.
   */
  weight: number;
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
  /** 만나러 갈 수 있는 최대 시간(분). zones.ts의 TRAVEL_OPTIONS에서 고른다 */
  maxTravelMinutes: number;
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
