'use client';

import type { ReactNode } from 'react';

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
        {title && <h1 className="text-[22px] font-bold leading-snug mt-4 whitespace-pre-line">{title}</h1>}
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

/** 탭해서 고르는 선택지 버튼 */
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

/** 라벨 + 선택지 한 줄 */
export function Field({
  label, hint, children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="text-[15px] font-semibold mb-1">{label}</div>
      {hint && <div className="text-[13px] text-muted mb-2.5">{hint}</div>}
      <div className={`flex flex-wrap gap-2 ${hint ? '' : 'mt-2.5'}`}>{children}</div>
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
    <div className="flex gap-2">
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
