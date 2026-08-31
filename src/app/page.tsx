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
import { SignInStep } from '@/components/SignInStep';
import { currentUserId, loadFromCloud, saveToCloud, supabaseReady } from '@/lib/account';
import { Button, Modal, Shell } from '@/components/ui';

type Step =
  | 'intro' | 'profile' | 'stance' | 'survey' | 'strictness' | 'signin' | 'me' | 'matches';

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
  /** 계정에 저장까지 끝났는가 — 프로필 화면에 표시한다 */
  const [savedToCloud, setSavedToCloud] = useState(false);

  /**
   * 첫 화면을 그리기 전에 두 가지를 확인한다.
   * ① 이미 로그인돼 있는가 (메일 링크를 누르고 막 돌아왔을 수도 있다)
   * ② 브라우저에 작성하던 내용이 남아 있는가
   */
  useEffect(() => {
    let alive = true;

    (async () => {
      const d = loadDraft();

      if (supabaseReady && (await currentUserId())) {
        // 서버에 이미 저장된 내용이 있으면 그걸 쓴다
        const cloud = await loadFromCloud();
        if (!alive) return;
        if (cloud) {
          setProfileResult(cloud.profile);
          setStanceResult(cloud.stance);
          setStrictness(cloud.strictness);
          setAnswers(cloud.answers);
          setSavedToCloud(true);
          setStep('me');
          return;
        }
        // 로그인은 됐는데 서버에 없다 = 메일 링크를 누르고 막 돌아온 참이다.
        // 브라우저에 남아 있는 작성분을 그대로 올려준다
        if (d?.profile && d.stance && d.strictness) {
          const r = await saveToCloud({
            profile: d.profile, stance: d.stance,
            strictness: d.strictness, answers: d.answers,
          });
          if (!alive) return;
          setProfileResult(d.profile);
          setStanceResult(d.stance);
          setStrictness(d.strictness);
          setAnswers(d.answers);
          setSavedToCloud(r.ok);
          setStep('me');
          return;
        }
      }

      if (!alive) return;
      if (d && Object.keys(d.answers).length > 0) setDraft(d);
    })();

    return () => { alive = false; };
  }, []);

  const persist = (next: Partial<Omit<Draft, 'savedAt'>>) => {
    saveDraft({
      profile: profileResult,
      stance: stanceResult,
      answers,
      strictness,
      page: surveyPage,
      ...next,
    });
  };

  /** 로그인한 사람이 내용을 고치면 서버에도 반영한다 */
  const syncIfSignedIn = async (over: Partial<{
    profile: ProfileResult; stance: StanceResult; strictness: Strictness; answers: Answers;
  }> = {}) => {
    if (!savedToCloud) return;
    const p = over.profile ?? profileResult;
    const s = over.stance ?? stanceResult;
    if (!p || !s) return;
    await saveToCloud({
      profile: p,
      stance: s,
      strictness: over.strictness ?? strictness,
      answers: over.answers ?? answers,
    });
  };

  const resume = () => {
    if (!draft) return;
    if (draft.profile) setProfileResult(draft.profile);
    if (draft.stance) setStanceResult(draft.stance);
    if (draft.strictness) setStrictness(draft.strictness);
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
          if (editing) { setEditing(false); void syncIfSignedIn({ profile: r }); setStep('me'); }
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
          if (editing) { setEditing(false); void syncIfSignedIn({ stance: r }); setStep('me'); }
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
          persist({ strictness: v });
          if (editing) {
            setEditing(false);
            void syncIfSignedIn({ strictness: v });
            setStep('me');
            return;
          }
          // 처음 설문을 마친 경우에만 완료 안내를 띄운다
          setJustFinished(true);
          // 저장 서버가 붙어 있으면 여기서 계정을 만들 기회를 준다.
          // 시작할 때가 아니라 다 끝낸 지금 묻는 것이 핵심이다
          setStep(supabaseReady ? 'signin' : 'me');
        }}
      />
    );
  }

  if (step === 'signin') {
    return (
      <SignInStep
        onSkip={() => setStep('me')}
        onSent={() => { /* 메일을 보낸 화면에 머문다 */ }}
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
      savedToCloud={savedToCloud}
      onSaveAccount={supabaseReady ? () => setStep('signin') : undefined}
    />
  );
}
