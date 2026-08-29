'use client';

import { useEffect, useRef, useState } from 'react';
import type { Answers, Question } from '@/lib/types';
import { PAGES, QUESTIONS } from '@/lib/questions';
import { Button, Chip, ScaleInput, Shell } from './ui';

/**
 * 한 화면에 여러 문항을 보여준다.
 *
 * 문항 하나에 한 화면이면 30번 넘겨야 해서 번거롭다.
 * 5개씩 묶으면 넘기는 횟수가 6번으로 줄고, 남은 양도 눈에 보인다.
 */
export function SurveyStep({
  onDone, baseProgress, span, initial,
}: {
  onDone: (answers: Answers) => void;
  baseProgress: number;
  span: number;
  initial?: Answers;
}) {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initial ?? {});
  const [showMissing, setShowMissing] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const questions = PAGES[page];
  const isLast = page === PAGES.length - 1;

  // 페이지를 넘기면 맨 위부터 보이게 한다
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
    window.scrollTo(0, 0);
  }, [page]);

  const isAnswered = (q: Question) => {
    const v = answers[q.id];
    return v !== undefined && (!Array.isArray(v) || v.length > 0);
  };
  const unanswered = questions.filter((q) => !isAnswered(q));

  const setAnswer = (id: string, v: Answers[string]) =>
    setAnswers((prev) => ({ ...prev, [id]: v }));

  const toggleMulti = (id: string, opt: string) =>
    setAnswers((prev) => {
      const cur = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      return { ...prev, [id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });

  const next = () => {
    if (unanswered.length > 0) {
      setShowMissing(true);
      document
        .getElementById(`q-${unanswered[0].id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setShowMissing(false);
    if (isLast) onDone(answers);
    else setPage(page + 1);
  };

  const answeredCount = QUESTIONS.filter(isAnswered).length;

  return (
    <Shell
      progress={baseProgress + (page / PAGES.length) * span}
      footer={
        <div className="flex gap-2">
          {page > 0 && (
            <div className="w-28">
              <Button variant="ghost" onClick={() => { setShowMissing(false); setPage(page - 1); }}>
                이전
              </Button>
            </div>
          )}
          <div className="flex-1">
            <Button onClick={next}>{isLast ? '완료' : '다음'}</Button>
          </div>
        </div>
      }
    >
      <div ref={topRef} />
      <div className="text-[13px] text-muted mb-6">
        {page + 1} / {PAGES.length} 쪽 · {answeredCount}개 답변함
      </div>

      <div className="flex flex-col gap-9">
        {questions.map((q, i) => {
          const missing = showMissing && !isAnswered(q);
          const current = answers[q.id];
          return (
            <div key={q.id} id={`q-${q.id}`} className="scroll-mt-24">
              <div className="flex gap-2 items-baseline mb-4">
                <span className={`text-[13px] font-bold ${missing ? 'text-accent' : 'text-muted'}`}>
                  {page * questions.length + i + 1}
                </span>
                <h2 className="text-[17px] font-semibold leading-snug flex-1">{q.text}</h2>
              </div>

              {missing && (
                <div className="text-[13px] text-accent mb-3">아직 답하지 않으셨어요</div>
              )}

              {q.type === 'scale' && (
                <ScaleInput
                  value={typeof current === 'number' ? current : undefined}
                  onChange={(v) => setAnswer(q.id, v)}
                />
              )}

              {q.type === 'choice' && (
                <div className="flex flex-col gap-2">
                  {q.options!.map((o) => (
                    <button
                      key={o}
                      onClick={() => setAnswer(q.id, o)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-[15px] transition active:scale-[0.98] ${
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
                        onClick={() => toggleMulti(q.id, o)}
                      />
                    ))}
                  </div>
                  <p className="text-[12px] text-muted mt-3">여러 개 고를 수 있어요</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
