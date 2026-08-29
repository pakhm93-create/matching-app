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
import { computeMatch, findMatches, passesHardFilter } from '../src/lib/matching';
import { generatePlantedUsers, generateUsers } from '../src/lib/fake-users';
import { SECTION_LABELS } from '../src/lib/questions';
import type { Section, User } from '../src/lib/types';
import { calcAge } from '../src/lib/types';

const line = (s = '') => console.log(s);
const hr = () => line('─'.repeat(58));

// ── 1·2) 극단 케이스 ───────────────────────────
const [twinA, twinB, oppA, oppB] = generatePlantedUsers();

hr();
line('1. 극단 케이스 검증');
hr();

const twinMatch = computeMatch(twinA, twinB);
const oppMatch = computeMatch(oppA, oppB);

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
line(`  나: ${me.profile.nickname} (${calcAge(me.profile.birthYear, me.profile.birthMonth)}세, ${me.profile.areas.join("·")}, ${me.profile.gender === 'male' ? '남' : '여'})`);
line(`  하드 필터 통과 후보: ${results.length}명 / 전체 49명`);

if (results.length > 0) {
  const scores = results.map((r) => r.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  line(`  점수 범위: ${Math.min(...scores)} ~ ${Math.max(...scores)}점 (평균 ${avg.toFixed(1)}점)`);

  line();
  line('  ── 상위 5명 ──');
  for (const r of results.slice(0, 5)) {
    const p = r.user.profile;
    const best = SECTION_LABELS[r.bestSection as Section];
    const worst = SECTION_LABELS[r.worstSection as Section];
    line(`   ${String(r.score).padStart(5)}점  ${p.nickname} (${calcAge(p.birthYear, p.birthMonth)}세, ${p.areas.join("·")})`);
    line(`          잘 맞음: ${best}  /  덜 맞음: ${worst}`);
  }

  // 점수 분포 히스토그램
  line();
  line('  ── 점수 분포 ──');
  const buckets = new Array(10).fill(0);
  for (const s of scores) buckets[Math.min(9, Math.floor(s / 10))]++;
  buckets.forEach((n, i) => {
    if (i < 2) return; // 0~20점 구간은 거의 안 나오므로 생략
    line(`   ${String(i * 10).padStart(3)}~${String(i * 10 + 9).padStart(3)}점 | ${'█'.repeat(n)} ${n}`);
  });
}

// ── 4) 하드 필터 동작 확인 ─────────────────────
hr();
line('3. 하드 필터 검증');
hr();

const strict: User = {
  ...me,
  priorities: [
    { key: 'smoking', allowed: ['none'] },   // 비흡연자만
    { key: 'region', allowed: ['서울'] },     // 서울에서 만날 수 있는 사람만
    { key: 'age', min: 28, max: 33 },        // 28~33세만
  ],
};
const strictResults = findMatches(strict, pool);
line(`  느슨한 조건: ${results.length}명`);
line(`  빡빡한 조건(비흡연·서울·28~33세): ${strictResults.length}명`);
line(`  → 필터가 후보를 줄이는가: ${strictResults.length < results.length ? '✅' : '❌'}`);

// 필터 통과자가 정말 조건을 만족하는지 확인
const allValid = strictResults.every((r) => {
  const p = r.user.profile;
  const age = calcAge(p.birthYear, p.birthMonth);
  return p.smoking === 'none' && p.areas.includes('서울') && age >= 28 && age <= 33;
});
line(`  → 통과한 후보가 조건을 실제로 만족하는가: ${allValid ? '✅' : '❌'}`);

// 양방향 확인: 상대의 조건에도 내가 맞아야 한다
const picky: User = {
  ...pool[1],
  priorities: [{ key: 'age', min: 99, max: 100 }], // 아무도 만족 못 하는 조건
};
line(`  → 상대가 불가능한 조건을 걸면 매칭 제외되는가: ${!passesHardFilter(me, picky) ? '✅' : '❌'}`);

hr();
