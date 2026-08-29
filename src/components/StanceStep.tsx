'use client';

import { useState } from 'react';
import type { PriorityFilter, Profile } from '@/lib/types';
import { MAX_STANCES, STANCES, type Stance } from '@/lib/stances';
import { Button, Shell } from './ui';

/**
 * 절대 양보 못 하는 조건 고르기.
 * 예전에는 "흡연" 같은 항목 이름을 고른 뒤, 다음 화면에서 "어디까지 괜찮으세요?"를
 * 또 물었다. 같은 질문을 두 번 하는 느낌이라 없앴다.
 * 지금은 완성된 문장을 바로 고르게 해서 한 화면에서 끝난다.
 */
export function StanceStep({
  me, onNext, progress,
}: {
  me: Profile;
  onNext: (filters: PriorityFilter[], stanceIds: string[]) => void;
  progress: number;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  const pickedStances = picked
    .map((id) => STANCES.find((s) => s.id === id))
    .filter((s): s is Stance => s !== undefined);
  const pickedGroups = new Set(pickedStances.map((s) => s.group));

  // 항상 직전 상태를 기준으로 계산한다 (연달아 눌러도 앞선 선택이 사라지지 않게)
  const toggle = (s: Stance) => {
    setPicked((prev) => {
      if (prev.includes(s.id)) return prev.filter((x) => x !== s.id);

      // 같은 그룹은 하나만 고를 수 있다.
      // "결혼 생각 있는 분만"과 "비혼주의인 분만"이 동시에 걸리면 후보가 0명이 된다.
      const sameGroup = prev.find(
        (id) => STANCES.find((x) => x.id === id)?.group === s.group,
      );
      if (sameGroup) return [...prev.filter((id) => id !== sameGroup), s.id];

      if (prev.length >= MAX_STANCES) return prev;
      return [...prev, s.id];
    });
  };

  const remaining = MAX_STANCES - picked.length;
  const full = remaining === 0;

  return (
    <Shell
      progress={progress}
      title={`절대 양보할 수 없는 것\n${MAX_STANCES}가지만 골라주세요`}
      subtitle="여기서 고른 조건은 반드시 지켜드립니다. 고르지 않은 것들도 버려지지 않고 궁합 점수에 반영돼요."
      footer={
        <Button
          onClick={() => onNext(pickedStances.map((s) => s.build(me)), picked)}
          disabled={!full}
        >
          {full ? '설문 시작하기' : `${remaining}개 더 골라주세요`}
        </Button>
      }
    >
      <div className="flex flex-col gap-2.5">
        {STANCES.map((s) => {
          const selected = picked.includes(s.id);
          // 3개를 다 골랐고 이 항목이 새로운 그룹이면 더 못 고른다
          const blocked = !selected && full && !pickedGroups.has(s.group);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s)}
              disabled={blocked}
              className={`w-full text-left px-5 py-4 rounded-2xl border text-[15px] leading-snug transition active:scale-[0.98] disabled:opacity-30 ${
                selected
                  ? 'bg-accent text-accent-fg border-accent font-semibold'
                  : 'bg-surface border-line'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-muted mt-6 leading-relaxed">
        조건을 많이 걸수록 만날 수 있는 분이 빠르게 줄어듭니다.
        그래서 {MAX_STANCES}개로 제한했어요.
      </p>
    </Shell>
  );
}
