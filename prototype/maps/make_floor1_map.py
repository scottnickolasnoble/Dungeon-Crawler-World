# Generates an illustrated Floor 1 overview map (2 km x 2 km) as an HTML/SVG page.
import random, math
random.seed(7)
W = 780  # map px for 2000 m -> 0.39 px per metre
S = W / 2000
def P(x, y): return (x * S, y * S)
districts = [  # name, centre (m), radius, fill
  ("Valet Row", (420, 380), 330, "#3a3448"), ("Goblin Territory", (1150, 420), 380, "#4a3a2a"),
  ("The Drain Fields", (1650, 650), 320, "#2a3a44"), ("Boiler Block", (380, 1100), 340, "#3a2e2e"),
  ("The Lightless Lots", (1000, 1050), 300, "#1e1a26"), ("Break Room Annex", (1600, 1250), 330, "#3a3a2a"),
  ("Statue Park", (600, 1650), 330, "#2e3a2e"), ("The Ramp Spiral", (1150, 1650), 260, "#3a3040"),
  ("Flooded Level B", (1700, 1750), 280, "#22343a"),
]
def blob(cx, cy, r, n=14):
  pts = []
  for i in range(n):
    a = i / n * math.tau; rr = r * (0.78 + random.random() * 0.35)
    pts.append(P(cx + math.cos(a) * rr, cy + math.sin(a) * rr))
  return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
svg = [f'<svg viewBox="0 0 {W} {W}" width="{W}" height="{W}" xmlns="http://www.w3.org/2000/svg">',
       f'<rect width="{W}" height="{W}" fill="#14101a"/>']
for name, (cx, cy), r, fill in districts:
  svg.append(f'<polygon points="{blob(cx, cy, r)}" fill="{fill}" stroke="#0d0b12" stroke-width="3"/>')
# pillar grid hint
for gx in range(0, 2000, 40):
  for gy in range(0, 2000, 40):
    if random.random() < 0.55: x, y = P(gx, gy); svg.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="2" height="2" fill="#5a5060" opacity=".5"/>')
# roads: main ramps and aisles
roads = [[(0, 1000), (600, 980), (1000, 1000), (1400, 1020), (2000, 1000)], [(1000, 0), (980, 500), (1000, 1000), (1030, 1500), (1000, 2000)],
         [(150, 150), (500, 500), (1000, 1000)], [(1850, 150), (1500, 500), (1000, 1000)], [(200, 1800), (600, 1400), (1000, 1000)], [(1850, 1850), (1450, 1450), (1000, 1000)]]
for r in roads:
  d = "M" + " L".join(f"{P(*p)[0]:.1f},{P(*p)[1]:.1f}" for p in r)
  svg.append(f'<path d="{d}" stroke="#d8c070" stroke-width="5" fill="none" stroke-dasharray="10 6" opacity=".55"/>')
# water
for (x, y, r) in [(1650, 650, 110), (1700, 1750, 160), (420, 1140, 50), (1250, 980, 40), (700, 300, 35)]:
  cx, cy = P(x, y); svg.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{r*S*1.2:.1f}" ry="{r*S*0.8:.1f}" fill="#2a6a8a" stroke="#0d0b12" stroke-width="2" opacity=".85"/>')
icons = []
def icon(kind, x, y, label, col):
  cx, cy = P(x, y)
  if kind == "hub": g = f'<rect x="{cx-11}" y="{cy-11}" width="22" height="22" fill="{col}" stroke="#0d0b12" stroke-width="3"/><rect x="{cx-4}" y="{cy-4}" width="8" height="8" fill="#0d0b12"/>'
  elif kind == "town": g = f'<rect x="{cx-8}" y="{cy-8}" width="16" height="16" fill="{col}" stroke="#0d0b12" stroke-width="3"/>'
  elif kind == "camp": g = f'<polygon points="{cx},{cy-11} {cx+10},{cy+8} {cx-10},{cy+8}" fill="{col}" stroke="#0d0b12" stroke-width="3"/>'
  elif kind == "boss": g = f'<circle cx="{cx}" cy="{cy}" r="11" fill="{col}" stroke="#0d0b12" stroke-width="3"/><text x="{cx}" y="{cy+5}" font-size="13" text-anchor="middle" fill="#0d0b12" font-family="Bangers">!</text>'
  elif kind == "landmark": g = f'<polygon points="{cx},{cy-13} {cx+4},{cy-4} {cx+13},{cy-4} {cx+6},{cy+3} {cx+9},{cy+12} {cx},{cy+6} {cx-9},{cy+12} {cx-6},{cy+3} {cx-13},{cy-4} {cx-4},{cy-4}" fill="{col}" stroke="#0d0b12" stroke-width="2.5"/>'
  else: g = f'<circle cx="{cx}" cy="{cy}" r="5" fill="{col}" stroke="#0d0b12" stroke-width="2"/>'
  icons.append(g)
  if label: icons.append(f'<text x="{cx}" y="{cy+26}" font-size="13" text-anchor="middle" fill="#F4EEDC" stroke="#0d0b12" stroke-width="3" paint-order="stroke" font-family="Barlow Condensed" font-weight="800">{label}</text>')
icon("hub", 1000, 1000, "STAIRWELL CAMP", "#F5C518")
for x, y, n in [(330, 300, "Valet Row"), (1780, 1130, "Level B Village"), (500, 1500, "Ticket Booth"), (1420, 230, "The Lift Shaft")]: icon("town", x, y, n, "#e8d8a0")
for x, y, n in [(1190, 760, "PYLON POINT"), (1720, 560, "The Drain Nest"), (300, 1180, "Boiler Room 0"), (820, 1210, "The Light Shrine"), (1640, 1330, "The Break Room"), (640, 1720, "Statue Park")]: icon("camp", x, y, n, "#ff7a3a")
icon("boss", 1180, 300, "Cone King's Throne Hall", "#E5484D"); icon("boss", 1120, 1820, "Arena: The Spiral Pit", "#E5484D")
for x, y, n in [(1150, 1650, "The Ramp Spiral"), (1350, 1180, "The Burning Bus"), (1000, 40, "THE EXIT SIGN")]: icon("landmark", x, y, n, "#7BE38A")
for _ in range(12): icon("loot", random.randint(120, 1880), random.randint(120, 1880), "", "#A06CF0")
for _ in range(9): icon("scav", random.randint(120, 1880), random.randint(120, 1880), "", "#9aa0aa")
svg += icons
# district names
for name, (cx, cy), r, fill in districts:
  x, y = P(cx - (120 if name == "Break Room Annex" else 0), cy - r * 0.62); svg.append(f'<text x="{x:.1f}" y="{y:.1f}" font-size="17" text-anchor="middle" fill="#c8b8e8" opacity=".85" font-family="Bangers" letter-spacing="2">{name.upper()}</text>')
# fog of war on the unexplored half, with the explored radius around the camp
svg.append('<defs><radialGradient id="fog" cx="0.5" cy="0.5" r="0.5"><stop offset="0.55" stop-color="#0d0b12" stop-opacity="0"/><stop offset="1" stop-color="#0d0b12" stop-opacity="0.82"/></radialGradient><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#2a2434" stroke-width="3"/></pattern></defs>')
svg.append(f'<rect width="{W}" height="{W}" fill="url(#fog)"/>')
svg.append(f'<path d="M0 0 H{W} V{W*0.32} Q{W*0.6} {W*0.25} {W*0.45} {W*0.38} Q{W*0.2} {W*0.45} 0 {W*0.36} Z" fill="url(#hatch)" opacity=".85"/>')
svg.append(f'<text x="{W*0.5}" y="{W*0.13}" font-size="26" text-anchor="middle" fill="#6a6080" font-family="Bangers" letter-spacing="4">UNEXPLORED</text>')
# scale bar + you-are-here
svg.append(f'<g transform="translate(24,{W-30})"><rect width="{500*S}" height="8" fill="#F4EEDC" stroke="#0d0b12" stroke-width="2"/><text x="0" y="-6" font-size="13" fill="#F4EEDC" font-family="Barlow Condensed" font-weight="800">0</text><text x="{500*S}" y="-6" font-size="13" fill="#F4EEDC" font-family="Barlow Condensed" font-weight="800" text-anchor="middle">500 m</text></g>')
cx, cy = P(1000, 1060); svg.append(f'<circle cx="{cx}" cy="{cy}" r="6" fill="#3FD0E0" stroke="#0d0b12" stroke-width="2"/><text x="{cx+10}" y="{cy+16}" font-size="12" fill="#3FD0E0" font-family="Barlow Condensed" font-weight="800">YOU</text>')
svg.append('</svg>')
legend = [("hub", "#F5C518", "Hub town (Stairwell Camp)"), ("town", "#e8d8a0", "Village / outpost (4)"), ("camp", "#ff7a3a", "Mob encampment + Neighbourhood boss (6)"), ("boss", "#E5484D", "Boss arena (Borough boss)"), ("landmark", "#7BE38A", "Landmark, visible from afar (3)"), ("loot", "#A06CF0", "Loot cache / secret room (12)"), ("scav", "#9aa0aa", "Scavenging site (9)")]
def lg(kind, col):
  if kind == "hub": return f'<svg width="26" height="26"><rect x="2" y="2" width="22" height="22" fill="{col}" stroke="#0d0b12" stroke-width="3"/></svg>'
  if kind == "town": return f'<svg width="26" height="26"><rect x="5" y="5" width="16" height="16" fill="{col}" stroke="#0d0b12" stroke-width="3"/></svg>'
  if kind == "camp": return f'<svg width="26" height="26"><polygon points="13,2 23,21 3,21" fill="{col}" stroke="#0d0b12" stroke-width="3"/></svg>'
  if kind == "boss": return f'<svg width="26" height="26"><circle cx="13" cy="13" r="10" fill="{col}" stroke="#0d0b12" stroke-width="3"/></svg>'
  if kind == "landmark": return f'<svg width="26" height="26"><polygon points="13,1 16,10 25,10 18,15 21,24 13,18 5,24 8,15 1,10 10,10" fill="{col}" stroke="#0d0b12" stroke-width="2"/></svg>'
  return f'<svg width="26" height="26"><circle cx="13" cy="13" r="6" fill="{col}" stroke="#0d0b12" stroke-width="2"/></svg>'
leg = "".join(f'<div class="li">{lg(k, c)}<span>{t}</span></div>' for k, c, t in legend)
html = f'''<!doctype html><html><head><meta charset="utf-8"><title>Floor 1 map</title>
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Barlow+Condensed:wght@500;700;800&display=swap" rel="stylesheet">
<style>body{{margin:0;background:#0d0b12;color:#F4EEDC;font-family:'Barlow Condensed',sans-serif;width:1440px;height:810px;display:flex;gap:28px;padding:15px 24px;box-sizing:border-box}}
.map{{border:5px solid #F5C518;box-shadow:8px 8px 0 #000}} h1{{font-family:Bangers;font-size:50px;letter-spacing:3px;color:#F5C518;margin:0}} h2{{font-family:Bangers;font-size:24px;letter-spacing:2px;margin:6px 0 14px;color:#c8b8e8}}
.li{{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;margin:7px 0}} .facts{{margin-top:18px;font-size:19px;line-height:1.45;color:#d9d2bf}} .facts b{{color:#F5C518}}</style></head>
<body><div class="map">{"".join(svg)}</div><div><h1>FLOOR 1 · THE UNDERCROFT</h1><h2>2 KM × 2 KM · 4 KM² · 9 DISTRICTS · 52 POINTS OF INTEREST</h2>{leg}
<div class="facts"><b>Get lost:</b> a forest of 9,600 identical pillars, painted bay codes that repeat, and an Exit Sign you can always see but never reach.<br><b>Find your way:</b> landmarks, the main ramps (dashed), and District Maps from Neighbourhood bosses that clear the fog.<br><b>Floor rule:</b> car alarms draw nearby mobs. <b>Event:</b> Rush Hour every 20 min.</div></div>
<script>document.fonts.ready.then(()=>{{window.__ready=true}})</script></body></html>'''
open('maps/floor1_map.html', 'w').write(html)
print('ok')
