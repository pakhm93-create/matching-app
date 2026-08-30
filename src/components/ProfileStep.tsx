'use client';

import { useState } from 'react';
import type { Gender, Profile } from '@/lib/types';
import { calcAge } from '@/lib/types';
import * as L from '@/lib/labels';
import { REGIONS, SIDO } from '@/lib/regions';
import { TRAVEL_OPTIONS } from '@/lib/zones';
import { Button, Chip, Field, RangeSlider, Shell, Wheel } from './ui';

const THIS_YEAR = new Date().getFullYear();
/** 성인만 대상이므로 만 19세가 되는 해부터 보여준다 */
const YEARS = Array.from({ length: 62 }, (_, i) => THIS_YEAR - 19 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const HEIGHTS = Array.from({ length: 61 }, (_, i) => 140 + i);

export interface ProfileResult {
  profile: Profile;
  ageRange: { min: number; max: number } | null;
  /** 만나러 갈 수 있는 최대 시간(분) */
  maxTravelMinutes: number;
  /** 원하는 상대의 키 범위. null이면 상관없음 */
  heightRange: { min: number; max: number } | null;
}

export function ProfileStep({
  onNext, progress, initial, submitLabel,
}: {
  onNext: (r: ProfileResult) => void;
  progress: number;
  initial?: ProfileResult;
  submitLabel?: string;
}) {
  const ip = initial?.profile;
  const [nickname, setNickname] = useState(ip?.nickname ?? '');
  const [birthYear, setBirthYear] = useState<number>(ip?.birthYear ?? THIS_YEAR - 30);
  const [birthMonth, setBirthMonth] = useState<number>(ip?.birthMonth ?? 6);
  const [gender, setGender] = useState<Gender | undefined>(ip?.gender);
  const [seeking, setSeeking] = useState<Gender[]>(ip?.seeking ?? []);
  const [sido, setSido] = useState<string | undefined>(ip?.sido);
  const [sigungu, setSigungu] = useState<string | undefined>(ip?.sigungu);
  const [travel, setTravel] = useState<number>(initial?.maxTravelMinutes ?? 90);
  const [heightCm, setHeightCm] = useState<number>(ip?.heightCm ?? 170);
  const [education, setEducation] = useState<string | undefined>(ip?.education);
  const [mbti, setMbti] = useState<string | undefined>(ip?.mbti);
  const [anyAge, setAnyAge] = useState(initial ? initial.ageRange === null : false);
  const [anyHeight, setAnyHeight] = useState(initial ? !initial.heightRange : true);
  const [heightRange, setHeightRange] = useState(initial?.heightRange ?? { min: 160, max: 180 });
  const [ageRange, setAgeRange] = useState(initial?.ageRange ?? { min: 25, max: 39 });

  /** 다음을 눌렀을 때 어디가 비었는지 알려주기 위한 것 */
  const [errors, setErrors] = useState<Record<string, string>>({});

  const myAge = calcAge(birthYear, birthMonth);

  function toggle<T>(v: T, list: T[], set: (l: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  const submit = () => {
    const e: Record<string, string> = {};
    if (nickname.trim() === '') e.nickname = '닉네임을 입력해주세요';
    if (!gender) e.gender = '성별을 골라주세요';
    if (seeking.length === 0) e.seeking = '어떤 분을 찾는지 골라주세요';
    if (!sido) e.home = '사는 지역을 골라주세요';
    else if (!sigungu) e.home = '시/군/구까지 골라주세요';

    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    onNext({
      profile: {
        id: 'me', nickname: nickname.trim(), birthYear, birthMonth,
        gender: gender!, seeking, sido: sido!, sigungu: sigungu!,
        heightCm, education, mbti,
      },
      ageRange: anyAge ? null : ageRange,
      maxTravelMinutes: travel,
      heightRange: anyHeight ? null : heightRange,
    });
  };

  const entries = <T extends string>(o: Record<T, string>) =>
    Object.entries(o) as [T, string][];

  return (
    <Shell
      progress={progress}
      title="기본 정보를 알려주세요"
      subtitle="여기서는 사실만 여쭤봅니다. 취향과 가치관은 다음 설문에서 알아볼게요."
      footer={<Button onClick={submit}>{submitLabel ?? '다음'}</Button>}
    >
      <Field label="닉네임" error={errors.nickname} anchorId="f-nickname">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="상대에게 보여질 이름"
          maxLength={12}
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
        />
      </Field>

      <Field label="태어난 연도와 월" hint={`만 ${myAge}세`}>
        <div className="flex gap-3 w-full rounded-2xl border border-line bg-surface px-3 py-2">
          <Wheel items={YEARS} value={birthYear} onChange={setBirthYear} suffix="년" />
          <Wheel items={MONTHS} value={birthMonth} onChange={setBirthMonth} suffix="월" />
        </div>
      </Field>

      <Field label="성별" error={errors.gender} anchorId="f-gender">
        {entries(L.GENDER).map(([k, v]) => (
          <Chip key={k} label={v} selected={gender === k} onClick={() => setGender(k)} />
        ))}
      </Field>

      <Field
        label="어떤 분을 찾으시나요?"
        hint="여러 개 선택할 수 있어요"
        error={errors.seeking}
        anchorId="f-seeking"
      >
        {entries(L.GENDER).map(([k, v]) => (
          <Chip key={k} label={v} selected={seeking.includes(k)}
                onClick={() => toggle(k, seeking, setSeeking)} />
        ))}
      </Field>

      <Field label="내 키" hint={`${heightCm}cm`}>
        <div className="w-full rounded-2xl border border-line bg-surface px-3 py-2">
          <Wheel items={HEIGHTS} value={heightCm} onChange={setHeightCm} suffix="cm" />
        </div>
      </Field>

      <Field label="사는 지역" error={errors.home} anchorId="f-home">
        {SIDO.map((s) => (
          <Chip
            key={s} label={s} selected={sido === s}
            onClick={() => { setSido(s); setSigungu(undefined); }}
          />
        ))}
      </Field>

      {sido && (
        <Field label={`${sido} 어디신가요?`}>
          {REGIONS[sido].map((g) => (
            <Chip key={g} label={g} selected={sigungu === g} onClick={() => setSigungu(g)} />
          ))}
        </Field>
      )}

      <Field
        label="만날 때 얼마나 이동할 수 있으세요?"
        hint="중간에서 만난다고 가정할 때, 본인이 편도로 움직일 수 있는 시간이에요"
      >
        {TRAVEL_OPTIONS.map((o) => (
          <Chip key={o.minutes} label={o.label} selected={travel === o.minutes}
                onClick={() => setTravel(o.minutes)} />
        ))}
      </Field>

      <Field label="원하는 상대의 나이">
        <div className="w-full">
          <RangeSlider
            min={19} max={70}
            value={ageRange}
            onChange={setAgeRange}
            format={(n) => `${n}세`}
            disabled={anyAge}
          />
          <button
            onClick={() => setAnyAge(!anyAge)}
            className={`mt-3 px-4 py-2.5 rounded-full text-[15px] border transition active:scale-95 ${
              anyAge
                ? 'bg-accent text-accent-fg border-accent font-semibold'
                : 'bg-surface text-foreground border-line'
            }`}
          >
            나이는 상관없어요
          </button>
        </div>
      </Field>

      <Field label="원하는 상대의 키">
        <div className="w-full">
          <RangeSlider
            min={140} max={200}
            value={heightRange}
            onChange={setHeightRange}
            format={(n) => `${n}cm`}
            disabled={anyHeight}
          />
          <button
            onClick={() => setAnyHeight(!anyHeight)}
            className={`mt-3 px-4 py-2.5 rounded-full text-[15px] border transition active:scale-95 ${
              anyHeight
                ? 'bg-accent text-accent-fg border-accent font-semibold'
                : 'bg-surface text-foreground border-line'
            }`}
          >
            키는 상관없어요
          </button>
        </div>
      </Field>

      <Field label="최종 학력">
        {L.EDUCATIONS.map((e) => (
          <Chip
            key={e} label={e} selected={education === e}
            onClick={() => setEducation(e)}
          />
        ))}
        <Chip
          label="입력 안 함" selected={education === undefined}
          onClick={() => setEducation(undefined)}
        />
      </Field>

      <Field label="MBTI">
        {L.MBTI_TYPES.map((m) => (
          <Chip key={m} label={m} selected={mbti === m} onClick={() => setMbti(m)} />
        ))}
        <Chip
          label="모르겠어요" selected={mbti === undefined}
          onClick={() => setMbti(undefined)}
        />
      </Field>
    </Shell>
  );
}
