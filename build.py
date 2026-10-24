"""Usage: python3 build.py [file.xlsx]
Creates index.html (no data, safe for GitHub) and preview.html (data embedded, keep PRIVATE)."""
import sys, json, base64, openpyxl
src = sys.argv[1] if len(sys.argv) > 1 else '../فروش ماهانه هرمغازه.xlsx'
t = open('template.html', encoding='utf-8').read()
logo = 'data:image/webp;base64,' + base64.b64encode(open('logo.webp','rb').read()).decode()
t = t.replace('/*__LOGO__*/', logo)
open('index.html', 'w', encoding='utf-8').write(t)
wb = openpyxl.load_workbook(src, data_only=True)
data = {ws.title: [list(r) for r in ws.iter_rows(values_only=True)] for ws in wb}
open('preview.html', 'w', encoding='utf-8').write(
    t.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False)))
open('.gitignore', 'w').write('preview.html\n*.xlsx\n')
