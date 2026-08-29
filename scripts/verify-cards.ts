/**
 * 매칭 카드에 들어가는 값들이 실제로 만들어지는지 확인한다.
 * 화면(JSX) 대신 카드가 쓰는 계산만 그대로 돌려본다.
 */
import { calcAge, type PriorityFilter, type User } from '../src/lib/types';
import { findMatches } from '../src/lib/matching';
import { generateUsers } from '../src/lib/fake-users';
import { QUESTIONS, SECTION_LABELS } from '../src/lib/questions';
import { extraTraits, personaOf, PERSONA_TYPES } from '../src/lib/personality';
import { STANCES } from '../src/lib/stances';

const THIS_YEAR = new Date().getFullYear();

const me: User = {
  profile: {
    id: 'me', nickname: '현민', birthYear: THIS_YEAR - 31, birthMonth: 3,
    gender: 'male', seeking: ['female'], areas: ['서울', '경기'],
    height: 170, job: '미입력', education: '미입력',
    smoking: 'none', drinking: 'sometimes', pet: 'none',
    marriage: 'yes', children: 'want', religion: 'none', politics: 3,
  },
  priorities: [
    { key: 'region', allowed: ['서울', '경기'] },
    { key: 'age', min: 21, max: 41 },
    ...(['smoke-none', 'drink-light', 'pet-none']
      .map((id) => STANCES.find((s) => s.id === id)!)
      .map((s) => s.build({
        id: 'me', nickname: '현민', birthYear: THIS_YEAR - 31, birthMonth: 3,
        gender: 'male', seeking: ['female'], areas: ['서울', '경기'],
        height: 170, job: '미입력', education: '미입력',
        smoking: 'none', drinking: 'sometimes', pet: 'none',
        marriage: 'yes', children: 'want', religion: 'none', politics: 3,
      })) as PriorityFilter[]),
  ],
  stanceIds: ['smoke-none', 'drink-light', 'pet-none'],
  answers: Object.fromEntries(
    QUESTIONS.map((q) => [
      q.id,
      q.type === 'scale' ? 4 : q.type === 'choice' ? q.options![0] : q.options!.slice(0, 3),
    ]),
  ),
};

const line = (s = '') => console.log(s);
line('─'.repeat(58));
line('매칭 카드 렌더링 값 검증');
line('─'.repeat(58));

// 내 프로필 페이지가 쓰는 값
const myPersona = personaOf(me.answers);
line(`  내 유형: ${myPersona.emoji} ${myPersona.name} — ${myPersona.tagline}`);
line(`  추가 특징: ${extraTraits(me.answers).join(' / ')}`);
line(`  잘 맞는 유형: ${myPersona.goesWellWith.map((c) => PERSONA_TYPES[c]?.name ?? '없음(❌)').join(', ')}`);
line(`  절대 조건: ${me.stanceIds!.map((id) => STANCES.find((s) => s.id === id)!.short).join(', ')}`);

// 8개 유형이 모두 유효한 상대를 가리키는지
const broken = Object.values(PERSONA_TYPES).flatMap((t) =>
  t.goesWellWith.filter((c) => !PERSONA_TYPES[c]).map((c) => `${t.code}→${c}`),
);
line(`  유형 8개 상호참조 정상: ${broken.length === 0 ? '✅' : `❌ ${broken.join(', ')}`}`);

// 매칭 카드
const matches = findMatches(me, generateUsers(50), 5);
line();
line(`  느슨한 조건에서 후보: ${matches.length}명 ${matches.length > 0 ? '✅' : '❌'}`);
for (const m of matches) {
  const p = m.user.profile;
  const persona = personaOf(m.user.answers);
  line(`   ${String(Math.round(m.score)).padStart(3)}%  ${p.nickname} (${calcAge(p.birthYear, p.birthMonth)}세 · ${p.areas.join('·')})`);
  line(`         ${persona.emoji} ${persona.name} | 잘 맞음: ${SECTION_LABELS[m.bestSection]} / 덜 맞음: ${SECTION_LABELS[m.worstSection]}`);
}
line('─'.repeat(58));
