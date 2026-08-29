'use client';

import { useEffect, useState } from 'react';
import { Button, Shell } from './ui';

const MESSAGES = [
  '답변을 정리하고 있어요',
  '성향을 분석하고 있어요',
  '조건에 맞는 분들을 찾고 있어요',
];

/**
 * 설문 직후 화면.
 *
 * 여기서 바로 매칭 결과를 보여주지 않는다.
 * 결과가 즉시 쏟아지면 희소성이 사라지고, 한 번에 다 소비하고 떠난다.
 * "찾는 데 시간이 걸린다"는 감각을 만들고 알림으로 전달하는 것이 배급 모델의 핵심이다.
 */
export function SearchingStep({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setDone(true), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Shell footer={done ? <Button onClick={onDone}>내 프로필 보기</Button> : undefined}>
      <div className="flex flex-col justify-center min-h-[70dvh]">
        {!done ? (
          <>
            <div className="flex gap-1.5 mb-7">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                    i <= step ? 'bg-accent' : 'bg-line'
                  }`}
                />
              ))}
            </div>
            <h1 className="text-[24px] font-bold leading-snug">{MESSAGES[step]}</h1>
            <p className="text-[15px] text-muted mt-3 leading-relaxed">
              잠시만 기다려주세요.
            </p>
          </>
        ) : (
          <>
            <div className="text-[40px] mb-4">💌</div>
            <h1 className="text-[26px] font-bold leading-snug">
              프로필이 완성됐어요
            </h1>
            <p className="text-[15px] text-muted mt-4 leading-relaxed">
              이제 조건이 맞는 분들 중에서 성향이 가장 가까운 분을 찾아볼게요.
              <br />
              <span className="text-foreground font-semibold">
                인연이 준비되면 알림으로 알려드립니다.
              </span>
            </p>
            <div className="mt-6 rounded-2xl bg-accent-soft p-5">
              <div className="text-[14px] font-semibold mb-1.5">왜 바로 안 보여주나요?</div>
              <p className="text-[13px] text-muted leading-relaxed">
                한 번에 여러 명을 보여주면 대충 넘기게 됩니다.
                한 분씩, 충분히 고민할 수 있게 전해드릴게요.
              </p>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
