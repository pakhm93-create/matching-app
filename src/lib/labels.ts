/** 코드 값 ↔ 화면에 보여줄 한국어 이름 대응표 */
import type { Children, Drinking, Gender, Marriage, Pet, Religion, Smoking } from './types';

/** 활동 가능 지역 — "사는 곳"이 아니라 "만날 수 있는 곳" */
export const AREAS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export const GENDER: Record<Gender, string> = {
  male: '남성', female: '여성', other: '기타',
};
export const SMOKING: Record<Smoking, string> = {
  none: '피우지 않음', sometimes: '가끔', yes: '피움',
};
export const DRINKING: Record<Drinking, string> = {
  none: '안 마심', sometimes: '가끔', often: '자주',
};
export const MARRIAGE: Record<Marriage, string> = {
  yes: '있음', no: '비혼주의', undecided: '아직 모름',
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
/** 0은 "잘 모름" — 정치 성향은 모르는 사람도 많다 */
export const POLITICS: Record<number, string> = {
  1: '매우 진보', 2: '진보', 3: '중도', 4: '보수', 5: '매우 보수', 0: '잘 모름',
};
