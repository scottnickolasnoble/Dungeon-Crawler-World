// Crafting guide (N): every recipe in the game, which table and tier makes it, what goes in, and where each
// material comes from (monsters, floors, scrapping, other tables, merchants). Works anywhere, not just at a bench.
import { TABLES, RECIPES, MATS, TIER_CAP_UI } from './crafting.js';
import { RARITIES, RARITY_MAT, RARITY_MAT_DROP, SLOT_NAMES, STAT_LABEL, WTYPES } from './data.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const FLOOR_NAMES = { 1: 'Floor 1 (Undercroft)', 2: 'Floor 2 (Spin City)', 3: 'Floor 3 (Soup District)', 4: 'Floor 4 (Endless Mall)', 5: 'Floor 5 (Suburbia)', 6: 'Floor 6 (Canopy)' };
const PICKLES = ['scrapmetal', 'wire', 'glass', 'gunpowder', 'battery', 'spring', 'ember', 'cloth'];
const SCRAP_BASIC = ['scrapmetal', 'plastic', 'wire', 'cloth', 'rubber', 'glass'];

// sources: { mat: [string, ...] }
function buildSources({ matDrop, floorMats, mobName }) {
  const src = {}; const add = (m, t) => { (src[m] = src[m] || []).includes(t) || src[m].push(t); };
  for (const [kind, mats] of Object.entries(matDrop)) for (const m of Object.keys(mats)) add(m, `Dropped by ${mobName(kind)}`);
  for (const [f, list] of Object.entries(floorMats)) if (+f > 0) for (const m of list) add(m, `Monsters on ${FLOOR_NAMES[f]}`);
  for (const m of SCRAP_BASIC) add(m, 'Scrapping any gear');
  for (const m of ['ember', 'frost', 'storm', 'light']) add(m, 'Scrapping rare or better gear');
  for (const [rar, m] of Object.entries(RARITY_MAT)) if (!['junk', 'common'].includes(rar)) add(m, `Scrapping ${RARITIES.find((r) => r.id === rar).name.toLowerCase()} gear (always)`);
  for (const [m, ch, lv] of RARITY_MAT_DROP) add(m, `Rare monster drop from level ${lv}+ (${(ch * 100).toFixed(ch < 0.01 ? 2 : 1)}% a kill, more from elites and bosses)`);
  for (const m of PICKLES) add(m, 'Bought from Pickles (Floor 1 junk trader)');
  for (const r of RECIPES) if (r.out.mat) add(r.out.mat, `Made: ${r.name} (${TABLES[r.table].name} ${ROMAN[r.tier - 1]})`);
  add('bosscore', 'Boss kills');
  return src;
}

export function createGuide(G, deps) {
  const S = G.state, $ = (id) => document.getElementById(id);
  let q = '', table = 'all', onlyCan = false, sel = null, matSel = null; let SRC = null;
  const have = (m) => (S.mats && S.mats[m]) || 0;
  const tableState = (r) => { const t = S.tables && S.tables[r.table]; if (!t) return { ok: false, txt: (S.tableStock || []).includes(r.table) ? 'Owned · not installed in your Crash Pad' : `You don't own this table (sold by the table merchant from Floor ${TABLES[r.table].floor})` }; if (t.tier < r.tier) return { ok: false, txt: `Your ${TABLES[r.table].name} is Tier ${ROMAN[t.tier - 1]} · upgrade to Tier ${ROMAN[r.tier - 1]}` }; return { ok: true, txt: `Your ${TABLES[r.table].name} can make this (Tier ${ROMAN[t.tier - 1]})` }; };
  const canMake = (r) => tableState(r).ok && Object.entries(r.inputs).every(([m, n]) => have(m) >= n);
  function outText(r) { const o = r.out; if (o.mat) return `${o.n}× ${MATS[o.mat]} <span class="sm">(material)</span>`; if (o.cons) return `${o.cons.name} <span class="sm">(${Object.entries(o.cons.effect).map(([k, v]) => `${k} ${v}`).join(', ')})</span>`;
    if (o.gear) { const wt = o.gear.wtype ? WTYPES[o.gear.wtype] : null; const cap = RARITIES[TIER_CAP_UI[r.tier - 1]]; return `${o.gear.name} <span class="sm">(${SLOT_NAMES[o.gear.slot]}${wt ? ' · ' + wt.name + ' weapon' : ''} · ${Object.entries(o.gear.stats).map(([k, v]) => `+${v} ${STAT_LABEL[k] || k}`).join(', ')})</span><div class="sm">Best rarity at this tier: <b style="color:${cap.color}">${cap.name}</b>${r.tier >= 4 ? ' (legendary needs a top-quality roll)' : ''}</div>`; }
    return `${o.imbue.tag} <span class="sm">(adds ${Object.entries(o.imbue.add).map(([k, v]) => `+${v} ${STAT_LABEL[k] || k}`).join(', ')} to existing gear)</span>`; }
  function render() {
    SRC = SRC || buildSources(deps);
    const body = $('guideBody'); if (!body) return;
    const list = RECIPES.filter((r) => (table === 'all' || r.table === table) && (!q || r.name.toLowerCase().includes(q) || Object.keys(r.inputs).some((m) => (MATS[m] || m).toLowerCase().includes(q))) && (!onlyCan || canMake(r)));
    body.innerHTML = `<div class="gTop"><input id="gSearch" placeholder="Search an item or a material (e.g. rapier, potion, steel)" value="${q.replace(/"/g, '&quot;')}"><label><input type="checkbox" id="gCan" ${onlyCan ? 'checked' : ''}> Craftable now</label></div>
      <div class="gTabs">${[['all', 'ALL'], ...Object.entries(TABLES).map(([id, T]) => [id, T.name])].map(([id, n]) => `<button data-t="${id}" class="${table === id ? 'on' : ''}" ${id !== 'all' ? `style="border-color:${TABLES[id].color}"` : ''}>${n}</button>`).join('')}</div>
      <div class="gCols"><div class="gList">${list.slice(0, 400).map((r) => `<button class="gRow ${sel === r ? 'on' : ''} ${canMake(r) ? 'ok' : ''}" data-r="${r.id}:${r.table}"><span>${r.name}</span><span class="sm" style="color:${TABLES[r.table].color}">${TABLES[r.table].name.replace(/'s.*/, '')} ${ROMAN[r.tier - 1]}</span></button>`).join('') || '<div class="sm" style="padding:10px">Nothing matches.</div>'}</div>
      <div class="gDet">${matSel ? matDetail(matSel) : sel ? recipeDetail(sel) : '<div class="sm">Pick a recipe to see what it needs and where to find each material. Click a material to see every source and every recipe that uses it.<br><br><b>How crafting works</b><br>Tables live in your Crash Pad (H, or a Safe Room door). Buy tables from the table merchant in each floor\'s hub. Upgrade a table to unlock its next tier. Higher tiers need rarity materials: Tempered Scrap (uncommon), Blue-Chip Alloy (rare), Prime-Time Crystal (epic) and Showstopper Core (legendary). You get them by scrapping gear of that rarity, or rarely from tougher monsters.</div>'}</div></div>`;
    const sEl = $('gSearch'); sEl.oninput = () => { q = sEl.value.toLowerCase(); sel = null; matSel = null; const pos = sEl.selectionStart; render(); const n = $('gSearch'); n.focus(); n.setSelectionRange(pos, pos); };
    sEl.onkeydown = (e) => e.stopPropagation();
    $('gCan').onchange = (e) => { onlyCan = e.target.checked; render(); };
    body.querySelectorAll('.gTabs button').forEach((b) => b.onclick = () => { table = b.dataset.t; render(); });
    body.querySelectorAll('.gRow').forEach((b) => b.onclick = () => { const [id, t] = b.dataset.r.split(':'); sel = RECIPES.find((r) => r.id === id && r.table === t); matSel = null; render(); });
    body.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { matSel = b.dataset.m; render(); });
    const back = $('gBack'); if (back) back.onclick = () => { matSel = null; render(); };
  }
  function recipeDetail(r) { const ts = tableState(r);
    return `<div class="gTitle">${r.name}</div><div class="sm" style="color:${TABLES[r.table].color}">Made at: <b>${TABLES[r.table].name}</b> · Tier ${ROMAN[r.tier - 1]}${r.needs ? ` · must sit next to the ${TABLES[r.needs].name}` : ''}</div>
      <div class="sm" style="color:${ts.ok ? '#7BE38A' : '#ff8a6a'};margin:4px 0 10px">${ts.txt}</div><div class="gOut">→ ${outText(r)}</div>
      <div class="gHdr">NEEDS</div>${Object.entries(r.inputs).map(([m, n]) => `<button class="gIn ${have(m) >= n ? 'have' : 'miss'}" data-m="${m}"><b>${MATS[m] || m}</b> <span>${have(m)}/${n}</span><div class="sm">${(SRC[m] || ['Not found yet']).slice(0, 3).join(' · ')}${(SRC[m] || []).length > 3 ? ' · …' : ''}</div></button>`).join('')}`; }
  function matDetail(m) { const uses = RECIPES.filter((r) => r.inputs[m]);
    return `<button class="cbtn ghost" id="gBack">← Back</button><div class="gTitle">${MATS[m] || m} <span class="sm">you have ${have(m)}</span></div><div class="gHdr">WHERE TO GET IT</div>${(SRC[m] || ['No known source yet']).map((t) => `<div class="gSrc">• ${t}</div>`).join('')}
      <div class="gHdr">USED IN ${uses.length} RECIPES</div><div class="gUses">${uses.slice(0, 60).map((r) => `<span style="border-color:${TABLES[r.table].color}">${r.name} <i>${ROMAN[r.tier - 1]}</i></span>`).join('')}</div>`; }
  return { render };
}
