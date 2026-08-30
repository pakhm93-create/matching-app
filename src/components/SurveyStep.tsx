'use client';

import { useEffect, useRef, useState } from 'react';
import type { Answers, Question } from '@/lib/types';
import { PAGES } from '@/lib/questions';
import { Button, Chip, ScaleInput, Shell } from './ui';

/**
 * 설문. 한 화면에 5문항씩 보여준다.
 *
 * 설문을 1차·2차로 나누지 않고 한 번에 끝내되, 답할 때마다 자동 저장한다.
 * 중간에 나가도 다음에 들어오면 이어서 할 수 있다.
 */
export function SurveyStep({
  onDone, onProgress, baseProgress, span, initial, startPage,
}: {
  onDone: (answers: Answers) => void;
  /** 답할 때마다 호출 — 바깥에서 임시 저장하는 데 쓴다 */
  onProgress?: (answers: Answers, page: number) => void;
  baseProgress: number;
  span: number;
  initial?: Answers;
  startPage?: number;
}) {
  const [page, setPage] = useState(startPage ?? 0);
  const [answers, setAnswers] = useState<Answers>(initial ?? {});
  const [showMissing, setShowMissing] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const pageQuestions = PAGES[page];
  const isLast = page === PAGES.length - 1;

  // 페이지를 넘기면 맨 위부터 보이게 한다
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
    window.scrollTo(0, 0);
  }, [page]);

  // 답이 바뀔 때마다 바깥에 알려 임시 저장하게 한다
  useEffect(() => {
    onProgress?.(answers, page);
    // onProgress는 매 렌더 새로 만들어질 수 있어 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, page]);

  const isAnswered = (q: Question) => {
    const v = answers[q.id];
    return v !== undefined && (!Array.isArray(v) || v.length > 0);
  };
  const unanswered = pageQuestions.filter((q) => !isAnswered(q));

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
      <div ref={topRef} className="pt-2" />

      <div className="flex flex-col gap-9">
        {pageQuestions.map((q) => {
          const missing = showMissing && !isAnswered(q);
          const current = answers[q.id];
          return (
            <div key={q.id} id={`q-${q.id}`} className="scroll-mt-24">
              <h2 className={`text-[17px] font-semibold leading-snug mb-4 ${missing ? 'text-accent' : ''}`}>
                {q.text}
              </h2>

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
