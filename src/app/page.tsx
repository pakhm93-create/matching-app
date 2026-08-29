'use client';

import { useState } from 'react';
import type { Answers, PriorityFilter, Profile, User } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { ProfileStep } from '@/components/ProfileStep';
import { PriorityStep } from '@/components/PriorityStep';
import { SurveyStep } from '@/components/SurveyStep';
import { ResultStep } from '@/components/ResultStep';
import { Button, Shell } from '@/components/ui';

type Step = 'intro' | 'profile' | 'priority' | 'survey' | 'result';

export default function Page() {
  const [step, setStep] = useState<Step>('intro');
  const [profile, setProfile] = useState<Profile>();
  const [priorities, setPriorities] = useState<PriorityFilter[]>([]);
  const [answers, setAnswers] = useState<Answers>({});

  const restart = () => {
    setProfile(undefined);
    setPriorities([]);
    setAnswers({});
    setStep('intro');
  };

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
        onNext={(p) => {
          setProfile(p);
          setStep('priority');
        }}
      />
    );
  }

  if (step === 'priority') {
    return (
      <PriorityStep
        progress={0.25}
        onNext={(f) => {
          setPriorities(f);
          setStep('survey');
        }}
      />
    );
  }

  if (step === 'survey') {
    return (
      <SurveyStep
        baseProgress={0.35}
        span={0.6}
        onDone={(a) => {
          setAnswers(a);
          setStep('result');
        }}
      />
    );
  }

  const me: User = { profile: profile!, priorities, answers };
  return <ResultStep me={me} onRestart={restart} />;
}
