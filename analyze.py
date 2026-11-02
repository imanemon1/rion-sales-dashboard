import sys,re,collections,openpyxl
from match import *
MAN={'میلاد قادریان تهران':'قادریان','پرده خانه ابریشم زرتشت':'خانه پرده ابریشم','کوکون مورکسی ارومیه':'کوکون مورکسی','فرشته پارک وی تهران':'فرشته پارک وی داوودپور','آقای دشتی رشت':'علی دشتی',
 'آرمانی شریعتی':'آرمانی شریعتی','رضایی شریعتی تهران':'آرمانی شریعتی','شانل ساری':'اشکان ساری','اشکان ساری':'اشکان ساری','شیک رشت':'شیک رشت'}
R=load_acc();L=load_list()
R=[r for r in R if r[0].strip() and r[1]]
byn={x[1]:x for x in L}
tot=collections.defaultdict(lambda:collections.defaultdict(float))
for r in R:
    a=n(r[0]);g=r[3].strip();tot[a][g]+=float(r[4]);tot[a]['_']+=float(r[4])
res=[];nocal=[]
used=set()
for a,v in tot.items():
    key=next((k for k in MAN if n(k)==a),None)
    x=byn.get(n(MAN[key])) if key else match(a,L)[0]
    if x: used.add(x[1]);res.append((x[1],x[0],x[3],v))
    else: nocal.append((a,v))
for x in L:
    if x[1] not in used: res.append((x[1],x[0],x[3],collections.defaultdict(float)))
def yr(b):
    if 'ADOR' in str(b): return 3
    m=re.search(r'(\d)\s*$',str(b or ''));return int(m.group(1)) if m else 0
def act(v):return v['PAYA(RION)']+v['DELVAN(RION)']
wb=openpyxl.Workbook();ws=wb.active;ws.title='مغازه-بوک'
ws.append(['مغازه','شیت','بوک','سال بوک','متر کل','متر RION (فعال)','متر قدیمی/سایر'])
for s,sh,b,v in sorted(res,key=lambda t:-t[3]['_']):
    ws.append([s,sh,b,yr(b),round(v['_'],1),round(act(v),1),round(v['_']-act(v),1)])
w2=wb.create_sheet('بدون کالیته');w2.append(['مشتری','متر'])
for a,v in sorted(nocal,key=lambda t:-t[1]['_']):w2.append([a,round(v['_'],1)])
w3=wb.create_sheet('بوک ۵ و ۴ کم‌خرید');w3.append(['مغازه','بوک','متر RION'])
for s,sh,b,v in res:
    if yr(b) in(4,5) and act(v)<30:w3.append([s,b,round(act(v),1)])
wb.save('گزارش بوک.xlsx')
Y=collections.defaultdict(lambda:[0,0.0,0,0])
for s,sh,b,v in res:
    y=Y[yr(b)];y[0]+=1;y[1]+=v['_'];y[2]+=act(v)>0
for k,y in sorted(Y.items()):print('بوک',k,'مغازه',y[0],'فعال',y[2],'متر',round(y[1]))
print('بدون کالیته',len(nocal),round(sum(v['_'] for a,v in nocal)))
print('صفر',sum(1 for r in res if r[3]['_']==0))
