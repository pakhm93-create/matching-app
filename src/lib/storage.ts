/**
 * 작성 중인 내용을 브라우저에 임시 저장한다.
 *
 * 설문이 100문항 가까이 되므로 한 번에 끝내지 못하는 사람이 많다.
 * 중간에 나가도 다음에 들어오면 이어서 할 수 있어야 한다.
 *
 * ⚠️ 어디까지나 임시 저장이다. 브라우저를 바꾸면 사라진다.
 *    계정과 함께 서버에 저장하는 것은 Supabase를 붙이면서 한다.
 */
import type { Answers, Strictness } from './types';
import type { ProfileResult } from '@/components/ProfileStep';
import type { StanceResult } from '@/components/StanceStep';

const KEY = 'matching-app.draft.v1';

export interface Draft {
  profile?: ProfileResult;
  stance?: StanceResult;
  answers: Answers;
  /** 매칭 기준. 메일 링크를 누르고 돌아왔을 때 다시 묻지 않으려고 함께 담는다 */
  strictness?: Strictness;
  /** 설문 몇 쪽까지 갔는지 */
  page: number;
  savedAt: number;
}

export function loadDraft(): Draft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && typeof d === 'object' && d.answers ? d : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: Omit<Draft, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...d, savedAt: Date.now() }));
  } catch {
    // 저장 공간이 없거나 브라우저가 막아둔 경우 — 조용히 넘어간다
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

/** "3일 전에 작성하던" 처럼 보여줄 문구 */
export function agoLabel(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
