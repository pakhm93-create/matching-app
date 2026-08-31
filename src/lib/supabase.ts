/**
 * Supabase 연결.
 *
 * Supabase는 "계정 로그인 + 데이터 저장소"를 한 번에 해주는 서비스다.
 * 지금까지는 설문 답이 브라우저에만 저장돼서 폰을 바꾸면 사라졌다.
 * 여기에 연결하면 계정에 묶여 어디서 접속해도 남는다.
 *
 * 주소와 키는 코드에 직접 적지 않고 .env.local 파일에서 읽는다.
 * (키가 깃허브에 올라가면 안 되기 때문. .env.local은 git이 무시한다)
 */
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 연결 정보가 아직 없으면 false. 이때는 예전처럼 브라우저 저장만 쓴다 */
export const supabaseReady = Boolean(url && key);

let cached: ReturnType<typeof createBrowserClient> | null = null;

/**
 * 브라우저에서 쓰는 Supabase 연결을 돌려준다.
 * 연결 정보가 없으면 null — 화면 코드는 null이면 조용히 넘어가야 한다.
 */
export function supabase() {
  if (!supabaseReady) return null;
  if (!cached) cached = createBrowserClient(url!, key!);
  return cached;
}
