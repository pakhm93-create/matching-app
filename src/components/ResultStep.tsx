'use client';

import { useMemo } from 'react';
import type { MatchResult, Section, User } from '@/lib/types';
import { findMatches } from '@/lib/matching';
import { generateUsers } from '@/lib/fake-users';
import { SECTION_LABELS } from '@/lib/questions';
import { describePersonality } from '@/lib/personality';
import * as L from '@/lib/labels';
import { Button, Shell } from './ui';

function MatchCard({ m, rank }: { m: MatchResult; rank: number }) {
  const p = m.user.profile;
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-muted mb-1">{rank}번째 인연</div>
          <div className="text-[17px] font-bold">{p.nickname}</div>
          <div className="text-[13px] text-muted mt-0.5">
            {p.age}세 · {p.region} · {L.SMOKING[p.smoking]}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[28px] font-bold text-accent leading-none">
            {Math.round(m.score)}<span className="text-[15px]">%</span>
          </div>
          <div className="text-[11px] text-muted mt-1">궁합</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-line flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
        <span>
          <span className="text-muted">잘 맞아요</span>{' '}
          <span className="font-semibold">{SECTION_LABELS[m.bestSection as Section]}</span>
        </span>
        <span>
          <span className="text-muted">덜 맞아요</span>{' '}
          <span className="font-semibold">{SECTION_LABELS[m.worstSection as Section]}</span>
        </span>
      </div>
    </div>
  );
}

export function ResultStep({ me, onRestart }: { me: User; onRestart: () => void }) {
  // MVP 단계 — 실제 사용자가 없으므로 가짜 사용자 50명을 상대로 매칭한다
  const matches = useMemo(() => findMatches(me, generateUsers(50), 5), [me]);
  const personality = useMemo(() => describePersonality(me.answers), [me.answers]);

  return (
    <Shell
      progress={1}
      footer={<Button variant="ghost" onClick={onRestart}>처음부터 다시 하기</Button>}
    >
      <div className="rounded-3xl bg-accent-soft p-6 mb-7">
        <div className="text-[13px] text-muted mb-1.5">{me.profile.nickname}님의 성향</div>
        <div className="text-[20px] font-bold leading-snug">{personality}</div>
      </div>

      <h2 className="text-[20px] font-bold mb-1">이번 주 인연</h2>
      <p className="text-[13px] text-muted mb-5 leading-relaxed">
        조건에 맞는 분들 중 성향이 가장 가까운 순서입니다.
      </p>

      {matches.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface p-6 text-center">
          <div className="text-[16px] font-semibold mb-2">조건에 맞는 분이 없어요</div>
          <p className="text-[13px] text-muted leading-relaxed">
            절대 조건 3가지가 너무 좁을 수 있어요.
            범위를 조금만 넓히면 만날 수 있는 분이 생깁니다.
          </p>
        </div>
      ) : (
        matches.map((m, i) => <MatchCard key={m.user.profile.id} m={m} rank={i + 1} />)
      )}

      <p className="text-[12px] text-muted mt-6 leading-relaxed">
        ※ 지금은 시제품이라 가상의 사용자 50명을 상대로 계산한 결과입니다.
        실제 사용자가 모이면 점수는 훨씬 높게 나옵니다.
      </p>
    </Shell>
  );
}
