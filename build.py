"""python3 build.py  -> index.html (self-contained, data from data/)"""
import json, base64, subprocess, openpyxl
t = open('template.html', encoding='utf-8').read()
logo = 'data:image/webp;base64,' + base64.b64encode(open('logo.webp','rb').read()).decode()
t = t.replace('/*__LOGO__*/', logo)
wb = openpyxl.load_workbook('data/caliti.xlsx', data_only=True)
data = {ws.title: [list(r) for r in ws.iter_rows(values_only=True)] for ws in wb}
acc = subprocess.check_output(['node','accrows.js','data/accounting.xls']).decode()
cw = openpyxl.load_workbook('data/caliti.xlsx', data_only=True)
cal = {ws.title: [list(r) for r in ws.iter_rows(values_only=True)] for ws in cw}
t = t.replace('/*__CAL__*/null', json.dumps(cal, ensure_ascii=False))
import os; os.makedirs('kalite',exist_ok=True); open('kalite/calist.json','w',encoding='utf-8').write(json.dumps(cal,ensure_ascii=False))
t = t.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False)).replace('/*__ACC__*/null', acc)
t = t.replace("/*__PLAN__*/''", json.dumps(open('pakhsh_plan.html',encoding='utf-8').read(), ensure_ascii=False).replace('</','<\\/'))
sc = json.load(open('pakhsh/shops_city.json', encoding='utf-8'))
OVR = {'کوکون مورکسی': 'ارومیه', 'کوردستان پرده': 'سنندج'}
cm = {n.strip(): (c or OVR.get(n.strip())) for d, n, c in sc if (c or OVR.get(n.strip()))}
import re
N = lambda x: re.sub(r'\s+',' ',str(x)).strip()
cm = {N(k): v for k, v in cm.items()}
ADD = {'گلدن هوم یزد':'یزد','آلتون یزد':'یزد','پیکاسو اردبیل':'اردبیل','طهرانچیان آمل':'آمل','اورست بابل':'بابل',
 'آقای دشتی رشت':'رشت','برلیان رشت':'رشت','مانیا رستاخیز':'کرج'}
cm.update(ADD)
for r in data['زرتشت و ولیعصر'][1:]:
    if r[1]: cm.setdefault(N(r[1]), 'تهران')
t = t.replace('/*__CITY__*/{}', json.dumps(cm, ensure_ascii=False))
open('index.html','w',encoding='utf-8').write(t)
