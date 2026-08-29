'use client';

import { useState } from 'react';
import type { Answers } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { Button, Chip, ScaleInput, Shell } from './ui';

/** 한 화면에 한 문항씩. 척도 문항은 고르면 자동으로 다음으로 넘어간다. */
export function SurveyStep({
  onDone, baseProgress, span,
}: {
  onDone: (answers: Answers) => void;
  /** 전체 흐름에서 설문이 시작되는 진행률 지점 */
  baseProgress: number;
  /** 설문이 차지하는 진행률 폭 */
  span: number;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const q = QUESTIONS[index];
  const current = answers[q.id];
  const isLast = index === QUESTIONS.length - 1;

  const go = (next: number) => {
    if (next >= QUESTIONS.length) onDone(answers);
    else setIndex(Math.max(0, next));
  };

  const setAnswer = (v: Answers[string], autoAdvance = false) => {
    const updated = { ...answers, [q.id]: v };
    setAnswers(updated);
    if (autoAdvance) {
      // 살짝 늦춰야 선택된 게 눈에 보인 뒤 넘어간다
      setTimeout(() => {
        if (index + 1 >= QUESTIONS.length) onDone(updated);
        else setIndex(index + 1);
      }, 180);
    }
  };

  const toggleMulti = (opt: string) => {
    const cur = Array.isArray(current) ? current : [];
    setAnswer(cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };

  const answered =
    current !== undefined && (!Array.isArray(current) || current.length > 0);

  return (
    <Shell
      progress={baseProgress + (index / QUESTIONS.length) * span}
      footer={
        <div className="flex gap-2">
          <div className="w-28">
            <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0}>
              이전
            </Button>
          </div>
          <div className="flex-1">
            <Button onClick={() => go(index + 1)} disabled={!answered}>
              {isLast ? '결과 보기' : '다음'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="text-[13px] text-muted mb-3">
        {index + 1} / {QUESTIONS.length}
      </div>
      <h2 className="text-[21px] font-bold leading-snug mb-8">{q.text}</h2>

      {q.type === 'scale' && (
        <ScaleInput
          value={typeof current === 'number' ? current : undefined}
          onChange={(v) => setAnswer(v, true)}
        />
      )}

      {q.type === 'choice' && (
        <div className="flex flex-col gap-2.5">
          {q.options!.map((o) => (
            <button
              key={o}
              onClick={() => setAnswer(o, true)}
              className={`w-full text-left px-5 py-4 rounded-2xl border text-[16px] transition active:scale-[0.98] ${
                current === o
                  ? 'bg-accent text-accent-fg border-accent font-semibold'
                  : 'bg-surface border-line'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {q.type === 'multi' && (
        <>
          <div className="flex flex-wrap gap-2">
            {q.options!.map((o) => (
              <Chip
                key={o}
                label={o}
                selected={Array.isArray(current) && current.includes(o)}
                onClick={() => toggleMulti(o)}
              />
            ))}
          </div>
          <p className="text-[13px] text-muted mt-4">여러 개 고를 수 있어요</p>
        </>
      )}
    </Shell>
  );
}
