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

line('');
line('  둘이 합쳐서 이 거리를 덮으면 만날 수 있다고 본다 (중간에서 만나므로)');

// 사용자가 든 예: 강북(1시간 30분) ↔ 수원(1시간), 집 사이 88분
const gangbuk = mkAt(pool[0], '서울', '강북구', 90, 'male');
const suwon = mkAt(pool[1], '경기', '수원시', 60, 'female');
line(`  → 서울(90분) + 수원(60분) = 150분 ≥ 88분, 만날 수 있는가: ${passesHardFilter(prepare(gangbuk), prepare(suwon)) ? '✅' : '❌'}`);

// 둘 다 30분씩만 움직일 수 있으면 서울-수원은 무리다
const tightA = mkAt(pool[0], '서울', '강북구', 30, 'male');
const tightB = mkAt(pool[1], '경기', '수원시', 30, 'female');
line(`  → 둘 다 30분만 가능하면(합 60분 < 88분) 제외되는가: ${!passesHardFilter(prepare(tightA), prepare(tightB)) ? '✅' : '❌'}`);

// 서울-부산은 둘이 아무리 합쳐도 어렵다
const seoul2h = mkAt(pool[0], '서울', '마포구', 120, 'male');
const busan2h = mkAt(pool[1], '부산', '해운대구', 120, 'female');
line(`  → 서울-부산은 각자 2시간씩(합 240분 < 299분) 나와도 제외되는가: ${!passesHardFilter(prepare(seoul2h), prepare(busan2h)) ? '✅' : '❌'}`);

// 파주(경기 북부)와 평택(경기 남부)은 같은 도지만 126분이라 멀다
const paju = mkAt(pool[0], '경기', '파주시', 30, 'male');
const pyeongtaek = mkAt(pool[1], '경기', '평택시', 30, 'female');
line(`  → 같은 경기도라도 파주-평택은 둘 다 30분이면 제외되는가: ${!passesHardFilter(prepare(paju), prepare(pyeongtaek)) ? '✅' : '❌'}`);

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
const candidatesPerPerson = allScores.length / sampleSize;

line(`  표본 ${sampleSize}명 × 400명 풀 = ${allScores.length}쌍 (1인당 후보 ${candidatesPerPerson.toFixed(0)}명)`);
line(`  중앙값 ${at(0.5).toFixed(1)}점 · 상위10% ${at(0.9).toFixed(1)}점 · 상위1% ${at(0.99).toFixed(1)}점`);
line('');

// 점수는 백분위로 정의돼 있으므로 절대 인원이 아니라 **후보 대비 비율**로 본다.
// 인원은 풀 크기에 따라 달라지지만 비율은 눈금이 제대로 그려졌는지를 보여준다.
const NAMES: Record<string, string> = {
  strict: '아주 잘 맞는 분만', balanced: '어느 정도(추천)', relaxed: '조금 달라도',
};
const TARGET: Record<string, [number, number]> = {
  strict: [1, 6],     // 상위 3% 근처
  balanced: [5, 16],  // 상위 10% 근처
  relaxed: [15, 35],  // 상위 25% 근처
};
let ok = true;
for (const [k, t] of Object.entries(STRICTNESS_THRESHOLD)) {
  const avg = perPerson[k] / sampleSize;
  const share = (avg / candidatesPerPerson) * 100;
  const [lo, hi] = TARGET[k];
  const good = share >= lo && share <= hi && avg >= 0.5;
  if (!good) ok = false;
  line(`  ${String(t).padStart(2)}점 이상 · ${NAMES[k]}: 후보의 ${share.toFixed(1)}% (1인당 ${avg.toFixed(1)}명)  ${good ? '✅' : `❌ 목표 ${lo}~${hi}%`}`);
}
line('');
line(`  → 눈금이 제대로 그려졌는가: ${ok ? '✅' : '❌ RAW_ANCHORS를 다시 측정할 것'}`);
hr();
