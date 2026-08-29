'use client';

import { useMemo } from 'react';
import type { MatchResult, Section, User } from '@/lib/types';
import { calcAge } from '@/lib/types';
import { findMatches } from '@/lib/matching';
import { generateUsers } from '@/lib/fake-users';
import { SECTION_LABELS } from '@/lib/questions';
import { personaOf } from '@/lib/personality';
import { Button, Shell } from './ui';

function MatchCard({ m, rank }: { m: MatchResult; rank: number }) {
  const p = m.user.profile;
  const persona = personaOf(m.user.answers);
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted mb-1">{rank}번째 인연</div>
          <div className="text-[17px] font-bold truncate">{p.nickname}</div>
          <div className="text-[13px] text-muted mt-0.5">
            {calcAge(p.birthYear, p.birthMonth)}세 · {p.sido} {p.sigungu} · {p.heightCm}cm
          </div>
          <div className="text-[13px] mt-2 font-medium">{persona.name}</div>
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

/** 매칭 결과 미리보기 — 시제품에서 알고리즘을 눈으로 확인하기 위한 화면 */
export function MatchesView({ me, onBack }: { me: User; onBack: () => void }) {
  // 실제 사용자가 없으므로 가짜 사용자 50명을 상대로 계산한다
  const matches = useMemo(() => findMatches(me, generateUsers(50), 5), [me]);

  return (
    <Shell footer={<Button variant="ghost" onClick={onBack}>내 프로필로 돌아가기</Button>}>
      <h2 className="text-[20px] font-bold mb-1 mt-2">이번 주 인연</h2>
      <p className="text-[13px] text-muted mb-5 leading-relaxed">
        조건에 맞는 분들 중 성향이 가장 가까운 순서입니다.
      </p>

      {matches.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface p-6 text-center">
          <div className="text-[16px] font-semibold mb-2">조건에 맞는 분이 없어요</div>
          <p className="text-[13px] text-muted leading-relaxed">
            절대 조건이나 지역·나이 범위가 좁을 수 있어요.
            프로필 수정에서 조금만 넓히면 만날 수 있는 분이 생깁니다.
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
