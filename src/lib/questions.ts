/**
 * MVP용 설문 문항 30개.
 * 전체 설계(68문항)는 docs/survey-design.md 참고. 여기는 축소판이다.
 *
 * ⚠️ 화면에 "성격 검사", "Big Five" 같은 표현을 절대 쓰지 않는다.
 *    bigFive 필드는 내부 집계 전용이다.
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

/** 사용자에게 보여줄 섹션 이름 (설명 문구에 사용) */
export const SECTION_LABELS: Record<Section, string> = {
  values: '가치관',
  relationship: '연애 스타일',
  lifestyle: '생활 습관',
  personality: '성향',
  taste: '취향',
};

/** TOP 3에 선택되었을 때 곱해지는 배수 */
export const PRIORITY_BOOST = 5;

export const QUESTIONS: Question[] = [
  // ── 가치관 (8) ─────────────────────────────
  { id: 'v1', section: 'values', type: 'scale', priorityKey: 'religion',
    text: '신앙이 내 삶에서 차지하는 비중이 크다' },
  { id: 'v2', section: 'values', type: 'scale', priorityKey: 'religion',
    text: '상대가 나와 다른 종교여도 괜찮다', reverse: true },
  { id: 'v3', section: 'values', type: 'scale', priorityKey: 'politics',
    text: '정치·사회 이슈에 관심이 많다' },
  { id: 'v4', section: 'values', type: 'scale', priorityKey: 'marriage',
    text: '결혼은 반드시 해야 한다고 생각한다' },
  { id: 'v5', section: 'values', type: 'scale', priorityKey: 'children',
    text: '자녀는 꼭 있어야 한다고 생각한다' },
  { id: 'v6', section: 'values', type: 'scale',
    text: '집안일과 육아는 성별과 무관하게 나눠야 한다' },
  { id: 'v7', section: 'values', type: 'scale',
    text: '저축보다 지금의 경험에 돈을 쓰는 게 낫다' },
  { id: 'v8', section: 'values', type: 'scale',
    text: '커리어보다 가정이 우선이다' },

  // ── 연애 스타일 (7) ────────────────────────
  { id: 'r1', section: 'relationship', type: 'scale',
    text: '연인과는 매일 연락해야 마음이 편하다' },
  { id: 'r2', section: 'relationship', type: 'scale',
    text: '답장이 늦으면 불안한 편이다' },
  { id: 'r3', section: 'relationship', type: 'scale',
    text: '다툼이 생기면 그 자리에서 바로 풀어야 한다' },
  { id: 'r4', section: 'relationship', type: 'scale',
    text: '애정 표현을 자주 하는 편이다' },
  { id: 'r5', section: 'relationship', type: 'choice',
    text: '언제 가장 사랑받는다고 느끼나요?',
    options: ['다정한 말', '스킨십', '선물', '함께하는 시간', '도와줄 때'] },
  { id: 'r6', section: 'relationship', type: 'scale',
    text: '연애 중에도 각자의 시간이 충분히 필요하다' },
  { id: 'r7', section: 'relationship', type: 'choice', ordinal: true,
    text: '얼마나 자주 만나고 싶나요?',
    options: ['거의 매일', '주 3~4회', '주 1~2회', '월 2~3회'] },

  // ── 생활 습관 (5) ──────────────────────────
  { id: 'l1', section: 'lifestyle', type: 'scale',
    text: '아침에 일찍 일어나는 편이다' },
  { id: 'l2', section: 'lifestyle', type: 'scale',
    text: '주말에는 밖에서 활동하는 게 좋다' },
  { id: 'l3', section: 'lifestyle', type: 'scale',
    text: '운동을 규칙적으로 한다' },
  { id: 'l4', section: 'lifestyle', type: 'scale',
    text: '정리정돈에 예민한 편이다' },
  { id: 'l5', section: 'lifestyle', type: 'scale', priorityKey: 'drinking',
    text: '술자리를 즐기는 편이다' },

  // ── 성향 (6) — 내부적으로만 5개 축으로 집계 ──
  { id: 'p1', section: 'personality', type: 'scale', bigFive: 'E',
    text: '처음 보는 사람과도 쉽게 대화한다' },
  { id: 'p2', section: 'personality', type: 'scale', bigFive: 'E',
    text: '여러 사람과 어울리면 에너지가 생긴다' },
  { id: 'p3', section: 'personality', type: 'scale', bigFive: 'A',
    text: '다툼이 생기면 내가 먼저 양보하는 편이다' },
  { id: 'p4', section: 'personality', type: 'scale', bigFive: 'C',
    text: '해야 할 일을 미루지 않는다' },
  { id: 'p5', section: 'personality', type: 'scale', bigFive: 'N', reverse: true,
    text: '사소한 일에도 걱정이 많은 편이다' },
  { id: 'p6', section: 'personality', type: 'scale', bigFive: 'O',
    text: '가본 적 없는 곳에 가보는 걸 좋아한다' },

  // ── 취향 (4) — 나중에 데이트 코스 추천의 재료가 된다 ──
  { id: 't1', section: 'taste', type: 'multi',
    text: '관심사를 골라주세요 (여러 개 가능)',
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

/** 문항 id로 빠르게 찾기 위한 표 */
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
