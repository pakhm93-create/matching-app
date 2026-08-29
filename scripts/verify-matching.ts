/**
 * 매칭 알고리즘 검증 스크립트.
 * 실행:  npm run verify
 *
 * 확인하는 것:
 *  1) 거의 같은 사람끼리는 궁합이 매우 높게 나오는가
 *  2) 정반대인 사람끼리는 궁합이 매우 낮게 나오는가
 *  3) 무작위 50명의 점수 분포가 한쪽에 쏠려 있지 않은가
 *  4) 하드 필터가 실제로 후보를 걸러내는가
 */
import { calcAge, STRICTNESS_THRESHOLD, type Section, type User } from '../src/lib/types';
import { computeMatch, findMatches, passesHardFilter, prepare } from '../src/lib/matching';
import { generatePlantedUsers, generateUsers } from '../src/lib/fake-users';
import { SECTION_LABELS } from '../src/lib/questions';
import { deriveFacts, politicsLabel } from '../src/lib/facts';

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

  line();
  line('  ── 점수 분포 ──');
  const buckets = new Array(10).fill(0);
  for (const s of scores) buckets[Math.min(9, Math.floor(s / 10))]++;
  buckets.forEach((n, i) => {
    line(`   ${String(i * 10).padStart(3)}~${String(i * 10 + 9).padStart(3)}점 | ${'█'.repeat(n)} ${n}`);
  });
}

// ── 4) 하드 필터 동작 확인 ─────────────────────
hr();
line('3. 하드 필터 검증');
hr();

// 절대 조건 3개를 건 나 — 흡연·음주·결혼관이 나와 같아야 한다
const strict: User = {
  ...me,
  stanceIds: ['smoking', 'drinking', 'marriage'],
  ageRange: { min: 25, max: 40 },
};
const strictResults = findMatches(strict, pool);
line(`  조건 없음: ${results.length}명`);
line(`  절대 조건 3개(흡연·음주·결혼관): ${strictResults.length}명`);
line(`  → 필터가 후보를 줄이는가: ${strictResults.length <= results.length ? '✅' : '❌'}`);

// 통과자가 정말 나와 같은 값을 갖는지
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

// 지역이 겹치지 않으면 제외되는가
const farAway: User = {
  ...pool[1],
  profile: { ...pool[1].profile, areas: ['제주'] },
  stanceIds: [], ageRange: null,
};
const meSeoul: User = { ...me, profile: { ...me.profile, areas: ['서울'] }, stanceIds: [], ageRange: null };
line(`  → 활동 지역이 하나도 안 겹치면 제외되는가: ${!passesHardFilter(prepare(meSeoul), prepare(farAway)) ? '✅' : '❌'}`);

// 겹치면 통과하는가 (경기 사는 사람이 서울에서도 만날 수 있는 경우)
const overlapping: User = {
  ...pool[1],
  profile: { ...pool[1].profile, gender: 'female', seeking: ['male'], areas: ['경기', '서울'] },
  stanceIds: [], ageRange: null,
};
const meMale: User = {
  ...me,
  profile: { ...me.profile, gender: 'male', seeking: ['female'], areas: ['서울'] },
  stanceIds: [], ageRange: null,
};
line(`  → 활동 지역이 하나라도 겹치면 통과하는가: ${passesHardFilter(prepare(meMale), prepare(overlapping)) ? '✅' : '❌'}`);

hr();

// ── 5) 매칭 기준(궁합 점수)이 현실적인가 ────────
hr();
line('4. 매칭 기준 검증');
hr();
line('  깐깐/추천/여유 기준이 실제로 몇 명을 통과시키는지 본다.');
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
const NAMES: Record<string, string> = { strict: '깐깐하게', balanced: '어느 정도(추천)', relaxed: '느긋하게' };
let ok = true;
for (const [k, t] of Object.entries(STRICTNESS_THRESHOLD)) {
  const avg = perPerson[k] / sampleSize;
  // 한 명당 0.5~15명 사이면 배급 모델로 쓸 만하다
  const good = avg >= 0.5 && avg <= 15;
  if (!good) ok = false;
  line(`  ${t}점 이상 · ${NAMES[k]}: 1인당 평균 ${avg.toFixed(1)}명  ${good ? '✅' : '❌'}`);
}
line('');
line(`  → 세 기준이 모두 쓸 만한가: ${ok ? '✅' : '❌ 기준 점수나 눈금(RAW_CEILING)을 조정할 것'}`);
hr();
