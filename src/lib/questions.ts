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

/**
 * 영역별 가중치 — 합계 1.0.
 *
 * 생활 습관을 15%에서 25%로 올렸다. 음주·흡연이 여기 있는데,
 * 이 둘은 관계를 실제로 가르는 축이라 낮은 천장 안에서는 담기지 않았다.
 * 음주 5문항이 9%, 흡연 3문항이 6%를 가져간다.
 */
export const SECTION_WEIGHTS: Record<Section, number> = {
  values: 0.38,
  relationship: 0.23,
  lifestyle: 0.25,
  personality: 0.10,
  taste: 0.04,
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
  '마라톤',
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

/** 민감도·비중은 아래 표에서 붙인다 */
type RawQuestion = Omit<Question, 'sensitivity' | 'weight'>;

const RAW: RawQuestion[] = [
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

  // ── 음주·흡연은 상황으로 다시 묻는다 ──────────────────
  // "얼마나 마시나요"만으로는 같은 '가끔'이 전혀 다른 사람일 수 있다.
  // 자리에서 어떻게 행동하는지, 다음 날을 어떻게 대하는지가 실제로 부딪히는 지점이다.
  // 문장은 짧게 — 길어지면 읽다가 지친다.
  { id: 'drink_late', section: 'lifestyle', type: 'scale', stanceGroup: '술',
    text: '술자리가 길어지면 끝까지 남는 편이다' },
  { id: 'drink_next', section: 'lifestyle', type: 'scale', stanceGroup: '술',
    text: '다음 날 일정이 있어도 술자리를 이어가는 편이다' },
  { id: 'drink_watch', section: 'lifestyle', type: 'scale', stanceGroup: '술',
    text: '상대가 취한 모습을 봐도 괜찮다' },
  { id: 'drink_none_ok', section: 'lifestyle', type: 'scale', stanceGroup: '술',
    text: '술 없는 자리도 충분히 즐겁다' },

  { id: 'smoke_smell', section: 'lifestyle', type: 'scale', stanceGroup: '담배',
    text: '담배 냄새가 배어 있으면 신경 쓰인다' },
  { id: 'smoke_break', section: 'lifestyle', type: 'scale', stanceGroup: '담배',
    text: '담배를 피우는 사람과도 편하게 지낸다' },

  { id: 'f_pet', section: 'lifestyle', type: 'choice',
    fact: 'pet', factValues: ['has', 'likes', 'none', 'allergic'], stanceGroup: '반려동물',
    text: '반려동물을 키우시나요?',
    options: ['키워요', '안 키우지만 좋아해요', '안 키워요', '알레르기가 있어요'] },

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
  { id: 't_weekend', section: 'taste', type: 'multi',
    text: '주말에 주로 무엇을 하나요?',
    options: ['집에서 쉬기', '카페·산책', '운동·액티비티', '친구들과 모임',
              '자기계발·공부', '가족과 시간', '나들이·여행', '집안일·정리',
              '콘텐츠 몰아보기', '취미 활동', '알바·부업'] },
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
    text: '연인의 친구들과 함께 있는 자리가 즐겁다' },
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
    text: '힘든 일이 생기면 기도하거나 마음을 맡기는 곳이 있다' },
  { id: 'rel_diff', section: 'values', type: 'choice', ordinal: true,
    text: '상대가 주말마다 종교 활동에 나간다면 어떠세요?',
    options: ['같이 가볼 수도 있어요', '각자 시간 보내면 돼요',
              '조금 부담스러울 것 같아요', '만나기 어려울 것 같아요'] },
  { id: 'rel_join', section: 'values', type: 'scale',
    text: '중요한 날에는 종교 시설을 찾는 편이다' },
  { id: 'rel_marry', section: 'values', type: 'scale',
    text: '양가 집안의 종교가 다르면 신경 쓰일 것 같다' },

  // ══ 19. 정치 — 가장 마지막 ════════════════════════════
  // politicsReverse = 동의할수록 진보. 계산할 때 뒤집어 "높을수록 보수"로 맞춘다.
  { id: 'pol_tolerate', section: 'values', type: 'choice', ordinal: true,
    text: '식사 자리에서 나와 정반대 의견이 나왔어요. 어떠세요?',
    options: ['그런 얘기 나누는 게 재밌어요', '생각이 다른 건 자연스러워요',
              '되도록 화제를 돌려요', '그 사람과는 거리를 두게 돼요'] },
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

// ════════════════════════════════════════════════════════
// 민감도 — 설문 순서를 정하는 데만 쓴다 (1 가벼움 ~ 5 무거움)
// ════════════════════════════════════════════════════════
const SENSITIVITY: Record<string, number> = {
  // 1 — 아무나 편하게 답할 수 있는 것
  f_pet: 1, f_exercise: 1, t_active: 1, t_culture: 1, t_life: 1,
  t_weekend: 1, t_travel: 1, t_date: 1,
  life_weekend: 1, life_tidy: 1, life_late: 1, life_recharge: 1, life_change: 1,
  eat_spicy: 1, eat_new: 1, eat_health: 1, eat_place: 1, eat_simple: 1,

  // 1 — 성향 문항 일부도 아주 가볍다. 초반이 생활 습관만으로 채워지지 않게 섞는다
  p_talk: 1, p_strange: 1, p_travel: 1, p_art: 1, p_plan: 1, p_delay: 1,

  // 2 — 나를 설명하는 것
  f_smoke: 2, f_drink: 2,
  drink_late: 2, drink_next: 2, drink_watch: 2, drink_none_ok: 2,
  smoke_smell: 2, smoke_break: 2,
  p_speak: 2, p_refuse: 2, p_mood: 2, p_trust: 2,
  p_finish: 2, p_worry: 2, p_panic: 2, p_stress: 2, p_abstract: 2,
  soc_many: 2, soc_intro: 2, soc_their: 2, soc_alone: 2,
  talk_first: 2, talk_listen: 2, talk_kind: 2,

  // 3 — 연애 방식
  att_daily: 3, att_reply: 3, att_know: 3, att_own: 3, att_alone: 3,
  att_deep: 3, att_busy: 3,
  con_now: 3, con_time: 3, con_yield: 3, con_say: 3,
  aff_often: 3, aff_moment: 3, aff_anniv: 3, aff_public: 3,

  // 4 — 삶의 방향, 조금 무거운 것
  work_achieve: 4, work_split: 4, work_stable: 4, work_busy: 4,
  mon_impulse: 4, mon_track: 4, mon_debt: 4, mon_diff: 4, mon_gift: 4, mon_share: 4,
  fut_abroad: 4, fut_home: 4, fut_plan: 4, fut_move: 4,
  bnd_meet: 4, bnd_jealous: 4, bnd_past: 4,
  role_chores: 4, role_cost: 4, role_decide: 4, role_income: 4,

  // 5 — 가장 무거운 것. 맨 뒤로 간다
  f_marriage: 5, f_children: 5,
  fam_must: 5, fam_cohab: 5, fam_fund: 5, fam_dual: 5, fam_account: 5,
  f_religion: 5, rel_weight: 5, rel_diff: 5, rel_join: 5, rel_marry: 5,
  pol_tolerate: 5, pol_samesex: 5, pol_estate: 5, pol_union: 5,
  pol_basic: 5, pol_martial: 5,
};

// ════════════════════════════════════════════════════════
// 문항별 비중 — 같은 영역 안에서 얼마나 크게 볼 것인가
//
// 모든 문항이 똑같이 중요하지는 않다.
// 관계를 실제로 갈라놓는 것들(음주 습관, 종교, 정치, 결혼·자녀관)을 크게 잡는다.
//
// ⚠️ 이 숫자들은 측정값이 아니라 **제품 판단**이다.
//    실사용자에게서 "어떤 항목이 어긋났을 때 실제로 헤어지는가"를 관찰하면
//    그때 근거를 갖고 다시 잡아야 한다.
//
// 영역 간 비중(SECTION_WEIGHTS)은 이 값과 무관하게 유지된다.
// 영역 안에서 서로 나눠 갖는 구조이기 때문이다.
// ════════════════════════════════════════════════════════
const WEIGHT: Record<string, number> = {
  // ── 생활 습관 (영역 25%) ────────────────────────────
  // 음주 — 사람을 만나는 태도, 자기관리, 식습관까지 함께 따라온다.
  //        5문항 합쳐서 전체의 9%
  f_drink: 6.4,
  drink_late: 2, drink_next: 2, drink_watch: 2, drink_none_ok: 2,
  // 흡연 — 같이 사는 문제로 바로 이어진다. 3문항 합쳐서 전체의 6%
  f_smoke: 4.8, smoke_smell: 2.4, smoke_break: 2.4,

  // ── 가치관 (영역 40%) ──────────────────────────────
  // 종교 — 무엇을 믿는가(3%)보다 얼마나 깊이 관여하는가(4%)가 더 크게 작용한다
  f_religion: 4.5, rel_weight: 6,
  rel_marry: 2, rel_diff: 2, rel_join: 1.5,
  // 결혼·자녀 — 연애의 끝을 가르는 항목. 각각 4%
  f_marriage: 6, f_children: 6, fam_must: 2,
  // 정치 — 이슈 문항 5개가 각각 1.4%씩, 합쳐서 7%
  pol_samesex: 2.1, pol_estate: 2.1, pol_union: 2.1, pol_basic: 2.1, pol_martial: 2.1,
  pol_tolerate: 1.5,

  // ── 연애 스타일 (영역 25%) ─────────────────────────
  // 애착 — 불안형과 회피형이 만나면 관계가 오래가지 못한다. 7문항 합쳐서 10%
  att_daily: 1.35, att_reply: 1.35, att_know: 1.35,
  att_own: 1.35, att_alone: 1.35, att_deep: 1.35, att_busy: 1.35,
  // 갈등을 푸는 방식
  con_now: 1.3, con_time: 1.3,
};

/** 민감도와 비중을 붙인 최종 문항 목록 */
export const QUESTIONS: Question[] = RAW.map((q) => ({
  ...q,
  sensitivity: SENSITIVITY[q.id] ?? 3,
  weight: WEIGHT[q.id] ?? 1,
}));

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

/** 관심사 문항들 — 절대 조건 '취미'가 이 문항들의 겹침을 본다 */
export const INTEREST_QUESTION_IDS = ['t_active', 't_culture', 't_life'];
/** 소비 성향을 재는 문항들 — 절대 조건 '소비 성향'이 이 평균을 본다 */
export const MONEY_QUESTION_IDS = ['mon_impulse', 'mon_track', 'mon_debt'];
/** 생활 리듬을 재는 문항들 */
export const RHYTHM_QUESTION_IDS = ['life_weekend', 'life_recharge'];
/** 연락 빈도를 재는 문항들 */
export const CONTACT_QUESTION_IDS = ['att_daily', 'att_reply'];

// ════════════════════════════════════════════════════════
// 페이지 구성
//
// 두 가지를 지킨다.
//  1. **한 페이지는 응답 형식이 같아야 한다.** 5점 척도를 찍다가 갑자기
//     취미를 고르는 화면이 나오면 손이 멈춘다.
//  2. **한 페이지 안에서는 영역이 섞여야 한다.** 종교만 다섯 개 연달아 나오면
//     취조당하는 기분이 든다. 생활 하나, 연애 하나, 종교 하나 식으로 섞는다.
//
// 순서는 여전히 가벼운 것부터다. 민감도로 정렬한 뒤 위 두 규칙을 적용한다.
// ════════════════════════════════════════════════════════

/** 같은 민감도 안에서 영역을 번갈아 꺼내 섞는다 */
function mixSections(qs: Question[]): Question[] {
  const bySensitivity = new Map<number, Question[]>();
  for (const q of qs) {
    const list = bySensitivity.get(q.sensitivity) ?? [];
    list.push(q);
    bySensitivity.set(q.sensitivity, list);
  }

  const out: Question[] = [];
  for (const level of [...bySensitivity.keys()].sort((a, b) => a - b)) {
    const queues = new Map<string, Question[]>();
    for (const q of bySensitivity.get(level)!) {
      const list = queues.get(q.section) ?? [];
      list.push(q);
      queues.set(q.section, list);
    }
    const lanes = [...queues.values()];
    let i = 0;
    while (lanes.some((l) => l.length > 0)) {
      const lane = lanes[i % lanes.length];
      if (lane.length > 0) out.push(lane.shift()!);
      i++;
    }
  }
  return out;
}

/**
 * 목록을 고르게 나눈다.
 * 11개를 5씩 자르면 5·5·1이 되어 마지막 페이지에 한 문항만 남는다.
 * 페이지 수는 같게 두되 4·4·3으로 고르게 편다.
 */
function chunkEvenly(list: Question[], target: number): Question[][] {
  if (list.length === 0) return [];
  const pageCount = Math.ceil(list.length / target);
  const base = Math.floor(list.length / pageCount);
  const extra = list.length % pageCount;

  const out: Question[][] = [];
  let i = 0;
  for (let p = 0; p < pageCount; p++) {
    const size = base + (p < extra ? 1 : 0);
    out.push(list.slice(i, i + size));
    i += size;
  }
  return out;
}

export const PAGES: Question[][] = (() => {
  const pages: Question[][] = [];

  // 형식별로 나눠서 페이지를 만든다
  for (const type of ['scale', 'choice', 'multi'] as const) {
    const ordered = mixSections(QUESTIONS.filter((q) => q.type === type));
    pages.push(...chunkEvenly(ordered, QUESTIONS_PER_PAGE));
  }

  // 가벼운 페이지부터 나오도록 정렬
  const avg = (p: Question[]) => p.reduce((n, q) => n + q.sensitivity, 0) / p.length;
  return pages.sort((a, b) => avg(a) - avg(b));
})();
