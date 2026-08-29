/**
 * 성향 집계와 유형 분류.
 * 설문 도중에는 검사 티를 내지 않고, 프로필 화면에서만 유형을 보여준다.
 *
 * 유형 이름은 임시다. 8가지는 "사람과 어울리는가(E) / 새로운 걸 좋아하는가(O) /
 * 계획적인가(C)" 세 축의 조합으로 기계적으로 나눈 것이다.
 * 이름과 설명 문구는 따로 다듬어야 한다.
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
  name: string;
  tagline: string;
  description: string;
  /** 연애할 때의 특징 */
  inLove: string;
}

export const PERSONA_TYPES: Record<string, PersonaType> = {
  EOC: {
    code: 'EOC', name: '주도형', tagline: '먼저 움직이고 끝까지 챙기는',
    description:
      '새로운 걸 시도하는 걸 좋아하면서도 준비 없이 나서지 않습니다. 사람들이 자연스럽게 따라오게 만드는 힘이 있어요.',
    inLove: '만날 곳을 미리 찾아두고, 약속과 기념일을 잘 챙깁니다.',
  },
  EOc: {
    code: 'EOc', name: '모험형', tagline: '지금 이 순간을 사는',
    description:
      '갑자기 떠나자는 말을 실제로 실행하는 사람입니다. 계획보다 흐름을 믿고, 낯선 곳에서 더 살아납니다.',
    inLove: '예상 못 한 즐거움을 자주 만들어냅니다. 대신 세세한 약속은 조금 느슨할 수 있어요.',
  },
  EoC: {
    code: 'EoC', name: '다정형', tagline: '익숙한 것을 깊게 가꾸는',
    description:
      '사람은 좋아하지만 굳이 새로운 걸 찾아다니지는 않습니다. 늘 가던 곳, 늘 만나던 사람과의 시간을 깊게 만듭니다.',
    inLove: '상대의 일상을 세심하게 챙기고, 약속을 정확히 지킵니다.',
  },
  Eoc: {
    code: 'Eoc', name: '사교형', tagline: '어디서든 편안한 분위기를 만드는',
    description:
      '누구와도 금방 편해지는 사람입니다. 어렵게 생각하지 않고, 무거운 자리도 가볍게 만듭니다.',
    inLove: '함께 있으면 웃을 일이 많습니다. 진지한 대화는 조금 미루는 편이에요.',
  },
  eOC: {
    code: 'eOC', name: '탐구형', tagline: '조용히, 그러나 멀리 나아가는',
    description:
      '떠들썩한 자리보다 몰입할 수 있는 시간을 좋아합니다. 관심이 생기면 끝까지 파고들고 꾸준히 해냅니다.',
    inLove: '표현이 많지는 않지만, 한 번 마음먹으면 오래 변하지 않습니다.',
  },
  eOc: {
    code: 'eOc', name: '몽상형', tagline: '머릿속에 늘 다른 세계가 있는',
    description:
      '혼자 있는 시간에 상상이 자랍니다. 남들이 보지 않는 걸 보고, 정해진 틀을 답답해합니다.',
    inLove: '취향을 함께 나눌 수 있는 사람에게 깊이 빠집니다.',
  },
  eoC: {
    code: 'eoC', name: '원칙형', tagline: '말없이 곁을 지키는',
    description:
      '요란하지 않지만 해야 할 일은 반드시 합니다. 익숙하고 안정적인 것을 좋아하고, 약속을 어기는 걸 스스로 못 견딥니다.',
    inLove: '표현은 서툴러도 행동으로 보여줍니다. 관계가 길어질수록 진가가 나옵니다.',
  },
  eoc: {
    code: 'eoc', name: '여유형', tagline: '서두르지 않는',
    description:
      '무리하지 않습니다. 집이 제일 편하고, 급하게 서두르는 걸 좋아하지 않아요. 곁에 있으면 마음이 놓이는 사람입니다.',
    inLove: '같이 아무것도 하지 않아도 어색하지 않은 관계를 만듭니다.',
  },
};

/** 응답에서 유형 코드를 뽑는다 (E/e, O/o, C/c 조합) */
export function personaCodeOf(answers: Answers): string {
  const a = computeAxes(answers);
  return (a.E >= 0.5 ? 'E' : 'e') + (a.O >= 0.5 ? 'O' : 'o') + (a.C >= 0.5 ? 'C' : 'c');
}

export function personaOf(answers: Answers): PersonaType {
  return PERSONA_TYPES[personaCodeOf(answers)] ?? PERSONA_TYPES.eoc;
}

/** 나머지 두 축(배려·정서)을 한 줄 설명으로 */
export function extraTraits(answers: Answers): string[] {
  const a = computeAxes(answers);
  return [
    a.A >= 0.5 ? '갈등이 생기면 먼저 손을 내미는 편' : '자기 생각을 분명히 말하는 편',
    a.N >= 0.5 ? '웬만한 일에 흔들리지 않는 편' : '감정을 섬세하게 느끼는 편',
  ];
}
