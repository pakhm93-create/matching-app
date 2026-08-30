/**
 * 검증용 가짜 사용자 생성기.
 * 실제 사용자가 없는 MVP 단계에서 매칭이 말이 되는지 확인하기 위한 것.
 */
import type { Answers, Gender, Profile, User } from './types';
import { QUESTIONS } from './questions';
import { EDUCATIONS, MBTI_TYPES } from './labels';
import { REGIONS, SIDO } from './regions';

/** 같은 씨앗을 주면 항상 같은 결과가 나오는 난수 생성기 */
function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 수도권 인구 비중을 반영해 후보에 더 자주 넣는다 */
const WEIGHTED_SIDO = ['서울', '서울', '서울', '경기', '경기', '인천', ...SIDO];

const pick = <T,>(rnd: () => number, arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const intBetween = (rnd: () => number, min: number, max: number) =>
  min + Math.floor(rnd() * (max - min + 1));

function randomAnswers(rnd: () => number): Answers {
  const answers: Answers = {};
  for (const q of QUESTIONS) {
    if (q.type === 'scale') {
      answers[q.id] = intBetween(rnd, 1, 5);
    } else if (q.type === 'choice') {
      answers[q.id] = pick(rnd, q.options!);
    } else {
      const n = intBetween(rnd, 1, Math.min(5, q.options!.length));
      const shuffled = [...q.options!].sort(() => rnd() - 0.5);
      answers[q.id] = shuffled.slice(0, n);
    }
  }
  return answers;
}

/**
 * 성향이 비슷한 무리(클러스터)를 몇 개 만든다.
 *
 * 완전 무작위로 만들면 궁합이 높은 사람이 애초에 존재하지 않아
 * 최고 점수가 40점대에 머문다. 실제 사람은 성향이 뭉쳐 다니므로
 * 무리를 만들고 거기에 잡음을 섞어야 현실적인 점수 분포가 나온다.
 */
const CLUSTER_COUNT = 6;

function makeClusters(): Answers[] {
  return Array.from({ length: CLUSTER_COUNT }, (_, i) =>
    randomAnswers(makeRandom(1000 + i * 37)),
  );
}

/** 무리의 기준 답변에 잡음을 섞어 한 사람을 만든다 */
function answersNearCluster(rnd: () => number, center: Answers): Answers {
  const answers: Answers = {};
  for (const q of QUESTIONS) {
    const c = center[q.id];
    if (q.type === 'scale') {
      // 70%는 기준값 그대로, 나머지는 한두 칸 흔든다
      const drift = rnd() < 0.7 ? 0 : rnd() < 0.8 ? (rnd() < 0.5 ? -1 : 1) : (rnd() < 0.5 ? -2 : 2);
      answers[q.id] = Math.max(1, Math.min(5, (c as number) + drift));
    } else if (q.type === 'choice') {
      answers[q.id] = rnd() < 0.75 ? (c as string) : pick(rnd, q.options!);
    } else {
      // 무리의 관심사 중 일부를 가져가고 한두 개는 자기 것을 더한다
      const base = (c as string[]).filter(() => rnd() < 0.7);
      const extra = q.options!.filter((o) => !base.includes(o) && rnd() < 0.15);
      answers[q.id] = base.concat(extra).slice(0, 6);
      if ((answers[q.id] as string[]).length === 0) answers[q.id] = [pick(rnd, q.options!)];
    }
  }
  return answers;
}

const THIS_YEAR = new Date().getFullYear();

function randomProfile(rnd: () => number, i: number, gender: Gender): Profile {
  const age = intBetween(rnd, 24, 42);
  const sido = pick(rnd, WEIGHTED_SIDO);
  return {
    id: `u${i}`,
    nickname: `사용자${i}`,
    birthYear: THIS_YEAR - age,
    birthMonth: intBetween(rnd, 1, 12),
    gender,
    seeking: gender === 'male' ? ['female'] : ['male'],
    sido,
    sigungu: pick(rnd, REGIONS[sido]),
    heightCm: gender === 'male' ? intBetween(rnd, 165, 190) : intBetween(rnd, 152, 175),
    education: rnd() < 0.8 ? pick(rnd, EDUCATIONS) : undefined,
    mbti: rnd() < 0.7 ? pick(rnd, MBTI_TYPES) : undefined,
  };
}

/**
 * @param clustered 성향이 비슷한 무리를 만들어 현실적인 점수 분포를 낸다.
 *                  false면 완전 무작위 (알고리즘의 바닥값을 볼 때 쓴다)
 */
export function generateUsers(count: number, seed = 42, clustered = true): User[] {
  const rnd = makeRandom(seed);
  const clusters = makeClusters();
  const users: User[] = [];
  for (let i = 1; i <= count; i++) {
    const gender: Gender = i % 2 === 0 ? 'female' : 'male';
    const center = clusters[Math.floor(rnd() * clusters.length)];
    users.push({
      profile: randomProfile(rnd, i, gender),
      // 검증용이라 조건은 넉넉하게 (하드 필터에 잘 걸리지 않게)
      stanceIds: [],
      ageRange: { min: 20, max: 60 },
      // 실제로 사람들이 고를 법한 분포. 대부분 1~2시간 안쪽이다
      maxTravelMinutes: pick(rnd, [30, 60, 60, 60, 90, 90, 90, 120, 120, 180, 9999]),
      answers: clustered ? answersNearCluster(rnd, center) : randomAnswers(rnd),
    });
  }
  return users;
}

/**
 * 검증용으로 일부러 심는 극단적인 사람들.
 * - twinA / twinB : 거의 동일 → 궁합이 매우 높아야 정상
 * - oppA  / oppB  : 정반대   → 궁합이 매우 낮아야 정상
 */
export function generatePlantedUsers(): User[] {
  const base = makeRandom(7);
  const raw = randomAnswers(base);

  // 5점 척도에서 3의 반대는 3이라 진짜 반대가 만들어지지 않는다.
  // 기준 답변을 1 또는 5의 극단으로 밀어낸 뒤 뒤집어야 정반대가 된다.
  const answersA: Answers = {};
  for (const q of QUESTIONS) {
    const v = raw[q.id];
    answersA[q.id] = q.type === 'scale' ? ((v as number) <= 3 ? 1 : 5) : v;
  }

  const twinAnswers: Answers = { ...answersA };
  twinAnswers['life_tidy'] = Math.min(5, (answersA['life_tidy'] as number) + 1);

  const oppositeAnswers: Answers = {};
  for (const q of QUESTIONS) {
    const v = answersA[q.id];
    if (q.type === 'scale') {
      oppositeAnswers[q.id] = 6 - (v as number);
    } else if (q.type === 'choice') {
      const others = q.options!.filter((o) => o !== v);
      oppositeAnswers[q.id] = others[others.length - 1];
    } else {
      const chosen = new Set(v as string[]);
      oppositeAnswers[q.id] = q.options!.filter((o) => !chosen.has(o)).slice(0, 3);
    }
  }

  const mk = (id: string, nickname: string, gender: Gender, answers: Answers): User => ({
    profile: {
      id, nickname, birthYear: THIS_YEAR - 30, birthMonth: 6, gender,
      seeking: gender === 'male' ? ['female'] : ['male'],
      sido: '서울', sigungu: '마포구',
      heightCm: 170, education: '대졸',
    },
    stanceIds: [],
    ageRange: { min: 20, max: 60 },
    maxTravelMinutes: 9999,
    answers,
  });

  return [
    mk('twinA', '쌍둥이A', 'male', answersA),
    mk('twinB', '쌍둥이B', 'female', twinAnswers),
    mk('oppA', '정반대A', 'male', answersA),
    mk('oppB', '정반대B', 'female', oppositeAnswers),
  ];
}
