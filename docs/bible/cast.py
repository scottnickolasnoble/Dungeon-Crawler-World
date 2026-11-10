# Builds the "cast to make" lists for the bible: every character, whether it's an NPC or a monster, where it lives,
# what state its model is in, and which Mixamo clips it needs.
import json, glob, os, re, struct
R = 'F:/Downstairs/Dungeon-Crawler-World-claude-device-sync-offline-start-tlcj0x/Dungeon-Crawler-World-claude-device-sync-offline-start-tlcj0x/'
D = R + 'godot/data/'
J = lambda f: json.load(open(D + f, encoding='utf8'))
slug = lambda s: re.sub(r'[^a-z0-9]+', '_', str(s).lower()).strip('_')


def clips(p):
    b = open(p, 'rb').read()
    l = struct.unpack('<I', b[12:16])[0]
    return [a.get('name') for a in json.loads(b[20:20 + l]).get('animations', [])]


queue = {}
for f in ['art/tripo_queue.json', 'art/tripo_queue_3.json']:
    for q in json.load(open(R + f, encoding='utf8')):
        queue.setdefault(q['folder'], {'humanoid': q.get('humanoid', True), 'name': q.get('name')})

src = open(R + 'godot/scripts/floors/floor_world.gd', encoding='utf8').read()
redesigned = json.loads(re.search(r'const REDESIGNED := (\{.*?\})\n', src).group(1))
model_to_kind = {v: k for k, v in redesigned.items()}
mons = J('monsters.json')['monsters']
mons.update(J('monsters_world.json')['monsters'])

floors = {}
for f in ['floors.json', 'floors_undercity.json', 'floors_deep.json']:
    d = J(f)
    floors.update(d.get('floors', d))
kind_floor, npc_role, chamber_bosses = {}, {}, set()
for n, fl in floors.items():
    for c in fl.get('camps', []):
        m = c.get('mob', c.get('mobs', []))
        for k in [c.get('boss')] + (m if isinstance(m, list) else [m]):
            if k:
                kind_floor.setdefault(str(k), int(n))
    for k in fl.get('roamers', []):
        kind_floor.setdefault(k, int(n))
    for m in fl.get('merchants', []):
        for key in [m.get('named'), m.get('name')]:
            if key:
                npc_role.setdefault(slug(key), (int(n), m.get('title', 'Merchant')))
    if fl.get('innkeeper'):
        npc_role.setdefault(slug(fl['innkeeper']), (int(n), 'Innkeeper'))
    for q in fl.get('quest_npcs', []):
        for key in [q.get('named'), q.get('name')]:
            if key:
                npc_role.setdefault(slug(key), (int(n), q.get('title', 'Quest giver')))
for n, lst in J('chambers.json')['floors'].items():
    for c in lst:
        kind_floor.setdefault(c['boss'], int(n))
        chamber_bosses.add(c['boss'])

remake = {'captain_kevlar', 'the_cone_king', 'traffic_cone_goblin'}
mixamo_done = {'intern_pip'}
for p in glob.glob(R + 'godot/models/characters/rigged/*.glb'):
    c = clips(p)
    if 'hit' not in c or 'talk2' in c:  # the old auto-rigs all carry the same seven clips; Mixamo-made ones don't
        mixamo_done.add(os.path.basename(p)[:-4])

SPECIAL = {
    'slam': ('Ground slam', 'Ground slam: search "Jump Attack" or "Mutant Jump Attack"'),
    'leap': ('Jump attack', 'Jump attack: search "Run Jump Attack" or "Jump Attack"'),
    'nova': ('Burst', 'Power burst all round: search "Power Up" or "Spell Casting"'),
    'sweep': ('360 sweep', '360 attack: search "Melee Attack 360"'),
    'spin': ('360 spin', '360 attack: search "Melee Attack 360"'),
    'charge': ('Charge', 'Charge: search "Mutant Run" or "Running"'),
    'barrage': ('Barrage', 'Throw: search "Throw" (thrown several times)'),
    'keys': ('Thrown keys', 'Throw: search "Throw"'),
    'puddle': ('Puddle', 'Throw or spit: search "Throw"'),
    'summon': ('Calls for help', 'Shout to rally others: search "Shout", "Battlecry" or "Roar"'),
    'whistle': ('Whistles for backup', 'Shout or whistle: search "Shout" or "Battlecry"'),
    'clockin': ('Clocks in the crew', 'Shout to rally others: search "Shout" or "Battlecry"'),
    'powerup': ('Power-up', 'Power-up: search "Power Up"'),
}
FLOOR_NAME = {int(k): v.get('name', '') for k, v in floors.items()}


def status(folder):
    if folder in mixamo_done:
        return 'done'
    if folder in remake:
        return 'remake'
    if not os.path.exists(R + 'godot/models/characters/%s.glb' % folder):
        return 'not made'
    return 'ready'


npcs, monsters = [], []
names = set(queue) | {os.path.basename(p)[:-4] for p in glob.glob(R + 'godot/models/characters/*.glb')}
for folder in sorted(names):
    if folder.endswith('_local') or folder.endswith('_townsperson'):
        continue
    q = queue.get(folder, {'humanoid': True, 'name': None})
    kind = model_to_kind.get(folder) or (folder if folder in mons or folder in kind_floor else None)
    d = mons.get(kind, {}) if kind else {}
    pretty = q['name'] or d.get('name') or folder.replace('_', ' ').title()
    st = status(folder)
    if kind:
        moves = [SPECIAL[a] for a in d.get('abilities', []) if a in SPECIAL]
        need = ['Idle', 'Walk' if float(d.get('speed', 3.0)) < 3.5 else 'Run', 'Attack', 'Death', 'Hit reaction (optional)']
        if d.get('ranged'):
            need[2] = 'Throw (its attack is ranged)'
        if d.get('combo'):
            need[2] = 'Combo attack'
        extra = [m[1] for m in moves]
        tags = [m[0] for m in moves]
        if d.get('ranged'):
            tags.append('Ranged')
        if d.get('taunt'):
            extra.append('Taunt when it spots you: search "Roar" or "Taunt"')
            tags.append('Taunt')
        fl = kind_floor.get(kind)
        monsters.append({'id': folder, 'name': pretty, 'boss': bool(d.get('boss')) or kind in chamber_bosses,
                         'floor': fl, 'floorName': FLOOR_NAME.get(fl, ''), 'humanoid': q['humanoid'], 'status': st,
                         'moves': tags, 'need': need, 'extra': extra, 'title': d.get('title', '')})
    else:
        role = npc_role.get(folder) or npc_role.get(slug(pretty))
        npcs.append({'id': folder, 'name': pretty, 'floor': role[0] if role else None, 'role': role[1] if role else '',
                     'floorName': FLOOR_NAME.get(role[0], '') if role else '', 'humanoid': q['humanoid'], 'status': st})
order = {'remake': 0, 'ready': 1, 'not made': 2, 'done': 3}
key = lambda c: (c['floor'] if c['floor'] is not None else 99, order[c['status']], c['name'])
npcs.sort(key=key)
monsters.sort(key=key)
CAST = {'npcs': npcs, 'monsters': monsters}

if __name__ == '__main__':
    from collections import Counter
    print('npcs', len(npcs), Counter(c['status'] for c in npcs), 'with role', sum(1 for c in npcs if c['role']))
    print('monsters', len(monsters), Counter(c['status'] for c in monsters), 'creatures', sum(not c['humanoid'] for c in monsters))
    for c in npcs[:4] + monsters[:4]:
        print(c)
