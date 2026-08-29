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
  pet: '반려동물',
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
    case 'pet': return f.pet !== undefined && filter.allowed.includes(f.pet);
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

/**
 * 영역별 문항 수. 가중치를 나눠주는 데 쓴다.
 *
 * 이걸로 나누지 않으면 **문항이 많은 영역이 자동으로 더 큰 힘을 갖는다.**
 * 가치관에 문항을 10개 더 넣었을 뿐인데 가치관의 비중이 35%에서 50%로
 * 올라가버리는 식이다. 그러면 문항을 추가할 때마다 균형이 깨진다.
 *
 * 영역 안에서 나눠 가지게 하면, 문항 수는 **측정의 정밀도**만 올리고
 * 영역 간 비중은 SECTION_WEIGHTS가 정한 대로 유지된다.
 */
const SECTION_COUNTS: Record<Section, number> = (() => {
  const c = {} as Record<Section, number>;
  for (const s of Object.keys(SECTION_WEIGHTS) as Section[]) c[s] = 0;
  for (const q of QUESTIONS) c[q.section] += 1;
  return c;
})();

/** 이 사람에게 이 문항이 갖는 무게 */
function questionWeight(q: Question, user: User): number {
  const boostedGroups = new Set(
    user.stanceIds.map((id) => STANCE_TO_GROUP[id]).filter(Boolean),
  );
  const boosted = q.stanceGroup !== undefined && boostedGroups.has(q.stanceGroup);
  const perQuestion = SECTION_WEIGHTS[q.section] / Math.max(1, SECTION_COUNTS[q.section]);
  return perQuestion * (boosted ? PRIORITY_BOOST : 1);
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
 * ── 왜 단순 비례가 아니라 백분위인가 ──────────────────────
 *
 * 원점수를 그대로 쓰거나 직선으로 늘리면, 문항을 추가하거나 뺄 때마다
 * 같은 "80점"이 다른 의미가 된다. 기준을 정해도 매번 다시 잡아야 한다.
 *
 * 그래서 점수를 **분포상의 위치**로 정의한다.
 * 80점은 "원점수 얼마"가 아니라 **"가능한 모든 짝 중 상위 10%"**를 뜻한다.
 * 문항이 바뀌어도 이 의미는 그대로 유지된다.
 *
 * 아래 두 배열이 짝을 이루는 눈금이다.
 *   RAW_ANCHORS   — 실제 분포에서 관측한 원점수
 *   SCORE_ANCHORS — 그 지점에 부여할 궁합 점수
 *
 * 기준점은 이렇게 잡았다.
 *   상위 25% → 65점   (느긋하게)
 *   상위 10% → 80점   (어느 정도, 추천)
 *   상위  3% → 90점   (깐깐하게)
 *   중앙값   → 45점
 *
 * ⚠️ RAW_ANCHORS는 지금 가짜 사용자 600명(약 5,800쌍)에서 뽑은 값이다.
 *    실제 사용자가 쌓이면 같은 방법으로 다시 뽑아 이 배열만 갈아끼우면 된다.
 *    SCORE_ANCHORS(무엇을 몇 점이라 부를지)는 제품 결정이라 그대로 둔다.
 */
const RAW_ANCHORS = [
  0.436, 0.484, 0.493, 0.510, 0.531, 0.546, 0.558,
  0.797, 0.827, 0.846, 0.856, 0.872, 0.879, 0.906,
];
const SCORE_ANCHORS = [
  0, 8, 13, 25, 45, 55, 65,
  74, 80, 86, 90, 95, 97, 100,
];
/** 각 눈금이 어느 백분위인지 (문서용 — 계산에는 쓰지 않는다) */
export const ANCHOR_PERCENTILES = [
  0, 5, 10, 25, 50, 65, 75, 85, 90, 95, 97, 99, 99.5, 100,
];

export function calibrateScore(raw: number): number {
  if (raw <= RAW_ANCHORS[0]) return 0;
  const last = RAW_ANCHORS.length - 1;
  if (raw >= RAW_ANCHORS[last]) return 100;

  for (let i = 0; i < last; i++) {
    const lo = RAW_ANCHORS[i];
    const hi = RAW_ANCHORS[i + 1];
    if (raw > hi) continue;
    const t = hi === lo ? 0 : (raw - lo) / (hi - lo);
    const score = SCORE_ANCHORS[i] + t * (SCORE_ANCHORS[i + 1] - SCORE_ANCHORS[i]);
    return Math.round(score * 10) / 10;
  }
  return 100;
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
