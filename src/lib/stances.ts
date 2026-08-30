/**
 * 절대 양보할 수 없는 조건 (최대 3개, 0개도 가능).
 *
 * 화면에는 **짧은 단어만** 보여준다. 문장으로 길게 쓰면 한눈에 안 들어온다.
 * "흡연"을 골랐다는 것 자체가 "이 사람에게 흡연이 가장 중요하다"는 뜻이다.
 *
 * 규칙은 하나로 통일했다 — **고른 항목은 상대가 나와 같아야 한다.**
 * 비흡연자가 '흡연'을 고르면 상대도 비흡연, 비혼주의자가 '결혼관'을 고르면 상대도 비혼.
 * 그래서 선택 화면에서는 값을 따로 물어볼 필요가 없다.
 * (내 값은 설문에서 알아내므로, 프로필에는 '비혼주의'처럼 구체적으로 표시한다)
 */
import type { Facts, PriorityFilter, Profile } from './types';
import {
  CONTACT_QUESTION_IDS, INTEREST_QUESTION_IDS, MONEY_QUESTION_IDS, RHYTHM_QUESTION_IDS,
} from './questions';

export interface StanceTag {
  id: string;
  /** 화면에 보이는 짧은 이름 */
  label: string;
  /** 눌렀을 때 무슨 뜻인지 한 줄 설명 */
  hint: string;
  /** 내 정보를 바탕으로 상대에게 걸 조건을 만든다. 만들 수 없으면 null */
  build: (facts: Facts, profile: Profile) => PriorityFilter | null;
}

export const MAX_STANCES = 3;

export const STANCE_TAGS: StanceTag[] = [
  { id: 'smoking', label: '흡연', hint: '나와 같은 흡연 습관인 분만',
    build: (f) => (f.smoking ? { key: 'smoking', allowed: [f.smoking] } : null) },

  { id: 'drinking', label: '음주', hint: '나와 같은 음주 습관인 분만',
    build: (f) => (f.drinking ? { key: 'drinking', allowed: [f.drinking] } : null) },

  { id: 'religion', label: '종교', hint: '나와 같은 종교인 분만',
    build: (f) => (f.religion ? { key: 'religion', allowed: [f.religion] } : null) },

  { id: 'marriage', label: '결혼관', hint: '결혼에 대한 생각이 같은 분만',
    build: (f) => (f.marriage ? { key: 'marriage', allowed: [f.marriage] } : null) },

  { id: 'children', label: '자녀 계획', hint: '아이에 대한 생각이 같은 분만',
    build: (f) => (f.children ? { key: 'children', allowed: [f.children] } : null) },

  { id: 'politics', label: '정치 성향', hint: '정치 성향이 비슷한 분만',
    build: (f) =>
      f.politics === null
        ? null
        : { key: 'politics', min: f.politics - 1, max: f.politics + 1 } },

  { id: 'exercise', label: '운동', hint: '운동 습관이 비슷한 분만',
    build: (f) => (f.exercise ? { key: 'exercise', allowed: [f.exercise] } : null) },

  { id: 'pet', label: '반려동물', hint: '반려동물에 대한 상황이 같은 분만',
    build: (f) => (f.pet ? { key: 'pet', allowed: [f.pet] } : null) },

  { id: 'hobby', label: '취미', hint: '관심사가 2개 이상 겹치는 분만',
    build: () => ({ key: 'sharedTags', questionIds: INTEREST_QUESTION_IDS, min: 2 }) },

  { id: 'money', label: '소비 성향', hint: '돈 쓰는 방식이 비슷한 분만',
    build: () => ({ key: 'answerClose', questionIds: MONEY_QUESTION_IDS, maxDiff: 1 }) },

  { id: 'rhythm', label: '생활 리듬', hint: '주말을 보내는 방식이 비슷한 분만',
    build: () => ({ key: 'answerClose', questionIds: RHYTHM_QUESTION_IDS, maxDiff: 1 }) },

  { id: 'contact', label: '연락 빈도', hint: '연락하는 빈도가 비슷한 분만',
    build: () => ({ key: 'answerClose', questionIds: CONTACT_QUESTION_IDS, maxDiff: 1 }) },

  { id: 'education', label: '학력', hint: '나와 같은 학력인 분만',
    build: (_f, p) => (p.education ? { key: 'education', allowed: [p.education] } : null) },
];

export const STANCE_BY_ID = new Map(STANCE_TAGS.map((s) => [s.id, s]));

/** 내 프로필에 보여줄 구체적인 이름 (예: '결혼관' → '비혼주의') */
export function stanceDisplayName(id: string, f: Facts, p: Profile): string {
  switch (id) {
    case 'smoking':
      return f.smoking === 'none' ? '비흡연' : f.smoking === 'sometimes' ? '가끔 흡연' : '흡연';
    case 'drinking':
      return f.drinking === 'none' ? '금주' : f.drinking === 'sometimes' ? '가끔 음주' : '자주 음주';
    case 'religion':
      return f.religion === 'none' ? '무교' : '같은 종교';
    case 'marriage':
      return f.marriage === 'no' ? '비혼주의' : f.marriage === 'yes' ? '결혼 희망' : '결혼관';
    case 'children':
      return f.children === 'not' ? '딩크' : f.children === 'want' ? '아이 희망' : '자녀 계획';
    case 'politics': return '정치 성향';
    case 'exercise':
      return f.exercise === 'often' ? '운동 자주' : f.exercise === 'rarely' ? '운동 안 함' : '운동';
    case 'pet':
      return f.pet === 'has' ? '반려동물 키움' : f.pet === 'allergic' ? '동물 알레르기' : '반려동물 없음';
    case 'hobby': return '취미';
    case 'money': return '소비 성향';
    case 'rhythm': return '생활 리듬';
    case 'contact': return '연락 빈도';
    case 'education': return p.education ?? '학력';
    default: return id;
  }
}

/** 사용자가 고른 태그들을 실제 매칭 조건으로 변환 */
export function buildStanceFilters(
  stanceIds: string[],
  facts: Facts,
  profile: Profile,
): PriorityFilter[] {
  return stanceIds
    .map((id) => STANCE_BY_ID.get(id)?.build(facts, profile) ?? null)
    .filter((f): f is PriorityFilter => f !== null);
}
