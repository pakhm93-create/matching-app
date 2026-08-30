/**
 * 설문 문항.
 *
 * ⚠️ 화면에 "성격 검사", "Big Five", "애착 유형" 같은 표현을 절대 쓰지 않는다.
 *    bigFive / attach 필드는 내부 집계 전용이다.
 *
 * ── 문항 순서가 중요하다 ──────────────────────────────────
 * 가벼운 것부터 무거운 것 순으로 배치한다.
 * 앞쪽에 정치나 종교가 나오면 "갑자기 왜 이런 걸 묻지?" 싶어 이탈한다.
 * 생활 → 성향 → 취향 → 연애 → 가치관 → 종교 → 정치 순으로 완만하게 올린다.
 * 무거운 문항이 뒤에 있으면 이미 대부분 답한 뒤라 끝까지 가게 된다.
 *
 * 정치 성향은 "본인이 진보인가 보수인가"를 묻지 않는다.
 * 실제 이슈에 대한 태도를 물어 우리가 계산한다 (politicsWeight).
 * 한 문항이 한 축만 재는 것은 아니다 — 역할관 문항도 정치 성향에 일부 기여한다.
 *
 * 흡연·음주·종교·결혼·자녀·운동·반려동물은 기본 정보에서 받지 않고 여기서 파악한다.
 * 이 응답이 절대 조건(하드 필터)의 판정 재료가 된다.
 */
import type { Question, Section } from './types';

/** 섹션별 가중치 — 관계 지속성 예측력 순. 합계 1.0 */
export const SECTION_WEIGHTS: Record<Section, number> = {
  values: 0.35,
  relationship: 0.25,
  lifestyle: 0.15,
  personality: 0.15,
  taste: 0.10,
};

export const SECTION_LABELS: Record<Section, string> = {
  values: '가치관',
  relationship: '연애 스타일',
  lifestyle: '생활 습관',
  personality: '성향',
  taste: '취향',
};

/** 절대 조건으로 고른 항목에 곱해지는 배수 */
export const PRIORITY_BOOST = 5;

/** 한 화면에 보여줄 문항 수 */
export const QUESTIONS_PER_PAGE = 5;

/** 관심사 — 겹치는 게 있어야 대화가 되고, 나중에 데이트 코스 추천의 재료가 된다 */
const ACTIVE_TAGS = [
  '헬스', '러닝', '등산', '클라이밍', '수영', '자전거', '골프', '테니스',
  '배드민턴', '축구', '농구', '야구', '스키·보드', '서핑', '스쿠버다이빙',
  '요가', '필라테스', '크로스핏', '복싱', '주짓수', '댄스', '볼링', '당구',
  '러닝크루', '마라톤',
];
const CULTURE_TAGS = [
  '영화', '드라마', '애니메이션', '독서', '미술·전시', '뮤지컬', '연극',
  '클래식', '콘서트', '페스티벌', '사진', '그림', '글쓰기', '악기 연주',
  '노래·보컬', '작곡', '팟캐스트', '웹툰', '시·문학', '건축·디자인',
];
const LIFE_TAGS = [
  '요리', '베이킹', '카페투어', '맛집탐방', '와인', '위스키', '커피',
  '인테리어', '식물 키우기', '반려동물', '뜨개질·공예', '향수', '패션',
  '국내여행', '해외여행', '캠핑', '드라이브', '낚시', '산책',
  '보드게임', '방탈출', 'PC·콘솔게임', '외국어', '재테크·투자',
  '봉사활동', '명상', '자격증 공부', '콘텐츠 제작',
];

export const QUESTIONS: Question[] = [
  // ══ 1. 가벼운 사실부터 ════════════════════════════════
  { id: 'f_smoke', section: 'lifestyle', type: 'choice', ordinal: true,
    fact: 'smoking', factValues: ['none', 'sometimes', 'yes'], stanceGroup: '담배',
    text: '담배를 피우시나요?',
    options: ['피우지 않아요', '가끔 피워요', '피워요'] },

  { id: 'f_drink', section: 'lifestyle', type: 'choice', ordinal: true,
    fact: 'drinking', factValues: ['none', 'sometimes', 'often'], stanceGroup: '술',
    text: '술은 얼마나 자주 드시나요?',
    options: ['거의 안 마셔요', '가끔 마셔요', '자주 마셔요'] },

  { id: 'f_exercise', section: 'lifestyle', type: 'choice', ordinal: true,
    fact: 'exercise', factValues: ['often', 'sometimes', 'rarely'], stanceGroup: '운동',
    text: '운동은 얼마나 하시나요?',
    options: ['주 3회 이상', '가끔 해요', '거의 안 해요'] },

  { id: 'f_pet', section: 'lifestyle', type: 'choice',
    fact: 'pet', factValues: ['has', 'none', 'allergic'], stanceGroup: '반려동물',
    text: '반려동물을 키우시나요?',
    options: ['키워요', '안 키워요', '알레르기가 있어요'] },

  // ══ 2. 생활 리듬 ══════════════════════════════════════
  { id: 'life_weekend', section: 'lifestyle', type: 'scale', stanceGroup: '생활리듬',
    text: '주말에는 밖에서 활동하는 게 좋다' },
  { id: 'life_tidy', section: 'lifestyle', type: 'scale',
    text: '정리정돈에 예민한 편이다' },
  { id: 'life_late', section: 'lifestyle', type: 'scale',
    text: '약속 시간에 늦는 걸 못 견딘다' },
  { id: 'life_recharge', section: 'lifestyle', type: 'scale', stanceGroup: '생활리듬',
    text: '혼자 조용히 쉬는 걸로 에너지를 채운다' },
  { id: 'life_change', section: 'lifestyle', type: 'scale',
    text: '갑자기 일정이 바뀌어도 잘 적응한다' },

  // ══ 3. 성향 — 사람 만날 때 ════════════════════════════
  { id: 'p_talk', section: 'personality', type: 'scale', bigFive: 'E',
    text: '처음 보는 사람과도 쉽게 대화한다' },
  { id: 'p_speak', section: 'personality', type: 'scale', bigFive: 'E',
    text: '모임에서 말을 많이 하는 편이다' },
  { id: 'p_strange', section: 'personality', type: 'scale', bigFive: 'E',
    text: '낯선 자리에 가는 게 부담스럽지 않다' },
  { id: 'p_refuse', section: 'personality', type: 'scale', bigFive: 'A',
    text: '남의 부탁을 잘 거절하지 못한다' },
  { id: 'p_mood', section: 'personality', type: 'scale', bigFive: 'A',
    text: '다른 사람의 기분을 빨리 알아차린다' },
  { id: 'p_trust', section: 'personality', type: 'scale', bigFive: 'A',
    text: '사람을 일단 믿고 보는 편이다' },

  // ══ 4. 관심사 ═════════════════════════════════════════
  { id: 't_active', section: 'taste', type: 'multi', stanceGroup: '취미',
    text: '즐기는 운동이나 활동을 골라주세요',
    options: ACTIVE_TAGS },
  { id: 't_culture', section: 'taste', type: 'multi', stanceGroup: '취미',
    text: '좋아하는 문화·예술 분야를 골라주세요',
    options: CULTURE_TAGS },
  { id: 't_life', section: 'taste', type: 'multi', stanceGroup: '취미',
    text: '그 밖에 관심 있는 것들을 골라주세요',
    options: LIFE_TAGS },
  { id: 't_weekend', section: 'taste', type: 'choice',
    text: '주말에 주로 무엇을 하나요?',
    options: ['집에서 휴식', '카페·산책', '액티비티', '친구들과 모임', '자기계발'] },
  { id: 't_travel', section: 'taste', type: 'choice',
    text: '여행은 어떤 스타일인가요?',
    options: ['계획을 꼼꼼히', '즉흥적으로', '쉬는 게 목적', '액티비티 위주'] },
  { id: 't_date', section: 'taste', type: 'multi',
    text: '어떤 데이트를 좋아하나요?',
    options: ['맛집', '카페', '영화', '전시', '공연', '산책', '드라이브',
              '액티비티', '홈데이트'] },

  // ══ 5. 성향 — 일할 때, 마음가짐 ═══════════════════════
  { id: 'p_delay', section: 'personality', type: 'scale', bigFive: 'C',
    text: '해야 할 일을 미루지 않는다' },
  { id: 'p_plan', section: 'personality', type: 'scale', bigFive: 'C',
    text: '계획을 세우고 움직이는 편이다' },
  { id: 'p_finish', section: 'personality', type: 'scale', bigFive: 'C',
    text: '한번 시작한 일은 끝을 본다' },
  { id: 'p_worry', section: 'personality', type: 'scale', bigFive: 'N', reverse: true,
    text: '사소한 일에도 걱정이 많은 편이다' },
  { id: 'p_panic', section: 'personality', type: 'scale', bigFive: 'N', reverse: true,
    text: '예상치 못한 일이 생기면 당황한다' },
  { id: 'p_stress', section: 'personality', type: 'scale', bigFive: 'N',
    text: '스트레스를 받아도 오래 가지 않는다' },
  { id: 'p_travel', section: 'personality', type: 'scale', bigFive: 'O',
    text: '가본 적 없는 곳에 가보는 걸 좋아한다' },
  { id: 'p_art', section: 'personality', type: 'scale', bigFive: 'O',
    text: '예술이나 창작물에 관심이 많다' },
  { id: 'p_abstract', section: 'personality', type: 'scale', bigFive: 'O',
    text: '추상적인 이야기를 나누는 걸 좋아한다' },

  // ══ 6. 식습관 ═════════════════════════════════════════
  { id: 'eat_spicy', section: 'lifestyle', type: 'scale',
    text: '매운 음식을 즐긴다' },
  { id: 'eat_new', section: 'lifestyle', type: 'scale',
    text: '새로운 음식에 도전하는 걸 좋아한다' },
  { id: 'eat_health', section: 'lifestyle', type: 'scale',
    text: '건강을 위해 먹는 걸 조절하는 편이다' },
  { id: 'eat_place', section: 'lifestyle', type: 'scale',
    text: '맛집을 찾아다니는 걸 좋아한다' },
  { id: 'eat_simple', section: 'lifestyle', type: 'scale',
    text: '밥은 대충 때워도 된다고 생각한다' },

  // ══ 7. 사람 관계 ══════════════════════════════════════
  { id: 'soc_many', section: 'lifestyle', type: 'scale',
    text: '친구가 많은 편이다' },
  { id: 'soc_intro', section: 'lifestyle', type: 'scale',
    text: '연인을 내 친구들에게 소개하고 싶다' },
  { id: 'soc_their', section: 'lifestyle', type: 'scale',
    text: '상대의 친구들과 어울리는 게 즐겁다' },
  { id: 'soc_alone', section: 'lifestyle', type: 'scale',
    text: '혼자 있는 시간이 많아도 외롭지 않다' },

  // ══ 8. 대화 스타일 ════════════════════════════════════
  { id: 'talk_first', section: 'relationship', type: 'scale',
    text: '내 이야기를 먼저 꺼내는 편이다' },
  { id: 'talk_listen', section: 'relationship', type: 'scale',
    text: '상대의 말을 끊지 않고 끝까지 듣는 편이다' },
  { id: 'talk_kind', section: 'relationship', type: 'choice',
    text: '어떤 대화가 제일 즐거우세요?',
    options: ['일상 잡담', '깊은 속마음', '서로의 관심사', '웃긴 이야기', '앞으로의 계획'] },

  // ══ 9. 연애 · 거리감 (애착) ═══════════════════════════
  { id: 'att_daily', section: 'relationship', type: 'scale', attach: 'anxious',
    stanceGroup: '연락',
    text: '연인과는 매일 연락해야 마음이 편하다' },
  { id: 'att_reply', section: 'relationship', type: 'scale', attach: 'anxious',
    stanceGroup: '연락',
    text: '답장이 늦으면 불안한 편이다' },
  { id: 'att_know', section: 'relationship', type: 'scale', attach: 'anxious',
    text: '상대의 하루 일과를 대략 알고 있는 게 좋다' },
  { id: 'att_own', section: 'relationship', type: 'scale', attach: 'avoidant',
    text: '연애 중에도 각자의 시간이 충분히 필요하다' },
  { id: 'att_alone', section: 'relationship', type: 'scale', attach: 'avoidant',
    text: '혼자 있는 시간이 없으면 지치는 편이다' },
  { id: 'att_deep', section: 'relationship', type: 'scale', attach: 'avoidant',
    text: '관계가 깊어질수록 부담스러워질 때가 있다' },
  { id: 'att_busy', section: 'relationship', type: 'scale', attach: 'secure',
    text: '상대가 며칠 바쁘다고 해도 크게 신경 쓰이지 않는다' },

  // ══ 10. 연애 · 갈등 ══════════════════════════════════
  { id: 'con_now', section: 'relationship', type: 'scale',
    text: '다툼이 생기면 그 자리에서 바로 풀어야 한다' },
  { id: 'con_time', section: 'relationship', type: 'scale',
    text: '화가 나면 혼자 생각할 시간이 필요하다' },
  { id: 'con_yield', section: 'relationship', type: 'scale', bigFive: 'A',
    text: '다툼이 생기면 내가 먼저 양보하는 편이다' },
  { id: 'con_say', section: 'relationship', type: 'scale',
    text: '서운한 게 있으면 바로 말하는 편이다' },

  // ══ 11. 연애 · 애정 표현 ══════════════════════════════
  { id: 'aff_often', section: 'relationship', type: 'scale',
    text: '애정 표현을 자주 하는 편이다' },
  { id: 'aff_moment', section: 'relationship', type: 'choice',
    text: '언제 가장 사랑받는다고 느끼나요?',
    options: ['다정한 말', '스킨십', '선물', '함께하는 시간', '도와줄 때'] },
  { id: 'aff_anniv', section: 'relationship', type: 'scale',
    text: '기념일을 챙기는 걸 중요하게 생각한다' },
  { id: 'aff_public', section: 'relationship', type: 'scale',
    text: '연애 사실을 주변에 알리는 편이다' },

  // ══ 12. 연애 · 경계와 신뢰 ════════════════════════════
  { id: 'bnd_meet', section: 'relationship', type: 'scale',
    text: '연인이 이성과 단둘이 만나는 게 신경 쓰인다' },
  { id: 'bnd_jealous', section: 'relationship', type: 'scale',
    text: '질투는 애정의 표현이라고 생각한다' },
  { id: 'bnd_past', section: 'relationship', type: 'scale',
    text: '상대의 과거 연애 횟수는 신경 쓰이지 않는다' },

  // ══ 13. 일과 커리어 ═══════════════════════════════════
  { id: 'work_achieve', section: 'values', type: 'scale',
    text: '일에서 성취감을 크게 느낀다' },
  { id: 'work_split', section: 'values', type: 'scale',
    text: '일과 생활은 확실히 분리해야 한다' },
  { id: 'work_stable', section: 'values', type: 'scale',
    text: '안정적인 직장이 무엇보다 중요하다' },
  { id: 'work_busy', section: 'values', type: 'scale',
    text: '상대가 일 때문에 바쁜 건 충분히 이해할 수 있다' },

  // ══ 14. 돈·소비 ═══════════════════════════════════════
  { id: 'mon_impulse', section: 'values', type: 'scale', stanceGroup: '소비',
    text: '갖고 싶은 게 생기면 비교적 빨리 사는 편이다' },
  { id: 'mon_track', section: 'values', type: 'scale', stanceGroup: '소비',
    text: '가계부나 지출 관리를 하는 편이다' },
  { id: 'mon_debt', section: 'values', type: 'scale', stanceGroup: '소비',
    text: '빚을 내서라도 투자할 수 있다고 생각한다' },
  { id: 'mon_diff', section: 'values', type: 'scale',
    text: '상대의 소비 습관이 나와 다르면 신경 쓰일 것 같다' },
  { id: 'mon_gift', section: 'values', type: 'scale',
    text: '기념일 선물은 값보다 마음이 중요하다' },
  { id: 'mon_share', section: 'values', type: 'scale',
    text: '수입이나 자산을 연인과 공유할 수 있다' },

  // ══ 15. 앞으로의 계획 ═════════════════════════════════
  { id: 'fut_abroad', section: 'values', type: 'scale',
    text: '언젠가 해외에서 살아보고 싶다' },
  { id: 'fut_home', section: 'values', type: 'scale',
    text: '내 집 마련은 꼭 필요하다고 생각한다' },
  { id: 'fut_plan', section: 'values', type: 'scale',
    text: '5년 뒤의 계획을 구체적으로 그려두는 편이다' },
  { id: 'fut_move', section: 'values', type: 'scale',
    text: '상대의 사정에 따라 사는 곳을 옮길 수 있다' },

  // ══ 16. 역할과 분담 ═══════════════════════════════════
  { id: 'role_chores', section: 'values', type: 'scale',
    politicsWeight: 0.3, politicsReverse: true,
    text: '집안일은 할 수 있는 사람이 하는 게 맞다' },
  { id: 'role_cost', section: 'values', type: 'scale',
    text: '데이트 비용은 서로 비슷하게 내는 게 편하다' },
  { id: 'role_decide', section: 'values', type: 'scale',
    text: '큰 결정은 반드시 상의해서 함께 내려야 한다' },
  { id: 'role_income', section: 'values', type: 'scale',
    text: '수입 차이가 관계에 영향을 준다고 생각한다' },

  // ══ 17. 결혼과 가족 ═══════════════════════════════════
  { id: 'f_marriage', section: 'values', type: 'choice',
    fact: 'marriage', factValues: ['yes', 'no', 'undecided'], stanceGroup: '결혼',
    text: '결혼에 대해 어떻게 생각하세요?',
    options: ['언젠가 하고 싶어요', '할 생각이 없어요', '아직 모르겠어요'] },
  { id: 'f_children', section: 'values', type: 'choice',
    fact: 'children', factValues: ['want', 'not', 'undecided'], stanceGroup: '자녀',
    text: '아이를 갖고 싶으신가요?',
    options: ['갖고 싶어요', '갖고 싶지 않아요', '아직 모르겠어요'] },
  { id: 'fam_must', section: 'values', type: 'scale', stanceGroup: '결혼',
    text: '결혼은 반드시 해야 한다고 생각한다' },
  { id: 'fam_cohab', section: 'values', type: 'scale',
    politicsWeight: 0.3, politicsReverse: true,
    text: '결혼 전 동거에 찬성한다' },
  { id: 'fam_fund', section: 'values', type: 'scale',
    text: '결혼 자금은 양가가 비슷하게 부담해야 한다' },
  { id: 'fam_dual', section: 'values', type: 'scale',
    politicsWeight: 0.3, politicsReverse: true,
    text: '맞벌이는 당연하다고 생각한다' },
  { id: 'fam_account', section: 'values', type: 'scale',
    text: '결혼하더라도 각자의 통장은 따로 두는 게 낫다' },

  // ══ 18. 종교 ══════════════════════════════════════════
  { id: 'f_religion', section: 'values', type: 'choice',
    fact: 'religion', factValues: ['none', 'protestant', 'catholic', 'buddhist', 'other'],
    stanceGroup: '종교',
    text: '종교가 있으신가요?',
    options: ['없어요', '개신교', '천주교', '불교', '그 외'] },
  { id: 'rel_weight', section: 'values', type: 'scale', stanceGroup: '종교',
    text: '신앙이 내 삶에서 차지하는 비중이 크다' },
  { id: 'rel_diff', section: 'values', type: 'scale',
    text: '상대가 나와 다른 종교여도 괜찮다' },
  { id: 'rel_join', section: 'values', type: 'scale',
    text: '상대가 내 종교 활동에 함께해주면 좋겠다' },
  { id: 'rel_marry', section: 'values', type: 'scale',
    text: '결혼한다면 종교가 같아야 한다고 생각한다' },

  // ══ 19. 정치 — 가장 마지막 ════════════════════════════
  // politicsReverse = 동의할수록 진보. 계산할 때 뒤집어 "높을수록 보수"로 맞춘다.
  { id: 'pol_tolerate', section: 'values', type: 'scale',
    text: '연인과 정치 성향이 달라도 괜찮다' },
  { id: 'pol_samesex', section: 'values', type: 'scale',
    politicsWeight: 1, politicsReverse: true, stanceGroup: '정치',
    text: '동성 결혼을 법적으로 인정해야 한다' },
  { id: 'pol_estate', section: 'values', type: 'scale',
    politicsWeight: 1, stanceGroup: '정치',
    text: '부동산은 시장에 맡기는 편이 낫다' },
  { id: 'pol_union', section: 'values', type: 'scale',
    politicsWeight: 1, politicsReverse: true, stanceGroup: '정치',
    text: '노동조합은 사회에 도움이 된다' },
  { id: 'pol_basic', section: 'values', type: 'scale',
    politicsWeight: 1, politicsReverse: true, stanceGroup: '정치',
    text: '전 국민에게 기본소득을 주는 것에 찬성한다' },
  { id: 'pol_martial', section: 'values', type: 'scale',
    politicsWeight: 1, stanceGroup: '정치',
    text: '2024년 12월 계엄 선포는 정당했다' },
];

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

/** 관심사 문항들 — 절대 조건 '취미'가 이 문항들의 겹침을 본다 */
export const INTEREST_QUESTION_IDS = ['t_active', 't_culture', 't_life'];
/** 소비 성향을 재는 문항들 — 절대 조건 '소비 성향'이 이 평균을 본다 */
export const MONEY_QUESTION_IDS = ['mon_impulse', 'mon_track', 'mon_debt'];
/** 생활 리듬을 재는 문항들 */
export const RHYTHM_QUESTION_IDS = ['life_weekend', 'life_recharge'];
/** 연락 빈도를 재는 문항들 */
export const CONTACT_QUESTION_IDS = ['att_daily', 'att_reply'];

/** 한 화면에 여러 문항을 보여주기 위해 페이지로 나눈다 */
export const PAGES: Question[][] = (() => {
  const pages: Question[][] = [];
  for (let i = 0; i < QUESTIONS.length; i += QUESTIONS_PER_PAGE) {
    pages.push(QUESTIONS.slice(i, i + QUESTIONS_PER_PAGE));
  }
  return pages;
})();
