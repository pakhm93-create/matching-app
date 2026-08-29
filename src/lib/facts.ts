/**
 * 설문 응답에서 "사실"을 뽑아낸다.
 *
 * 기본 정보에서 직접 묻지 않는 항목들(흡연·음주·종교·결혼·자녀·운동·정치 성향)을
 * 설문 답변으로부터 계산한다. 하드 필터는 이 값을 본다.
 */
import type { Answers, Facts } from './types';
import { QUESTIONS } from './questions';

export function deriveFacts(answers: Answers): Facts {
  const facts: Facts = { politics: null };

  for (const q of QUESTIONS) {
    // 선택지를 정해진 값으로 번역 (예: "가끔 피워요" → 'sometimes')
    if (q.fact && q.factValues && q.options) {
      const v = answers[q.id];
      if (typeof v !== 'string') continue;
      const i = q.options.indexOf(v);
      if (i >= 0) {
        // 값 종류가 문항마다 달라 여기서만 느슨하게 넣는다.
        // 어떤 문항이 어떤 값을 주는지는 questions.ts의 factValues가 보장한다.
        (facts as unknown as Record<string, string>)[q.fact] = q.factValues[i];
      }
    }
  }

  // 정치 성향: 이슈 문항들의 평균. 높을수록 보수가 되도록 방향을 맞춘다.
  const polQs = QUESTIONS.filter((q) => q.politicsAxis);
  const values: number[] = [];
  for (const q of polQs) {
    const v = answers[q.id];
    if (typeof v !== 'number') continue;
    values.push(q.reverse ? 6 - v : v);
  }
  if (values.length > 0) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    facts.politics = Math.round(mean * 10) / 10;
  }

  return facts;
}

/** 정치 성향 숫자를 사람이 읽을 수 있는 말로 */
export function politicsLabel(p: number | null): string {
  if (p === null) return '판단 보류';
  if (p < 2) return '진보 성향';
  if (p < 2.6) return '약간 진보';
  if (p <= 3.4) return '중도';
  if (p <= 4) return '약간 보수';
  return '보수 성향';
}
