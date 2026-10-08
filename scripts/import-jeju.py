"""Reproduce the supplied JPF PDF snapshot and catalog (requires PyMuPDF)."""
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parent.parent
pdf = ROOT / 'sources/jeju-poker-festival-2026.pdf'
page = pymupdf.open(pdf)[0]
words = page.get_text('words')
times = sorted((w for w in words if 95 < w[0] < 130 and re.fullmatch(r'\d{2}:\d{2}', w[4])), key=lambda w: w[1])
rows, date, previous = [], dt.date(2026, 10, 28), 0
for index, word in enumerate(times):
    hour = int(word[4][:2]) + int(word[4][3:]) / 60
    if hour < previous:
        date += dt.timedelta(days=1)
    previous = hour
    y = (word[1] + word[3]) / 2
    line = sorted((w for w in words if w[0] > 90 and abs((w[1] + w[3]) / 2 - y) < 4), key=lambda w: w[0])
    def column(lo, hi):
        return ' '.join(w[4] for w in line if lo <= w[0] < hi)
    rows.append(dict(row=index+1, date=str(date), time=word[4], number=column(130,150), name=column(150,430), buyin=column(430,475), breakdown=column(475,546), bounty=column(546,584), stack=column(584,618), duration=column(618,670), registration=column(670,731)))
assert len(rows) == 178 and date == dt.date(2026, 11, 11)

def write(path, value):
    (ROOT / path).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
write('sources/jeju-poker-festival-2026.snapshot.json', dict(source=pdf.name, sha256=hashlib.sha256(pdf.read_bytes()).hexdigest(), rows=rows))

def amount(value):
    return int(value.replace('USD ', '').replace(',', '')) if value else None

catalog = {}
for row in rows:
    number = row['number']
    event_id = 'JPF-' + number
    name = row['name'].replace('**', '')
    currency = 'USD' if row['buyin'].startswith('USD ') else 'KRW'
    buyin, bounty = amount(row['buyin']), amount(row['bounty'])
    continuation = bool(re.search(r'\bDAY [2-9]\b|\bFINAL (TABLE|DAY)\b', name))
    source_date = dt.date.fromisoformat(row['date'])
    hour = int(row['time'][:2]) + int(row['time'][3:]) / 60
    actual_date = source_date + dt.timedelta(days=1 if hour == 24 else 0)
    notes = []
    if hour == 24:
        notes.append(f"原表 {row['date']} 24:00，按次日 00:00 归入日程。")
        hour = 0
    if row['breakdown']:
        parts = [int(v.replace(',', '')) for v in re.findall(r'[\d,]+', row['breakdown'])]
        assert sum(parts) + (bounty or 0) == buyin, row
        notes.append(f"报名费构成（奖池 + 服务费）：{row['breakdown']} {currency}。")
    if bounty:
        notes.append(f"赏金部分：{bounty:,} {currency}，已包含在总报名费内。")
    if number == '1':
        notes.append('原表未列报名费，按未公布保留，不作免费赛事处理。')
    if number == '106':
        notes.append('原表名称含 BOUNTY，但赏金列空白，不推定赏金金额。')
    if '**' in row['name']:
        notes.append('原表 **：EARLY BIRD 混合游戏节套餐指定赛事。')
    if continuation:
        notes.append('晋级续赛；原表如列出买入仅作资料保留，不重复计入预算。')
    gtd_match = re.search(r'KRW ([\d.]+) (MILLION|BILLION) GTD', name)
    guarantee = int(float(gtd_match[1]) * (1e6 if gtd_match[2] == 'MILLION' else 1e9)) if gtd_match else None
    mixed = '**' in row['name'] or bool(re.search(r'PLO|OMAHA|BIG O|DRAW|RAZZ|STUD|T\.O\.R\.S\.E|GAME CHAMPIONSHIP', name))
    satellite = number.startswith('MS')
    group = '卫星赛' if satellite else '混合游戏' if mixed else '德州扑克变体' if re.search(r'SUPER HOLD|PINEAPPLE',name) else '德州扑克'
    registration = re.search(r'LEVEL (\d+)(?: ON DAY (\d+))?', row['registration'])
    slot = dict(id=f'JPF-R{row["row"]:03d}', date=str(actual_date), hour=hour, name=name, buyin=buyin, guarantee=guarantee, count=None, unit='', group=group, notes='；'.join(notes), chips=amount(row['stack']), levels=row['duration'].replace(' MINUTES',''), supplement=False, sourceRow=row['row'])
    if registration:
        slot['registrationLevel'] = int(registration[1])
        slot['registrationNote'] = (f'Day {registration[2]} ' if registration[2] else '') + f'第 {registration[1]} 级（原表未列时刻）'
    if event_id not in catalog:
        title = re.sub(r'\s*\(KRW .*? GTD\)', '', name)
        title = re.sub(r'\s+DAY \d[A-E]?(?:[（(]TURBO[）)]|\s+TURBO)?\s*$', '', title)
        catalog[event_id] = {**slot, 'id':event_id, 'title':title, 'starts':[], 'continuations':[], 'restricted':'须年满19岁，并持 Casino Players Club 会员卡。', 'priority':bool(gtd_match), 'kind':'satellite' if satellite else 'regular', 'seriesId':'jeju-poker-festival-2026', 'currency':currency, 'sourcePage':1, 'notes':'', **({'displayNumber':number} if satellite else {'officialNumber':int(number)})}
    event = catalog[event_id]
    # Blank continuation fees do not change the event's original USD/KRW denomination.
    if buyin is not None:
        assert currency == event['currency'], row
    event['continuations' if continuation else 'starts'].append(slot)
assert len(catalog) == 140
assert sum(len(e['starts']) for e in catalog.values()) == 160
assert sum(len(e['continuations']) for e in catalog.values()) == 18
assert all(e['starts'] for e in catalog.values())
write('lib/jeju-poker-festival-2026.json', list(catalog.values()))
# Render the supplied official masthead as a local brand asset without redrawing it.
page.get_pixmap(matrix=pymupdf.Matrix(3,3), clip=pymupdf.Rect(54,19,388,68)).save(str(ROOT / 'assets/jpf-2026-logo.png'))
print('JPF: 178 source rows -> 140 events, 160 starts, 18 continuations; 17 satellites.')
