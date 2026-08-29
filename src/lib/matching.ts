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
  AnswerValue, Facts, MatchResult, PriorityFilter, Profile, Question, Section, User,
} from './types';
import { calcAge } from './types';
import { PRIORITY_BOOST, QUESTIONS, SECTION_WEIGHTS } from './questions';
import { deriveFacts } from './facts';
import { buildStanceFilters } from './stances';

/** 절대 조건 태그 id ↔ 문항에 붙은 그룹 이름 (가중치를 올릴 문항을 찾는 데 쓴다) */
const STANCE_TO_GROUP: Record<string, string> = {
  smoking: '담배', drinking: '술', religion: '종교',
  marriage: '결혼', children: '자녀', exercise: '운동', politics: '정치',
};

/** 사용자 한 명의 계산 결과를 재사용하기 위한 묶음 */
interface Prepared {
  user: User;
  facts: Facts;
  filters: PriorityFilter[];
}

export function prepare(user: User): Prepared {
  const facts = deriveFacts(user.answers);
  const filters: PriorityFilter[] = [
    // 지역과 나이는 "애초에 만날 수 있느냐"의 문제라 항상 적용한다
    { key: 'region', allowed: user.profile.areas },
  ];
  if (user.ageRange) {
    filters.push({ key: 'age', min: user.ageRange.min, max: user.ageRange.max });
  }
  filters.push(
    ...buildStanceFilters(user.stanceIds, facts, user.profile, user.heightRange),
  );
  return { user, facts, filters };
}

// ────────────────────────────────────────────
// 1단계: 하드 필터
// ────────────────────────────────────────────

/** 상대(프로필 + 설문에서 뽑은 사실)가 조건 하나를 만족하는가 */
function matchesFilter(p: Profile, f: Facts, filter: PriorityFilter): boolean {
  switch (filter.key) {
    case 'age': {
      const age = calcAge(p.birthYear, p.birthMonth);
      return age >= filter.min && age <= filter.max;
    }
    case 'height': return p.heightCm >= filter.min && p.heightCm <= filter.max;
    // 정치 성향을 알 수 없는 사람은 걸러내지 않는다.
    // 모른다는 것과 반대라는 것은 다르다.
    case 'politics':
      return f.politics === null || (f.politics >= filter.min && f.politics <= filter.max);
    // 지역은 "사는 곳"이 아니라 "만날 수 있는 곳"이라 겹치기만 하면 통과다.
    case 'region': return p.areas.some((a) => filter.allowed.includes(a));
    case 'smoking': return f.smoking !== undefined && filter.allowed.includes(f.smoking);
    case 'drinking': return f.drinking !== undefined && filter.allowed.includes(f.drinking);
    case 'religion': return f.religion !== undefined && filter.allowed.includes(f.religion);
    case 'marriage': return f.marriage !== undefined && filter.allowed.includes(f.marriage);
    case 'children': return f.children !== undefined && filter.allowed.includes(f.children);
    case 'exercise': return f.exercise !== undefined && filter.allowed.includes(f.exercise);
    case 'education':
      return p.education !== undefined && filter.allowed.includes(p.education);
  }
}

function seekingMatches(a: Profile, b: Profile): boolean {
  return a.seeking.includes(b.gender) && b.seeking.includes(a.gender);
}

/**
 * 후보로 올릴 수 있는가.
 * 양방향으로 검사한다 — 내 조건에 상대가 맞아야 하고, 상대의 조건에도 내가 맞아야 한다.
 */
export function passesHardFilter(a: Prepared, b: Prepared): boolean {
  if (a.user.profile.id === b.user.profile.id) return false;
  if (!seekingMatches(a.user.profile, b.user.profile)) return false;
  if (!a.filters.every((f) => matchesFilter(b.user.profile, b.facts, f))) return false;
  if (!b.filters.every((f) => matchesFilter(a.user.profile, a.facts, f))) return false;
  return true;
}

// ────────────────────────────────────────────
// 2단계: 문항별 유사도 (0 ~ 1)
// ────────────────────────────────────────────

/**
 * 두 답변이 얼마나 비슷한가. 답이 없으면 null(계산에서 제외).
 *
 * reverse(역방향) 문항은 여기서 신경 쓰지 않는다.
 * 같은 질문에 답한 것을 비교하므로 뒤집어도 차이는 동일하다.
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
  if (union.size === 0) return null;
  let overlap = 0;
  for (const v of setA) if (setB.has(v)) overlap++;
  return overlap / union.size;
}

// ────────────────────────────────────────────
// 3단계: 가중치
// ────────────────────────────────────────────

/** 이 사람에게 이 문항이 갖는 무게 = 섹션 가중치 × (절대 조건이면 5배) */
function questionWeight(q: Question, user: User): number {
  const boostedGroups = new Set(
    user.stanceIds.map((id) => STANCE_TO_GROUP[id]).filter(Boolean),
  );
  const boosted = q.stanceGroup !== undefined && boostedGroups.has(q.stanceGroup);
  return SECTION_WEIGHTS[q.section] * (boosted ? PRIORITY_BOOST : 1);
}

// ────────────────────────────────────────────
// 4단계: 양방향 점수 → 기하평균
// ────────────────────────────────────────────

interface DirectionalResult {
  score: number;
  bySection: Record<Section, number>;
}

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
 * 원점수를 사용자에게 보여줄 "궁합 점수"로 바꾼다.
 *
 * 눈금을 두 군데서 잡는다.
 *
 * BASELINE — 아무 상관 없는 두 사람도 원점수는 0.5 근처가 나온다.
 *   5점 척도에서 무작위로 답해도 평균적으로 절반은 겹치기 때문이다.
 *   이 바닥을 0점으로 끌어내린다.
 *
 * CEILING — 반대로 원점수 1.0(모든 문항이 완전히 같음)은 현실에서 나오지 않는다.
 *   천장을 1.0으로 두면 아무리 잘 맞는 두 사람도 70점대에 머물러
 *   "궁합 90점" 같은 기준이 영원히 도달 불가능해진다.
 *   그래서 현실적인 상한을 천장으로 잡는다.
 *
 * ⚠️ 두 값 모두 실제 사용자 데이터가 쌓이면 반드시 다시 잡아야 한다.
 *    기준은 백분위다 — 90점이 상위 1~2%, 80점이 상위 5% 안쪽,
 *    65점이 상위 15~20%쯤 되도록 맞춘다.
 */
export const RAW_BASELINE = 0.42;
export const RAW_CEILING = 0.92;

export function calibrateScore(raw: number): number {
  const stretched = (raw - RAW_BASELINE) / (RAW_CEILING - RAW_BASELINE);
  return Math.round(Math.max(0, Math.min(1, stretched)) * 1000) / 10;
}

/** 두 사람의 궁합을 계산한다. 하드 필터에 걸리면 null */
export function computeMatch(me: Prepared, other: Prepared): MatchResult | null {
  if (!passesHardFilter(me, other)) return null;

  const forward = directionalScore(me.user, other.user);
  const backward = directionalScore(other.user, me.user);

  // 기하평균 — 한쪽만 만족하는 매칭을 확실히 끌어내린다
  const combined = Math.sqrt(forward.score * backward.score);

  const sections = Object.keys(SECTION_WEIGHTS) as Section[];
  const sorted = [...sections].sort(
    (x, y) => forward.bySection[y] - forward.bySection[x],
  );

  return {
    user: other.user,
    score: calibrateScore(combined),
    rawScore: Math.round(combined * 1000) / 10,
    bySection: forward.bySection,
    bestSection: sorted[0],
    worstSection: sorted[sorted.length - 1],
  };
}

/** 후보 전체를 돌려 궁합 높은 순으로 정렬해 반환 */
export function findMatches(me: User, pool: User[], limit?: number): MatchResult[] {
  const prepared = prepare(me);
  const results: MatchResult[] = [];
  for (const other of pool) {
    const m = computeMatch(prepared, prepare(other));
    if (m) results.push(m);
  }
  results.sort((a, b) => b.score - a.score);
  return limit === undefined ? results : results.slice(0, limit);
}
