'use client';

import { useState } from 'react';
import { MAX_STANCES, STANCE_TAGS } from '@/lib/stances';
import { Button, RangeSlider, Shell } from './ui';

export interface StanceResult {
  stanceIds: string[];
  heightRange: { min: number; max: number } | null;
}

/**
 * 절대 양보할 수 없는 조건 고르기.
 *
 * 짧은 단어만 늘어놓아 한눈에 들어오게 한다.
 * "흡연"을 골랐다는 것 자체가 그 사람에게 흡연이 가장 중요하다는 뜻이고,
 * 조건은 "상대가 나와 같아야 한다"로 통일했다. 그래서 값을 따로 묻지 않는다.
 *
 * 0개여도 넘어갈 수 있다. 꼭 걸어야 할 조건이 없는 사람도 있다.
 */
export function StanceStep({
  onNext, progress, initial,
}: {
  onNext: (r: StanceResult) => void;
  progress: number;
  initial?: StanceResult;
}) {
  const [picked, setPicked] = useState<string[]>(initial?.stanceIds ?? []);
  const [heightRange, setHeightRange] = useState(
    initial?.heightRange ?? { min: 160, max: 180 },
  );

  const toggle = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_STANCES) return prev;
      return [...prev, id];
    });
  };

  const full = picked.length >= MAX_STANCES;

  return (
    <Shell
      progress={progress}
      title={'절대 양보할 수 없는 것을\n골라주세요'}
      subtitle={`최대 ${MAX_STANCES}개까지 고를 수 있어요. 없으면 그냥 넘어가셔도 됩니다. 고른 항목은 반드시 지켜드리고, 고르지 않은 것도 궁합 점수에는 반영돼요.`}
      footer={
        <Button onClick={() => onNext({
          stanceIds: picked,
          heightRange: picked.includes('height') ? heightRange : null,
        })}>
          {picked.length === 0 ? '건너뛰고 설문 시작' : '설문 시작하기'}
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2.5">
        {STANCE_TAGS.map((s) => {
          const selected = picked.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              disabled={!selected && full}
              className={`px-5 py-3 rounded-2xl text-[16px] border transition active:scale-95 disabled:opacity-25 ${
                selected
                  ? 'bg-accent text-accent-fg border-accent font-bold'
                  : 'bg-surface border-line'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 text-[13px] text-muted">
        {picked.length}/{MAX_STANCES} 선택
      </div>

      {/* 고른 항목이 무슨 뜻인지 */}
      {picked.length > 0 && (
        <div className="mt-5 rounded-2xl bg-accent-soft p-4">
          {picked.map((id) => {
            const s = STANCE_TAGS.find((x) => x.id === id)!;
            return (
              <div key={id} className="text-[13px] py-1">
                <span className="font-semibold">{s.label}</span>
                <span className="text-muted"> · {s.hint}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 키는 범위를 받아야 한다 */}
      {picked.includes('height') && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="text-[15px] font-semibold mb-3">원하는 키 범위</div>
          <RangeSlider
            min={140} max={200}
            value={heightRange}
            onChange={setHeightRange}
            format={(n) => `${n}cm`}
          />
        </div>
      )}

      <p className="text-[13px] text-muted mt-7 leading-relaxed">
        조건을 많이 걸수록 만날 수 있는 분이 빠르게 줄어듭니다.
        그래서 {MAX_STANCES}개로 제한했어요.
      </p>
    </Shell>
  );
}
