/**
 * 설문 문항.
 *
 * ⚠️ 화면에 "성격 검사", "Big Five" 같은 표현을 절대 쓰지 않는다.
 *    bigFive 필드는 내부 집계 전용이다.
 *
 * 정치 성향은 "본인이 진보인가 보수인가"를 묻지 않는다.
 * 실제 이슈에 대한 태도를 물어 우리가 계산한다 (politicsAxis).
 *
 * 흡연·음주·종교·결혼·자녀·운동도 기본 정보에서 받지 않고 여기서 파악한다.
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

export const QUESTIONS: Question[] = [
  // ── 사실 문항 (절대 조건의 판정 재료) ─────────────────
  { id: 'f_smoke', section: 'lifestyle', type: 'choice', ordinal: true,
    fact: 'smoking', factValues: ['none', 'sometimes', 'yes'], stanceGroup: '담배',
    text: '담배를 피우시나요?',
    options: ['피우지 않아요', '가끔 피워요', '피워요'] },

  { id: 'f_drink', section: 'lifestyle', type: 'choice', ordinal: true,
    fact: 'drinking', factValues: ['none', 'sometimes', 'often'], stanceGroup: '술',
    text: '술은 얼마나 자주 드시나요?',
    options: ['거의 안 마셔요', '가끔 마셔요', '자주 마셔요'] },

  { id: 'f_religion', section: 'values', type: 'choice',
    fact: 'religion', factValues: ['none', 'protestant', 'catholic', 'buddhist', 'other'],
    stanceGroup: '종교',
    text: '종교가 있으신가요?',
    options: ['없어요', '개신교', '천주교', '불교', '그 외'] },

  { id: 'f_marriage', section: 'values', type: 'choice',
    fact: 'marriage', factValues: ['yes', 'no', 'undecided'], stanceGroup: '결혼',
    text: '결혼에 대해 어떻게 생각하세요?',
    options: ['언젠가 하고 싶어요', '할 생각이 없어요', '아직 모르겠어요'] },

  { id: 'f_children', section: 'values', type: 'choice',
    fact: 'children', factValues: ['want', 'not', 'undecided'], stanceGroup: '자녀',
    text: '아이를 갖고 싶으신가요?',
    options: ['갖고 싶어요', '갖고 싶지 않아요', '아직 모르겠어요'] },

  { id: 'f_exercise', section: 'lifestyle', type: 'choice', ordinal: true,
    fact: 'exercise', factValues: ['often', 'sometimes', 'rarely'], stanceGroup: '운동',
    text: '운동은 얼마나 하시나요?',
    options: ['주 3회 이상', '가끔 해요', '거의 안 해요'] },

  // ── 정치 성향 (이슈로 파악) ───────────────────────────
  // reverse = 동의할수록 진보. 계산할 때 뒤집어서 "높을수록 보수"로 맞춘다.
  { id: 'pol1', section: 'values', type: 'scale', politicsAxis: true, reverse: true,
    stanceGroup: '정치',
    text: '동성 결혼을 법적으로 인정해야 한다' },
  { id: 'pol2', section: 'values', type: 'scale', politicsAxis: true, reverse: true,
    stanceGroup: '정치',
    text: '복지를 늘리기 위해서라면 세금을 더 낼 수 있다' },
  { id: 'pol3', section: 'values', type: 'scale', politicsAxis: true,
    stanceGroup: '정치',
    text: '기업에 대한 규제는 지금보다 완화해야 한다' },

  // ── 가치관 ────────────────────────────────────────────
  { id: 'v1', section: 'values', type: 'scale', stanceGroup: '종교',
    text: '신앙이 내 삶에서 차지하는 비중이 크다' },
  { id: 'v2', section: 'values', type: 'scale',
    text: '집안일과 육아는 성별과 무관하게 나눠야 한다' },
  { id: 'v3', section: 'values', type: 'scale',
    text: '저축보다 지금의 경험에 돈을 쓰는 게 낫다' },
  { id: 'v4', section: 'values', type: 'scale',
    text: '커리어보다 가정이 우선이다' },
  { id: 'v5', section: 'values', type: 'scale',
    text: '데이트 비용은 반반이 원칙이다' },

  // ── 연애 스타일 ───────────────────────────────────────
  { id: 'r1', section: 'relationship', type: 'scale',
    text: '연인과는 매일 연락해야 마음이 편하다' },
  { id: 'r2', section: 'relationship', type: 'scale',
    text: '답장이 늦으면 불안한 편이다' },
  { id: 'r3', section: 'relationship', type: 'scale',
    text: '다툼이 생기면 그 자리에서 바로 풀어야 한다' },
  { id: 'r4', section: 'relationship', type: 'scale',
    text: '애정 표현을 자주 하는 편이다' },
  { id: 'r5', section: 'relationship', type: 'scale',
    text: '연애 중에도 각자의 시간이 충분히 필요하다' },
  { id: 'r6', section: 'relationship', type: 'choice',
    text: '언제 가장 사랑받는다고 느끼나요?',
    options: ['다정한 말', '스킨십', '선물', '함께하는 시간', '도와줄 때'] },
  { id: 'r7', section: 'relationship', type: 'choice', ordinal: true,
    text: '얼마나 자주 만나고 싶나요?',
    options: ['거의 매일', '주 3~4회', '주 1~2회', '월 2~3회'] },

  // ── 생활 습관 ─────────────────────────────────────────
  { id: 'l1', section: 'lifestyle', type: 'scale',
    text: '아침에 일찍 일어나는 편이다' },
  { id: 'l2', section: 'lifestyle', type: 'scale',
    text: '주말에는 밖에서 활동하는 게 좋다' },
  { id: 'l3', section: 'lifestyle', type: 'scale',
    text: '정리정돈에 예민한 편이다' },

  // ── 성향 (내부적으로만 5개 축으로 집계) ────────────────
  { id: 'p1', section: 'personality', type: 'scale', bigFive: 'E',
    text: '처음 보는 사람과도 쉽게 대화한다' },
  { id: 'p2', section: 'personality', type: 'scale', bigFive: 'E',
    text: '여러 사람과 어울리면 에너지가 생긴다' },
  { id: 'p3', section: 'personality', type: 'scale', bigFive: 'A',
    text: '다툼이 생기면 내가 먼저 양보하는 편이다' },
  { id: 'p4', section: 'personality', type: 'scale', bigFive: 'C',
    text: '해야 할 일을 미루지 않는다' },
  { id: 'p5', section: 'personality', type: 'scale', bigFive: 'C',
    text: '계획을 세우고 움직이는 편이다' },
  { id: 'p6', section: 'personality', type: 'scale', bigFive: 'N', reverse: true,
    text: '사소한 일에도 걱정이 많은 편이다' },
  { id: 'p7', section: 'personality', type: 'scale', bigFive: 'O',
    text: '가본 적 없는 곳에 가보는 걸 좋아한다' },
  { id: 'p8', section: 'personality', type: 'scale', bigFive: 'O',
    text: '익숙한 방식보다 새로운 방식을 시도해보는 편이다' },

  // ── 취향 (나중에 데이트 코스 추천의 재료) ──────────────
  { id: 't1', section: 'taste', type: 'multi',
    text: '관심사를 골라주세요',
    options: ['영화', '독서', '게임', '등산', '여행', '요리', '공연', '전시',
              '운동', '음악', '사진', '반려동물', '맛집탐방', '드라이브'] },
  { id: 't2', section: 'taste', type: 'multi',
    text: '좋아하는 영화 장르를 골라주세요',
    options: ['액션', '로맨스', '코미디', '스릴러', 'SF', '다큐', '애니메이션', '공포'] },
  { id: 't3', section: 'taste', type: 'choice',
    text: '여행은 어떤 스타일인가요?',
    options: ['계획을 꼼꼼히', '즉흥적으로', '쉬는 게 목적', '액티비티 위주'] },
  { id: 't4', section: 'taste', type: 'multi',
    text: '어떤 데이트를 좋아하나요?',
    options: ['맛집', '카페', '영화', '전시', '공연', '산책', '드라이브',
              '액티비티', '홈데이트'] },
];

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

/** 한 화면에 여러 문항을 보여주기 위해 페이지로 나눈다 */
export const PAGES: Question[][] = (() => {
  const pages: Question[][] = [];
  for (let i = 0; i < QUESTIONS.length; i += QUESTIONS_PER_PAGE) {
    pages.push(QUESTIONS.slice(i, i + QUESTIONS_PER_PAGE));
  }
  return pages;
})();
