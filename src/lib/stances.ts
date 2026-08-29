/**
 * "절대 양보할 수 없는 것" 선택지.
 *
 * 예전에는 "흡연" 같은 항목 이름을 고르게 한 뒤, 다음 화면에서 다시
 * "어디까지 괜찮으세요?"를 물었다. 같은 질문을 두 번 하는 느낌이라 없앴다.
 * 지금은 처음부터 완성된 문장을 고르게 한다 — 한 번에 끝난다.
 */
import type { PriorityFilter, Profile } from './types';

export interface Stance {
  id: string;
  /** 카드에 보일 문장 */
  label: string;
  /** 프로필 요약에 보일 짧은 이름 */
  short: string;
  /** 같은 그룹에서는 하나만 고를 수 있다 (결혼 필수 ↔ 비혼주의 충돌 방지) */
  group: string;
  /** 매칭 엔진이 쓰는 필터로 변환. me는 "나와 같은" 류의 조건에 필요 */
  build: (me: Profile) => PriorityFilter;
}

export const STANCES: Stance[] = [
  { id: 'smoke-none', group: '담배', short: '비흡연', label: '담배를 피우지 않는 분만 만날래요',
    build: () => ({ key: 'smoking', allowed: ['none'] }) },

  { id: 'drink-none', group: '술', short: '술 안 마심', label: '술을 마시지 않는 분만 만날래요',
    build: () => ({ key: 'drinking', allowed: ['none'] }) },
  { id: 'drink-light', group: '술', short: '과음 안 함', label: '술을 자주 마시지 않는 분이면 좋겠어요',
    build: () => ({ key: 'drinking', allowed: ['none', 'sometimes'] }) },

  { id: 'marry-yes', group: '결혼', short: '결혼 생각 있음', label: '결혼 생각이 있는 분만 만날래요',
    build: () => ({ key: 'marriage', allowed: ['yes'] }) },
  { id: 'marry-no', group: '결혼', short: '비혼', label: '비혼주의인 분만 만날래요',
    build: () => ({ key: 'marriage', allowed: ['no'] }) },

  { id: 'child-want', group: '자녀', short: '아이 원함', label: '아이를 원하는 분만 만날래요',
    build: () => ({ key: 'children', allowed: ['want'] }) },
  { id: 'child-not', group: '자녀', short: '아이 원치 않음', label: '아이를 원하지 않는 분만 만날래요',
    build: () => ({ key: 'children', allowed: ['not'] }) },

  { id: 'religion-same', group: '종교', short: '같은 종교', label: '저와 같은 종교인 분만 만날래요',
    build: (me) => ({ key: 'religion', allowed: [me.religion] }) },
  { id: 'religion-none', group: '종교', short: '무교', label: '종교가 없는 분만 만날래요',
    build: () => ({ key: 'religion', allowed: ['none'] }) },

  { id: 'politics-close', group: '정치', short: '비슷한 정치 성향',
    label: '정치 성향이 저와 비슷한 분만 만날래요',
    build: (me) => {
      // 잘 모름(null)이면 조건을 걸어도 의미가 없으므로 전 범위 허용
      if (me.politics === null) return { key: 'politics', min: 1, max: 5 };
      return { key: 'politics', min: me.politics - 1, max: me.politics + 1 };
    } },

  { id: 'pet-none', group: '반려동물', short: '반려동물 없는 분',
    label: '반려동물을 키우지 않는 분만 만날래요',
    build: () => ({ key: 'pet', allowed: ['none', 'allergic'] }) },
  { id: 'pet-ok', group: '반려동물', short: '반려동물 좋아함',
    label: '반려동물을 키우는 분이면 좋겠어요',
    build: () => ({ key: 'pet', allowed: ['has'] }) },
];

export const STANCE_BY_ID = new Map(STANCES.map((s) => [s.id, s]));
export const MAX_STANCES = 3;
