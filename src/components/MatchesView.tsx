'use client';

import { useMemo } from 'react';
import type { MatchResult, Section, Strictness, User } from '@/lib/types';
import { calcAge, STRICTNESS_THRESHOLD } from '@/lib/types';
import { findMatches } from '@/lib/matching';
import { generateUsers } from '@/lib/fake-users';
import { SECTION_LABELS } from '@/lib/questions';
import { personaOf } from '@/lib/personality';
import { Button, Shell } from './ui';

const STRICTNESS_LABEL: Record<Strictness, string> = {
  strict: '깐깐하게',
  balanced: '어느 정도',
  relaxed: '느긋하게',
};

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
          <div className="text-[28px] font-bold text-accent leading-none tabular-nums">
            {Math.round(m.score)}<span className="text-[15px]">점</span>
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
  const strictness: Strictness = me.strictness ?? 'balanced';
  const threshold = STRICTNESS_THRESHOLD[strictness];

  // 실제 사용자가 없으므로 가짜 사용자를 상대로 계산한다.
  // 표본이 작으면 궁합 높은 사람이 아예 없을 수 있어 넉넉히 만든다.
  const all = useMemo(() => findMatches(me, generateUsers(200)), [me]);
  const passed = all.filter((m) => m.score >= threshold);
  const best = all[0];

  return (
    <Shell footer={<Button variant="ghost" onClick={onBack}>내 프로필로 돌아가기</Button>}>
      <h2 className="text-[20px] font-bold mb-1 mt-2">이번 주 인연</h2>
      <p className="text-[13px] text-muted mb-5 leading-relaxed">
        {STRICTNESS_LABEL[strictness]} 기준으로 <b className="text-foreground">궁합 {threshold}점 이상</b>인
        분만 보여드립니다.
      </p>

      {passed.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="text-[16px] font-semibold mb-2">
            아직 기준에 맞는 분이 없어요
          </div>
          <p className="text-[13px] text-muted leading-relaxed">
            조건에 맞는 분은 {all.length}명 있지만, 궁합 {threshold}점을 넘는 분이 아직 없습니다.
            {best && (
              <>
                {' '}지금 가장 높은 궁합은 <b className="text-foreground">{Math.round(best.score)}점</b>이에요.
              </>
            )}
          </p>
          <p className="text-[13px] text-muted leading-relaxed mt-3">
            기준을 낮추거나, 조금 더 기다려보시는 걸 권합니다.
            매칭 기준은 프로필에서 언제든 바꿀 수 있어요.
          </p>
        </div>
      ) : (
        passed.slice(0, 5).map((m, i) => (
          <MatchCard key={m.user.profile.id} m={m} rank={i + 1} />
        ))
      )}

      <p className="text-[12px] text-muted mt-6 leading-relaxed">
        ※ 지금은 시제품이라 가상의 사용자 200명을 상대로 계산한 결과입니다.
        실제 사용자가 모이면 표본이 커져서 높은 궁합이 나올 확률도 올라갑니다.
      </p>
    </Shell>
  );
}
