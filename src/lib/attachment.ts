/**
 * 애착 — 이 앱에서 유일하게 "비슷할수록 좋다"가 성립하지 않는 영역.
 *
 * 다른 영역은 답이 비슷하면 잘 맞는다고 봐도 된다.
 * 그런데 애착은 다르다. 불안형 둘이 만나면 서로 확인을 요구하며 지치고,
 * 회피형 둘이 만나면 관계가 앞으로 나가지 않는다.
 * 그리고 **불안형 × 회피형**이 최악이다 — 한쪽이 다가갈수록 다른 쪽이 물러서고,
 * 물러설수록 더 매달리는 고리가 생긴다.
 *
 * 그래서 이 영역만 유사도 대신 **궁합표**로 계산한다.
 *
 * 재는 방식은 다른 영역과 같다. "당신은 불안형입니까"라고 묻지 않는다.
 * 행동 문항으로 재고, 화면에는 부드러운 말로만 보여준다.
 */
import type { Answers } from './types';
import { QUESTIONS } from './questions';

export type AttachStyle = 'secure' | 'anxious' | 'avoidant' | 'fearful';

export interface AttachScore {
  /** 불안 정도 0~1 — 확인받고 싶은 마음이 얼마나 강한가 */
  anxiety: number;
  /** 회피 정도 0~1 — 거리를 두고 싶은 마음이 얼마나 강한가 */
  avoidance: number;
  style: AttachStyle;
}

/** 화면에 보여줄 부드러운 표현. 임상 용어를 그대로 쓰지 않는다 */
export const ATTACH_LABEL: Record<AttachStyle, string> = {
  secure: '편안하게 거리를 두는 편',
  anxious: '가까이 붙어 있고 싶은 편',
  avoidant: '혼자만의 시간이 꼭 필요한 편',
  fearful: '가까워지고 싶지만 조심스러운 편',
};

const ANXIOUS_IDS = QUESTIONS.filter((q) => q.attach === 'anxious').map((q) => q.id);
const AVOIDANT_IDS = QUESTIONS.filter((q) => q.attach === 'avoidant').map((q) => q.id);
/** 안정 문항은 뒤집어서 불안 쪽에 넣는다 ("바빠도 신경 안 쓰인다" = 불안이 낮다) */
const SECURE_IDS = QUESTIONS.filter((q) => q.attach === 'secure').map((q) => q.id);

/** 모든 애착 문항 — 가중치 예산을 계산할 때 쓴다 */
export const ATTACH_IDS = [...ANXIOUS_IDS, ...AVOIDANT_IDS, ...SECURE_IDS];

/** 1~5 척도 여러 개의 평균을 0~1로 */
function mean01(answers: Answers, ids: string[], reverse = false): number | null {
  const vals: number[] = [];
  for (const id of ids) {
    const v = answers[id];
    if (typeof v !== 'number') continue;
    vals.push(reverse ? 6 - v : v);
  }
  if (vals.length === 0) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 4;
}

export function attachScore(answers: Answers): AttachScore | null {
  const anxRaw = mean01(answers, ANXIOUS_IDS);
  const secRaw = mean01(answers, SECURE_IDS, true); // 뒤집으면 불안 지표
  const avoRaw = mean01(answers, AVOIDANT_IDS);
  if (anxRaw === null || avoRaw === null) return null;

  // 안정 문항이 있으면 불안 점수에 함께 반영한다
  const anxiety = secRaw === null ? anxRaw : anxRaw * 0.75 + secRaw * 0.25;
  const avoidance = avoRaw;

  const style: AttachStyle =
    anxiety >= 0.5 && avoidance >= 0.5 ? 'fearful'
      : anxiety >= 0.5 ? 'anxious'
        : avoidance >= 0.5 ? 'avoidant'
          : 'secure';

  return { anxiety, avoidance, style };
}

/**
 * 애착 궁합표 (0~1).
 *
 * 안정형은 누구와 만나도 무난하다 — 상대의 불안을 받아주고 거리도 존중한다.
 * 불안 × 회피가 최악이고, 같은 유형끼리도 좋지 않다.
 *
 * ⚠️ 이 값들은 관계 연구에서 널리 이야기되는 방향을 옮긴 것이지
 *    우리 사용자에게서 측정한 값은 아니다. 데이터가 쌓이면 다시 잡는다.
 */
const TABLE: Record<AttachStyle, Record<AttachStyle, number>> = {
  secure:   { secure: 0.95, anxious: 0.85, avoidant: 0.85, fearful: 0.75 },
  anxious:  { secure: 0.85, anxious: 0.55, avoidant: 0.20, fearful: 0.35 },
  avoidant: { secure: 0.85, anxious: 0.20, avoidant: 0.45, fearful: 0.30 },
  fearful:  { secure: 0.75, anxious: 0.35, avoidant: 0.30, fearful: 0.25 },
};

/**
 * 두 사람의 애착 궁합. 답이 없으면 null(계산에서 제외).
 *
 * 유형만으로 딱 잘라 계산하면 경계선에 있는 사람이 억울해진다.
 * (불안 0.49와 0.51이 전혀 다른 취급을 받는다)
 * 그래서 표에서 얻은 값에 실제 점수 차이를 조금 섞어 부드럽게 만든다.
 */
export function attachCompatibility(a: Answers, b: Answers): number | null {
  const sa = attachScore(a);
  const sb = attachScore(b);
  if (!sa || !sb) return null;

  const base = TABLE[sa.style][sb.style];

  // 두 사람이 각 축에서 얼마나 떨어져 있는지 (0~1). 가까울수록 부드럽게 가산
  const gap = (Math.abs(sa.anxiety - sb.anxiety) + Math.abs(sa.avoidance - sb.avoidance)) / 2;
  const smooth = 1 - gap;

  // 표가 8할, 실제 점수 근접도가 2할
  return Math.max(0, Math.min(1, base * 0.8 + smooth * 0.2));
}
