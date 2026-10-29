#!/usr/bin/env python3
"""날씨 지역표 만들기: 시·군·구(행정동 경계 자료) → 기상청 단기예보 격자 · 중기예보 구역 · 에어코리아 예보 구역
  python3 scripts/wx/make-regions.py <HangJeongDong_verYYYYMMDD.geojson>
  자료: https://github.com/vuski/admdongkor (행정동 경계, 통계청 · 행안부 기준)
  결과: firebase/functions/lib/wxRegions.json (서버) · wxDongs.json (동: 시·군·구 → [[동 번호 10자리, 동 이름, 격자 x, y]], 고를 때 서버가 나눠 줌) — 앱(index.html)의 WX_REG 은 같은 내용을 줄여서 넣음 (시험이 같은지 확인)
  대표 위치 = 그 시·군·구 안 행정동 중심들의 평균 (사람 사는 곳 쪽으로 쏠리게)"""
import json, math, sys, os

SIDO = {'서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전',
  '울산광역시':'울산','세종특별자치시':'세종','경기도':'경기','강원특별자치도':'강원','강원도':'강원','충청북도':'충북','충청남도':'충남',
  '전북특별자치도':'전북','전라북도':'전북','전라남도':'전남','전남광주통합특별시':'전남광주','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주'}
# 중기 육상예보 구역
LAND = {'서울':'11B00000','인천':'11B00000','경기':'11B00000','대전':'11C20000','세종':'11C20000','충남':'11C20000','충북':'11C10000',
  '광주':'11F20000','전남':'11F20000','전남광주':'11F20000','전북':'11F10000','대구':'11H10000','경북':'11H10000',
  '부산':'11H20000','울산':'11H20000','경남':'11H20000','제주':'11G00000'}
YEONGDONG = {'강릉시','동해시','삼척시','속초시','고성군','양양군','태백시'}
# 중기 기온예보 도시 (코드가 확실한 곳만) — 각 시·군·구는 같은 육상 구역 안에서 가장 가까운 도시를 씀
TA = {'11B00000':[('서울','서울',None,'11B10101'),('인천','인천','미추홀구','11B20201'),('수원','경기','수원시',' 11B20601'),('파주','경기','파주시','11B20305'),('이천','경기','이천시','11B20701'),('평택','경기','평택시','11B20606')],
  '11D10000':[('춘천','강원','춘천시','11D10301'),('원주','강원','원주시','11D10401')],
  '11D20000':[('강릉','강원','강릉시','11D20501')],
  '11C20000':[('대전','대전',None,'11C20401'),('서산','충남','서산시','11C20101'),('세종','세종',None,'11C20404')],
  '11C10000':[('청주','충북','청주시','11C10301')],
  '11F20000':[('광주','전남광주',('동구','서구','남구','북구','광산구'),'11F20501'),('목포','전남광주','목포시','21F20801'),('여수','전남광주','여수시','11F20401')],
  '11F10000':[('전주','전북','전주시','11F10201'),('군산','전북','군산시','21F10501')],
  '11H10000':[('대구','대구',None,'11H10701'),('안동','경북','안동시','11H10501'),('포항','경북','포항시','11H10201')],
  '11H20000':[('부산','부산',None,'11H20201'),('울산','울산',None,'11H20101'),('창원','경남','창원시','11H20301')],
  '11G00000':[('제주','제주','제주시','11G00201'),('서귀포','제주','서귀포시','11G00401')]}
NORTH_GG = {'고양시','의정부시','파주시','양주시','동두천시','포천시','연천군','가평군','남양주시','구리시'}

def grid(lat, lon):   # 기상청 단기예보 격자 (LCC)
  RE, G, S1, S2, OLON, OLAT, XO, YO = 6371.00877, 5.0, 30.0, 60.0, 126.0, 38.0, 43, 136
  D = math.pi/180; re = RE/G; s1, s2, ol, oa = S1*D, S2*D, OLON*D, OLAT*D
  sn = math.log(math.cos(s1)/math.cos(s2))/math.log(math.tan(math.pi*.25+s2*.5)/math.tan(math.pi*.25+s1*.5))
  sf = math.tan(math.pi*.25+s1*.5)**sn*math.cos(s1)/sn; ro = re*sf/math.tan(math.pi*.25+oa*.5)**sn
  ra = re*sf/math.tan(math.pi*.25+lat*D*.5)**sn; th = lon*D-ol
  th = th-2*math.pi if th > math.pi else th+2*math.pi if th < -math.pi else th; th *= sn
  return int(ra*math.sin(th)+XO+.5), int(ro-ra*math.cos(th)+YO+.5)

def ring_centroid(r):
  a = cx = cy = 0.0
  for (x1,y1),(x2,y2) in zip(r, r[1:]+r[:1]):
    c = x1*y2-x2*y1; a += c; cx += (x1+x2)*c; cy += (y1+y2)*c
  if abs(a) < 1e-12: return sum(p[0] for p in r)/len(r), sum(p[1] for p in r)/len(r), 0
  return cx/(3*a), cy/(3*a), abs(a)/2

def feat_centroid(g):
  polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
  best = max((ring_centroid(p[0]) for p in polys), key=lambda t: t[2])   # 가장 큰 조각(섬 말고 본토)
  return best[0], best[1]

def main(src):
  fs = json.load(open(src, encoding='utf-8'))['features']
  by = {}; dongs = {}
  for f in fs:
    p = f['properties']; k = p['sgg']; c = feat_centroid(f['geometry'])
    by.setdefault(k, {'sido': SIDO[p['sidonm']], 'sgg': p['sggnm'], 'pts': []})['pts'].append(c)
    nx, ny = grid(c[1], c[0])
    dongs.setdefault(k, []).append([p['adm_cd2'], p['adm_nm'].split(' ')[-1], nx, ny])
  rows = []
  for code, v in sorted(by.items()):
    lon = sum(x for x,_ in v['pts'])/len(v['pts']); lat = sum(y for _,y in v['pts'])/len(v['pts'])
    v['lat'], v['lon'] = lat, lon
    sd, sg = v['sido'], v['sgg']
    if sd == '강원': land = '11D20000' if sg in YEONGDONG else '11D10000'
    else: land = LAND[sd]
    if sd == '경기': aq = '경기북부' if sg in NORTH_GG else '경기남부'
    elif sd == '강원': aq = '영동' if land == '11D20000' else '영서'
    elif sd == '전남광주': aq = '광주|전남광주' if sg in ('동구','서구','남구','북구','광산구') else '전남|전남광주'
    else: aq = sd
    import re
    m = re.match(r'^(.+시)(.+구)$', sg)
    name = f'{m.group(1)} {m.group(2)}' if m and sd not in ('서울','부산','대구','인천','광주','대전','울산') else sg
    rows.append({'c': code, 's': sd, 'n': name, 'land': land, 'aq': aq, 'lat': lat, 'lon': lon, 'sgg': sg})
  # 기온 도시 위치
  def city_pos(sd, key):
    pts = [r for r in rows if r['s'] == sd and (key is None or (r['sgg'].startswith(key) if isinstance(key, str) else r['sgg'] in key))]
    assert pts, (sd, key)
    return sum(r['lat'] for r in pts)/len(pts), sum(r['lon'] for r in pts)/len(pts)
  cand = {land: [(nm, code.strip(), city_pos(sd, key)) for nm, sd, key, code in lst] for land, lst in TA.items()}
  out = []
  for r in rows:
    nx, ny = grid(r['lat'], r['lon'])
    cs = cand[r['land']]
    t = min(cs, key=lambda c: (c[2][0]-r['lat'])**2 + ((c[2][1]-r['lon'])*math.cos(math.radians(r['lat'])))**2)
    out.append([r['c'], r['s'], r['n'], nx, ny, r['land'], t[1], r['aq']])
  assert len(out) > 200
  dst = os.path.join(os.path.dirname(__file__), '../../firebase/functions/lib/wxRegions.json')
  with open(dst, 'w', encoding='utf-8') as f:
    f.write('[\n' + ',\n'.join(json.dumps(x, ensure_ascii=False, separators=(',', ':')) for x in out) + '\n]\n')
  print(len(out), 'rows →', os.path.normpath(dst))
  dd = os.path.join(os.path.dirname(__file__), '../../firebase/functions/lib/wxDongs.json')
  with open(dd, 'w', encoding='utf-8') as f:
    f.write('{\n' + ',\n'.join(json.dumps(k, ensure_ascii=False) + ':' + json.dumps(sorted(v, key=lambda x: x[1]), ensure_ascii=False, separators=(',', ':')) for k, v in sorted(dongs.items())) + '\n}\n')
  print(sum(len(v) for v in dongs.values()), 'dongs →', os.path.normpath(dd))

main(sys.argv[1])
