/**
 * 화면에 들어가는 값들이 실제로 만들어지는지 확인한다.
 * JSX 대신 화면이 쓰는 계산만 그대로 돌려본다.
 */
import { calcAge, type Section, type User } from '../src/lib/types';
import { findMatches } from '../src/lib/matching';
import { generateUsers } from '../src/lib/fake-users';
import { PAGES, QUESTIONS, SECTION_LABELS, SECTION_WEIGHTS } from '../src/lib/questions';
import { extraTraits, personaOf, PERSONA_TYPES } from '../src/lib/personality';
import { deriveFacts, politicsLabel } from '../src/lib/facts';
import { STANCE_TAGS, stanceDisplayName } from '../src/lib/stances';

const THIS_YEAR = new Date().getFullYear();
const line = (s = '') => console.log(s);
const hr = () => line('─'.repeat(58));

/** 모든 문항에 답한 가상의 나 */
const me: User = {
  profile: {
    id: 'me', nickname: '현민', birthYear: THIS_YEAR - 31, birthMonth: 3,
    gender: 'male', seeking: ['female'],
    sido: '서울', sigungu: '마포구',
    heightCm: 178, education: '대졸',
  },
  stanceIds: ['smoking', 'hobby', 'height'],
  ageRange: { min: 26, max: 36 },
  maxTravelMinutes: 120,
  heightRange: { min: 155, max: 172 },
  answers: Object.fromEntries(
    QUESTIONS.map((q) => [
      q.id,
      q.type === 'scale' ? 4 : q.type === 'choice' ? q.options![0] : q.options!.slice(0, 4),
    ]),
  ),
};

hr();
line('화면 표시값 검증');
hr();

line(`  전체 ${QUESTIONS.length}문항 · ${PAGES.length}쪽 (한 쪽 최대 ${PAGES[0].length}개)`);
const allPaged = PAGES.reduce((n, p) => n + p.length, 0);
line(`  모든 문항이 쪽에 배정됐는가: ${allPaged === QUESTIONS.length ? '✅' : `❌ ${allPaged}`}`);

// 영역별 비중이 문항 수와 무관하게 유지되는가
line();
line('  ── 영역별 비중 ──');
const cnt: Record<string, number> = {};
for (const q of QUESTIONS) cnt[q.section] = (cnt[q.section] ?? 0) + 1;
for (const s of Object.keys(SECTION_WEIGHTS) as Section[]) {
  line(`   ${SECTION_LABELS[s].padEnd(7)} ${String(cnt[s] ?? 0).padStart(3)}문항  ${(SECTION_WEIGHTS[s] * 100).toFixed(0).padStart(3)}%`);
}

// 설문에서 뽑아낸 사실
const facts = deriveFacts(me.answers);
line();
line('  ── 설문에서 파악한 값 (사용자에게는 보여주지 않음) ──');
line(`   흡연 ${facts.smoking} · 음주 ${facts.drinking} · 종교 ${facts.religion} · 반려동물 ${facts.pet}`);
line(`   결혼 ${facts.marriage} · 자녀 ${facts.children} · 운동 ${facts.exercise}`);
line(`   정치 ${facts.politics} (${politicsLabel(facts.politics)})`);
const factKeys = ['smoking', 'drinking', 'religion', 'marriage', 'children', 'exercise', 'pet'] as const;
const missing = factKeys.filter((k) => facts[k] === undefined);
line(`   모든 사실이 계산됐는가: ${missing.length === 0 ? '✅' : `❌ 빠짐: ${missing.join(', ')}`}`);

// 절대 조건
line();
line(`  ── 절대 조건 (고를 수 있는 항목 ${STANCE_TAGS.length}개) ──`);
line(`   ${STANCE_TAGS.map((s) => s.label).join(' · ')}`);
for (const id of me.stanceIds) {
  line(`   고른 것: ${STANCE_TAGS.find((s) => s.id === id)!.label} → "${stanceDisplayName(id, facts, me.profile)}"`);
}

// 성향 유형
const persona = personaOf(me.answers);
line();
line('  ── 성향 유형 ──');
line(`   ${persona.name} — ${persona.tagline}`);
line(`   ${extraTraits(me.answers).join(' / ')}`);
line(`   유형 8개 모두 정의됐는가: ${Object.keys(PERSONA_TYPES).length === 8 ? '✅' : '❌'}`);

// 매칭 카드
const matches = findMatches(me, generateUsers(200), 5);
line();
line(`  ── 매칭 결과: ${matches.length}명 ──`);
for (const m of matches) {
  const p = m.user.profile;
  line(`   ${String(Math.round(m.score)).padStart(3)}점  ${p.nickname} (${calcAge(p.birthYear, p.birthMonth)}세 · ${p.sido} ${p.sigungu} · ${p.heightCm}cm)`);
  line(`         ${personaOf(m.user.answers).name} | 잘 맞음: ${SECTION_LABELS[m.bestSection]} / 덜 맞음: ${SECTION_LABELS[m.worstSection]}`);
}

// 절대 조건이 실제로 지켜졌는지
const kept = matches.every((m) => {
  const f = deriveFacts(m.user.answers);
  const h = m.user.profile.heightCm;
  return f.smoking === facts.smoking && h >= me.heightRange!.min && h <= me.heightRange!.max;
});
line();
line(`  절대 조건(흡연·키)이 모두 지켜졌는가: ${matches.length === 0 ? '(후보 없음)' : kept ? '✅' : '❌'}`);
hr();
