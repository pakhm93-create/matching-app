'use client';

import { useState } from 'react';
import type { Strictness } from '@/lib/types';
import { STRICTNESS_PERCENTILE, STRICTNESS_THRESHOLD } from '@/lib/types';
import { Button, Shell } from './ui';

const OPTIONS: {
  id: Strictness;
  title: string;
  desc: string;
  badge?: string;
}[] = [
  {
    id: 'strict',
    title: '깐깐하게 찾을래요',
    desc: '거의 다 맞는 분만 소개받습니다. 만날 수 있는 분이 확 줄어들고, 오래 기다려야 할 수 있어요.',
  },
  {
    id: 'balanced',
    title: '어느 정도 맞으면 좋아요',
    desc: '중요한 것들이 맞고 사소한 차이는 있는 정도입니다. 대부분의 분께 이 기준을 권합니다.',
    badge: '추천',
  },
  {
    id: 'relaxed',
    title: '느긋하게 만나볼래요',
    desc: '다른 점이 좀 있어도 일단 만나보는 쪽입니다. 소개받는 분이 가장 많습니다.',
  },
];

/**
 * 설문을 마친 뒤 매칭을 얼마나 깐깐하게 걸지 고르게 한다.
 *
 * 절대 조건이 "이건 절대 안 된다"라면, 이건 "얼마나 잘 맞아야 만날 마음이 드는가"다.
 * 같은 사람이라도 시기에 따라 달라지므로 나중에 언제든 바꿀 수 있어야 한다.
 */
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
      title={'어느 정도 맞는 분을\n소개해드릴까요?'}
      subtitle="궁합은 100점 만점이에요. 나중에 언제든 바꿀 수 있으니 편하게 고르세요."
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[16px] font-bold">{o.title}</span>
                {o.badge && (
                  <span className="shrink-0 whitespace-nowrap text-[11px] font-bold rounded-full bg-accent text-accent-fg px-2.5 py-0.5">
                    {o.badge}
                  </span>
                )}
              </div>
              <div
                className={`text-[13px] font-bold tabular-nums mb-2 ${
                  selected ? 'text-accent' : 'text-muted'
                }`}
              >
                궁합 {STRICTNESS_THRESHOLD[o.id]}점 이상
                <span className="font-normal text-muted"> · {STRICTNESS_PERCENTILE[o.id]}</span>
              </div>
              <p className="text-[13.5px] text-muted leading-relaxed">{o.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-muted mt-7 leading-relaxed">
        기준을 높이면 더 잘 맞는 분을 만나지만, 그만큼 소개가 뜸해집니다.
        조건에 맞는 분이 없을 때는 기준을 낮춰보시라고 알려드릴게요.
      </p>
    </Shell>
  );
}
