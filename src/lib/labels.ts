/** 코드 값 ↔ 화면에 보여줄 한국어 이름 대응표 */
import type {
  Children, Drinking, Gender, Marriage, Pet, PriorityKey, Religion, Smoking,
} from './types';

export const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export const GENDER: Record<Gender, string> = {
  male: '남성', female: '여성', other: '기타',
};
export const SMOKING: Record<Smoking, string> = {
  none: '비흡연', sometimes: '가끔', yes: '흡연', vape: '전자담배',
};
export const DRINKING: Record<Drinking, string> = {
  none: '안 마심', sometimes: '가끔', often: '자주',
};
export const MARRIAGE: Record<Marriage, string> = {
  yes: '있음', no: '없음', undecided: '아직 모름',
};
export const CHILDREN: Record<Children, string> = {
  want: '원함', not: '원치 않음', undecided: '아직 모름',
};
export const PET: Record<Pet, string> = {
  has: '키움', none: '안 키움', allergic: '알레르기 있음',
};
export const RELIGION: Record<Religion, string> = {
  none: '무교', protestant: '개신교', catholic: '천주교',
  buddhist: '불교', other: '기타',
};
export const POLITICS: Record<number, string> = {
  1: '매우 진보', 2: '진보', 3: '중도', 4: '보수', 5: '매우 보수',
};

/** TOP 3에서 고를 수 있는 조건 (MVP에서 수집하는 항목만) */
export const PRIORITY_OPTIONS: { key: PriorityKey; label: string; hint: string }[] = [
  { key: 'age',      label: '나이',      hint: '원하는 나이 범위' },
  { key: 'region',   label: '지역',      hint: '만날 수 있는 지역' },
  { key: 'smoking',  label: '흡연',      hint: '허용할 흡연 상태' },
  { key: 'drinking', label: '음주',      hint: '허용할 음주 정도' },
  { key: 'religion', label: '종교',      hint: '허용할 종교' },
  { key: 'politics', label: '정치 성향', hint: '허용할 성향 범위' },
  { key: 'marriage', label: '결혼 의향', hint: '허용할 결혼 의향' },
  { key: 'children', label: '자녀 계획', hint: '허용할 자녀 계획' },
  { key: 'tattoo',   label: '타투',      hint: '타투 허용 여부' },
  { key: 'pet',      label: '반려동물',  hint: '허용할 반려동물 상태' },
];

/** 성향 유형 이름 — 결과 화면에서 재미 요소로 보여준다 */
export const AXIS_NAMES = {
  E: { high: '사교적인', low: '차분한' },
  A: { high: '배려하는', low: '주관 뚜렷한' },
  C: { high: '계획적인', low: '즉흥적인' },
  N: { high: '단단한', low: '섬세한' },
  O: { high: '모험적인', low: '안정적인' },
} as const;
