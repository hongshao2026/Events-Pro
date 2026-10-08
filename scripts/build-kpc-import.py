"""Rebuild the KPC candidate and small auditable source snapshot, offline.

Usage: python scripts/build-kpc-import.py --source sources/kpc-jeju-2026.source.json --output .sites-runtime/kpc-replayed
Consumes an archived, sanitized official API snapshot; makes no network requests.
The snapshot excludes live player information and authorization identifiers.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SERIES = 'kpc-jeju-2026'
LEAGUE = 'd3f5de57-34a5-4b16-bfe6-7b44251595f7'
ORIGIN = 'https://www.kpcpoker.com'
SOURCE_URL = ORIGIN + '/seriesTournament.jhtml?leagueId=' + LEAGUE + '&lang=en'
PDF_URL = ORIGIN + '/u/cms/en/202609/23121842exqf.pdf'
SOURCE_DATE = '2026-10-08'

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def clean(value):
    return re.sub(r'\s+', ' ', value or '').strip()

def code(row):
    prefix = row['name'].split('|')[0].strip()
    if prefix.startswith('MS#'):
        return 'MS' + prefix[3:]
    return prefix.lstrip('#')

def event_id(value):
    parts = re.fullmatch(r'([A-Z]*)(\d+)', value)
    assert parts, value
    return 'KPC' + parts[1] + parts[2].zfill(2)

def currency(row):
    return {'₩': 'KRW', '$': 'USD'}[row['subscription']['currencySymbol']]

def source_name(row):
    return clean(row['name'].split('|', 1)[1])

def classify(row):
    title = source_name(row)
    if 'SATELLITE' in title:
        return 'satellite', '卫星赛'
    if re.search(r'MIX|STUD|DRAW|ARCHIE|ARI99|POKER PLAYERS|2-7', title):
        return 'regular', '混合/限注'
    if re.search(r'OMAHA|PLO|BIG[- ]O', title):
        return 'regular', '奥马哈'
    if 'OFC' in title or 'FUN GAME' in title:
        return 'regular', '混合/限注'
    return 'regular', '德州扑克'

def make_slot(row):
    daily = row['dailyDetails']
    raw_buyin = row['subscription']['buyin']
    label = code(row)
    name = source_name(row)
    kind, group = classify(row)
    start = datetime.fromisoformat(daily['startDate'])
    # These UTC-named fields carry an explicit response-dependent offset.
    assert start.replace(tzinfo=timezone(timedelta(hours=9))) == datetime.fromisoformat(daily['startDateUTC'])
    assert daily['day'] in (0, 1, 2, 3)
    continuation = daily['day'] >= 2
    if daily['day'] == 0:
        stage = '资格决赛' if label == 'S1' else '首轮'
    elif continuation:
        stage = 'Final Day' if re.search(r'FINAL DAY\b', name) else 'Day ' + str(daily['day'])
    else:
        stage = 'Day 1' + clean(daily['flight'])
        if 'TURBO' in name:
            stage += ' Turbo'
    notes = []
    if continuation:
        notes.append('晋级续赛沿用筹码，不新增买入。')
    registration = daily.get('subscriptionClose')
    if continuation and registration:
        if registration > daily['startDate']:
            notes.append('官网列明续赛日仍开放延迟报名；本产品将该时段保留为续赛，实际报名请向主办方确认。')
        elif registration == daily['startDate']:
            notes.append('官网列明报名于本续赛开赛时截止；本产品不将续赛作为独立买入。')
        else:
            notes.append('官网沿用前轮报名截止时间，不代表本续赛可重新报名。')
    if label == 'S1':
        notes.append('官网规则限混合游戏系列积分榜前 6 名；起始筹码按积分为 400,000–1,000,000。接口默认筹码 10,000 与该专属规则不一致，本表不采用默认值。')
    if label == '2' and continuation:
        notes.append('官网当前开赛为 12:00；9 月 22 日版 PDF 曾列 11:45，本表采用当前官网。')
    if label == '10':
        notes.append('官网当前每级 25 分钟；9 月 22 日版 PDF 曾列 30 分钟，本表采用当前官网。')
    if label == '16':
        notes.append('官网当前列 40,000 起始筹码、40 分钟和 14:40 报名截止；旧版 PDF 筹码和级别列 N/A、截止 14:00，本表采用当前官网。')
    if label == '38':
        notes.append('OFC 轮次时长：官网专属规则规定首轮 75 分钟、半决赛和决赛各 90 分钟；接口默认时长 90 分钟不代表所有轮次。')
    if continuation and label in ('8', '18', '52'):
        if label == '8' or label == '52' or daily['day'] == 3:
            notes.append('官网当前每级 40 分钟；旧版 PDF 本阶段时长不同，本表采用当前官网。')
    if label == '58':
        notes.append('官网当前报名截止 23:10；9 月 22 日版 PDF 曾列 23:15，本表采用当前官网。')
    if label == '49':
        notes.append('官网当前报名截止当天 23:59；旧版 PDF 列次日 00:00，本表采用当前官网。')
    if label == 'MS3':
        notes.append('官网赛名保底 10 席；接口金额 13,000,000 韩元对应席位价值，不作现金保底累计。')
    if label in ('S2', 'S3'):
        notes.append('阶梯卫星赛；具体晋级资格和目标场次以主办方规则为准。')
    buyin = int(raw_buyin['amount'])
    guarantee = int(row['subscription'].get('guaranteedAmount') or 0) or None
    result = {
        'id': row['id'], 'date': start.date().isoformat(),
        'hour': start.hour + start.minute / 60,
        'name': name, 'stageLabel': stage, 'buyin': None if continuation else buyin,
        'guarantee': None if kind == 'satellite' else guarantee,
        'count': 10 if label == 'MS3' else None,
        'unit': '席位' if kind == 'satellite' else '', 'group': group,
        'notes': ''.join(notes), 'chips': None if continuation or label == 'S1' else int(raw_buyin['chips']),
        'levels': '75/90' if label == '38' else str(daily['levelMinutes']), 'supplement': False,
        'sourceUrl': ORIGIN + '/seriesTournamentDetail.jhtml?id=' + row['id'],
    }
    if registration:
        result['registrationCloses'] = registration[:16]
        level = row['subscription'].get('lateRegistrationLevel')
        if level:
            result['registrationLevel'] = level
    return result

def build(snapshot):
    groups = defaultdict(list)
    for row in snapshot['events']:
        groups[row.get('summaryId') or row['id']].append(row)
    events = []
    audit_rows = []
    for key, rows in groups.items():
        rows.sort(key=lambda row: (row['dailyDetails']['startDate'], row['id']))
        first = rows[0]
        label = code(first)
        currencies = {currency(row) for row in rows}
        assert len(currencies) == 1, (key, currencies)
        assert len({code(row) for row in rows}) == 1, key
        starts = [make_slot(row) for row in rows if row['dailyDetails']['day'] <= 1]
        continuations = [make_slot(row) for row in rows if row['dailyDetails']['day'] >= 2]
        assert starts, key
        title = source_name(first)
        if first['behaviour']['multiDay']:
            title = re.sub(r'\s+DAY\s+1(?:/?[A-Z])?(?:\s*\(TURBO\))?', '', title)
        title = clean(re.sub(r'\s*\(GTD:[^)]+\)', '', title))
        kind, _ = classify(first)
        note = '买入和现金保底以' + ('韩元' if currency(first) == 'KRW' else '美元') + '计价；时间为韩国当地时间 KST（UTC+9）。'
        restricted = ''
        if label == 'S1':
            restricted = '仅混合游戏系列积分榜前 6 名；并非公开免费报名赛事。'
        elif label == '29':
            restricted = '单挑赛，上限 32 人。'
        event = {**starts[0], 'id': event_id(label), 'title': title,
                 'seriesId': SERIES, 'currency': currency(first),
                 'notes': note, 'starts': starts, 'continuations': continuations,
                 'restricted': restricted, 'priority': label in ('8', '52'), 'kind': kind}
        if label.isdigit():
            event['officialNumber'] = int(label)
        else:
            event['displayNumber'] = ('MS#' + label[2:]) if label.startswith('MS') else '#' + label
        events.append(event)
        for row in rows:
            slot = next(slot for slot in starts + continuations if slot['id'] == row['id'])
            audit_rows.append({
                'id': row['id'], 'eventId': event['id'], 'groupId': key,
                'officialCode': code(row), 'sourceName': row['name'],
                'localStart': row['dailyDetails']['startDate'], 'currency': currency(row),
                'buyin': row['subscription']['buyin']['amount'],
                'chips': row['subscription']['buyin']['chips'],
                'levelMinutes': row['dailyDetails']['levelMinutes'],
                'registrationCloses': row['dailyDetails'].get('subscriptionClose'),
                'registrationLevel': row['subscription'].get('lateRegistrationLevel'),
                'guaranteeAmount': row['subscription'].get('guaranteedAmount'),
                'day': row['dailyDetails']['day'], 'flight': row['dailyDetails']['flight'],
                'role': 'continuation' if row['dailyDetails']['day'] >= 2 else 'start',
                'stageLabel': slot['stageLabel'], 'sourceUrl': slot['sourceUrl'],
            })
    events.sort(key=lambda event: (event['date'], event['hour'], event['id']))
    audit_rows.sort(key=lambda row: (row['localStart'], row['id']))
    assert len({event['id'] for event in events}) == len(events)
    assert len({row['id'] for row in audit_rows}) == len(snapshot['events'])
    return events, audit_rows

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
snapshot = json.loads(args.source.read_text(encoding='utf-8'))
events, rows = build(snapshot)
write(args.output / 'kpc-jeju-2026.json', events)
write(args.output / 'kpc-jeju-2026.source.json', snapshot)
write(args.output / 'kpc-jeju-2026.rows.json', {'sourceUrl': SOURCE_URL, 'retrievedOn': SOURCE_DATE, 'rows': rows})
manifest = {
    'seriesId': SERIES, 'name': snapshot['league']['name'], 'sourceUrl': SOURCE_URL,
    'retrievedOn': SOURCE_DATE, 'start': '2026-10-10', 'end': '2026-10-21',
    'venue': snapshot['league']['venue'], 'city': 'Jeju', 'countryCode': 'KR',
    'timeZone': 'Asia/Seoul', 'timeLabel': 'KST', 'currencies': ['KRW', 'USD'],
    'eventCount': len(events), 'entryCount': sum(len(event['starts']) for event in events),
    'continuationCount': sum(len(event['continuations']) for event in events),
    'slotCount': len(rows), 'satelliteEventCount': sum(event['kind'] == 'satellite' for event in events),
    'currencySlots': dict(Counter(row['currency'] for row in rows)),
    'currencyEvents': dict(Counter(event['currency'] for event in events)),
    'pdfUrl': PDF_URL, 'pdfVersion': '2026-09-22 (01)',
    'logoUrl': ORIGIN + '/r/cms/en/en/images/top-logo.png?v1',
    'sourceSha256': hashlib.sha256((args.output / 'kpc-jeju-2026.source.json').read_bytes()).hexdigest(),
}
write(args.output / 'manifest.json', manifest)
print(json.dumps(manifest, ensure_ascii=True, indent=2))
