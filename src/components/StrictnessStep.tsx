'use client';

import { useState } from 'react';
import type { Strictness } from '@/lib/types';
import { Button, Shell } from './ui';

/**
 * 설문을 마친 뒤 매칭을 얼마나 깐깐하게 걸지 고르게 한다.
 *
 * 점수(90/80/65)는 화면에 보여주지 않는다.
 * 사용자에게 필요한 것은 "얼마나 자주, 얼마나 잘 맞는 사람을 볼 것인가"이지
 * 내부 계산 기준이 아니다. 숫자를 보여주면 그 숫자가 무슨 뜻인지부터 설명해야 한다.
 */
const OPTIONS: { id: Strictness; title: string; desc: string; badge?: string }[] = [
  {
    id: 'strict',
    title: '아주 잘 맞는 분만',
    desc: '소개가 드물어요. 오래 기다릴 수 있어요.',
  },
  {
    id: 'balanced',
    title: '어느 정도 맞으면 좋아요',
    desc: '중요한 게 맞고 사소한 차이는 있는 정도예요.',
    badge: '추천',
  },
  {
    id: 'relaxed',
    title: '조금 달라도 만나볼래요',
    desc: '소개를 자주 받을 수 있어요.',
  },
];

export function StrictnessStep({
  onNext, progress, initial,
}: {
  onNext: (s: Strictness) => void;
  progress: number;
  initial?: Strictness;
}) {
  const [picked, setPicked] = useState<Strictness>(initial ?? 'balanced');

  return (
    <Shell
      progress={progress}
      title={'어떤 분을\n소개해드릴까요?'}
      subtitle="나중에 언제든 바꿀 수 있으니 편하게 고르세요."
      footer={<Button onClick={() => onNext(picked)}>완료</Button>}
    >
      <div className="flex flex-col gap-3">
        {OPTIONS.map((o) => {
          const selected = picked === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setPicked(o.id)}
              className={`w-full text-left p-5 rounded-2xl border transition active:scale-[0.99] ${
                selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[16px] font-bold">{o.title}</span>
                {o.badge && (
                  <span className="shrink-0 whitespace-nowrap text-[11px] font-bold rounded-full bg-accent text-accent-fg px-2.5 py-0.5">
                    {o.badge}
                  </span>
                )}
              </div>
              <p className="text-[13.5px] text-muted leading-relaxed">{o.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-muted mt-7 leading-relaxed">
        잘 맞는 분만 볼수록 소개가 뜸해집니다.
        마땅한 분이 없을 때는 저희가 알려드릴게요.
      </p>
    </Shell>
  );
}
