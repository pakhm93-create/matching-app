/**
 * 매칭 알고리즘 검증 스크립트.
 * 실행:  npm run verify
 *
 * 확인하는 것:
 *  1) 거의 같은 사람끼리는 궁합이 매우 높게 나오는가
 *  2) 정반대인 사람끼리는 궁합이 매우 낮게 나오는가
 *  3) 점수 분포가 한쪽에 쏠려 있지 않은가
 *  4) 하드 필터(절대 조건·나이·거리)가 실제로 후보를 걸러내는가
 *  5) 매칭 기준 세 가지가 현실적인 수의 후보를 남기는가
 */
import { calcAge, STRICTNESS_THRESHOLD, type Section, type User } from '../src/lib/types';
import { computeMatch, findMatches, passesHardFilter, prepare } from '../src/lib/matching';
import { generatePlantedUsers, generateUsers } from '../src/lib/fake-users';
import { SECTION_LABELS } from '../src/lib/questions';
import { deriveFacts, politicsLabel } from '../src/lib/facts';
import { travelMinutes, zoneOf } from '../src/lib/zones';

const line = (s = '') => console.log(s);
const hr = () => line('─'.repeat(58));

// ── 1·2) 극단 케이스 ───────────────────────────
const [twinA, twinB, oppA, oppB] = generatePlantedUsers();

hr();
line('1. 극단 케이스 검증');
hr();

const twinMatch = computeMatch(prepare(twinA), prepare(twinB));
const oppMatch = computeMatch(prepare(oppA), prepare(oppB));
const twinScore = twinMatch?.score ?? -1;
const oppScore = oppMatch?.score ?? -1;

line(`  거의 동일한 두 사람 : ${twinScore}점 (원점수 ${twinMatch?.rawScore})   (기대: 90 이상)  ${twinScore >= 90 ? '✅' : '❌'}`);
line(`  완전히 반대인 두 사람: ${oppScore}점 (원점수 ${oppMatch?.rawScore})   (기대: 20 이하)  ${oppScore <= 20 ? '✅' : '❌'}`);

// ── 3) 무작위 50명 분포 ────────────────────────
const pool = generateUsers(50);
const me: User = pool[0];
const results = findMatches(me, pool);

hr();
line('2. 무작위 50명 매칭 결과');
hr();
const myFacts = deriveFacts(me.answers);
line(`  나: ${me.profile.nickname} (${calcAge(me.profile.birthYear, me.profile.birthMonth)}세, ${me.profile.sido} ${me.profile.sigungu}, ${me.profile.gender === 'male' ? '남' : '여'})`);
line(`  설문에서 파악한 나: 흡연 ${myFacts.smoking} · 음주 ${myFacts.drinking} · ${politicsLabel(myFacts.politics)}`);
line(`  하드 필터 통과 후보: ${results.length}명 / 전체 49명`);

if (results.length > 0) {
  const scores = results.map((r) => r.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  line(`  점수 범위: ${Math.min(...scores)} ~ ${Math.max(...scores)}점 (평균 ${avg.toFixed(1)}점)`);

  line();
  line('  ── 상위 5명 ──');
  for (const r of results.slice(0, 5)) {
    const p = r.user.profile;
    line(`   ${String(r.score).padStart(5)}점  ${p.nickname} (${calcAge(p.birthYear, p.birthMonth)}세, ${p.sido} ${p.sigungu})`);
    line(`          잘 맞음: ${SECTION_LABELS[r.bestSection as Section]}  /  덜 맞음: ${SECTION_LABELS[r.worstSection as Section]}`);
  }
}

// ── 4) 하드 필터 동작 확인 ─────────────────────
hr();
line('3. 하드 필터 검증');
hr();

// 절대 조건 3개 — 흡연·음주·결혼관이 나와 같아야 한다
const strict: User = {
  ...me,
  stanceIds: ['smoking', 'drinking', 'marriage'],
  ageRange: { min: 25, max: 40 },
};
const strictResults = findMatches(strict, pool);
line(`  조건 없음: ${results.length}명`);
line(`  절대 조건 3개(흡연·음주·결혼관): ${strictResults.length}명`);
line(`  → 필터가 후보를 줄이는가: ${strictResults.length <= results.length ? '✅' : '❌'}`);

const allValid = strictResults.every((r) => {
  const f = deriveFacts(r.user.answers);
  const p = r.user.profile;
  const age = calcAge(p.birthYear, p.birthMonth);
  return f.smoking === myFacts.smoking && f.drinking === myFacts.drinking
    && f.marriage === myFacts.marriage && age >= 25 && age <= 40;
});
line(`  → 통과한 후보가 조건을 실제로 만족하는가: ${allValid ? '✅' : '❌'}`);

// 양방향 확인: 상대의 조건에도 내가 맞아야 한다
const picky: User = { ...pool[1], stanceIds: [], ageRange: { min: 99, max: 100 } };
line(`  → 상대가 불가능한 조건을 걸면 매칭 제외되는가: ${!passesHardFilter(prepare(me), prepare(picky)) ? '✅' : '❌'}`);

// ── 거리 조건 ──────────────────────────────────
hr();
line('4. 거리 조건 검증');
hr();

const pairs: [string, string, string, string][] = [
  ['서울', '마포구', '서울', '강남구'],
  ['서울', '마포구', '경기', '의정부시'],
  ['서울', '마포구', '경기', '수원시'],
  ['서울', '마포구', '인천', '연수구'],
  ['서울', '마포구', '대전', '유성구'],
  ['서울', '마포구', '부산', '해운대구'],
  ['경기', '파주시', '경기', '평택시'],
];
line('  예상 이동 시간');
for (const [s1, g1, s2, g2] of pairs) {
  const mins = travelMinutes(zoneOf(s1, g1), zoneOf(s2, g2));
  line(`   ${(s1 + ' ' + g1).padEnd(10)} ↔ ${(s2 + ' ' + g2).padEnd(10)} ${String(mins).padStart(4)}분`);
}

const mkAt = (u: User, sido: string, sigungu: string, minutes: number, gender: 'male' | 'female'): User => ({
  ...u,
  profile: { ...u.profile, sido, sigungu, gender, seeking: [gender === 'male' ? 'female' : 'male'] },
  stanceIds: [], ageRange: null, maxTravelMinutes: minutes,
});

const seoulTight = mkAt(pool[0], '서울', '마포구', 60, 'male');
const busanPerson = mkAt(pool[1], '부산', '해운대구', 9999, 'female');
const seoulNear = mkAt(pool[1], '경기', '의정부시', 9999, 'female');
line('');
line(`  → 1시간 조건인 서울 사람과 부산 사람이 제외되는가: ${!passesHardFilter(prepare(seoulTight), prepare(busanPerson)) ? '✅' : '❌'}`);
line(`  → 1시간 조건인 서울 사람과 의정부 사람이 통과하는가: ${passesHardFilter(prepare(seoulTight), prepare(seoulNear)) ? '✅' : '❌'}`);
// 파주(경기 북부)와 평택(경기 남부)은 같은 도지만 멀다
const paju = mkAt(pool[0], '경기', '파주시', 60, 'male');
const pyeongtaek = mkAt(pool[1], '경기', '평택시', 9999, 'female');
line(`  → 같은 경기도라도 파주-평택이 1시간 조건에서 걸러지는가: ${!passesHardFilter(prepare(paju), prepare(pyeongtaek)) ? '✅' : '❌'}`);

// ── 5) 매칭 기준 ──────────────────────────────
hr();
line('5. 매칭 기준 검증');
hr();
line('  세 기준이 실제로 몇 명을 통과시키는지 본다.');
line('  아무도 통과 못 하면 기준이 무의미하고, 다 통과하면 기준이 없는 것과 같다.');
line('');

const bigPool = generateUsers(400, 99);
const sampleSize = 40;
const perPerson: Record<string, number> = {};
const allScores: number[] = [];

for (let i = 0; i < sampleSize; i++) {
  const ms = findMatches(bigPool[i], bigPool);
  for (const m of ms) allScores.push(m.score);
  for (const [k, t] of Object.entries(STRICTNESS_THRESHOLD)) {
    perPerson[k] = (perPerson[k] ?? 0) + ms.filter((m) => m.score >= t).length;
  }
}
allScores.sort((a, b) => a - b);
const at = (p: number) => allScores[Math.floor(allScores.length * p)];

line(`  표본 ${sampleSize}명 × 400명 풀 = ${allScores.length}쌍`);
line(`  중앙값 ${at(0.5).toFixed(1)}점 · 상위10% ${at(0.9).toFixed(1)}점 · 상위1% ${at(0.99).toFixed(1)}점`);
line('');
const NAMES: Record<string, string> = {
  strict: '아주 잘 맞는 분만', balanced: '어느 정도(추천)', relaxed: '조금 달라도',
};
let ok = true;
for (const [k, t] of Object.entries(STRICTNESS_THRESHOLD)) {
  const avg = perPerson[k] / sampleSize;
  // 한 명당 0.5~15명 사이면 배급 모델로 쓸 만하다
  const good = avg >= 0.5 && avg <= 15;
  if (!good) ok = false;
  line(`  ${String(t).padStart(2)}점 이상 · ${NAMES[k]}: 1인당 평균 ${avg.toFixed(1)}명  ${good ? '✅' : '❌'}`);
}
line('');
line(`  → 세 기준이 모두 쓸 만한가: ${ok ? '✅' : '❌ 기준 점수나 눈금(RAW_ANCHORS)을 조정할 것'}`);
hr();
