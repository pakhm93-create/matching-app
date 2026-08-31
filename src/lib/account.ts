/**
 * 계정과 서버 저장.
 *
 * 지금까지 설문 답은 브라우저에만 있었다(storage.ts). 폰을 바꾸면 사라진다.
 * 여기서는 같은 내용을 Supabase에 올려 계정에 묶는다.
 *
 * 설계상 중요한 점 두 가지:
 *
 * 1. **계정은 설문을 다 마친 뒤에 만들게 한다.** 시작하자마자 가입을 시키면
 *    아무것도 못 해본 사람에게 개인정보를 내놓으라는 말이 된다. 이탈이 크다.
 *    먼저 끝까지 해보게 하고, 마지막에 "이 결과를 저장할까요?"라고 묻는다.
 *
 * 2. **연결 정보가 없어도 앱은 그대로 돌아간다.** .env.local이 없으면
 *    supabaseReady가 false가 되고, 예전처럼 브라우저 저장만 쓴다.
 */
import type { Answers, Strictness } from './types';
import type { ProfileResult } from '@/components/ProfileStep';
import type { StanceResult } from '@/components/StanceStep';
import { deriveFacts } from './facts';
import { supabase, supabaseReady } from './supabase';

export { supabaseReady };

/** 저장하고 불러올 내용 한 벌 */
export interface AccountData {
  profile: ProfileResult;
  stance: StanceResult;
  strictness: Strictness;
  answers: Answers;
}

/** 지금 로그인한 사람의 id. 로그인 안 했으면 null */
export async function currentUserId(): Promise<string | null> {
  const db = supabase();
  if (!db) return null;
  const { data } = await db.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * 이메일로 로그인 링크를 보낸다.
 *
 * 비밀번호를 만들지 않는 방식이다. 메일로 온 링크를 누르면 바로 로그인된다.
 * 비밀번호가 없으니 잊어버릴 일도, 우리가 보관하다 새어나갈 일도 없다.
 * 카카오·구글 로그인은 각 회사에 앱 등록이 필요해서 나중에 붙인다.
 */
export async function sendLoginLink(email: string): Promise<{ ok: boolean; message: string }> {
  const db = supabase();
  if (!db) return { ok: false, message: '아직 저장 서버가 연결되지 않았어요.' };

  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { ok: false, message: '메일을 보내지 못했어요. 주소를 다시 확인해 주세요.' };
  return { ok: true, message: '메일함을 확인해 주세요.' };
}

export async function signOut(): Promise<void> {
  await supabase()?.auth.signOut();
}

/**
 * 설문 결과를 서버에 저장한다.
 *
 * 프로필과 응답을 각각 한 줄씩 넣는다(있으면 덮어쓴다).
 * 응답은 문항이 자주 바뀌므로 칼럼으로 쪼개지 않고 통째로 넣는다.
 */
export async function saveToCloud(d: AccountData): Promise<{ ok: boolean; message?: string }> {
  const db = supabase();
  if (!db) return { ok: false, message: '저장 서버가 연결되지 않았어요.' };

  const uid = await currentUserId();
  if (!uid) return { ok: false, message: '로그인이 필요해요.' };

  const p = d.profile.profile;
  const { error: pe } = await db.from('profiles').upsert({
    id: uid,
    nickname: p.nickname,
    birth_year: p.birthYear,
    birth_month: p.birthMonth,
    gender: p.gender,
    seeking: p.seeking,
    sido: p.sido,
    sigungu: p.sigungu,
    height_cm: p.heightCm,
    education: p.education ?? null,
    mbti: p.mbti ?? null,
    max_travel_minutes: d.profile.maxTravelMinutes,
    age_min: d.profile.ageRange?.min ?? null,
    age_max: d.profile.ageRange?.max ?? null,
    height_min: d.profile.heightRange?.min ?? null,
    height_max: d.profile.heightRange?.max ?? null,
    stance_ids: d.stance.stanceIds,
    strictness: d.strictness,
    survey_done: true,
    updated_at: new Date().toISOString(),
  });
  if (pe) return { ok: false, message: '프로필을 저장하지 못했어요.' };

  const { error: ae } = await db.from('answers').upsert({
    user_id: uid,
    data: d.answers,
    facts: deriveFacts(d.answers),
    updated_at: new Date().toISOString(),
  });
  if (ae) return { ok: false, message: '설문 답을 저장하지 못했어요.' };

  return { ok: true };
}

/** 로그인한 사람의 저장된 내용을 불러온다. 없으면 null */
export async function loadFromCloud(): Promise<AccountData | null> {
  const db = supabase();
  if (!db) return null;

  const uid = await currentUserId();
  if (!uid) return null;

  const { data: prof } = await db.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (!prof || !prof.survey_done) return null;

  const { data: ans } = await db.from('answers').select('data').eq('user_id', uid).maybeSingle();

  return {
    profile: {
      profile: {
        id: uid,
        nickname: prof.nickname,
        birthYear: prof.birth_year,
        birthMonth: prof.birth_month,
        gender: prof.gender,
        seeking: prof.seeking,
        sido: prof.sido,
        sigungu: prof.sigungu,
        heightCm: prof.height_cm,
        education: prof.education ?? undefined,
        mbti: prof.mbti ?? undefined,
      },
      ageRange: prof.age_min != null && prof.age_max != null
        ? { min: prof.age_min, max: prof.age_max } : null,
      maxTravelMinutes: prof.max_travel_minutes,
      heightRange: prof.height_min != null && prof.height_max != null
        ? { min: prof.height_min, max: prof.height_max } : null,
    },
    stance: { stanceIds: prof.stance_ids ?? [] },
    strictness: prof.strictness as Strictness,
    answers: (ans?.data as Answers) ?? {},
  };
}
