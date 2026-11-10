import json, glob, os
R = 'F:/Downstairs/Dungeon-Crawler-World-claude-device-sync-offline-start-tlcj0x/Dungeon-Crawler-World-claude-device-sync-offline-start-tlcj0x/'
D = R + 'godot/data/'
OUT = os.path.dirname(os.path.abspath(__file__)) + '/downstairs_bible.html'
J = lambda f: json.load(open(D + f, encoding='utf8'))
def md(p): return open(R + p, encoding='utf8').read()

docs = [
  ('story', 'Story', 'art/STORY.md'), ('world', 'World', 'art/WORLD.md'),
  ('voice', 'Voice scripts', 'prototype/voice/SCRIPTS.md'),
  ('art', 'Art direction', 'art/ART_DIRECTION.md'), ('pipeline', 'Character pipeline', 'art/CHARACTER_PIPELINE.md'),
  ('audit', 'Character audit', 'art/CHARACTER_AUDIT.md'), ('engine', 'Engine port', 'ENGINE_PORT.md'),
  ('t-plan', 'Tripo plan', 'art/TRIPO_PLAN.md'), ('t-cast3', 'Tripo cast 3', 'art/TRIPO_CAST_3.md'),
  ('t-list', 'Tripo list', 'art/TRIPO_LIST.md'), ('t-remaining', 'Tripo remaining', 'art/TRIPO_REMAINING.md'),
  ('t-comic', 'Tripo comic kit', 'art/TRIPO_COMIC_KIT.md'), ('t-deep', 'Tripo deep props', 'art/TRIPO_DEEP_PROPS.md'),
  ('t-every', 'Tripo everyday', 'art/TRIPO_EVERYDAY.md'), ('t-props', 'Tripo props', 'art/TRIPO_PROPS.md'),
]
DOCS = [{'id': i, 'name': n, 'path': p, 'md': md(p)} for i, n, p in docs]

floors = {}
for f in ['floors.json', 'floors_undercity.json', 'floors_deep.json']:
    d = J(f); d = d.get('floors', d)
    for k, v in d.items():
        floors[k] = {'name': v.get('name', ''), 'hub': v.get('hub_name', '')}
ql = J('quest_lines.json')['floors']
ch = J('chambers.json')['floors']
FLOORS = []
for k in sorted(set(ql) | set(ch), key=int):
    f = ql.get(k, {})
    qs = [dict(id=i, **q) for i, q in f.get('quests', {}).items()]
    FLOORS.append({'n': int(k), 'name': floors.get(k, {}).get('name', 'Floor ' + k), 'hub': floors.get(k, {}).get('hub', ''),
                   'stairs': f.get('stairs'), 'quests': qs, 'chambers': ch.get(k, [])})
OLDQ = {'quests': J('quests.json')['quests'], 'story': J('story_quests.json')['quests']}

disc = J('discoveries.json')
narr = dict(disc['monsters'])
for f in sorted(glob.glob(D + 'narration/*.json')):
    narr.update(json.load(open(f, encoding='utf8')))
mons = {}
for f in ['monsters.json', 'monsters_world.json']:
    for k, v in J(f)['monsters'].items():
        mons[k] = {x: v.get(x) for x in ['name', 'title', 'boss', 'hp', 'dmg', 'speed', 'xp', 'barks', 'ranged']}
boss_floor = {}
for k, lst in ch.items():
    for c in lst:
        boss_floor[c['boss']] = (int(k), c['name'])
        mons.setdefault(c['boss'], {'name': c.get('title', c['boss']).title(), 'boss': True})
BEAST = []
for k in sorted(set(mons) | set(narr)):
    m = mons.get(k, {}); n = narr.get(k)
    BEAST.append({'id': k, 'name': m.get('name') or (n or {}).get('title', k).title(), 'title': m.get('title'), 'boss': bool(m.get('boss')) or k in boss_floor,
                  'stats': {x: m.get(x) for x in ['hp', 'dmg', 'speed', 'xp'] if m.get(x) is not None}, 'ranged': bool(m.get('ranged')),
                  'barks': m.get('barks') or [], 'chamber': boss_floor.get(k), 'narr': n})
RACES = [dict(id=k, **v) for k, v in disc['races'].items()]

import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cast import CAST
data = {'cast': CAST, 'docs': DOCS, 'floors': FLOORS, 'oldq': OLDQ, 'beasts': BEAST, 'races': RACES, 'narrator': disc.get('narrator', '')}
blob = json.dumps(data, ensure_ascii=False).replace('</', '<\/')
tpl = open(os.path.dirname(os.path.abspath(__file__)) + '/template.html', encoding='utf8').read()
open(OUT, 'w', encoding='utf8').write(tpl.replace('/*DATA*/null', blob))
print('floors', len(FLOORS), 'beasts', len(BEAST), 'narrated', sum(1 for b in BEAST if b['narr']), 'quests', sum(len(f['quests']) for f in FLOORS), 'bytes', os.path.getsize(OUT))
