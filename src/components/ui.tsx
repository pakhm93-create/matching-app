'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** 화면 공통 뼈대 — 상단 진행률, 본문, 하단 고정 버튼 */
export function Shell({
  progress, title, subtitle, children, footer,
}: {
  progress?: number;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      {progress !== undefined && (
        <div className="sticky top-0 z-10 bg-background px-5 pt-5 pb-3">
          <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex-1 px-5 pb-6">
        {title && (
          <h1 className="text-[22px] font-bold leading-snug mt-4 whitespace-pre-line">{title}</h1>
        )}
        {subtitle && <p className="text-[14px] text-muted mt-2 leading-relaxed">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <div className="sticky bottom-0 bg-background px-5 py-4 border-t border-line">
          {footer}
        </div>
      )}
    </div>
  );
}

export function Button({
  children, onClick, disabled, variant = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const base =
    'w-full rounded-2xl py-4 font-semibold text-[16px] transition active:scale-[0.98] disabled:opacity-35 disabled:active:scale-100';
  const style =
    variant === 'primary'
      ? 'bg-accent text-accent-fg'
      : 'bg-transparent text-muted border border-line';
  return (
    <button className={`${base} ${style}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Chip({
  label, selected, onClick, disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-full text-[15px] border transition active:scale-95 disabled:opacity-30 ${
        selected
          ? 'bg-accent text-accent-fg border-accent font-semibold'
          : 'bg-surface text-foreground border-line'
      }`}
    >
      {label}
    </button>
  );
}

/** 라벨 + 선택지 한 줄. error가 있으면 빨갛게 표시한다 */
export function Field({
  label, hint, error, children, anchorId,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  anchorId?: string;
}) {
  return (
    <div className="mb-6 scroll-mt-24" id={anchorId}>
      <div className="text-[15px] font-semibold mb-1">{label}</div>
      {hint && !error && <div className="text-[13px] text-muted mb-2.5">{hint}</div>}
      {error && <div className="text-[13px] text-accent mb-2.5 font-medium">{error}</div>}
      <div className={`flex flex-wrap gap-2 ${hint || error ? '' : 'mt-2.5'}`}>{children}</div>
    </div>
  );
}

/** 1~5 척도 응답 버튼 */
export function ScaleInput({
  value, onChange,
}: {
  value?: number;
  onChange: (v: number) => void;
}) {
  const labels = ['전혀\n아니다', '아닌\n편', '보통', '그런\n편', '매우\n그렇다'];
  return (
    <div className="flex gap-2 w-full">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex-1 aspect-square rounded-2xl border text-[11px] leading-tight whitespace-pre-line flex items-center justify-center transition active:scale-95 ${
            value === n
              ? 'bg-accent text-accent-fg border-accent font-bold'
              : 'bg-surface border-line text-muted'
          }`}
        >
          {labels[n - 1]}
        </button>
      ))}
    </div>
  );
}

/**
 * 휠 선택기 — 위아래로 굴려서 고른다.
 * 숫자를 직접 입력하는 것보다 오타가 없고 모바일에서 빠르다.
 */
export function Wheel({
  items, value, onChange, suffix,
}: {
  items: number[];
  value: number | undefined;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ITEM = 44;

  // 처음 열릴 때 선택된 값이 가운데 오도록 맞춘다
  useEffect(() => {
    const el = ref.current;
    if (!el || value === undefined) return;
    const i = items.indexOf(value);
    if (i >= 0) el.scrollTop = i * ITEM;
    // 처음 한 번만 맞추면 되므로 value 변화에는 반응하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (timer.current) clearTimeout(timer.current);
    // 굴리는 중에는 계산하지 않고, 멈춘 뒤에 가운데 값을 읽는다
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / ITEM);
      const picked = items[Math.max(0, Math.min(items.length - 1, i))];
      if (picked !== undefined && picked !== value) onChange(picked);
    }, 90);
  };

  return (
    <div className="relative flex-1">
      {/* 가운데 선택 영역 표시 */}
      <div className="pointer-events-none absolute inset-x-0 top-[44px] h-[44px] rounded-xl bg-accent-soft" />
      <div ref={ref} className="wheel relative" onScroll={handleScroll}>
        <div style={{ height: 44 }} />
        {items.map((n) => (
          <div
            key={n}
            className={`wheelItem flex items-center justify-center text-[17px] transition-colors ${
              n === value ? 'font-bold text-foreground' : 'text-muted'
            }`}
            onClick={() => {
              ref.current?.scrollTo({ top: items.indexOf(n) * 44, behavior: 'smooth' });
              onChange(n);
            }}
          >
            {n}{suffix}
          </div>
        ))}
        <div style={{ height: 44 }} />
      </div>
    </div>
  );
}

/**
 * 양쪽 손잡이를 드래그하는 범위 슬라이더 (볼륨 조절하듯이).
 * 손잡이 두 개를 겹쳐 놓고, 트랙은 뒤에 직접 그린다.
 */
export function RangeSlider({
  min, max, value, onChange, format, disabled,
}: {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (v: { min: number; max: number }) => void;
  format?: (n: number) => string;
  disabled?: boolean;
}) {
  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  const label = format ?? ((n: number) => String(n));

  return (
    <div className={`w-full ${disabled ? 'opacity-35 pointer-events-none' : ''}`}>
      <div className="flex justify-center mb-3">
        <span className="text-[17px] font-bold">
          {label(value.min)} ~ {label(value.max)}
        </span>
      </div>

      <div className="relative h-10 flex items-center">
        {/* 트랙 */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-line" />
        {/* 선택된 구간 */}
        <div
          className="absolute h-1.5 rounded-full bg-accent"
          style={{ left: `${pct(value.min)}%`, right: `${100 - pct(value.max)}%` }}
        />
        <input
          type="range" className="rangeThumb" min={min} max={max} value={value.min}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), value.max);
            onChange({ min: v, max: value.max });
          }}
        />
        <input
          type="range" className="rangeThumb" min={min} max={max} value={value.max}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), value.min);
            onChange({ min: value.min, max: v });
          }}
        />
      </div>
    </div>
  );
}

/** 화면 위에 뜨는 안내 창 */
export function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50">
      <div className="w-full max-w-[400px] rounded-3xl bg-surface p-7 text-center shadow-2xl">
        {children}
      </div>
    </div>
  );
}
