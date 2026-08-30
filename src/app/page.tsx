'use client';

import { useEffect, useState } from 'react';
import type { Answers, Strictness, User } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { agoLabel, clearDraft, loadDraft, saveDraft, type Draft } from '@/lib/storage';
import { ProfileStep, type ProfileResult } from '@/components/ProfileStep';
import { StanceStep, type StanceResult } from '@/components/StanceStep';
import { SurveyStep } from '@/components/SurveyStep';
import { StrictnessStep } from '@/components/StrictnessStep';
import { ProfilePage } from '@/components/ProfilePage';
import { MatchesView } from '@/components/MatchesView';
import { Button, Modal, Shell } from '@/components/ui';

type Step = 'intro' | 'profile' | 'stance' | 'survey' | 'strictness' | 'me' | 'matches';

export default function Page() {
  const [step, setStep] = useState<Step>('intro');
  const [profileResult, setProfileResult] = useState<ProfileResult>();
  const [stanceResult, setStanceResult] = useState<StanceResult>();
  const [answers, setAnswers] = useState<Answers>({});
  const [surveyPage, setSurveyPage] = useState(0);
  const [strictness, setStrictness] = useState<Strictness>('balanced');
  /** 설문을 방금 마쳤는가 — 프로필 화면에서 완료 팝업을 띄우기 위한 것 */
  const [justFinished, setJustFinished] = useState(false);
  /** 수정 중이면 설문을 다시 시키지 않고 프로필로 돌려보낸다 */
  const [editing, setEditing] = useState(false);
  /** 저장된 작성분이 있으면 이어서 할지 물어본다 */
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const d = loadDraft();
    if (d && Object.keys(d.answers).length > 0) setDraft(d);
  }, []);

  const persist = (next: Partial<Omit<Draft, 'savedAt'>>) => {
    saveDraft({
      profile: profileResult,
      stance: stanceResult,
      answers,
      page: surveyPage,
      ...next,
    });
  };

  const resume = () => {
    if (!draft) return;
    if (draft.profile) setProfileResult(draft.profile);
    if (draft.stance) setStanceResult(draft.stance);
    setAnswers(draft.answers);
    setSurveyPage(draft.page);
    setDraft(null);
    setStep(draft.profile ? 'survey' : 'profile');
  };

  const startOver = () => {
    clearDraft();
    setDraft(null);
  };

  if (step === 'intro') {
    return (
      <>
        {draft && (
          <Modal>
            <div className="text-[34px] mb-3">📝</div>
            <div className="text-[20px] font-bold mb-2">작성하던 설문이 있어요</div>
            <p className="text-[14px] text-muted leading-relaxed mb-6">
              {agoLabel(draft.savedAt)}에 {Object.keys(draft.answers).length}개 문항까지
              답하셨어요. 이어서 하시겠어요?
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={resume}>이어서 하기</Button>
              <Button variant="ghost" onClick={startOver}>처음부터 다시</Button>
            </div>
          </Modal>
        )}

        <Shell footer={<Button onClick={() => setStep('profile')}>시작하기</Button>}>
          <div className="flex flex-col justify-center min-h-[70dvh]">
            <div className="text-[13px] font-semibold text-accent mb-3">성향 매칭</div>
            <h1 className="text-[30px] font-bold leading-[1.3]">
              조건이 아니라
              <br />
              성향으로 만나요
            </h1>
            <p className="text-[15px] text-muted mt-5 leading-relaxed">
              가치관, 연애 스타일, 생활 습관까지 꼼꼼히 들여다본 뒤
              가장 잘 맞는 분을 찾아드립니다.
            </p>
          </div>
        </Shell>
      </>
    );
  }

  if (step === 'profile') {
    return (
      <ProfileStep
        progress={0.06}
        initial={profileResult}
        submitLabel={editing ? '저장' : '다음'}
        onNext={(r) => {
          setProfileResult(r);
          persist({ profile: r });
          // 수정 중이면 설문 흐름으로 넘어가지 않고 프로필로 돌아간다
          if (editing) { setEditing(false); setStep('me'); }
          else setStep('stance');
        }}
      />
    );
  }

  if (step === 'stance') {
    return (
      <StanceStep
        progress={0.14}
        initial={stanceResult}
        submitLabel={editing ? '저장' : undefined}
        onNext={(r) => {
          setStanceResult(r);
          persist({ stance: r });
          if (editing) { setEditing(false); setStep('me'); }
          else setStep('survey');
        }}
      />
    );
  }

  if (step === 'survey') {
    return (
      <SurveyStep
        baseProgress={0.2}
        span={0.75}
        initial={answers}
        startPage={surveyPage}
        onProgress={(a, p) => {
          setAnswers(a);
          setSurveyPage(p);
          persist({ answers: a, page: p });
        }}
        onDone={(a) => {
          setAnswers(a);
          setStep('strictness');
        }}
      />
    );
  }

  if (step === 'strictness') {
    return (
      <StrictnessStep
        progress={0.97}
        initial={strictness}
        onNext={(v) => {
          setStrictness(v);
          // 처음 설문을 마친 경우에만 완료 안내를 띄운다
          if (!editing) setJustFinished(true);
          setEditing(false);
          setStep('me');
        }}
      />
    );
  }

  const me: User = {
    profile: profileResult!.profile,
    stanceIds: stanceResult?.stanceIds ?? [],
    strictness,
    ageRange: profileResult!.ageRange,
    maxTravelMinutes: profileResult!.maxTravelMinutes,
    heightRange: profileResult!.heightRange,
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
      onChangeStrictness={() => { setEditing(true); setStep('strictness'); }}
      onEditStances={() => { setEditing(true); setStep('stance'); }}
      onPreviewMatches={() => setStep('matches')}
    />
  );
}
