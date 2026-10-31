import subprocess,re,json,sys
from concurrent.futures import ThreadPoolExecutor
from cities import C
def rd(u):
    for _ in range(2):
        try:
            o=subprocess.run(['gap','web-browse','read',json.dumps({'url':u})],capture_output=True,text=True,timeout=100).stdout
            if '<content>' in o: return o
        except Exception: pass
    return ''
def one(c):
    base=f'https://balad.ir/city-{c[2]}/cat-curtain-store'
    o=rd(base)
    if not o: return c[0],None,0
    n1=len(re.findall(r'تزیینات و دکوراسیون',o))+len(re.findall(r'مرکز خرید',o))
    m=re.search(r'صفحه\s*1\s*از\s*(\d+)',o); pages=int(m.group(1)) if m else 1
    items=len(re.findall(r'-{5,}',o))
    tot=items
    if pages>1:
        o2=rd(base+f'?page={pages}')
        last=len(re.findall(r'-{5,}',o2)) if o2 else 0
        tot=items*(pages-1)+last
    return c[0],tot,pages
if __name__=='__main__':
    with ThreadPoolExecutor(6) as ex: R=list(ex.map(one,C))
    json.dump({r[0]:{'n':r[1],'pages':r[2]} for r in R},open('balad.json','w'),ensure_ascii=False,indent=0)
    for r in R: print(r)
