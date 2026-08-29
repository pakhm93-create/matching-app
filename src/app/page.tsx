'use client';

import { useState } from 'react';
import type { Answers, User } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { ProfileStep, type ProfileResult } from '@/components/ProfileStep';
import { StanceStep, type StanceResult } from '@/components/StanceStep';
import { SurveyStep } from '@/components/SurveyStep';
import { ProfilePage } from '@/components/ProfilePage';
import { MatchesView } from '@/components/MatchesView';
import { Button, Shell } from '@/components/ui';

type Step = 'intro' | 'profile' | 'stance' | 'survey' | 'me' | 'matches';

export default function Page() {
  const [step, setStep] = useState<Step>('intro');
  const [profileResult, setProfileResult] = useState<ProfileResult>();
  const [stanceResult, setStanceResult] = useState<StanceResult>();
  const [answers, setAnswers] = useState<Answers>({});
  /** 설문을 방금 마쳤는가 — 프로필 화면에서 완료 팝업을 띄우기 위한 것 */
  const [justFinished, setJustFinished] = useState(false);
  /** 수정 중이면 설문을 다시 시키지 않고 프로필로 돌려보낸다 */
  const [editing, setEditing] = useState(false);

  if (step === 'intro') {
    return (
      <Shell footer={<Button onClick={() => setStep('profile')}>시작하기</Button>}>
        <div className="flex flex-col justify-center min-h-[70dvh]">
          <div className="text-[13px] font-semibold text-accent mb-3">성향 매칭</div>
          <h1 className="text-[30px] font-bold leading-[1.3]">
            조건이 아니라
            <br />
            성향으로 만나요
          </h1>
          <p className="text-[15px] text-muted mt-5 leading-relaxed">
            {QUESTIONS.length}개의 질문으로 가치관, 연애 스타일, 생활 습관까지
            꼼꼼히 살펴본 뒤 가장 잘 맞는 분을 찾아드립니다.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              ['절대 조건 3가지', '양보 못 하는 것만 3개, 확실히 지켜드려요'],
              [`${QUESTIONS.length}개의 질문`, '5분이면 충분해요'],
              ['서로 맞아야 매칭', '한쪽만 좋은 매칭은 보여주지 않아요'],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <div>
                  <div className="text-[15px] font-semibold">{t}</div>
                  <div className="text-[13px] text-muted mt-0.5">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (step === 'profile') {
    return (
      <ProfileStep
        progress={0.08}
        initial={profileResult}
        onNext={(r) => { setProfileResult(r); setStep('stance'); }}
      />
    );
  }

  if (step === 'stance') {
    return (
      <StanceStep
        progress={0.22}
        initial={stanceResult}
        onNext={(r) => {
          setStanceResult(r);
          if (editing) { setEditing(false); setStep('me'); }
          else setStep('survey');
        }}
      />
    );
  }

  if (step === 'survey') {
    return (
      <SurveyStep
        baseProgress={0.3}
        span={0.7}
        initial={answers}
        onDone={(a) => {
          setAnswers(a);
          setJustFinished(true);
          setStep('me');
        }}
      />
    );
  }

  const me: User = {
    profile: profileResult!.profile,
    stanceIds: stanceResult?.stanceIds ?? [],
    ageRange: profileResult!.ageRange,
    heightRange: stanceResult?.heightRange ?? null,
    answers,
  };

  if (step === 'matches') {
    return <MatchesView me={me} onBack={() => setStep('me')} />;
  }

  return (
    <ProfilePage
      me={me}
      justFinished={justFinished}
      onDismiss={() => setJustFinished(false)}
      onEdit={() => { setEditing(true); setStep('profile'); }}
      onPreviewMatches={() => setStep('matches')}
    />
  );
}
