'use client';

import { useMemo, useState } from 'react';
import type { User } from '@/lib/types';
import { calcAge } from '@/lib/types';
import { deriveFacts, politicsLabel } from '@/lib/facts';
import { extraTraits, personaOf } from '@/lib/personality';
import { stanceDisplayName } from '@/lib/stances';
import * as L from '@/lib/labels';
import { Button, Modal, Shell } from './ui';

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-line bg-surface p-5 mb-3">{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-[14px]">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/**
 * 내 연애 프로필 / 성향 페이지.
 * 설문을 마치면 여기에 도착한다. 매칭 결과로 바로 넘어가지 않는다.
 */
export function ProfilePage({
  me, onEdit, onPreviewMatches, justFinished, onDismiss,
}: {
  me: User;
  onEdit: () => void;
  onPreviewMatches: () => void;
  /** 설문을 방금 마쳤으면 완료 안내를 팝업으로 띄운다 */
  justFinished?: boolean;
  onDismiss?: () => void;
}) {
  const [showDone, setShowDone] = useState(justFinished ?? false);
  const persona = useMemo(() => personaOf(me.answers), [me.answers]);
  const traits = useMemo(() => extraTraits(me.answers), [me.answers]);
  const facts = useMemo(() => deriveFacts(me.answers), [me.answers]);
  const p = me.profile;
  const age = calcAge(p.birthYear, p.birthMonth);

  const ageText = me.ageRange
    ? `${me.ageRange.min}세 ~ ${me.ageRange.max}세`
    : '상관없음';

  return (
    <>
      {showDone && (
        <Modal>
          <div className="text-[40px] mb-3">💌</div>
          <div className="text-[21px] font-bold mb-2">프로필이 완성됐어요</div>
          <p className="text-[14px] text-muted leading-relaxed mb-6">
            조건이 맞는 분들 중에서 성향이 가장 가까운 분을 찾아볼게요.
            인연이 준비되면 알림으로 알려드립니다.
          </p>
          <Button onClick={() => { setShowDone(false); onDismiss?.(); }}>확인</Button>
        </Modal>
      )}

      <Shell footer={<Button variant="ghost" onClick={onEdit}>프로필 수정하기</Button>}>
        <div className="pt-2">
          <div className="text-[13px] text-muted">{p.nickname}님의 연애 프로필</div>
        </div>

        {/* 성향 유형 */}
        <div className="rounded-3xl bg-accent-soft p-6 mt-4 mb-3">
          <div className="text-[13px] text-muted">{persona.tagline}</div>
          <div className="text-[28px] font-bold mt-1">{persona.name}</div>
          <p className="text-[14px] mt-4 leading-relaxed">{persona.description}</p>

          <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10">
            <div className="text-[13px] font-semibold mb-1.5">연애할 때는</div>
            <p className="text-[14px] text-muted leading-relaxed">{persona.inLove}</p>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            {traits.map((t) => (
              <div key={t} className="text-[13px] text-muted flex gap-2">
                <span className="text-accent">·</span>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* 이번 주 인연 — 아직 탐색 중 */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[15px] font-semibold">인연을 찾고 있어요</span>
          </div>
          <p className="text-[13px] text-muted leading-relaxed">
            조건이 맞는 분들 중에서 성향이 가장 가까운 분을 고르고 있어요.
            준비되면 알림으로 알려드릴게요.
          </p>
          <button
            onClick={onPreviewMatches}
            className="mt-4 w-full rounded-2xl border border-line py-3 text-[13px] text-muted active:scale-[0.98] transition"
          >
            지금 결과 미리보기 (시제품 확인용)
          </button>
        </Card>

        {/* 내 조건 */}
        <Card>
          <div className="text-[15px] font-semibold mb-2">절대 양보 못 하는 조건</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {me.stanceIds.length === 0 ? (
              <span className="text-[14px] text-muted">선택한 조건이 없어요</span>
            ) : (
              me.stanceIds.map((id) => (
                <span
                  key={id}
                  className="rounded-full bg-accent text-accent-fg px-3.5 py-1.5 text-[13px] font-semibold"
                >
                  {stanceDisplayName(id, facts, p)}
                </span>
              ))
            )}
          </div>
          <div className="border-t border-line pt-1">
            <Row label="만날 수 있는 지역" value={p.areas.join(', ')} />
            <Row label="원하는 나이" value={ageText} />
            {me.heightRange && (
              <Row label="원하는 키" value={`${me.heightRange.min} ~ ${me.heightRange.max}cm`} />
            )}
          </div>
        </Card>

        {/* 설문에서 파악한 것 */}
        <Card>
          <div className="text-[15px] font-semibold mb-1">설문에서 파악한 내 정보</div>
          <p className="text-[12px] text-muted mb-2">답변을 바탕으로 계산한 값이에요</p>
          <div className="border-t border-line pt-1">
            {facts.smoking && <Row label="흡연" value={L.SMOKING[facts.smoking]} />}
            {facts.drinking && <Row label="음주" value={L.DRINKING[facts.drinking]} />}
            {facts.religion && <Row label="종교" value={L.RELIGION[facts.religion]} />}
            {facts.marriage && <Row label="결혼" value={L.MARRIAGE[facts.marriage]} />}
            {facts.children && <Row label="자녀" value={L.CHILDREN[facts.children]} />}
            {facts.exercise && <Row label="운동" value={L.EXERCISE[facts.exercise]} />}
            <Row label="정치 성향" value={politicsLabel(facts.politics)} />
          </div>
        </Card>

        {/* 기본 정보 */}
        <Card>
          <div className="text-[15px] font-semibold mb-2">내 정보</div>
          <Row label="닉네임" value={p.nickname} />
          <Row label="나이" value={`만 ${age}세 (${p.birthYear}년 ${p.birthMonth}월생)`} />
          <Row label="성별" value={L.GENDER[p.gender]} />
          <Row label="찾는 상대" value={p.seeking.map((g) => L.GENDER[g]).join(', ')} />
          <Row label="키" value={`${p.heightCm}cm`} />
          <Row label="사는 곳" value={`${p.sido} ${p.sigungu}`} />
          {p.education && <Row label="학력" value={p.education} />}
        </Card>

        <p className="text-[12px] text-muted mt-4 mb-2 leading-relaxed">
          ※ 아직 저장 기능이 없어 새로고침하면 사라집니다. 다음 단계에서 계정과 함께 붙입니다.
        </p>
      </Shell>
    </>
  );
}
