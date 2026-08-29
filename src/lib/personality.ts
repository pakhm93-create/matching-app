/**
 * 성향 축 집계.
 * 설문 도중에는 검사 티를 내지 않지만, 결과 화면에서는 유형을 보여준다.
 */
import type { Answers, BigFiveAxis } from './types';
import { QUESTIONS } from './questions';
import { AXIS_NAMES } from './labels';

/** 각 축의 점수를 0~1로 계산 */
export function computeAxes(answers: Answers): Record<BigFiveAxis, number> {
  const sum: Record<string, number> = {};
  const count: Record<string, number> = {};

  for (const q of QUESTIONS) {
    if (!q.bigFive) continue;
    const v = answers[q.id];
    if (typeof v !== 'number') continue;
    // 역방향 문항은 뒤집어서 더한다 ("걱정이 많다"에 5점 = 정서안정성은 낮음)
    const normalized = (q.reverse ? 6 - v : v) - 1; // 0~4
    sum[q.bigFive] = (sum[q.bigFive] ?? 0) + normalized;
    count[q.bigFive] = (count[q.bigFive] ?? 0) + 1;
  }

  const axes = {} as Record<BigFiveAxis, number>;
  for (const a of ['E', 'A', 'C', 'N', 'O'] as BigFiveAxis[]) {
    axes[a] = count[a] ? sum[a] / (count[a] * 4) : 0.5;
  }
  return axes;
}

/** 축 점수를 사람이 읽을 수 있는 유형 이름으로 (예: "사교적인 · 계획적인 · 모험적인") */
export function describePersonality(answers: Answers): string {
  const axes = computeAxes(answers);
  // 중간(0.5)에서 가장 멀리 떨어진 3개 축만 뽑아 특징을 만든다
  const ranked = (Object.keys(axes) as BigFiveAxis[])
    .sort((a, b) => Math.abs(axes[b] - 0.5) - Math.abs(axes[a] - 0.5))
    .slice(0, 3);
  return ranked
    .map((a) => (axes[a] >= 0.5 ? AXIS_NAMES[a].high : AXIS_NAMES[a].low))
    .join(' · ');
}
