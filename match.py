import re,html,openpyxl,collections,difflib
def n(s):
    s=s.replace('ي','ی').replace('ك','ک').replace('ة','ه').replace('\u200c',' ')
    s=re.sub(r'[()\-.،]',' ',s); return re.sub(r'\s+',' ',s).strip()
def load_acc(p='اکسل حسابداری.xls'):
    t=open(p,encoding='utf-8').read()
    R=[[html.unescape(x) for x in re.findall(r'<Data[^>]*>(.*?)</Data>',r,re.S)] for r in re.findall(r'<Row>(.*?)</Row>',t,re.S)][1:]
    return [r for r in R if len(r)==9]
def load_list(p='لیست پخش کالیته.xlsx'):
    L=[]
    for ws in openpyxl.load_workbook(p,data_only=True):
        for r in ws.iter_rows(min_row=2,values_only=True):
            if r[1] and isinstance(r[0],int): L.append((ws.title,n(str(r[1])),r[2],r[3]))
    return L
TEH={'تهران','زرتشت و ولیعصر'}
NOISE={'آقای','اقای','خانم','نمایندگی','تهران','زرتشت','ولیعصر','کرج','مشهد','شیراز','عبدل','اباد','آباد'}
def core(x):
    x=x.replace('آ','ا').replace('ط','ت').replace('ث','س').replace('ذ','ز').replace('ظ','ز').replace('ص','س').replace('ض','ز').replace('ه','ا') if False else x.replace('آ','ا')
    return ' '.join(w for w in x.replace('آ','ا').split() if w not in {t.replace('آ','ا') for t in NOISE})
def hint(a):
    if 'عبدل اباد' in a or 'عبدل آباد' in a: return {'عبدل اباد'}
    if a.endswith(' کرج'): return {'کرج'}
    if a.endswith(' مشهد'): return {'مشهد'}
    if a.endswith(' تهران') or 'زرتشت' in a or 'ولیعصر' in a: return TEH
    return None
def match(acc,L):
    h=hint(acc); ca=core(acc)
    pools=[[x for x in L if x[0] in h]] if h else []
    pools.append(L)
    for pool in pools:
        for x in pool:
            if core(x[1])==ca and ca: return x,1
        for x in pool:
            if core(x[1]).replace(' ','')==ca.replace(' ','') and ca: return x,1
    best=None
    for pool in pools:
        for x in pool:
            r=difflib.SequenceMatcher(None,ca,core(x[1])).ratio()
            if r>=0.8 and (not best or r>best[1]): best=(x,round(r,2))
        if best: return best
    return None,0
if __name__=='__main__':
    R=load_acc();L=load_list()
    m=collections.defaultdict(float)
    for r in R:m[n(r[0])]+=float(r[4])
    ex=[];fz=[];no=[]
    for a,v in m.items():
        x,s=match(a,L)
        (ex if s==1 else fz if x else no).append((a,x[1] if x else '',x[0] if x else '',round(v)))
    print(len(ex),'exact',len(fz),'fuzzy',len(no),'none')
    print('FUZZY');[print(i) for i in fz]
    print('NONE');[print(i) for i in no]
    used={match(a,L)[0][1] for a in m if match(a,L)[0]}
    print('LIST NOT MATCHED',[(x[0],x[1]) for x in L if x[1] not in used])
