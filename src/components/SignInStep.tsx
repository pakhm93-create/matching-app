'use client';

import { useState } from 'react';
import { sendLoginLink } from '@/lib/account';
import { Button, Shell } from './ui';

/**
 * 설문을 마친 뒤 결과를 저장할 계정을 만드는 화면.
 *
 * **시작할 때가 아니라 끝난 뒤에 묻는다.** 아무것도 해보지 않은 사람에게
 * 가입부터 시키면 대부분 그 자리에서 나간다. 끝까지 해본 사람에게
 * "이 결과를 잃어버리지 않으려면" 이라고 말하는 편이 훨씬 자연스럽다.
 *
 * 비밀번호를 만들지 않고 메일로 온 링크로 로그인한다.
 * 외울 것이 없고, 우리가 비밀번호를 보관하지 않아 새어나갈 것도 없다.
 */
export function SignInStep({
  onSkip, onSent,
}: {
  onSkip: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('메일 주소를 다시 확인해 주세요');
      return;
    }
    setBusy(true);
    setError('');
    const r = await sendLoginLink(email.trim());
    setBusy(false);
    if (!r.ok) { setError(r.message); return; }
    setSent(true);
    onSent();
  };

  if (sent) {
    return (
      <Shell footer={<Button variant="ghost" onClick={onSkip}>나중에 하기</Button>}>
        <div className="flex flex-col justify-center min-h-[70dvh]">
          <div className="text-[34px] mb-4">📬</div>
          <h1 className="text-[24px] font-bold leading-snug">메일을 보냈어요</h1>
          <p className="text-[15px] text-muted mt-4 leading-relaxed">
            <span className="text-foreground font-medium">{email}</span> 으로 보낸 링크를
            누르면 저장이 끝나요. 메일이 안 보이면 스팸함도 확인해 주세요.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      footer={
        <div className="flex flex-col gap-2">
          <Button onClick={submit} disabled={busy}>
            {busy ? '보내는 중…' : '메일로 저장하기'}
          </Button>
          <Button variant="ghost" onClick={onSkip}>나중에 하기</Button>
        </div>
      }
    >
      <div className="flex flex-col justify-center min-h-[70dvh]">
        <div className="text-[13px] font-semibold text-accent mb-3">거의 다 됐어요</div>
        <h1 className="text-[26px] font-bold leading-[1.35]">
          답해주신 내용을
          <br />
          안전하게 보관할까요
        </h1>
        <p className="text-[15px] text-muted mt-4 leading-relaxed">
          지금은 이 브라우저에만 저장돼 있어요. 폰을 바꾸거나 기록을 지우면 사라집니다.
          메일 주소를 남겨두면 어디서 접속하든 이어서 볼 수 있어요.
        </p>

        <div className="mt-8">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="name@example.com"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-[16px] outline-none focus:border-accent"
          />
          {error && <div className="text-[13px] text-accent mt-2 font-medium">{error}</div>}
          <p className="text-[12px] text-muted mt-3 leading-relaxed">
            비밀번호는 만들지 않아요. 메일로 온 링크를 누르면 바로 로그인됩니다.
          </p>
        </div>
      </div>
    </Shell>
  );
}
