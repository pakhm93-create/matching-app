'use client';

import { useState } from 'react';
import type {
  Children, Drinking, Gender, Marriage, Pet, Politics, PriorityFilter, Profile, Religion, Smoking,
} from '@/lib/types';
import { calcAge } from '@/lib/types';
import * as L from '@/lib/labels';
import { Button, Chip, Field, Shell } from './ui';

const THIS_YEAR = new Date().getFullYear();
/** 나이 허용 폭 선택지 (나를 기준으로 위/아래 몇 살까지) */
const AGE_GAPS = [0, 1, 2, 3, 5, 7, 10, 99];
const gapLabel = (n: number) => (n === 0 ? '동갑만' : n === 99 ? '상관없음' : `${n}살`);

export function ProfileStep({
  onNext, progress,
}: {
  onNext: (p: Profile, basePriorities: PriorityFilter[]) => void;
  progress: number;
}) {
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState<number | undefined>();
  const [birthMonth, setBirthMonth] = useState<number | undefined>();
  const [gender, setGender] = useState<Gender>();
  const [seeking, setSeeking] = useState<Gender[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [younger, setYounger] = useState<number>(5);
  const [older, setOlder] = useState<number>(5);
  const [smoking, setSmoking] = useState<Smoking>();
  const [drinking, setDrinking] = useState<Drinking>();
  const [religion, setReligion] = useState<Religion>();
  const [politics, setPolitics] = useState<Politics | undefined>();
  const [marriage, setMarriage] = useState<Marriage>();
  const [children, setChildren] = useState<Children>();
  const [pet, setPet] = useState<Pet>();

  const validBirth =
    birthYear !== undefined && birthMonth !== undefined &&
    birthYear >= 1940 && birthYear <= THIS_YEAR - 19 &&
    birthMonth >= 1 && birthMonth <= 12;

  const myAge = validBirth ? calcAge(birthYear!, birthMonth!) : undefined;

  const ready =
    nickname.trim() !== '' && validBirth && gender && seeking.length > 0 &&
    areas.length > 0 && smoking && drinking && religion && politics !== undefined &&
    marriage && children && pet;

  function toggle<T>(v: T, list: T[], set: (l: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  const submit = () => {
    if (!ready || myAge === undefined) return;
    const profile: Profile = {
      id: 'me', nickname: nickname.trim(),
      birthYear: birthYear!, birthMonth: birthMonth!,
      gender: gender!, seeking, areas,
      smoking: smoking!, drinking: drinking!, religion: religion!,
      politics: politics!, marriage: marriage!, children: children!, pet: pet!,
      // MVP에서는 받지 않는 항목들 (나중에 추가)
      height: 170, job: '미입력', education: '미입력',
    };
    // 지역과 나이는 "애초에 만날 수 있느냐"의 문제라 항상 적용되는 기본 조건이다.
    // 그래서 절대 조건 3가지와는 별개로 여기서 만든다.
    const basePriorities: PriorityFilter[] = [
      { key: 'region', allowed: areas },
      {
        key: 'age',
        min: younger === 99 ? 19 : myAge - younger,
        max: older === 99 ? 99 : myAge + older,
      },
    ];
    onNext(profile, basePriorities);
  };

  const entries = <T extends string>(o: Record<T, string>) =>
    Object.entries(o) as [T, string][];

  const inputCls =
    'w-full rounded-2xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent';

  return (
    <Shell
      progress={progress}
      title="먼저 기본 정보를 알려주세요"
      subtitle="매칭 조건을 거르는 데 사용됩니다. 1분이면 됩니다."
      footer={<Button onClick={submit} disabled={!ready}>다음</Button>}
    >
      <Field label="닉네임">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="상대에게 보여질 이름"
          maxLength={12}
          className={inputCls}
        />
      </Field>

      <Field
        label="태어난 연도와 월"
        hint={myAge !== undefined ? `만 ${myAge}세로 계산했어요` : '만 나이는 저희가 계산해드려요'}
      >
        <div className="flex items-center gap-2 w-full">
          <input
            type="number" inputMode="numeric" placeholder="1995"
            value={birthYear ?? ''}
            onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : undefined)}
            className={`${inputCls} text-center`}
          />
          <span className="text-muted text-[14px] shrink-0">년</span>
          <input
            type="number" inputMode="numeric" placeholder="3"
            value={birthMonth ?? ''}
            onChange={(e) => setBirthMonth(e.target.value ? Number(e.target.value) : undefined)}
            className={`${inputCls} text-center`}
          />
          <span className="text-muted text-[14px] shrink-0">월</span>
        </div>
      </Field>

      <Field label="성별">
        {entries(L.GENDER).map(([k, v]) => (
          <Chip key={k} label={v} selected={gender === k} onClick={() => setGender(k)} />
        ))}
      </Field>

      <Field label="어떤 분을 찾으시나요?" hint="여러 개 선택할 수 있어요">
        {entries(L.GENDER).map(([k, v]) => (
          <Chip key={k} label={v} selected={seeking.includes(k)}
                onClick={() => toggle(k, seeking, setSeeking)} />
        ))}
      </Field>

      <Field
        label="어디서 만날 수 있나요?"
        hint="사는 곳이 아니라 실제로 만나러 갈 수 있는 지역이에요. 여러 개 고르면 만날 수 있는 분이 늘어납니다"
      >
        {L.AREAS.map((a) => (
          <Chip key={a} label={a} selected={areas.includes(a)}
                onClick={() => toggle(a, areas, setAreas)} />
        ))}
      </Field>

      <Field label="나보다 어린 쪽은 몇 살까지 괜찮으세요?">
        {AGE_GAPS.map((n) => (
          <Chip key={n} label={gapLabel(n)} selected={younger === n} onClick={() => setYounger(n)} />
        ))}
      </Field>

      <Field label="나보다 많은 쪽은 몇 살까지 괜찮으세요?">
        {AGE_GAPS.map((n) => (
          <Chip key={n} label={gapLabel(n)} selected={older === n} onClick={() => setOlder(n)} />
        ))}
      </Field>

      <Field label="흡연">
        {entries(L.SMOKING).map(([k, v]) => (
          <Chip key={k} label={v} selected={smoking === k} onClick={() => setSmoking(k)} />
        ))}
      </Field>

      <Field label="음주">
        {entries(L.DRINKING).map(([k, v]) => (
          <Chip key={k} label={v} selected={drinking === k} onClick={() => setDrinking(k)} />
        ))}
      </Field>

      <Field label="종교">
        {entries(L.RELIGION).map(([k, v]) => (
          <Chip key={k} label={v} selected={religion === k} onClick={() => setReligion(k)} />
        ))}
      </Field>

      <Field label="정치 성향">
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip key={n} label={L.POLITICS[n]} selected={politics === n} onClick={() => setPolitics(n)} />
        ))}
        <Chip label={L.POLITICS[0]} selected={politics === null} onClick={() => setPolitics(null)} />
      </Field>

      <Field label="결혼 의향">
        {entries(L.MARRIAGE).map(([k, v]) => (
          <Chip key={k} label={v} selected={marriage === k} onClick={() => setMarriage(k)} />
        ))}
      </Field>

      <Field label="자녀 계획">
        {entries(L.CHILDREN).map(([k, v]) => (
          <Chip key={k} label={v} selected={children === k} onClick={() => setChildren(k)} />
        ))}
      </Field>

      <Field label="반려동물">
        {entries(L.PET).map(([k, v]) => (
          <Chip key={k} label={v} selected={pet === k} onClick={() => setPet(k)} />
        ))}
      </Field>
    </Shell>
  );
}
