"""python3 build.py  -> index.html (self-contained, data from data/)"""
import json, base64, subprocess, openpyxl
t = open('template.html', encoding='utf-8').read()
logo = 'data:image/webp;base64,' + base64.b64encode(open('logo.webp','rb').read()).decode()
t = t.replace('/*__LOGO__*/', logo)
wb = openpyxl.load_workbook('data/monthly.xlsx', data_only=True)
data = {ws.title: [list(r) for r in ws.iter_rows(values_only=True)] for ws in wb}
acc = subprocess.check_output(['node','accrows.js','data/accounting.xls']).decode()
cw = openpyxl.load_workbook('data/caliti.xlsx', data_only=True)
cal = {ws.title: [list(r) for r in ws.iter_rows(values_only=True)] for ws in cw}
t = t.replace('/*__CAL__*/null', json.dumps(cal, ensure_ascii=False))
t = t.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False)).replace('/*__ACC__*/null', acc)
open('index.html','w',encoding='utf-8').write(t)
