# Builds art/downstairs_bible.html: the whole game on one page. Story, intro script, quests, every floor's theme and map,
# and every character with their picture, description, stats and lines.
#   python tools/build_bible.py <folder of character pictures>
import base64
import html
import io
import json
import os
import re
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md_lite import md  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
THUMBS = sys.argv[1]
OUT = os.path.join(ROOT, "art", "downstairs_bible.html")


def read(*p):
    return open(os.path.join(ROOT, *p), encoding="utf-8").read()


def img64(path, w, quality=72):
    if not os.path.exists(path):
        return ""
    im = Image.open(path).convert("RGB")
    im.thumbnail((w, w * 3))
    b = io.BytesIO()
    im.save(b, "JPEG", quality=quality)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def key(s):
    s = s.lower().replace("&", "and")
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^a-z ]", "", s)
    return " ".join(w for w in s.split() if w not in ("the", "townsperson", "cultist"))


E = html.escape

# ---------------------------------------------------------------- sources
casting = read("art", "TRIPO_LIST.md").replace("\r\n", "\n")
scripts = read("prototype", "voice", "SCRIPTS.md").replace("\r\n", "\n")
story = read("prototype", "game", "story.js")
monsters = json.loads(read("godot", "data", "monsters.json"))["monsters"]
floors = json.loads(read("godot", "data", "floors.json"))
floors.update(json.loads(read("godot", "data", "floors_undercity.json")))

# characters from the casting list
cast, section, cur = [], "", None
for line in casting.split("\n"):
    if line.startswith("## "):
        section = line[3:]
    elif line.startswith("### "):
        cur = {"name": line[4:].replace(" (NEW)", ""), "new": "(NEW)" in line, "section": section}
        cast.append(cur)
    elif cur and line.startswith("Floor ") and "meta" not in cur:
        cur["meta"] = line
        m = re.search(r"folder `([^`]+)`", line)
        cur["folder"] = m.group(1) if m else ""
    elif cur and "meta" in cur and "desc" not in cur and line and not line.startswith("```"):
        d = re.sub(r"^Full-body 3D game character,.*?cel-shaded colours\. ", "", line)
        d = re.sub(r" (Standing in a T-pose|One single character).*$", "", d)
        cur["desc"] = d
folder_fix = {"lost_found": "the_lost_found", "lost_and_found": "the_lost_found"}

# lines from the voice scripts, by character
lines_by, head = {}, None
part = scripts.split("## Opening cutscene")
for line in part[0].split("\n"):
    m = re.match(r"### (.+?)\s+\(`", line) or re.match(r"### (\w+)$", line)
    if m:
        head = m.group(1)
        lines_by[head] = []
    elif head and line.startswith("- `"):
        lines_by[head].append(re.sub(r"^- `[^`]+` — ", "", line))
intro = part[1] if len(part) > 1 else ""

# quests
quests = []
for m in re.finditer(r"(\w+): \{ name: '([^']+)', giver: '(\w+)'(.*?)desc: '((?:[^'\\]|\\.)*)'", story):
    quests.append({"id": m.group(1), "name": m.group(2), "giver": m.group(3), "main": "main: true" in m.group(4), "arc": "arc: true" in m.group(4), "desc": m.group(5).replace("\\'", "'")})

THEMES = {
    "0": ("The Landing", "The Network's Orientation Centre, a shabby TV-studio lobby. Where every contestant arrives, signs the forms, meets Intern Pip and practises on cardboard goblins before the stairs."),
    "1": ("The Undercroft", "A dark multi-storey car park the size of a town. Lit in pockets, with something in every unlit one. Goblins in traffic cones, lampreys in the flooded bays, moths in the lightwells."),
    "2": ("The Laundromat", "The laundromat that never closes. Machine canyons, drying yards with shapes behind the sheets, the Pressing Plant, bleach pools. Clean, wet, and full of hands."),
    "3": ("The Soup District", "A fogbound city that's been cooking a long time. Tenements, Butcher's Row, the banquet nobody leaves, the broth canal. It smells wonderful. Don't ask what's in it."),
    "4": ("The Endless Mall", "Bright, cheerful, spotless and endless, with the music on. The dummies move when you aren't looking, the fountain is full of teeth, and every vein in the floor leads to the heart."),
    "5": ("Suburbia Infinite", "Blue painted sky, perfect lawns and the same family waving from every yard. The further out you go, the more of the houses have gone wrong. The gnomes are always facing you."),
    "6": ("The Canopy", "Black forest under a roof you can't see, lit only by what grows. The Glimmerkin run safaris here and you are the game. Trophy walks, net traps and flytraps the size of you."),
    "7": ("The Drowned Cistern", "The first floor of the Undercity. Flooded pillar halls, sunken tenements still collecting rent, a giant bath, a field of hands, and a chain ferry nobody admits to running. (Designed for the Godot port.)"),
    "8": ("The Workings", "A mine dug out so far it's a country. The moles dig, the fryers fry, the Collectors take what's owed, and something soft at the north end tells everyone they've done enough. (Designed for the Godot port.)"),
    "9": ("The Undercity", "The rat capital. Grand civic buildings going green, an election that never ends, the Rat Senate, the Vault and City Hall. The city loves its candidates. (Designed for the Godot port.)"),
}
UNDERCITY = {"wyrm": "Sewer Wyrm", "collector": "Clockwork Debt Collector", "molekin": "Tunnel Mole-Kin", "grease": "Grease Golem", "choir": "Fungal Choir", "ratking": "Ratking Choir", "bathwater": "Old Lady Bathwater", "landlord": "The Landlord", "organ": "Pipe Organ Wyrm", "sanking": "The Sanitation King", "repo": "Repossessor Mk. IX", "grubtooth": "Chief Grubtooth", "drill": "Drill Prophet", "baron": "The Fryer Baron", "mold": "Big Momma Mold", "soloist": "The Soloist", "senate": "The Rat Senate", "lockjaw": "Lockjaw", "ratthrone": "The Rat Throne King", "undermayor": "The Undermayor"}


def mname(k):
    return monsters.get(k, {}).get("name") or UNDERCITY.get(k, k)


# ---------------------------------------------------------------- page
css = """
:root{--bg:#f3ecdc;--ink:#16121a;--card:#fffaf0;--muted:#6a6070;--red:#a81e1e;--gold:#c9961a;--line:#d8ccb4}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#15121a;--ink:#efe6d0;--card:#211c26;--muted:#a89cb0;--red:#ff7a6a;--gold:#f5c518;--line:#3a3242}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,Segoe UI,sans-serif}
header{background:#16121a;color:#f5c518;padding:28px 16px;text-align:center}header h1{margin:0;font:900 44px Impact,Arial Black,sans-serif;letter-spacing:1px}header p{margin:6px 0 0;color:#efe6d0}
nav{position:sticky;top:0;z-index:5;background:var(--card);border-bottom:2px solid var(--line);display:flex;gap:6px;overflow-x:auto;padding:8px 12px}
nav a{white-space:nowrap;color:var(--ink);text-decoration:none;font-weight:700;padding:4px 10px;border-radius:14px;background:var(--bg)}
main{max-width:1180px;margin:0 auto;padding:0 16px 60px}h2{font:900 30px Impact,Arial Black,sans-serif;border-bottom:4px solid var(--ink);padding-top:30px}
h3{margin:22px 0 6px}.muted{color:var(--muted)}.tag{display:inline-block;font-size:12px;font-weight:700;padding:1px 8px;border-radius:10px;background:var(--line);margin-right:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.card{background:var(--card);border:2px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;aspect-ratio:1;object-fit:cover;background:#2a2630}.card .b{padding:10px 12px}.card h4{margin:0 0 4px;font-size:18px}
.card .stats{font-size:13px;color:var(--muted)}.card ul{margin:6px 0 0;padding-left:18px;font-size:13px}.card .noimg{aspect-ratio:1;display:grid;place-items:center;color:var(--muted);background:var(--line)}
.floor{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:14px;margin:14px 0}.floor img{width:100%;border-radius:8px;margin-top:10px}
details summary{cursor:pointer;font-weight:700}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid var(--line);padding:5px 6px;text-align:left;vertical-align:top}
.story h2{font-size:24px;border-bottom:2px solid var(--line)}.story blockquote{border-left:4px solid var(--gold);margin:8px 0;padding:6px 12px;background:var(--card)}.story table{margin:8px 0}.script{white-space:pre-wrap;background:var(--card);border:2px solid var(--line);border-radius:12px;padding:14px;font-size:14px}
"""
out = [f"<!doctype html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Downstairs Bible</title><style>{css}</style></head><body>"]
out.append("<header><h1>DOWNSTAIRS</h1><p>The game on one page: story, floors, and the whole cast</p></header>")
out.append("<nav><a href=#story>Storyline</a><a href=#world>Gods, factions &amp; clubs</a><a href=#intro>Intro script</a><a href=#quests>Quests</a><a href=#floors>Floors</a><a href=#cast>Cast</a><a href=#people>People</a><a href=#shops>Shopkeepers</a><a href=#races>Races</a><a href=#monsters>Monsters</a><a href=#bosses>Bosses</a><a href=#townlines>Townsfolk lines</a><a href=#next>Still to design</a></nav><main>")

out.append("<h2 id=story>The storyline</h2><div class=story>" + md(read("art", "STORY.md").split(chr(10), 2)[2]) + "</div>")
out.append("<h2 id=world>The world: gods, factions, contestants, clubs, Floors 10-18</h2><div class=story>" + md(read("art", "WORLD.md").split(chr(10), 2)[2]) + "</div>")
out.append("<h2 id=intro>Opening cutscene script</h2><div class=script>" + E(intro.strip()) + "</div>")

out.append("<h2 id=quests>Quests</h2><table><tr><th>Quest</th><th>Given by</th><th>Type</th><th>What happens</th></tr>")
for q in quests:
    kind = "Main" if q["main"] else ("Story arc" if q["arc"] else "Side")
    out.append(f"<tr><td><b>{E(q['name'])}</b></td><td>{E(q['giver'])}</td><td>{kind}</td><td>{E(q['desc'])}</td></tr>")
out.append("</table>")

out.append("<h2 id=floors>The floors</h2>")
for n in [str(i) for i in range(0, 10)]:
    title, blurb = THEMES[n]
    out.append(f"<div class=floor><h3>Floor {n} · {E(title)}</h3><p>{E(blurb)}</p>")
    f = floors.get(n)
    if f:
        out.append(f"<p><b>Town:</b> {E(f.get('hub_name',''))}. <b>Innkeeper:</b> {E(f.get('innkeeper',''))}. <b>Townsfolk:</b> {E(', '.join(f.get('townsfolk',{}).get('races',[])))}.</p>")
        shops = ", ".join(f"{m['name']} ({m['title']})" for m in f.get("merchants", []))
        out.append(f"<p><b>Shops:</b> {E(shops)}</p>")
        vills = "; ".join(f"{v['name']} ({', '.join(m['name'] for m in v.get('merchants', []))})" for v in f.get("villages", []))
        out.append(f"<p><b>Villages:</b> {E(vills)}</p>")
        out.append("<table><tr><th>Monster camp</th><th>Level</th><th>Boss</th><th>Monsters</th></tr>")
        for c in f.get("camps", []):
            mobs = c.get("mob", [])
            mobs = mobs if isinstance(mobs, list) else [mobs]
            out.append(f"<tr><td>{E(c['name'])}</td><td>{E(str(c.get('level','')))}</td><td>{E(mname(str(c.get('boss',''))))}</td><td>{E(', '.join(dict.fromkeys(mname(m) for m in mobs)))}</td></tr>")
        out.append("</table>")
        lm = ", ".join(l["name"] for l in f.get("landmarks", []))
        if lm:
            out.append(f"<p><b>Landmarks:</b> {E(lm)}</p>")
        st = f.get("stairs", {})
        if st.get("how"):
            out.append(f"<p><b>The way down:</b> {E(st['how'])}</p>")
        mp = img64(os.path.join(ROOT, "art", "maps", f"floor_{n}_map.png"), 1100, 70)
        if mp:
            out.append(f"<details><summary>Map of Floor {n}</summary><img src='{mp}' alt='Map of Floor {n}'></details>")
    out.append("</div>")

# ---------------------------------------------------------------- the cast
groups = [("people", "People you meet", lambda c: c["section"].startswith("People") or c["section"].startswith("NPCs")),
          ("shops", "Shopkeepers, innkeepers and guild masters", lambda c: c["section"].startswith("Shopkeepers")),
          ("races", "Townsfolk races", lambda c: c["section"].startswith("Townsfolk")),
          ("monsters", "Monsters", lambda c: "monsters" in c["section"].lower()),
          ("bosses", "Bosses", lambda c: "bosses" in c["section"].lower())]
by_name = {key(m.get("name", k)): m for k, m in monsters.items()}
script_keys = {key(k): v for k, v in lines_by.items()}
out.append("<h2 id=cast>The cast</h2><p class=muted>Pictures are the new Tripo models. Floors 10 to 18 are listed in the casting sheet but not built yet, so they're left out here.</p>")
for anchor, title, test in groups:
    out.append(f"<h3 id={anchor} style='font-size:24px'>{title}</h3><div class=grid>")
    for c in cast:
        if not test(c) or not c.get("folder"):
            continue
        floor = re.match(r"Floor ([\d\-a-z]+)", c.get("meta", ""))
        floor = floor.group(1) if floor else ""
        if floor and floor[0].isdigit() and int(re.split(r"[-]", floor)[0]) >= 10:
            continue
        folder = folder_fix.get(c["folder"], c["folder"])
        pic = img64(os.path.join(THUMBS, folder + ".png"), 360)
        k = key(c["name"])
        mon = by_name.get(k) or next((m for kk, m in by_name.items() if kk and (kk in k or k in kk)), None)
        said = script_keys.get(k) or next((v for kk, v in script_keys.items() if kk and len(kk) > 3 and (kk in k or k in kk)), [])
        tags = f"<span class=tag>Floor {E(floor)}</span>" + ("<span class=tag>New</span>" if c["new"] else "") + ("<span class=tag>Rigged</span>" if "Humanoid" in c.get("meta", "") else "")
        out.append("<div class=card>" + (f"<img src='{pic}' alt='{E(c['name'])}'>" if pic else "<div class=noimg>no model yet</div>") + f"<div class=b><h4>{E(c['name'])}</h4>{tags}<p>{E(c.get('desc',''))}</p>")
        if mon:
            abil = ", ".join(mon.get("abilities", []))
            out.append(f"<div class=stats>{E(mon.get('title',''))} HP {mon.get('hp','?')} · damage {mon.get('dmg','?')} · speed {mon.get('speed','?')}" + (f" · moves: {E(abil)}" if abil else "") + "</div>")
            said = said or mon.get("barks", [])
        if said:
            out.append("<details><summary>Lines</summary><ul>" + "".join(f"<li>{E(s)}</li>" for s in said) + "</ul></details>")
        out.append("</div></div>")
    out.append("</div>")

out.append("<h2 id=townlines>Townsfolk lines</h2><div class=grid>")
for role in ("guard", "cook", "trader", "gossip", "healer", "quest", "kid", "worker"):
    if role in lines_by:
        out.append(f"<div class=card><div class=b><h4>{role.title()}</h4><ul>" + "".join(f"<li>{E(s)}</li>" for s in lines_by[role]) + "</ul></div></div>")
out.append("</div>")

out.append("""<h2 id=next>Still to design</h2><ul>
<li>The full story from start to finish, and the ending nobody has reached.</li>
<li>A longer intro: a big cutscene of how you end up in the dungeon, with a playable part where you wake up, see the chaos and make your way down confused.</li>
<li>A fuller Floor 0 tutorial: attacks, the skill tree, crafting and tracking materials.</li>
<li>Fans and fan boxes: how you win viewers and what they send you.</li>
<li>Avatar customisation at the start, and again on Floor 3 when you pick a race.</li>
<li>Other contestants in the dungeon, and partying up with them.</li>
<li>Monster lore that unlocks as you fight, showing strengths and weaknesses that feed crafting.</li>
<li>Monster variation within each type, spawn rules, and how monsters look and move in a fight.</li>
<li>Transmog for equipment (its own table), and a safe room you can customise.</li>
<li>Cutscenes, voice-over (ElevenLabs), and the timed events on each map.</li>
</ul></main></body></html>""")
open(OUT, "w", encoding="utf-8").write("".join(out))
print("WROTE", OUT, round(os.path.getsize(OUT) / 1e6, 1), "MB", len(quests), "quests")
