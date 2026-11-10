# Character audit (2026-11-09)

Every character model in the game was rendered from the front and checked for whether its arms stand clear of its body,
which Mixamo's auto-rigger needs. Results, and what to do with each group.

## 1. Remake in Tripo (4)

These need a new model, made the strict way: a T-pose picture with chunky hands (made locally by
`tools/ai3d/make_concepts.py`; AccuRig must be closed while it runs), then Tripo **image-to-3D**, then Mixamo.

| Character | Why |
|---|---|
| captain_kevlar | Bulky armour, with the arms pressed against the body |
| the_cone_king | Merged into his throne and robes |
| traffic_cone_goblin | Arms are fine now, but the hands are thin melted claws |
| sergeant_pylon | Arms are fine now, but the hands are thin melted claws |

Also: **marta_vance** is rigged and animated, but needs the **Texture** step in Tripo (she's grey).

## 2. Ready for Mixamo as they are (about 77)

Arms out in a T-pose, so they can go straight into Mixamo's auto-rigger with no Tripo work. Upload the FBX from
`art/mixamo/upload/<name>.fbx` (one is already there for every character).

archmage_pell, auntie_dumpling, auntie_sludge, barb_the_innkeeper, bark_blade, benchwright_bo, bev, big_deb, bix,
bogling_townsperson, cardboard_goblin, cave_troll, chief_grubtooth, cinnamon_sue, clanker_townsperson, clearance_carl,
cleaver_jo, clockwork_debt_collector, cone_captain, cone_chucker, curbside_cal, dot, drill_prophet, fennix_townsperson,
forager_fern, foreman_gruss, foreman_tuck, grandma_gristle, gravy_the_innkeeper, grimhide_townsperson, gutter_hag,
gutterkin_townsperson, human_townsperson, judge_vrask, lawn_gnome_cultist, lemonade_lee, lord_hunter_facet,
lost_receipts, lumen_townsperson, madame_prickle, mall_cop_ogre, mangle_the_innkeeper, matron_hale, mattress_mo,
mayor_eternal, mrs_doily, nan_gangway, neighbourhood_watch, officer_brick, ogrekin_townsperson, old_bramble,
old_reggie, pickles, quillback_townsperson, registrar_odessa, rinse, rusty_kell, scraps, spin_cycle, spool,
stoneblood_townsperson, suds, sunny_the_sponsor_rep, supervisor_mox, the_fryer_baron, the_gnome_pope,
the_hoa_president, the_host, the_rat_senate_speaker, the_rat_throne_king, the_undermayor, tourist_hunter,
tunnel_mole_kin, twig, yard_sale_yolanda

Already done in Mixamo: intern_pip, marta_vance.

Keep an eye on: officer_brick (odd blocky outline) and cave_troll (ape-like arms angled down).

The 11 `*_townsperson` models will probably be replaced by the base-body crowd (Quaternius), so do those last, or skip them.

## 3. Creatures: no Mixamo, no Tripo remake (45 made)

Non-humanoid monsters (moths, slimes, lampreys, wyrms, the Kraken, Lost & Found...). Mixamo can't rig them, and a
Tripo remake wouldn't help. They get custom rigs in Blender, done by Claude.

## 4. Not made yet (21 humanoids, 21 creatures)

Mostly deep-floor characters still on the Tripo lists. Make them the strict way from the start (T-pose picture, then
image-to-3D).

Humanoids: archivist_quire, commercial_break_imp, cue_card_cal, dust, executive_shade, gaffer_tape, gladiator_bot,
gloria_from_hr, head_archivist_vellum, intern_zero, janitor_sol, librarian_lich, madame_encore, ratings_wraith,
sir_skip_ad, stamp, the_chairman, the_editor_in_chief, the_number_one, the_showrunner, ulti_max

## Saving Mixamo work

All Mixamo rigs share the same bone names. So **each character only needs one download from Mixamo: the rigged model
itself, With Skin, in its T-pose, no animation.** The animations can be downloaded **once**, on one character, as a
shared library (idle, walk, run, talk, wave, attack, hit, die and so on), and Claude copies that library onto every
character during import. This turns about 6 downloads per character into 1.
