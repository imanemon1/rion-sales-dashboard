"""python3 pakhsh/plan_gen.py  -> pakhsh_plan.html (جدول شهرها + جدول استان‌ها + نقشه فتح استان‌ها)"""
import json, sys, os
from shapely.geometry import shape, mapping
sys.path.insert(0, os.path.dirname(__file__))
from cities import C
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # dashboard/
bal = json.load(open(f'{H}/pakhsh/balad.json'))
sc = json.load(open(f'{H}/pakhsh/shops_city.json'))
OVR = {'کوکون مورکسی': 'ارومیه', 'کوردستان پرده': 'سنندج'}
EXTRA = {'دماوند': ('تهران', 35.72, 52.07), 'نور': ('مازندران', 36.57, 52.01)}
mine = {}
for d, n, c in sc:
    c = c or OVR.get(n)
    mine[c] = mine.get(c, 0) + 1
unk = mine.pop(None, 0)
R = [dict(c=c[0], p=c[1], pop=c[5], comp=bal.get(c[0], {}).get('n'), mine=mine.get(c[0], 0), lat=c[3], lon=c[4]) for c in C]
for k, (p, la, lo) in EXTRA.items():
    if k in mine:
        R.append(dict(c=k, p=p, pop=0, comp=None, mine=mine[k], lat=la, lon=lo))

FA = {'Alborz': 'البرز', 'Ardebil': 'اردبیل', 'Bushehr': 'بوشهر', 'ChaharMahallandBakhtiari': 'چهارمحال و بختیاری',
      'EastAzarbaijan': 'آذربایجان شرقی', 'Esfahan': 'اصفهان', 'Fars': 'فارس', 'Gilan': 'گیلان', 'Golestan': 'گلستان',
      'Hamadan': 'همدان', 'Hormozgan': 'هرمزگان', 'Ilam': 'ایلام', 'Kerman': 'کرمان', 'Kermanshah': 'کرمانشاه',
      'Khuzestan': 'خوزستان', 'KohgiluyehandBuyerAhmad': 'کهگیلویه و بویراحمد', 'Kordestan': 'کردستان',
      'Lorestan': 'لرستان', 'Markazi': 'مرکزی', 'Mazandaran': 'مازندران', 'NorthKhorasan': 'خراسان شمالی',
      'Qazvin': 'قزوین', 'Qom': 'قم', 'RazaviKhorasan': 'خراسان رضوی', 'Semnan': 'سمنان',
      'SistanandBaluchestan': 'سیستان و بلوچستان', 'SouthKhorasan': 'خراسان جنوبی', 'Tehran': 'تهران',
      'WestAzarbaijan': 'آذربایجان غربی', 'Yazd': 'یزد', 'Zanjan': 'زنجان'}
import math
K = math.cos(math.radians(32))
X0, X1, Y0, Y1 = 43.8, 63.6, 24.9, 40.0
W = (X1 - X0) * K * 40
Hh = (Y1 - Y0) * 40
def px(lon, lat): return ((lon - X0) * K * 40, (Y1 - lat) * 40)
def path(g):
    out = []
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    for p in polys:
        for ring in [p.exterior] + list(p.interiors):
            pts = [px(*q) for q in ring.coords]
            out.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
    return ''.join(out)
P = []
for f in json.load(open(f'{H}/geo/gadm41_IRN_1.json'))['features']:
    g = shape(f['geometry']).simplify(0.012, preserve_topology=True)
    # حذف جزیره‌های ریز
    if g.geom_type == 'MultiPolygon':
        from shapely.geometry import MultiPolygon
        g = MultiPolygon([p for p in g.geoms if p.area > 0.02])
    rp = g.representative_point() if f['properties']['NAME_1'] in ('Tehran', 'Alborz') else g.centroid
    if not g.contains(rp): rp = g.representative_point()
    x, y = px(rp.x, rp.y)
    P.append(dict(n=FA[f['properties']['NAME_1']], d=path(g), x=round(x, 1), y=round(y, 1)))
for r in R:
    r['x'], r['y'] = [round(v, 1) for v in px(r['lon'], r['lat'])]
    del r['lat'], r['lon']

T = open(f'{H}/pakhsh/plan_tpl.html', encoding='utf-8').read()
T = T.replace('/*R*/[]', json.dumps(R, ensure_ascii=False)).replace('/*P*/[]', json.dumps(P, ensure_ascii=False))
T = T.replace('/*W*/0', str(round(W))).replace('/*H*/0', str(round(Hh))).replace('/*U*/0', str(unk))
open(f'{H}/pakhsh_plan.html', 'w', encoding='utf-8').write(T)
print(len(R), len(P), round(W), round(Hh), 'unknown', unk, len(T))
