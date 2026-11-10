# Draws a map sheet for each floor: town, villages, camps and their bosses, landmarks, districts, rides, the cave and loot room.
#   1. Godot_console.exe --headless --path godot -- --map=F:/Downstairs/mapdata     (writes floor_<n>.json)
#   2. python tools/draw_floor_maps.py F:/Downstairs/mapdata art/maps
import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FONTS = "C:/Windows/Fonts/"
def font(name, size):
    for candidate in (name, "arialbd.ttf"):
        try:
            return ImageFont.truetype(FONTS + candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()

TITLE, HEAD, LABEL, SMALL = font("impact.ttf", 64), font("impact.ttf", 34), font("arialbd.ttf", 21), font("arial.ttf", 18)
INK = (16, 14, 20)
PAPER = (240, 232, 214)
THEME = {1: (74, 70, 64), 2: (110, 160, 156), 3: (110, 80, 60), 4: (196, 190, 196), 5: (120, 170, 90), 6: (40, 66, 44), 7: (40, 78, 76), 8: (92, 62, 40), 9: (70, 60, 92), 10: (60, 52, 66), 11: (40, 70, 60), 12: (80, 46, 64), 13: (90, 70, 44), 14: (40, 44, 52), 15: (60, 84, 104), 16: (40, 40, 64), 17: (110, 170, 90), 18: (200, 200, 196)}
TAGLINE = {
    1: "A dark car park the size of a town. Lit in pockets. Something in every unlit one.",
    2: "The laundromat that never closes. Machine canyons, drying yards, the Pressing Plant.",
    3: "A fogbound city that's been cooking for a long time. It smells wonderful.",
    4: "Bright, cheerful, spotless, endless. The dummies move when you aren't looking.",
    5: "Blue painted sky, perfect lawns. The same family waves from every yard.",
    6: "Black forest under a roof you can't see. The Glimmerkin run safaris. You're the game.",
    7: "Flooded pillar halls. Sunken tenements still collecting rent. A ferry nobody drives.",
    8: "A mine dug out so far it's a country. Moles, fryers, the Collectors, and the Nursery.",
    9: "The rat capital. An election that never ends, and a city that loves its candidates.",
    10: "A studio lot that goes on forever. Towns that are only fronts. You are on camera now.",
    11: "A stadium city. Every fight is a fixture, every crowd is a mob.",
    12: "Backstage forever. Dressing rooms stacked round atriums. Everyone waiting to go on.",
    13: "A library the size of a country. Shelf canyons four levels deep. Do not speak.",
    14: "Castle Dread: the Archive kept a whole horror season. The cast never left.",
    15: "The Builders' machine memory. Server fields, cooling towers, frost, blue light.",
    16: "A forest of broadcast masts. The signal you can see. Somewhere, the off switch.",
    17: "A perfect fifties suburb built from one man's memories. Nothing blinks.",
    18: "The floor that does not exist. Concrete, silence, every god's empty plinth.",
}
# district names for the camera spots, and the spots that are underground or just for testing
NAMES = {
    1: {"red": "Red Level", "blue": "Blue Level", "shrine": "Cone Shrine", "collapse": "The Collapse", "flood": "Flooded Bay Road", "ruin": "Ruined Offices", "zip": "Service Line", "world": "Open Deck"},
    2: {"hall": "Wash Hall 9", "sheets": "Drying Yard", "press": "The Pressing Plant", "bleach": "Bleach Pools", "drains": "The Drains", "fold": "Folding Hall", "ebb": "Ebb's Boiler Yard", "bags": "Conveyor", "shoes": "Shoe Pile"},
    3: {"streets": "Tenement Quarter", "tenement": "Tenements", "butcher": "Butcher's Row", "cuts": "Cuts & Offal", "banquet": "The Banquet", "canal": "Broth Canal", "toll": "Toll Road", "jars": "Pickle Market", "bones": "Bone Yard", "graves": "Tallow Graveyard", "city": "City Blocks"},
    4: {"heart": "The Heart", "dummies": "Hall of Dummies", "grotto": "Santa's Grotto", "rides": "Kiddie Rides", "depths": "Food Court Depths", "well": "Wishing Well", "escalators": "Escalator Canyon"},
    5: {"tower": "Water Tower", "gnomes": "Gnome Field", "party": "Block Party", "pools": "Pool Row", "open": "The Open House", "sprinklers": "Sprinkler Field", "street": "Elm Street", "street_far": "The Far Streets"},
    6: {"trophies": "Trophy Walk", "safari": "Safari Camp", "hollow": "Hag Hollow", "traps": "Flytrap Garden", "cathedral": "Root Cathedral", "totems": "Totem Circle", "marsh": "Pitcher Marsh", "forest": "Deep Forest"},
    7: {"tenements": "Tenement Row", "tenements_b": "Tenement Row East", "baths": "Public Baths", "organ": "The Organ Loft", "landfill": "Landfill", "ned": "Old Ned (wyrm bones)", "shallows": "The Shallows", "culvert": "Brick Culvert", "hall": "Pillar Halls"},
    8: {"chapel": "Drill Chapel", "fryers": "The Fryers", "repo": "Repo Yard", "nursery": "The Nursery", "stacks": "Furnace Stacks", "gallery": "Timbered Galleries", "rock": "Rock Pillars"},
    9: {"senate": "The Rat Senate", "vault": "Vault Street", "opera": "The Opera House", "throne": "The Rat Throne", "hall": "City Hall Steps", "cathedral": "Spore Cathedral", "metro": "Metro Station"},
}
SKIP = {"cave", "loot", "drain", "station", "galleries", "roots", "figure", "hanged", "carclose", "pressin", "garden", "garden_far", "dark"}

S, M = 1700, 50
for n in range(1, 19):
    path = os.path.join(SRC, f"floor_{n}.json")
    if not os.path.exists(path):
        continue
    f = json.load(open(path, encoding="utf-8"))
    size = f["size"]
    def to_px(x, z):
        return (M + (x + size / 2) / size * S, 170 + M + (z + size / 2) / size * S)
    camps = f["camps"]
    places = [p for p in f["places"] if p["name"] not in SKIP and p["name"] in NAMES.get(n, {})]
    rows = len(camps) + len(places) + len(f["landmarks"]) + 12
    sheet = Image.new("RGB", (S + 2 * M, 170 + S + 2 * M + 40 + rows * 30 + 80), PAPER)
    g = ImageDraw.Draw(sheet)
    g.rectangle((0, 0, sheet.width, 150), fill=INK)
    g.text((M, 24), f["name"], font=TITLE, fill=(245, 197, 24))
    g.text((M, 102), TAGLINE.get(n, ""), font=LABEL, fill=PAPER)
    g.text((sheet.width - M, 40), f"{int(size)} m across", font=HEAD, fill=PAPER, anchor="ra")
    # the ground, and a grid every 100 m
    base = THEME[n]
    x0, y0 = to_px(-size / 2, -size / 2)
    x1, y1 = to_px(size / 2, size / 2)
    g.rectangle((x0, y0, x1, y1), fill=base, outline=INK, width=6)
    line = tuple(min(255, c + 22) for c in base)
    step = 100
    v = -int(size / 2 / step) * step
    while v <= size / 2:
        a, _ = to_px(v, 0)
        _, b = to_px(0, v)
        g.line((a, y0, a, y1), fill=line, width=1)
        g.line((x0, b, x1, b), fill=line, width=1)
        v += step
    g.text((x1 - 10, y1 - 10), "N ↑   grid: 100 m", font=SMALL, fill=PAPER, anchor="rd")
    # rides
    for r in f["rides"]:
        a, b = to_px(r["x1"], r["z1"]), to_px(r["x2"], r["z2"])
        g.line((a, b), fill=INK, width=9)
        g.line((a, b), fill=(245, 197, 24), width=4)
        for p in (a, b):
            g.ellipse((p[0] - 9, p[1] - 9, p[0] + 9, p[1] + 9), fill=(245, 197, 24), outline=INK, width=3)
    # walk-in buildings out in the wilds
    hub_rect = (-f["hub_w"] / 2 - 20, -f["hub_d"] / 2 - 20, f["hub_w"] / 2 + 20, f["hub_d"] / 2 + 20)
    for bld in f["buildings"]:
        if hub_rect[0] < bld["x"] < hub_rect[2] and hub_rect[1] < bld["z"] < hub_rect[3]:
            continue
        if any(abs(bld["x"] - v["x"]) < 40 and abs(bld["z"] - v["z"]) < 34 for v in f["villages"]):
            continue
        p = to_px(bld["x"], bld["z"])
        g.rectangle((p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4), fill=(232, 210, 160), outline=INK)
    # the town and villages
    a, b = to_px(-f["hub_w"] / 2, -f["hub_d"] / 2)
    c, d = to_px(f["hub_w"] / 2, f["hub_d"] / 2)
    g.rectangle((a, b, c, d), fill=(232, 210, 160), outline=INK, width=5)
    g.text(((a + c) / 2, (b + d) / 2), f["hub"].upper(), font=LABEL, fill=INK, anchor="mm")
    g.text(((a + c) / 2, (b + d) / 2 + 24), "TOWN · shops · inn · safe room", font=SMALL, fill=INK, anchor="mm")
    for v in f["villages"]:
        a, b = to_px(v["x"] - 32, v["z"] - 26)
        c, d = to_px(v["x"] + 32, v["z"] + 26)
        g.rectangle((a, b, c, d), fill=(218, 196, 150), outline=INK, width=4)
        g.text(((a + c) / 2, d + 6), v["name"], font=SMALL, fill=PAPER, anchor="ma", stroke_width=3, stroke_fill=INK)
    # districts, numbered
    key = []
    for i, p in enumerate(places):
        q = to_px(p["x"], p["z"])
        num = str(i + 1)
        g.ellipse((q[0] - 17, q[1] - 17, q[0] + 17, q[1] + 17), fill=PAPER, outline=INK, width=4)
        g.text(q, num, font=LABEL, fill=INK, anchor="mm")
        g.text((q[0] + 22, q[1]), NAMES[n][p["name"]], font=SMALL, fill=PAPER, anchor="lm", stroke_width=3, stroke_fill=INK)
        key.append((num, NAMES[n][p["name"]]))
    # landmarks
    for l in f["landmarks"]:
        q = to_px(l["x"], l["z"])
        pts = [(q[0] + math.cos(-math.pi / 2 + k * math.pi / 5) * (22 if k % 2 == 0 else 9), q[1] + math.sin(-math.pi / 2 + k * math.pi / 5) * (22 if k % 2 == 0 else 9)) for k in range(10)]
        g.polygon(pts, fill=(245, 197, 24), outline=INK, width=3)
        g.text((q[0] + 26, q[1]), l["name"], font=LABEL, fill=(245, 197, 24), anchor="lm", stroke_width=3, stroke_fill=INK)
    # outposts on the way to the camps, and places worth finding
    points = f.get("points", [])
    POI = {"chamber": ((255, 60, 60), "B"), "lesser_chamber": ((255, 140, 110), "b"), "crew": ((120, 220, 255), "C"), "secret": ((200, 140, 255), "?"), "clue": ((170, 120, 220), "c"), "grand": ((255, 240, 120), "G"), "tower": ((220, 220, 255), "T"), "summit": ((140, 255, 160), "^"), "sight": ((255, 90, 70), "!"), "hideout": ((232, 210, 160), "H"), "lookout": ((255, 224, 138), "L"), "shrine": ((255, 184, 96), "S"), "wreck": ((200, 200, 200), "W"), "cache": ((245, 197, 24), "$"), "nest": ((200, 255, 138), "N")}
    for pt in points:
        q = to_px(pt["x"], pt["z"])
        if pt["kind"] == "outpost":
            g.ellipse((q[0] - 9, q[1] - 9, q[0] + 9, q[1] + 9), fill=(196, 60, 44), outline=INK, width=3)
            g.text((q[0] + 12, q[1]), f"lv {pt['level']}", font=SMALL, fill=(255, 150, 130), anchor="lm", stroke_width=2, stroke_fill=INK)
        else:
            colour, letter = POI.get(pt["kind"], ((255, 255, 255), "?"))
            g.rectangle((q[0] - 10, q[1] - 10, q[0] + 10, q[1] + 10), fill=colour, outline=INK, width=3)
            g.text(q, letter, font=SMALL, fill=INK, anchor="mm")
    # camps
    for i, c in enumerate(camps):
        q = to_px(c["x"], c["z"])
        r = max(c["r"] / size * S, 18)
        g.ellipse((q[0] - r, q[1] - r, q[0] + r, q[1] + r), fill=(150, 26, 20), outline=INK, width=5)
        g.text(q, "☠", font=font("seguisym.ttf", 30), fill=PAPER, anchor="mm")
        g.text((q[0], q[1] + r + 4), c["name"], font=LABEL, fill=(255, 120, 100), anchor="ma", stroke_width=3, stroke_fill=INK)
    # ways underground, the stairs and where you arrive
    for w in f["ways"]:
        q = to_px(w["x"], w["z"])
        if w["kind"] == "cave":
            g.polygon([(q[0] - 15, q[1] - 12), (q[0] + 15, q[1] - 12), (q[0], q[1] + 15)], fill=(120, 255, 210), outline=INK, width=3)
            g.text((q[0] + 20, q[1]), "CAVE", font=SMALL, fill=(120, 255, 210), anchor="lm", stroke_width=3, stroke_fill=INK)
        else:
            g.rectangle((q[0] - 12, q[1] - 9, q[0] + 12, q[1] + 9), fill=(245, 197, 24), outline=INK, width=3)
            g.line((q[0] - 12, q[1] - 2, q[0] + 12, q[1] - 2), fill=INK, width=2)
            g.text((q[0] + 18, q[1]), "LOOT ROOM", font=SMALL, fill=(245, 197, 24), anchor="lm", stroke_width=3, stroke_fill=INK)
    st = f["stairs"]
    q = to_px(st["x"], st["z"])
    g.rectangle((q[0] - 15, q[1] - 15, q[0] + 15, q[1] + 15), fill=(90, 255, 122), outline=INK, width=4)
    g.text((q[0] + 20, q[1] - 14), f"STAIRS ↓ FLOOR {st['to']}", font=LABEL, fill=(90, 255, 122), anchor="lm", stroke_width=3, stroke_fill=INK)
    q = to_px(*f["spawn"])
    g.ellipse((q[0] - 10, q[1] - 10, q[0] + 10, q[1] + 10), fill=(80, 160, 255), outline=INK, width=3)
    g.text((q[0] + 14, q[1] + 6), "YOU ARRIVE", font=SMALL, fill=INK, anchor="lm")
    # the key underneath
    y = y1 + 30
    g.text((M, y), "MONSTER CAMPS", font=HEAD, fill=(150, 26, 20))
    y += 44
    for c in camps:
        mobs = ", ".join(dict.fromkeys(c["mobs"]))
        g.text((M, y), f"■  {c['name']}  ·  level {c['level']}  ·  boss: {c['boss']}  ·  with {mobs}", font=LABEL, fill=INK)
        y += 30
    outposts = [pt for pt in points if pt["kind"] == "outpost"]
    if outposts:
        levels = [pt["level"] for pt in outposts]
        g.text((M, y), f"●  {len(outposts)} outposts (small red rings) on the way out, level {min(levels)} near town to {max(levels)} near the bosses: monsters, a loot box for clearing each one, and field notes on what lives there", font=LABEL, fill=INK)
        y += 30
        g.text((M, y), f"     That's {len(outposts) + len(camps)} camps against {1 + len(f['villages'])} safe areas (the town and its villages).", font=LABEL, fill=INK)
        y += 30
    others = [pt for pt in points if pt["kind"] != "outpost"]
    if others:
        tally = {}
        for pt in others:
            tally[pt["name"]] = tally.get(pt["name"], 0) + 1
        g.text((M, y), "Also out there:  " + "  ·  ".join(f"{v} {k}{'s' if v > 1 else ''}" if v > 1 else k for k, v in tally.items()), font=LABEL, fill=INK)
        y += 30
    y += 14
    g.text((M, y), "PLACES TO FIND", font=HEAD, fill=INK)
    y += 44
    col = 0
    for num, name in key:
        g.text((M + col * 560, y), f"{num}.  {name}", font=LABEL, fill=INK)
        col += 1
        if col == 3:
            col = 0
            y += 30
    y += 44
    rides = len(f["rides"])
    walk_ins = sum(1 for b in f["buildings"])
    g.text((M, y), f"Also: {rides} ride{'s' if rides != 1 else ''} (yellow lines, quest-locked later)  ·  {walk_ins} buildings you can walk into  ·  a cave and a hidden loot room", font=LABEL, fill=INK)
    y += 30
    g.text((M, y), f"Way down: {st.get('how') or 'take the stairs'}", font=LABEL, fill=INK)
    sheet = sheet.crop((0, 0, sheet.width, y + 50))
    sheet.save(os.path.join(OUT, f"floor_{n}_map.png"))
    print("drew floor", n)
