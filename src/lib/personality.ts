/**
 * 성향 집계와 유형 분류.
 * 설문 도중에는 검사 티를 내지 않지만, 결과 화면에서는 유형을 보여준다.
 */
import type { Answers, BigFiveAxis } from './types';
import { QUESTIONS } from './questions';

/** 각 축의 점수를 0~1로 계산 */
export function computeAxes(answers: Answers): Record<BigFiveAxis, number> {
  const sum: Record<string, number> = {};
  const count: Record<string, number> = {};

  for (const q of QUESTIONS) {
    if (!q.bigFive) continue;
    const v = answers[q.id];
    if (typeof v !== 'number') continue;
    // 역방향 문항은 뒤집어서 더한다 ("걱정이 많다"에 5점 = 정서안정성은 낮음)
    const normalized = (q.reverse ? 6 - v : v) - 1; // 0~4
    sum[q.bigFive] = (sum[q.bigFive] ?? 0) + normalized;
    count[q.bigFive] = (count[q.bigFive] ?? 0) + 1;
  }

  const axes = {} as Record<BigFiveAxis, number>;
  for (const a of ['E', 'A', 'C', 'N', 'O'] as BigFiveAxis[]) {
    axes[a] = count[a] ? sum[a] / (count[a] * 4) : 0.5;
  }
  return axes;
}

export interface PersonaType {
  code: string;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  /** 연애할 때의 특징 */
  inLove: string;
  /** 잘 맞는 유형 코드 */
  goesWellWith: string[];
}

/**
 * 8가지 유형 — 사람 많은 게 좋은가(E), 새로운 걸 좋아하는가(O),
 * 계획적인가(C) 세 축의 조합.
 * 나머지 두 축(배려·정서)은 유형 안에서 설명 문구로 녹인다.
 */
export const PERSONA_TYPES: Record<string, PersonaType> = {
  EOC: {
    code: 'EOC', emoji: '🔥', name: '불꽃 기획자',
    tagline: '사람도 좋고, 새로운 것도 좋고, 계획도 확실한',
    description:
      '함께 있으면 하루가 알차게 흘러갑니다. 새로운 걸 시도하는 걸 좋아하면서도 준비 없이 나서지 않아요. 주변 사람들이 자연스럽게 따라오게 만드는 힘이 있습니다.',
    inLove: '데이트 코스를 미리 찾아두고, 기념일도 잘 챙기는 편이에요.',
    goesWellWith: ['eOC', 'EOc'],
  },
  EOc: {
    code: 'EOc', emoji: '🌪️', name: '바람 같은 여행자',
    tagline: '지금 이 순간이 제일 중요한',
    description:
      '갑자기 떠나자는 말을 진짜로 실행하는 사람입니다. 계획보다 흐름을 믿고, 낯선 곳에서 더 살아납니다. 답답한 걸 못 견뎌요.',
    inLove: '예상 못 한 이벤트를 잘 만들지만, 세세한 약속은 조금 느슨할 수 있어요.',
    goesWellWith: ['EOC', 'eOc'],
  },
  EoC: {
    code: 'EoC', emoji: '🍲', name: '따뜻한 살림꾼',
    tagline: '익숙한 것들을 소중히 가꾸는',
    description:
      '사람은 좋아하지만 굳이 새로운 걸 찾아다니지는 않습니다. 늘 가던 곳, 늘 만나던 사람들과의 시간을 깊게 만듭니다. 챙김이 몸에 배어 있어요.',
    inLove: '기념일과 약속을 정확히 지키고, 상대의 일상을 세심하게 챙깁니다.',
    goesWellWith: ['eoC', 'EOC'],
  },
  Eoc: {
    code: 'Eoc', emoji: '🎈', name: '동네 인기쟁이',
    tagline: '어디서든 분위기를 살리는',
    description:
      '누구와도 금방 편해지는 사람입니다. 어렵게 생각하지 않고, 무겁던 자리도 가볍게 만듭니다. 계획보다 그때그때의 재미를 따릅니다.',
    inLove: '함께 있으면 웃을 일이 많아요. 대신 진지한 대화는 조금 미루는 편.',
    goesWellWith: ['eoc', 'EoC'],
  },
  eOC: {
    code: 'eOC', emoji: '🌙', name: '깊은 밤의 사색가',
    tagline: '조용히, 그러나 멀리 나아가는',
    description:
      '떠들썩한 자리보다 몰입할 수 있는 시간을 좋아합니다. 관심이 생기면 끝까지 파고들고, 그걸 꾸준히 해냅니다. 말수보다 결과로 보여주는 쪽이에요.',
    inLove: '표현이 많지는 않지만, 한 번 마음먹으면 오래 변하지 않습니다.',
    goesWellWith: ['EOC', 'eoC'],
  },
  eOc: {
    code: 'eOc', emoji: '☁️', name: '구름 위 몽상가',
    tagline: '머릿속에 늘 다른 세계가 있는',
    description:
      '혼자 있는 시간에 상상이 자랍니다. 남들이 안 보는 걸 보고, 정해진 틀을 답답해합니다. 하고 싶은 게 자주 바뀌지만 그게 매력이에요.',
    inLove: '독특한 취향을 나눌 수 있는 사람에게 깊이 빠집니다.',
    goesWellWith: ['EOc', 'eOC'],
  },
  eoC: {
    code: 'eoC', emoji: '🌲', name: '묵묵한 지킴이',
    tagline: '말없이 곁을 지키는',
    description:
      '요란하지 않지만 해야 할 일은 반드시 합니다. 익숙하고 안정적인 것을 좋아하고, 약속을 어기는 걸 스스로 못 견딥니다. 믿음직하다는 말을 자주 듣습니다.',
    inLove: '표현은 서툴러도 행동으로 보여줍니다. 관계가 길어질수록 진가가 나와요.',
    goesWellWith: ['EoC', 'eOC'],
  },
  eoc: {
    code: 'eoc', emoji: '🐈', name: '느긋한 고양이',
    tagline: '편안한 게 제일인',
    description:
      '무리하지 않습니다. 집이 제일 편하고, 급하게 서두르는 걸 싫어해요. 곁에 있으면 이상하게 마음이 놓이는 사람입니다.',
    inLove: '같이 아무것도 안 해도 어색하지 않은 관계를 만듭니다.',
    goesWellWith: ['Eoc', 'eoC'],
  },
};

/** 응답에서 유형 코드를 뽑는다 (E/e, O/o, C/c 조합) */
export function personaCodeOf(answers: Answers): string {
  const a = computeAxes(answers);
  return (
    (a.E >= 0.5 ? 'E' : 'e') + (a.O >= 0.5 ? 'O' : 'o') + (a.C >= 0.5 ? 'C' : 'c')
  );
}

export function personaOf(answers: Answers): PersonaType {
  return PERSONA_TYPES[personaCodeOf(answers)] ?? PERSONA_TYPES.eoc;
}

/** 나머지 두 축(배려·정서)을 한 줄 설명으로 */
export function extraTraits(answers: Answers): string[] {
  const a = computeAxes(answers);
  const out: string[] = [];
  out.push(a.A >= 0.5 ? '갈등이 생기면 먼저 손을 내미는 편' : '자기 생각을 분명히 말하는 편');
  out.push(a.N >= 0.5 ? '웬만한 일에 흔들리지 않는 편' : '감정을 섬세하게 느끼는 편');
  return out;
}
