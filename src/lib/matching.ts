/**
 * 매칭 계산 엔진.
 * 설계 문서: docs/matching-algorithm.md
 *
 * 순서:  1) 하드 필터로 후보를 걸러내고
 *        2) 문항별 유사도를 계산하고
 *        3) 가중치를 곱해 양방향 점수를 낸 뒤
 *        4) 기하평균으로 최종 궁합을 만든다.
 */
import type {
  AnswerValue, MatchResult, PriorityFilter, Profile, Question, Section, User,
} from './types';
import { calcAge } from './types';
import { PRIORITY_BOOST, QUESTIONS, SECTION_WEIGHTS } from './questions';

// ────────────────────────────────────────────
// 1단계: 하드 필터
// ────────────────────────────────────────────

/** 프로필 하나가 조건 하나를 만족하는가 */
function profileMatchesFilter(p: Profile, f: PriorityFilter): boolean {
  switch (f.key) {
    case 'age': {
      const age = calcAge(p.birthYear, p.birthMonth);
      return age >= f.min && age <= f.max;
    }
    case 'height':   return p.height >= f.min && p.height <= f.max;
    // 정치 성향을 "잘 모름"으로 둔 사람은 걸러내지 않는다.
    // 모른다는 것과 반대라는 것은 다르다.
    case 'politics': return p.politics === null || (p.politics >= f.min && p.politics <= f.max);
    // 지역은 "사는 곳"이 아니라 "만날 수 있는 곳"이라 겹치기만 하면 통과다.
    // 경기 사는 사람이 서울에서도 만날 수 있으면 서울 사람과 매칭된다.
    case 'region':   return p.areas.some((a) => f.allowed.includes(a));
    case 'smoking':  return f.allowed.includes(p.smoking);
    case 'drinking': return f.allowed.includes(p.drinking);
    case 'religion': return f.allowed.includes(p.religion);
    case 'marriage': return f.allowed.includes(p.marriage);
    case 'children': return f.allowed.includes(p.children);
    case 'pet':      return f.allowed.includes(p.pet);
    case 'job':      return f.allowed.includes(p.job);
    case 'education':return f.allowed.includes(p.education);
  }
}

/** 서로가 찾는 성별이 맞는가 */
function seekingMatches(a: Profile, b: Profile): boolean {
  return a.seeking.includes(b.gender) && b.seeking.includes(a.gender);
}

/**
 * 후보로 올릴 수 있는가.
 * 양방향으로 검사한다 — 내 조건에 상대가 맞아야 하고,
 * 상대의 조건에도 내가 맞아야 한다.
 */
export function passesHardFilter(a: User, b: User): boolean {
  if (a.profile.id === b.profile.id) return false;
  if (!seekingMatches(a.profile, b.profile)) return false;
  if (!a.priorities.every((f) => profileMatchesFilter(b.profile, f))) return false;
  if (!b.priorities.every((f) => profileMatchesFilter(a.profile, f))) return false;
  return true;
}

// ────────────────────────────────────────────
// 2단계: 문항별 유사도 (0 ~ 1)
// ────────────────────────────────────────────

/**
 * 두 답변이 얼마나 비슷한가. 답이 없으면 null(계산에서 제외).
 *
 * 참고: reverse(역방향) 문항은 여기서 신경 쓰지 않는다.
 * 두 사람이 같은 질문에 답한 것을 비교하므로 뒤집어도 차이는 동일하다.
 * reverse는 성향 축 점수를 따로 집계할 때만 쓴다.
 */
export function answerSimilarity(
  q: Question, a: AnswerValue | undefined, b: AnswerValue | undefined,
): number | null {
  if (a === undefined || b === undefined) return null;

  if (q.type === 'scale') {
    if (typeof a !== 'number' || typeof b !== 'number') return null;
    return 1 - Math.abs(a - b) / 4; // 1~5 척도라 최대 차이가 4
  }

  if (q.type === 'choice') {
    if (typeof a !== 'string' || typeof b !== 'string') return null;
    // 순서가 있는 선택지는 거리로 계산 (예: 매일 vs 주3~4회는 꽤 비슷하다)
    if (q.ordinal && q.options) {
      const ia = q.options.indexOf(a);
      const ib = q.options.indexOf(b);
      if (ia < 0 || ib < 0) return null;
      const maxGap = q.options.length - 1;
      return maxGap === 0 ? 1 : 1 - Math.abs(ia - ib) / maxGap;
    }
    return a === b ? 1 : 0;
  }

  // multi — 겹치는 개수 ÷ 전체 개수 (자카드 유사도)
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return null; // 둘 다 아무것도 안 골랐으면 제외
  let overlap = 0;
  for (const v of setA) if (setB.has(v)) overlap++;
  return overlap / union.size;
}

// ────────────────────────────────────────────
// 3단계: 가중치
// ────────────────────────────────────────────

/** 이 사람에게 이 문항이 갖는 무게 = 섹션 가중치 × (TOP3면 5배) */
function questionWeight(q: Question, user: User): number {
  const boosted =
    q.priorityKey !== undefined &&
    user.priorities.some((f) => f.key === q.priorityKey);
  return SECTION_WEIGHTS[q.section] * (boosted ? PRIORITY_BOOST : 1);
}

// ────────────────────────────────────────────
// 4단계: 양방향 점수 → 기하평균
// ────────────────────────────────────────────

interface DirectionalResult {
  score: number;
  bySection: Record<Section, number>;
}

/** viewer의 기준으로 본 만족도 (0~1)와 섹션별 점수 */
function directionalScore(viewer: User, other: User): DirectionalResult {
  let totalW = 0;
  let totalS = 0;
  const secW: Record<string, number> = {};
  const secS: Record<string, number> = {};

  for (const q of QUESTIONS) {
    const sim = answerSimilarity(q, viewer.answers[q.id], other.answers[q.id]);
    if (sim === null) continue;
    const w = questionWeight(q, viewer);
    totalW += w;
    totalS += w * sim;
    secW[q.section] = (secW[q.section] ?? 0) + w;
    secS[q.section] = (secS[q.section] ?? 0) + w * sim;
  }

  const bySection = {} as Record<Section, number>;
  for (const s of Object.keys(SECTION_WEIGHTS) as Section[]) {
    bySection[s] = secW[s] ? secS[s] / secW[s] : 0;
  }
  return { score: totalW === 0 ? 0 : totalS / totalW, bySection };
}

// ────────────────────────────────────────────
// 점수 보정 — 사용자에게 보여줄 숫자 만들기
// ────────────────────────────────────────────

/**
 * 아무 상관 없는 두 사람이라도 원점수는 0.5 근처가 나온다.
 * 5점 척도에서 무작위로 답해도 평균적으로 절반은 겹치기 때문이다.
 * 이 값을 그대로 "궁합 54%"로 보여주면 숫자가 의미를 잃는다.
 *
 * 그래서 무작위 조합에서 나오는 바닥값을 0으로 끌어내려 눈금을 다시 그린다.
 * ⚠️ 이 값은 실제 사용자 데이터가 쌓이면 반드시 재조정할 것.
 *    (실사용자 전체 조합의 하위 5% 지점으로 맞추는 것이 정석)
 */
export const RAW_BASELINE = 0.42;

/** 원점수(0~1) → 사용자에게 보여줄 점수(0~100) */
export function calibrateScore(raw: number): number {
  const stretched = (raw - RAW_BASELINE) / (1 - RAW_BASELINE);
  const clamped = Math.max(0, Math.min(1, stretched));
  return Math.round(clamped * 1000) / 10;
}

/**
 * 두 사람의 궁합을 계산한다. 하드 필터에 걸리면 null.
 * @param me 결과를 보게 될 사람 (섹션별 설명은 이 사람 기준으로 만든다)
 */
export function computeMatch(me: User, other: User): MatchResult | null {
  if (!passesHardFilter(me, other)) return null;

  const forward = directionalScore(me, other);
  const backward = directionalScore(other, me);

  // 기하평균 — 한쪽만 만족하는 매칭을 확실히 끌어내린다
  const combined = Math.sqrt(forward.score * backward.score);

  const sections = Object.keys(SECTION_WEIGHTS) as Section[];
  const sorted = [...sections].sort(
    (x, y) => forward.bySection[y] - forward.bySection[x],
  );

  return {
    user: other,
    score: calibrateScore(combined),
    rawScore: Math.round(combined * 1000) / 10,
    bySection: forward.bySection,
    bestSection: sorted[0],
    worstSection: sorted[sorted.length - 1],
  };
}

/** 후보 전체를 돌려 궁합 높은 순으로 정렬해 반환 */
export function findMatches(me: User, pool: User[], limit?: number): MatchResult[] {
  const results: MatchResult[] = [];
  for (const other of pool) {
    const m = computeMatch(me, other);
    if (m) results.push(m);
  }
  results.sort((a, b) => b.score - a.score);
  return limit === undefined ? results : results.slice(0, limit);
}
