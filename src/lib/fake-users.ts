/**
 * 검증용 가짜 사용자 생성기.
 * 실제 사용자가 없는 MVP 단계에서 매칭이 말이 되는지 확인하기 위한 것.
 */
import type { Answers, Gender, Profile, User } from './types';
import { QUESTIONS } from './questions';
import { EDUCATIONS } from './labels';
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

/** 활동 가능 지역 (겹치는 지역이 있으면 매칭 가능) */
function randomAreas(rnd: () => number, home: string): string[] {
  const areas = new Set([home]);
  // 수도권 거주자는 서울까지 활동 범위에 넣는 경우가 많다
  if ((home === '경기' || home === '인천') && rnd() < 0.7) areas.add('서울');
  if (rnd() < 0.25) areas.add(pick(rnd, SIDO));
  return [...areas];
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
    areas: randomAreas(rnd, sido),
    heightCm: gender === 'male' ? intBetween(rnd, 165, 190) : intBetween(rnd, 152, 175),
    education: rnd() < 0.8 ? pick(rnd, EDUCATIONS) : undefined,
  };
}

export function generateUsers(count: number, seed = 42): User[] {
  const rnd = makeRandom(seed);
  const users: User[] = [];
  for (let i = 1; i <= count; i++) {
    const gender: Gender = i % 2 === 0 ? 'female' : 'male';
    users.push({
      profile: randomProfile(rnd, i, gender),
      // 검증용이라 조건은 넉넉하게 (하드 필터에 잘 걸리지 않게)
      stanceIds: [],
      ageRange: { min: 20, max: 60 },
      answers: randomAnswers(rnd),
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
  twinAnswers['l3'] = Math.min(5, (answersA['l3'] as number) + 1);

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
      sido: '서울', sigungu: '마포구', areas: ['서울'],
      heightCm: 170, education: '대졸',
    },
    stanceIds: [],
    ageRange: { min: 20, max: 60 },
    answers,
  });

  return [
    mk('twinA', '쌍둥이A', 'male', answersA),
    mk('twinB', '쌍둥이B', 'female', twinAnswers),
    mk('oppA', '정반대A', 'male', answersA),
    mk('oppB', '정반대B', 'female', oppositeAnswers),
  ];
}
