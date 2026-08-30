/**
 * 권역과 거리 계산.
 *
 * ── 왜 "만날 수 있는 지역"을 묻지 않게 되었나 ──────────────
 *
 * 시/도 단위로 지역을 고르게 하면 경기도가 너무 크다.
 * 파주와 평택은 같은 경기도지만 2시간 넘게 걸린다.
 * 그렇다고 250개 시/군/구를 다 고르게 하면 입력이 고역이다.
 *
 * 그래서 지역을 고르는 대신 **"얼마나 멀리까지 갈 수 있는지"**만 묻는다.
 * 사는 곳은 이미 시/군/구까지 받고 있으므로, 두 사람 사이의 거리를 계산해
 * 양쪽 모두의 허용 시간 안에 들면 만날 수 있다고 본다.
 *
 * 입력은 한 번으로 끝나고, 판정은 훨씬 정확해진다.
 *
 * ⚠️ 지도 API로 실제 소요 시간을 구하면 더 정확하지만, 매칭은 사람 수의
 *    제곱만큼 계산해야 해서 호출량이 감당되지 않는다. 좌표 거리로 근사한다.
 */

export interface Zone {
  id: string;
  label: string;
  lat: number;
  lng: number;
  /** 수도권은 대중교통이 촘촘해 같은 거리라도 빨리 간다 */
  metro?: boolean;
}

/**
 * 권역 목록. 경기는 남부와 북부로, 강원은 영서와 영동으로 나눴다.
 * 둘 다 도 안에서 이동 시간이 크게 벌어지는 곳이다.
 */
export const ZONES: Zone[] = [
  { id: 'seoul',    label: '서울',     lat: 37.5665, lng: 126.9780, metro: true },
  { id: 'gg_north', label: '경기 북부', lat: 37.7381, lng: 127.0337, metro: true },
  { id: 'gg_south', label: '경기 남부', lat: 37.2636, lng: 127.0286, metro: true },
  { id: 'incheon',  label: '인천',     lat: 37.4563, lng: 126.7052, metro: true },
  { id: 'gw_west',  label: '강원 영서', lat: 37.8813, lng: 127.7300 },
  { id: 'gw_east',  label: '강원 영동', lat: 37.7519, lng: 128.8761 },
  { id: 'daejeon',  label: '대전',     lat: 36.3504, lng: 127.3845 },
  { id: 'sejong',   label: '세종',     lat: 36.4801, lng: 127.2890 },
  { id: 'cb',       label: '충북',     lat: 36.6424, lng: 127.4890 },
  { id: 'cn',       label: '충남',     lat: 36.8151, lng: 127.1139 },
  { id: 'jb',       label: '전북',     lat: 35.8242, lng: 127.1480 },
  { id: 'gwangju',  label: '광주',     lat: 35.1595, lng: 126.8526 },
  { id: 'jn',       label: '전남',     lat: 34.9506, lng: 127.4872 },
  { id: 'daegu',    label: '대구',     lat: 35.8714, lng: 128.6014 },
  { id: 'gb',       label: '경북',     lat: 36.0190, lng: 129.3435 },
  { id: 'busan',    label: '부산',     lat: 35.1796, lng: 129.0756 },
  { id: 'ulsan',    label: '울산',     lat: 35.5384, lng: 129.3114 },
  { id: 'gn',       label: '경남',     lat: 35.2280, lng: 128.6811 },
  { id: 'jeju',     label: '제주',     lat: 33.4996, lng: 126.5312 },
];

export const ZONE_BY_ID = new Map(ZONES.map((z) => [z.id, z]));

/** 경기 북부에 해당하는 시/군 */
const GG_NORTH = [
  '고양시', '의정부시', '파주시', '양주시', '동두천시', '포천시',
  '연천군', '남양주시', '구리시', '가평군',
];
/** 강원 영동에 해당하는 시/군 (태백산맥 동쪽) */
const GW_EAST = [
  '강릉시', '동해시', '태백시', '속초시', '삼척시', '고성군', '양양군',
];

/** 사는 곳(시/도 + 시/군/구)으로 권역을 판정한다 */
export function zoneOf(sido: string, sigungu: string): Zone {
  if (sido === '경기') {
    return ZONE_BY_ID.get(GG_NORTH.includes(sigungu) ? 'gg_north' : 'gg_south')!;
  }
  if (sido === '강원') {
    return ZONE_BY_ID.get(GW_EAST.includes(sigungu) ? 'gw_east' : 'gw_west')!;
  }
  const byLabel = ZONES.find((z) => z.label === sido);
  return byLabel ?? ZONES[0];
}

/** 두 지점의 직선 거리(km) */
function distanceKm(a: Zone, b: Zone): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 두 권역 사이의 예상 이동 시간(분).
 *
 * 직선 거리를 평균 속도로 나누고 채비 시간을 더한 근사치다.
 * 수도권 안은 대중교통이 촘촘해 느리게(자주 서니까) 잡고,
 * 지역 간 이동은 고속도로·철도라 빠르게 잡는다.
 */
export function travelMinutes(a: Zone, b: Zone): number {
  if (a.id === b.id) return 30; // 같은 권역 안에서 만나는 정도
  const km = distanceKm(a, b);
  const bothMetro = a.metro && b.metro;
  const speed = bothMetro ? 30 : 70; // km/h
  return Math.round(20 + (km / speed) * 60);
}

/** 사용자가 고르는 "이동 가능 시간" 선택지 */
export const TRAVEL_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 30, label: '30분 이내' },
  { minutes: 60, label: '1시간 이내' },
  { minutes: 90, label: '1시간 30분 이내' },
  { minutes: 120, label: '2시간 이내' },
  { minutes: 180, label: '3시간 이내' },
  { minutes: 9999, label: '거리는 상관없어요' },
];
