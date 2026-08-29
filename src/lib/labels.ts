/** 코드 값 ↔ 화면에 보여줄 한국어 이름 */
import type {
  Children, Drinking, Exercise, Gender, Marriage, Religion, Smoking,
} from './types';

export const GENDER: Record<Gender, string> = {
  male: '남성', female: '여성', other: '기타',
};

export const EDUCATIONS = ['고졸', '전문대졸', '대졸', '대학원졸'];

// 아래 값들은 기본 정보에서 직접 묻지 않는다.
// 설문 응답에서 뽑아낸 뒤 프로필 화면에 보여줄 때만 쓴다.
export const SMOKING: Record<Smoking, string> = {
  none: '피우지 않음', sometimes: '가끔', yes: '피움',
};
export const DRINKING: Record<Drinking, string> = {
  none: '거의 안 마심', sometimes: '가끔', often: '자주',
};
export const MARRIAGE: Record<Marriage, string> = {
  yes: '하고 싶음', no: '생각 없음', undecided: '아직 모름',
};
export const CHILDREN: Record<Children, string> = {
  want: '갖고 싶음', not: '갖고 싶지 않음', undecided: '아직 모름',
};
export const RELIGION: Record<Religion, string> = {
  none: '무교', protestant: '개신교', catholic: '천주교',
  buddhist: '불교', other: '그 외',
};
export const EXERCISE: Record<Exercise, string> = {
  often: '주 3회 이상', sometimes: '가끔', rarely: '거의 안 함',
};
