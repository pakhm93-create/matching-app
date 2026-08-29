'use client';

import { useState } from 'react';
import type { Children, Drinking, Gender, Marriage, Pet, Profile, Religion, Smoking } from '@/lib/types';
import * as L from '@/lib/labels';
import { Button, Chip, Field, Shell } from './ui';

/** 기본 정보 입력 — 여기 값들이 매칭 필터의 판정 재료가 된다 */
export function ProfileStep({
  onNext, progress,
}: {
  onNext: (p: Profile) => void;
  progress: number;
}) {
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState<number | undefined>();
  const [gender, setGender] = useState<Gender>();
  const [seeking, setSeeking] = useState<Gender[]>([]);
  const [region, setRegion] = useState<string>();
  const [smoking, setSmoking] = useState<Smoking>();
  const [drinking, setDrinking] = useState<Drinking>();
  const [religion, setReligion] = useState<Religion>();
  const [politics, setPolitics] = useState<number>();
  const [marriage, setMarriage] = useState<Marriage>();
  const [children, setChildren] = useState<Children>();
  const [tattoo, setTattoo] = useState<boolean>();
  const [pet, setPet] = useState<Pet>();

  const ready =
    nickname.trim() !== '' && age !== undefined && age >= 19 && gender && seeking.length > 0 &&
    region && smoking && drinking && religion && politics !== undefined &&
    marriage && children && tattoo !== undefined && pet;

  const toggleSeeking = (g: Gender) =>
    setSeeking((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const submit = () => {
    if (!ready) return;
    onNext({
      id: 'me', nickname: nickname.trim(), age: age!, gender: gender!, seeking,
      region: region!, smoking: smoking!, drinking: drinking!, religion: religion!,
      politics: politics!, marriage: marriage!, children: children!,
      tattoo: tattoo!, pet: pet!,
      // MVP에서는 아래 3개를 받지 않는다 (문항 수를 줄이기 위해). 나중에 추가
      height: 170, job: '미입력', education: '미입력',
    });
  };

  const entries = <T extends string>(o: Record<T, string>) =>
    Object.entries(o) as [T, string][];

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
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
        />
      </Field>

      <Field label="나이">
        <input
          type="number"
          inputMode="numeric"
          value={age ?? ''}
          onChange={(e) => setAge(e.target.value ? Number(e.target.value) : undefined)}
          placeholder="만 나이"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
        />
      </Field>

      <Field label="성별">
        {entries(L.GENDER).map(([k, v]) => (
          <Chip key={k} label={v} selected={gender === k} onClick={() => setGender(k)} />
        ))}
      </Field>

      <Field label="어떤 분을 찾으시나요?" hint="여러 개 선택할 수 있어요">
        {entries(L.GENDER).map(([k, v]) => (
          <Chip key={k} label={v} selected={seeking.includes(k)} onClick={() => toggleSeeking(k)} />
        ))}
      </Field>

      <Field label="사는 지역">
        {L.REGIONS.map((r) => (
          <Chip key={r} label={r} selected={region === r} onClick={() => setRegion(r)} />
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

      <Field label="타투">
        <Chip label="있음" selected={tattoo === true} onClick={() => setTattoo(true)} />
        <Chip label="없음" selected={tattoo === false} onClick={() => setTattoo(false)} />
      </Field>

      <Field label="반려동물">
        {entries(L.PET).map(([k, v]) => (
          <Chip key={k} label={v} selected={pet === k} onClick={() => setPet(k)} />
        ))}
      </Field>
    </Shell>
  );
}
