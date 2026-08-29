'use client';

import { useState } from 'react';
import type { PriorityFilter, PriorityKey } from '@/lib/types';
import * as L from '@/lib/labels';
import { Button, Chip, Field, Shell } from './ui';

const MAX = 3;

/** 각 조건에서 고를 수 있는 값 목록 (age만 예외로 숫자 범위) */
function optionsFor(key: PriorityKey): { value: string; label: string }[] {
  const fromRecord = (r: Record<string, string>) =>
    Object.entries(r).map(([value, label]) => ({ value, label }));
  switch (key) {
    case 'region':   return L.REGIONS.map((r) => ({ value: r, label: r }));
    case 'smoking':  return fromRecord(L.SMOKING);
    case 'drinking': return fromRecord(L.DRINKING);
    case 'religion': return fromRecord(L.RELIGION);
    case 'marriage': return fromRecord(L.MARRIAGE);
    case 'children': return fromRecord(L.CHILDREN);
    case 'pet':      return fromRecord(L.PET);
    case 'politics': return [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: L.POLITICS[n] }));
    case 'tattoo':   return [{ value: 'true', label: '있어도 됨' }, { value: 'false', label: '없어야 함' }];
    default:         return [];
  }
}

/** 선택한 값들을 매칭 엔진이 쓰는 형태로 변환 */
function toFilter(key: PriorityKey, picked: string[], ageRange: [number, number]): PriorityFilter | null {
  if (key === 'age') return { key: 'age', min: ageRange[0], max: ageRange[1] };
  if (picked.length === 0) return null;
  if (key === 'politics') {
    const nums = picked.map(Number);
    return { key: 'politics', min: Math.min(...nums), max: Math.max(...nums) };
  }
  if (key === 'tattoo') return { key: 'tattoo', allowed: picked.map((p) => p === 'true') };
  // 나머지는 문자열 목록 그대로
  return { key, allowed: picked } as PriorityFilter;
}

export function PriorityStep({
  onNext, progress,
}: {
  onNext: (filters: PriorityFilter[]) => void;
  progress: number;
}) {
  const [phase, setPhase] = useState<'pick' | 'config'>('pick');
  const [keys, setKeys] = useState<PriorityKey[]>([]);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [ageRange, setAgeRange] = useState<[number, number]>([25, 39]);

  const toggleKey = (k: PriorityKey) =>
    setKeys((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : prev.length < MAX ? [...prev, k] : prev,
    );

  const toggleValue = (k: PriorityKey, v: string) =>
    setPicked((prev) => {
      const cur = prev[k] ?? [];
      return { ...prev, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });

  // ── 1단계: 조건 3개 고르기 ──
  if (phase === 'pick') {
    return (
      <Shell
        progress={progress}
        title={`절대 양보할 수 없는 것\n${MAX}가지만 골라주세요`}
        subtitle="나머지 조건도 매칭에 반영되지만, 여기서 고른 3가지는 절대 조건으로 지켜드립니다."
        footer={
          <Button onClick={() => setPhase('config')} disabled={keys.length !== MAX}>
            {keys.length === MAX ? '다음' : `${MAX - keys.length}개 더 골라주세요`}
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {L.PRIORITY_OPTIONS.map((o) => (
            <Chip
              key={o.key}
              label={o.label}
              selected={keys.includes(o.key)}
              onClick={() => toggleKey(o.key)}
              disabled={!keys.includes(o.key) && keys.length >= MAX}
            />
          ))}
        </div>
        <p className="text-[13px] text-muted mt-6 leading-relaxed">
          너무 많은 조건을 걸면 만날 수 있는 사람이 사라집니다.
          그래서 {MAX}개로 제한하고, 나머지는 점수로 반영합니다.
        </p>
      </Shell>
    );
  }

  // ── 2단계: 고른 조건의 허용 범위 정하기 ──
  const allConfigured = keys.every((k) => k === 'age' || (picked[k]?.length ?? 0) > 0);

  return (
    <Shell
      progress={progress}
      title="어느 정도까지 괜찮으세요?"
      subtitle="고르신 조건별로 허용 범위를 정해주세요."
      footer={
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              const filters = keys
                .map((k) => toFilter(k, picked[k] ?? [], ageRange))
                .filter((f): f is PriorityFilter => f !== null);
              onNext(filters);
            }}
            disabled={!allConfigured}
          >
            설문 시작하기
          </Button>
          <Button variant="ghost" onClick={() => setPhase('pick')}>다시 고르기</Button>
        </div>
      }
    >
      {keys.map((k) => {
        const meta = L.PRIORITY_OPTIONS.find((o) => o.key === k)!;
        if (k === 'age') {
          return (
            <Field key={k} label={meta.label} hint={meta.hint}>
              <div className="flex items-center gap-3 w-full">
                <input
                  type="number" inputMode="numeric" value={ageRange[0]}
                  onChange={(e) => setAgeRange([Number(e.target.value), ageRange[1]])}
                  className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent text-center"
                />
                <span className="text-muted">~</span>
                <input
                  type="number" inputMode="numeric" value={ageRange[1]}
                  onChange={(e) => setAgeRange([ageRange[0], Number(e.target.value)])}
                  className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent text-center"
                />
                <span className="text-muted text-[14px]">세</span>
              </div>
            </Field>
          );
        }
        return (
          <Field key={k} label={meta.label} hint={`${meta.hint} (여러 개 선택 가능)`}>
            {optionsFor(k).map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={(picked[k] ?? []).includes(o.value)}
                onClick={() => toggleValue(k, o.value)}
              />
            ))}
          </Field>
        );
      })}
    </Shell>
  );
}
