// In-game UI: HUD updates, inventory + equipment, character sheet, skill tree, map, achievements, loot boxes.
import { STATS, STAT_INFO, CLASS, SKILLS, SLOTS, SLOT_NAMES, RARITIES, STAT_LABEL, ACHIEVEMENTS, BOXES } from './data.js';

const $ = (id) => document.getElementById(id);
const rcol = (r) => (RARITIES.find((x) => x.id === r) || { color: '#fff' }).color;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// little line-art icons per slot / item kind (SVG paths, 24x24)
const ICON = {
  head: 'M4 15c0-5 3.6-9 8-9s8 4 8 9H4zm-1 0h18v3H3z', face: 'M3 10h18v5H3zM7 12.5h3M14 12.5h3', shoulders: 'M3 14c0-4 4-6 9-6s9 2 9 6l-3 2-3-3H9l-3 3z', chest: 'M6 3l3 2h6l3-2 3 4-3 3v11H6V10L3 7z', back: 'M7 3h10l3 18-8-3-8 3z',
  bracers: 'M6 6h12v12H6zM6 10h12M6 14h12', gloves: 'M7 21v-8L5 9l2-1 2 3V4h2v6V3h2v7V4h2v8l2-3 2 1-3 6v5z', belt: 'M2 10h20v5H2zM10 9h4v7h-4z', legs: 'M6 3h12l-1 18h-4l-1-12-1 12H7z', boots: 'M7 3h5v11l7 3v4H5v-4l2-1z',
  ring1: 'M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM9 6l3-3 3 3', amulet: 'M5 3c2 6 12 6 14 0M12 9l4 5-4 6-4-6z', main: 'M18 3l3 3-11 11-3-3zM5 16l3 3-3 3-3-3z', off: 'M12 3l8 3v6c0 5-4 8-8 10-4-2-8-5-8-10V6z',
  consumable: 'M9 2h6v4l3 3v12H6V9l3-3z', book: 'M4 4h7c1 0 1 1 1 1v15s0-1-1-1H4zM20 4h-7c-1 0-1 1-1 1v15s0-1 1-1h7z', box: 'M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9',
};
export const icon = (k, col = '#F4EEDC') => `<svg viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${ICON[k] || ICON.box}"/></svg>`;

export function createUI(G) {
  const state = G.state;
  let open = null, tab = 'gear', hoverEl = null;
  // ---------- panels ----------
  const panels = { inv: $('pInv'), char: $('pChar'), skills: $('pSkills'), map: $('pMap'), ach: $('pAch'), craft: $('pCraft'), settings: $('pSettings'), shop: $('pShop'), quests: $('pQuests') };
  function toggle(p) { if (open === p) return close(); open = p; Object.entries(panels).forEach(([k, el]) => el.classList.toggle('show', k === p)); $('panelWrap').classList.add('show'); render(); G.onPanel(true); }
  function close() { open = null; Object.values(panels).forEach((el) => el.classList.remove('show')); $('panelWrap').classList.remove('show'); hideTip(); G.onPanel(false); }
  function render() { if (open === 'inv') renderInv(); if (open === 'char') renderChar(); if (open === 'skills') renderSkills(); if (open === 'map') G.drawMap($('bigMap'), true); if (open === 'ach') renderAch(); if (open === 'craft') G.renderCraft(); if (open === 'settings') G.renderSettings(); if (open === 'shop') G.renderShop(); if (open === 'quests') G.renderLog(); }

  // ---------- tooltip ----------
  const tip = $('tip');
  function statLines(stats, cmp) {
    return Object.entries(stats).map(([k, v]) => { const d = cmp ? v - (cmp[k] || 0) : 0; const lab = k.startsWith('skill_') ? `+${v} ${STAT_LABEL[k]}` : `+${v} ${STAT_LABEL[k] || k}`; return `<div class="sl">${esc(lab)}${cmp && d ? `<span class="${d > 0 ? 'up' : 'dn'}"> (${d > 0 ? '+' : ''}${d})</span>` : ''}</div>`; }).join('')
      + (cmp ? Object.entries(cmp).filter(([k]) => !(k in stats)).map(([k, v]) => `<div class="sl dn">-${v} ${esc(STAT_LABEL[k] || k)}</div>`).join('') : '');
  }
  function showTip(item, x, y, equippedCmp = true) {
    if (!item) return hideTip();
    const cur = item.kind === 'gear' && equippedCmp ? state.equip[item.slot === 'ring1' && state.equip.ring1 && !state.equip.ring2 ? 'ring2' : item.slot] : null;
    let h = `<div class="tn" style="color:${rcol(item.rarity)}">${esc(item.name)}</div>`;
    if (item.kind === 'gear') h += `<div class="tr">${(RARITIES.find((r) => r.id === item.rarity) || {}).name} ${SLOT_NAMES[item.slot]} · iLvl ${item.level} · ${item.family}</div>` + statLines(item.stats, cur && cur !== item ? cur.stats : null) + (cur && cur !== item ? `<div class="tc">Compared with equipped: ${esc(cur.name)}</div>` : '');
    if (item.kind === 'consumable') h += `<div class="tr">Consumable</div>` + Object.entries(item.effect).map(([k, v]) => `<div class="sl">+${v} ${k}</div>`).join('');
    if (item.kind === 'book') { const s = SKILLS.find((q) => q.id === item.skill); h += `<div class="tr">Skill book · Pyromancer</div><div class="sl">${state.skills[item.skill] ? 'Known: +1 skill level' : 'Teaches: ' + esc(s.name)}</div><div class="sl">${esc(s.desc)}</div>`; }
    if (item.kind === 'box') h += `<div class="tr">Loot box</div><div class="sl">${BOXES[item.box].items}+ items · chance of a skill book</div>`;
    h += `<div class="th">“${esc(item.host || '')}”</div>`;
    h += `<div class="tk">${item.kind === 'gear' ? (state.equipped(item) ? 'Click: unequip' : 'Click: equip · Right-click: scrap') : item.kind === 'consumable' ? 'Click: use' : item.kind === 'book' ? 'Click: read' : 'Click: open'}</div>`;
    tip.innerHTML = h; tip.style.display = 'block';
    const r = tip.getBoundingClientRect(); tip.style.left = Math.min(window.innerWidth - r.width - 10, x + 16) + 'px'; tip.style.top = Math.min(window.innerHeight - r.height - 10, y + 10) + 'px';
  }
  function hideTip() { tip.style.display = 'none'; }
  document.addEventListener('mousemove', (e) => { if (hoverEl && tip.style.display === 'block') { const r = tip.getBoundingClientRect(); tip.style.left = Math.min(window.innerWidth - r.width - 10, e.clientX + 16) + 'px'; tip.style.top = Math.min(window.innerHeight - r.height - 10, e.clientY + 10) + 'px'; } });
  function bindItem(el, item, onClick, onRight) {
    el.addEventListener('mouseenter', (e) => { hoverEl = el; showTip(item, e.clientX, e.clientY); });
    el.addEventListener('mouseleave', () => { hoverEl = null; hideTip(); });
    el.addEventListener('click', () => { hideTip(); onClick(); render(); });
    if (onRight) el.addEventListener('contextmenu', (e) => { e.preventDefault(); hideTip(); onRight(); render(); });
  }

  // ---------- inventory + equipment ----------
  const DOLL = { head: [1, 0], face: [1, 1], amulet: [2, 1], shoulders: [0, 1], chest: [1, 2], back: [2, 2], bracers: [0, 2], gloves: [0, 3], belt: [1, 3], legs: [1, 4], boots: [1, 5], ring1: [2, 3], ring2: [2, 4], main: [0, 4], off: [2, 5] };
  function renderInv() {
    const doll = $('doll'); doll.innerHTML = '';
    for (const slot of SLOTS) { const it = state.equip[slot]; const [c, r] = DOLL[slot]; const el = document.createElement('button'); el.className = 'eq'; el.style.gridColumn = c + 1; el.style.gridRow = r + 1; el.style.borderColor = it ? rcol(it.rarity) : '#3a3448';
      el.innerHTML = `${icon(slot === 'ring2' ? 'ring1' : slot, it ? rcol(it.rarity) : '#5a5068')}<span>${it ? '' : SLOT_NAMES[slot]}</span>`; el.setAttribute('aria-label', it ? it.name : SLOT_NAMES[slot] + ' (empty)');
      if (it) bindItem(el, it, () => G.unequip(slot)); doll.appendChild(el); }
    const D = G.derived(); $('invStats').innerHTML = `<b>${state.name}</b> · Lv ${state.level} ${CLASS.name}<br>HP ${Math.round(D.maxHp)} · Mana ${Math.round(D.maxMana)} · Armour ${D.armor} · Spell ${D.spell} · Fire +${D.fire}%<br>Gold <span style="color:#F5C518">${state.gold}</span> · Scrap ${state.scrap}`;
    document.querySelectorAll('#invTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const grid = $('grid'); grid.innerHTML = '';
    const list = state.inv.filter((it) => (tab === 'gear' ? it.kind === 'gear' : tab === 'cons' ? it.kind === 'consumable' : tab === 'books' ? it.kind === 'book' : it.kind === 'box'));
    for (let i = 0; i < 48; i++) { const it = list[i]; const el = document.createElement('button'); el.className = 'cell'; if (it) { el.style.borderColor = rcol(it.rarity || 'common'); el.style.background = `linear-gradient(180deg, ${rcol(it.rarity || 'common')}22, #120e18)`; el.innerHTML = icon(it.kind === 'gear' ? it.slot : it.kind === 'box' ? 'box' : it.kind, it.kind === 'box' ? BOXES[it.box].color : rcol(it.rarity || 'common')); el.setAttribute('aria-label', it.name);
      bindItem(el, it, () => G.useItem(it), it.kind === 'gear' ? () => G.scrap(it) : null); } grid.appendChild(el); }
    $('invCount').textContent = `${state.inv.length} / 48`;
  }
  document.querySelectorAll('#invTabs button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; renderInv(); }));
  $('scrapJunk').addEventListener('click', () => { G.scrapJunk(); renderInv(); });

  // ---------- character sheet ----------
  function renderChar() {
    const D = G.derived();
    $('charHead').innerHTML = `<div class="big">${esc(state.name)}</div><div>Level ${state.level} ${CLASS.name} · Human</div><div class="xpbar"><i style="width:${(state.xp / state.xpNext) * 100}%"></i></div><div class="sm">${state.xp} / ${state.xpNext} XP</div><div class="pts">Stat points: <b>${state.statPoints}</b></div>`;
    $('statRows').innerHTML = STATS.map((s) => `<div class="srow"><div class="sn">${s}${CLASS.main.includes(s) ? '<span class="main">MAIN</span>' : ''}</div><div class="sv">${state.base[s]}${D.gearStats[s] ? `<span class="gear"> +${D.gearStats[s]}</span>` : ''}</div><button class="plus" data-s="${s}" ${state.statPoints ? '' : 'disabled'} aria-label="Add a point to ${s}">+</button><div class="sd">${STAT_INFO[s]}</div></div>`).join('');
    document.querySelectorAll('#statRows .plus').forEach((b) => b.addEventListener('click', () => { G.addStat(b.dataset.s); renderChar(); }));
    const rows = [['Max HP', Math.round(D.maxHp)], ['Max mana', Math.round(D.maxMana)], ['Mana regen', D.manaRegen.toFixed(1) + '/s'], ['Max stamina', Math.round(D.maxStamina)], ['Armour', D.armor], ['Spell power', D.spell], ['Fire damage', '+' + D.fire + '%'], ['Crit chance', D.crit + '%'], ['Cast speed', '+' + D.castSpeed + '%'], ['Move speed', '+' + D.moveSpeed + '%'], ['Firebolt hit', Math.round(G.spellDamage('firebolt'))], ['Fireball hit', state.skills.fireball ? Math.round(G.spellDamage('fireball')) : '—']];
    $('derived').innerHTML = rows.map(([a, b]) => `<div class="dr"><span>${a}</span><b>${b}</b></div>`).join('');
    const [o, d, u] = CLASS.mix; $('mix').innerHTML = `<div class="mixbar"><i style="width:${o}%;background:#E5484D"></i><i style="width:${d}%;background:#4a9aff"></i><i style="width:${u}%;background:#5ad86a"></i></div><div class="sm">Skill mix: ${o}% attack · ${d}% defence · ${u}% utility. +1 INT and +1 CON are added automatically each level.</div>`;
  }

  // ---------- skill tree ----------
  function renderSkills() {
    $('skPts').innerHTML = `Skill points: <b>${state.skillPoints}</b> · Base levels cap at 15 · Upgrade choices at base 5, 10 and 15 · Gear adds levels (damage only)`;
    const groups = [['atk', 'ATTACK', '#E5484D'], ['def', 'DEFENCE', '#4a9aff'], ['util', 'UTILITY', '#5ad86a']];
    $('skillTree').innerHTML = groups.map(([t, label, c]) => `<div class="sgroup"><div class="sgh" style="color:${c}">${label}</div><div class="scards">${SKILLS.filter((s) => s.type === t).map((s) => {
      const k = state.skills[s.id]; const base = k ? k.lvl : 0, bonus = k ? G.gearSkillBonus(s.id) : 0;
      const tiers = s.ups.map((pair, i) => { const need = (i + 1) * 5, ch = k && k.ups[i]; return `<div class="tier ${base >= need ? 'open' : ''}"><span class="tl">Lv ${need}</span>${pair.map((nm, j) => `<button class="up ${ch === j ? 'chosen' : ''}" data-s="${s.id}" data-t="${i}" data-c="${j}" ${base >= need && ch === undefined ? '' : 'disabled'}>${esc(nm)}</button>`).join('<span class="or">or</span>')}</div>`; }).join('');
      return `<div class="scard ${k ? '' : 'locked'}" style="border-color:${k ? c : '#3a3448'}"><div class="st"><b>${esc(s.name)}</b>${s.built ? '<span class="bi">BUILT-IN</span>' : ''}${s.passive ? '<span class="bi">PASSIVE</span>' : ''}</div>
        <div class="slv">${k ? `Lv <b>${base}</b>${bonus ? `<span class="gear"> +${bonus} gear = ${base + bonus}</span>` : ''} / 15` : `<span class="lk">Locked · ${esc(s.src)}</span>`}</div>
        <div class="pips">${Array.from({ length: 15 }, (_, i) => `<i class="${i < base ? 'f' : i < base + bonus ? 'g' : ''} ${(i + 1) % 5 === 0 ? 'm' : ''}"></i>`).join('')}</div>
        <div class="sdsc">${esc(s.desc)}${s.mana ? ` <span class="sm">${s.mana} mana</span>` : ''}</div>${tiers}
        ${k ? `<button class="lvl" data-s="${s.id}" ${state.skillPoints && base < 15 ? '' : 'disabled'}>+ Level</button>` : ''}</div>`; }).join('')}</div></div>`).join('');
    document.querySelectorAll('#skillTree .lvl').forEach((b) => b.addEventListener('click', () => { G.levelSkill(b.dataset.s); renderSkills(); }));
    document.querySelectorAll('#skillTree .up').forEach((b) => b.addEventListener('click', () => { G.chooseUpgrade(b.dataset.s, +b.dataset.t, +b.dataset.c); renderSkills(); }));
  }

  // ---------- achievements ----------
  function renderAch() {
    $('achList').innerHTML = ACHIEVEMENTS.map((a) => { const done = state.ach[a.id]; const p = G.achProgress(a.id); return `<div class="ach ${done ? 'done' : ''}"><div class="ab" style="background:${BOXES[a.box].color}">${icon('box', '#0D0B12')}</div><div><b>${esc(a.name)}</b><div class="sm">${esc(a.desc)}${p ? ` · ${p}` : ''}</div></div><div class="ar">${done ? 'EARNED' : BOXES[a.box].name}</div></div>`; }).join('');
  }

  // ---------- loot box reveal ----------
  function revealBox(boxName, color, items, onDone) {
    const m = $('boxModal'); m.classList.add('show'); $('boxTitle').textContent = boxName; $('boxTitle').style.color = color;
    const cards = $('boxCards'); cards.innerHTML = '';
    items.forEach((it, i) => { const c = document.createElement('div'); c.className = 'bcard'; c.style.animationDelay = (0.25 + i * 0.35) + 's'; c.style.borderColor = rcol(it.rarity || 'common');
      c.innerHTML = `<div class="bi2">${icon(it.kind === 'gear' ? it.slot : it.kind, rcol(it.rarity || 'common'))}</div><div class="bn" style="color:${rcol(it.rarity || 'common')}">${esc(it.name)}</div><div class="sm">${it.kind === 'gear' ? (RARITIES.find((r) => r.id === it.rarity) || {}).name + ' ' + SLOT_NAMES[it.slot] : it.kind === 'book' ? 'Skill book!' : 'Consumable'}</div>`;
      c.addEventListener('mouseenter', (e) => showTip(it, e.clientX, e.clientY)); c.addEventListener('mouseleave', hideTip); cards.appendChild(c); });
    $('boxOk').onclick = () => { m.classList.remove('show'); hideTip(); onDone && onDone(); render(); };
  }

  // ---------- HUD ----------
  function hud(D) {
    const p = state;
    $('hpF').style.width = (p.hp / D.maxHp) * 100 + '%'; $('hpT').textContent = `${Math.ceil(p.hp)} / ${Math.round(D.maxHp)}`;
    $('mpF').style.width = (p.mana / D.maxMana) * 100 + '%'; $('stF').style.width = (p.stamina / D.maxStamina) * 100 + '%';
    $('wardF').style.width = p.ward > 0 ? (p.ward / p.wardMax) * 100 + '%' : '0%';
    $('hunF').style.width = p.hunger + '%'; $('thiF').style.width = p.thirst + '%';
    $('xpF').style.width = (p.xp / p.xpNext) * 100 + '%'; $('lvl').textContent = 'LV ' + p.level;
    for (const [id, sk] of [['h1', 'firebolt'], ['h2', 'fireball'], ['h3', 'flameward'], ['h4', 'kindle']]) { const el = $(id), cd = G.cooldownFrac(sk); el.querySelector('.cdo').style.height = cd * 100 + '%'; el.classList.toggle('locked', !p.skills[sk]); el.classList.toggle('nomana', !!p.skills[sk] && p.mana < (SKILLS.find((s) => s.id === sk).mana || 0)); }
    $('ptsBadge').style.display = p.statPoints || p.skillPoints ? 'block' : 'none'; $('ptsBadge').textContent = `${p.statPoints ? p.statPoints + ' stat' : ''}${p.statPoints && p.skillPoints ? ' · ' : ''}${p.skillPoints ? p.skillPoints + ' skill' : ''} point${p.statPoints + p.skillPoints > 1 ? 's' : ''} to spend (C / K)`;
    $('boxBadge').style.display = p.inv.some((i) => i.kind === 'box') ? 'block' : 'none'; $('boxBadge').textContent = `${p.inv.filter((i) => i.kind === 'box').length} loot box(es) · press I`;
  }
  let toastN = 0;
  function toast(html, color = '#F5C518', ms = 4200) { const t = document.createElement('div'); t.className = 'toast'; t.style.borderColor = color; t.innerHTML = html; $('toasts').prepend(t); setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 600); }
  let hostTimer = 0;
  function host(line) { $('hostTxt').textContent = line; $('host').classList.add('show'); clearTimeout(hostTimer); hostTimer = setTimeout(() => $('host').classList.remove('show'), 6000); }
  function banner(text, color = '#F5C518') { const b = $('banner'); b.textContent = text; b.style.color = color; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); }
  return { toggle, close, render, isOpen: () => open, hud, toast, host, banner, revealBox };
}
