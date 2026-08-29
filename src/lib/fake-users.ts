/**
 * 검증용 가짜 사용자 생성기.
 * 실제 사용자가 없는 MVP 단계에서 매칭이 말이 되는지 확인하기 위한 것.
 */
import type {
  Answers, Children, Drinking, Gender, Marriage, Pet, Profile,
  PriorityFilter, Religion, Smoking, User,
} from './types';
import { QUESTIONS } from './questions';
import { AREAS } from './labels';

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

const JOBS = ['회사원', '전문직', '공무원', '자영업', '프리랜서', '학생'];
const EDUCATIONS = ['고졸', '전문대졸', '대졸', '대학원졸'];
const SMOKING: Smoking[] = ['none', 'sometimes', 'yes'];
const DRINKING: Drinking[] = ['none', 'sometimes', 'often'];
const MARRIAGE: Marriage[] = ['yes', 'no', 'undecided'];
const CHILDREN: Children[] = ['want', 'not', 'undecided'];
const PETS: Pet[] = ['has', 'none', 'allergic'];
const RELIGIONS: Religion[] = ['none', 'protestant', 'catholic', 'buddhist', 'other'];
/** 수도권은 실제 인구 비중이 높으므로 후보에 더 자주 넣는다 */
const WEIGHTED_AREAS = ['서울', '서울', '서울', '경기', '경기', '인천', ...AREAS];

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

/** 활동 지역 1~3개 (겹치는 지역이 있으면 매칭 가능) */
function randomAreas(rnd: () => number): string[] {
  const main = pick(rnd, WEIGHTED_AREAS);
  const areas = new Set([main]);
  // 수도권 거주자는 서울까지 활동 범위에 넣는 경우가 많다
  if ((main === '경기' || main === '인천') && rnd() < 0.7) areas.add('서울');
  if (rnd() < 0.25) areas.add(pick(rnd, AREAS));
  return [...areas];
}

const THIS_YEAR = new Date().getFullYear();

function randomProfile(rnd: () => number, i: number, gender: Gender): Profile {
  const age = intBetween(rnd, 24, 42);
  return {
    id: `u${i}`,
    nickname: `사용자${i}`,
    birthYear: THIS_YEAR - age,
    birthMonth: intBetween(rnd, 1, 12),
    gender,
    seeking: gender === 'male' ? ['female'] : ['male'],
    areas: randomAreas(rnd),
    height: intBetween(rnd, 155, 190),
    job: pick(rnd, JOBS),
    education: pick(rnd, EDUCATIONS),
    smoking: pick(rnd, SMOKING),
    drinking: pick(rnd, DRINKING),
    pet: pick(rnd, PETS),
    marriage: pick(rnd, MARRIAGE),
    children: pick(rnd, CHILDREN),
    religion: pick(rnd, RELIGIONS),
    politics: rnd() < 0.15 ? null : intBetween(rnd, 1, 5),
  };
}

/** 넉넉한 조건 — 하드 필터에 잘 걸리지 않게 (검증용) */
function loosePriorities(): PriorityFilter[] {
  return [
    { key: 'age', min: 20, max: 60 },
    { key: 'region', allowed: [...AREAS] },
  ];
}

export function generateUsers(count: number, seed = 42): User[] {
  const rnd = makeRandom(seed);
  const users: User[] = [];
  for (let i = 1; i <= count; i++) {
    const gender: Gender = i % 2 === 0 ? 'female' : 'male';
    users.push({
      profile: randomProfile(rnd, i, gender),
      priorities: loosePriorities(),
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
  twinAnswers['l4'] = Math.min(5, (answersA['l4'] as number) + 1);

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
      areas: ['서울'], height: 170, job: '회사원', education: '대졸',
      smoking: 'none', drinking: 'sometimes', pet: 'none',
      marriage: 'yes', children: 'want', religion: 'none', politics: 3,
    },
    priorities: loosePriorities(),
    answers,
  });

  return [
    mk('twinA', '쌍둥이A', 'male', answersA),
    mk('twinB', '쌍둥이B', 'female', twinAnswers),
    mk('oppA', '정반대A', 'male', answersA),
    mk('oppB', '정반대B', 'female', oppositeAnswers),
  ];
}
