# Step 1 of making a character: concept pictures for the 3D generator to work from. Runs locally on the graphics card.
#   F:/Downstairs/ai3d/env/Scripts/python.exe tools/ai3d/make_concepts.py [--seeds 8] [--first 5000] [character ...]
# Writes F:/Downstairs/ai3d/out/concepts/<character>_<seed>.png. pick_concepts.py then ranks them.
import os
import sys

os.environ.setdefault("HF_HOME", "F:/Downstairs/ai3d/cache/hf")


OUT = "F:/Downstairs/ai3d/out/concepts"
# The prompt limit is 77 tokens and anything past it is silently dropped, so the pose and style come first and descriptions stay short.
# T-pose characters get rigged on Mixamo; creatures can't be, so they stand however suits them.
POSES = {
    "tpose": "full body head to toe, T-pose, both arms stretched straight out sideways, standing, front view, plain white background, ink outlines, flat colours, cartoon character sheet",
    "creature": "full body, whole creature in frame, front three-quarter view, plain white background, ink outlines, flat colours, cartoon monster sheet",
    "prop": "single game prop, whole object in frame, front three-quarter view, plain white background, bold ink outlines, flat cel colours, comic book cartoon",
}
NEGATIVE = {
    "tpose": "claws, talons, long fingernails, long thin fingers, clawed hands, fists, muscular, bodybuilder, hulk, six pack, arms down, arms at sides, hands in pockets, crossed arms, weapon, holding object, staff, club, backpack, props, cropped, close-up, portrait, side view, background, scenery, papers, collage, multiple characters, floor, shadow, text, photo, 3d render, deformed face, extra limbs",
    "creature": "cropped, close-up, background, scenery, street, city, room, wall, shelves, buildings, collage, multiple characters, people, human, floor, shadow, text, photo, 3d render, extra heads",
    "prop": "cropped, close-up, background, scenery, room, floor, shadow, people, character, hands, multiple objects, collage, text, photo, 3d render, blurry",
}
SCARY = "scary horror comic monster, "
# name: (pose, description). Monsters are scary; townsfolk are friendly and ordinary.
CHARACTERS = {
    # ---- monsters, Floors 0-1
    "traffic_cone_goblin": ("tpose", "big chunky cartoon hands with five thick fingers spread wide apart, green goblin, orange traffic cone helmet on head, yellow eyes, pointed ears, toothy grin, leather strap, brown shorts, bare feet"),
    "sergeant_pylon": ("tpose", "big chunky cartoon hands with five thick fingers spread wide apart, fat stocky green goblin, bald, angry yellow eyes, tusks, moustache, yellow safety vest, bare green arms, grey trousers, black boots"),
    "cardboard_goblin": ("tpose", "goblin made of flat cut-out brown cardboard, goofy face drawn in black marker, tape on the joints, folded corners"),
    "cone_chucker": ("tpose", SCARY + "skinny lanky green goblin, thin bony limbs, long arms, mad grin of needle teeth, wild eyes, orange hi-vis bib, rag shorts, bare feet"),
    "cone_captain": ("tpose", SCARY + "big brutal green goblin, scowl, tusks, scrap metal chest plate, hi-vis sash, spiked shoulder pad, ragged trousers, boots"),
    "mop_wight": ("tpose", SCARY + "undead janitor, grinning skull face, glowing eyes, rotting blue work shirt with name patch, visible ribs, grey work trousers, boots, empty hands"),
    "marta_vance": ("tpose", "tired friendly woman camp leader, nurse scrubs, cardigan, stethoscope round neck, bandana, trousers, sneakers, empty open hands"),
    "drain_lamprey": ("creature", SCARY + "slimy grey eel monster rearing upright, round sucker mouth ringed with hooked teeth, small beady eyes, gill holes, dripping slime"),
    "fluorescent_moth": ("creature", SCARY + "huge moth, wings spread wide with eye spots, furry thorax, giant black compound eyes, feathered antennae, glowing white abdomen"),
    "pigeon_ghoul": ("creature", SCARY + "large undead pigeon, rotting bare patches, exposed ribs, mad red eye, iridescent neck, scaly clawed feet"),
    "vending_mimic": ("creature", SCARY + "red snack vending machine with a huge mouth of teeth along its front, long wet tongue, one eye in the coin slot, stubby legs"),
    "the_big_sucker": ("creature", SCARY + "enormous bloated lamprey monster rearing up, vast round mouth of hooked teeth, sagging grey skin, tiny angry eyes"),
    "the_moth_matron": ("creature", SCARY + "giant queen moth, broad patterned wings spread, white fur ruff collar, crown of antennae, glowing abdomen, black eyes"),
    "the_pigeon_elder": ("creature", SCARY + "giant ragged undead pigeon, bald patches, puffed chest, one deranged red eye, long claws"),
    "lost_and_found": ("creature", SCARY + "tall hunched monster made of lost coats and scarves, umbrella spines for fingers, odd shoes for feet, a face of buttons and one huge eye, colourful"),
    # ---- townsfolk, one body per race
    "human_townsperson": ("tpose", "ordinary tired survivor, friendly normal face, messy brown hair, patched green jacket, worn trousers, boots"),
    "gutterkin_townsperson": ("tpose", "short rat person, rat snout, whiskers, round ears, grey brown fur, long tail, patched blue overalls"),
    "stoneblood_townsperson": ("tpose", "rock golem person, body made of grey boulders, stone head with a kind face, glowing orange cracks, brown leather apron, big stone hands"),
    "fennix_townsperson": ("tpose", "slim fox person, orange fur, white muzzle, tall ears, bushy tail, simple green tunic, belt"),
    "ogrekin_townsperson": ("tpose", "very tall heavy ogre person, tan skin, small tusks, big belly, huge hands, friendly dim face, sleeveless shirt"),
    "lumen_townsperson": ("tpose", "slender elf-like person, pale blue softly glowing skin, pointed ears, calm eyes, flowing white robes"),
    "bogling_townsperson": ("tpose", "short big-headed frog person, wet green spotted skin, huge round eyes, wide mouth, leaf cloak"),
    "clanker_townsperson": ("tpose", "humanoid robot, old grey riveted metal plates, dented friendly face plate, teal glowing eyes"),
    "grimhide_townsperson": ("tpose", "tall muscular green orc person, tusks, pointed ears, underbite, sturdy brown leather clothes"),
    "quillback_townsperson": ("tpose", "short hedgehog person, brown spines over back and head, small black nose, bright eyes, neat red waistcoat"),
    "mothwing_townsperson": ("tpose", "slim moth person, soft grey fur, big dark eyes, feathered antennae, dusty folded wings, plain tunic"),
    # ---- earlier pilots
    "intern_pip": ("tpose", "skinny nervous young man, red polo shirt, tan skin, freckles, messy brown hair, big worried eyes, awkward smile, khaki trousers, white sneakers"),
}


# Props made on this PC instead of Tripo (art/TRIPO_PLAN.md). Names are the game's own prop names, so
# tools/ai3d/import_prop.py drops each one straight in.
PROPS = {
    "desk": ("prop", "long curved orange and teal TV studio reception desk, chunky old computer monitor, bell, stack of forms"),
    "filing": ("prop", "grey four drawer metal filing cabinet, one drawer open stuffed with folders, dents"),
    "folding_chair": ("prop", "grey metal folding chair, cracked plastic seat"),
    "shelf": ("prop", "tall metal storage shelf unit crammed with labelled boxes and binders"),
    "boxes": ("prop", "stack of three taped cardboard boxes stamped FRAGILE, top one crushed"),
    "trash_can": ("prop", "round steel bin with swing lid, crumpled paper spilling over"),
    "bench": ("prop", "row of three linked plastic waiting room seats on a steel beam"),
    "plant": ("prop", "tall potted office plant, big glossy leaves, terracotta pot"),
    "ceiling_light": ("prop", "long rectangular fluorescent ceiling light with two glowing tubes"),
    "spotlight": ("prop", "black stage spotlight on a tripod stand with barn door flaps"),
    "tv_mount": ("prop", "chunky old CRT television on a metal wall bracket"),
    "noticeboard": ("prop", "cork noticeboard in a wooden frame covered in pinned papers and posters"),
    "stanchions": ("prop", "two brass queue posts joined by a red velvet rope"),
    "wet_floor": ("prop", "yellow folding caution wet floor sign"),
    "fountain": ("prop", "wall mounted steel drinking fountain with push button"),
    "sandbags": ("prop", "low curved wall of stacked burlap sandbags"),
    "cones": ("prop", "three orange traffic cones with white stripes, one knocked over"),
    "barrier": ("prop", "metal crowd control barrier section with feet"),
    "tires": ("prop", "stack of four worn black car tyres"),
    "barrels": ("prop", "two oak barrels with iron hoops, one with a tap"),
    "crates": ("prop", "pile of three wooden shipping crates with rope handles and stencilled numbers"),
    "bed": ("prop", "narrow iron frame bed, lumpy mattress, patched quilt, flat pillow"),
    "counter": ("prop", "long wooden shop counter with brass cash register and a bell"),
    "bar_back": ("prop", "tavern back bar shelf full of mismatched bottles and a cracked mirror"),
    "food_shelf": ("prop", "grocery shelf unit stacked with tins, jars and bread loaves"),
    "potion_shelf": ("prop", "wooden apothecary shelf of coloured potion bottles and a skull"),
    "armor_stand": ("prop", "wooden armour stand with patchwork sports pads and a saucepan helmet"),
    "workbench": ("prop", "heavy wooden workbench with a vice and scattered tools"),
    "table_set": ("prop", "round tavern table with two wobbly chairs and two tankards"),
    "kiosk": ("prop", "small street newspaper kiosk with open shutter and pegged newspapers"),
    "market_stall": ("prop", "wooden market stall with striped canopy and crates of strange fruit"),
    "washer": ("prop", "chunky front loading launderette washing machine with round porthole"),
    "well": ("prop", "round stone well with wooden roof, crank and bucket"),
    "fence": ("prop", "section of weathered wooden picket fence, one broken picket"),
    "hedge": ("prop", "neatly clipped boxy green hedge section"),
    "car_parked": ("prop", "boxy family estate car, roof rack with a suitcase"),
    "power_pole": ("prop", "wooden telegraph pole with crossbars, insulators and a poster"),
    "tent": ("prop", "ragged monster camp tent of stitched tarps over bent poles, bones tied on, flap open"),
    "bonfire": ("prop", "camp bonfire of smashed furniture in a ring of bricks, cartoon flames"),
    "bone_heap": ("prop", "heap of gnawed bones, skulls and one fuzzy slipper"),
    "camp_banner": ("prop", "tall monster war banner on a pole, torn hi-vis cloth with a snarling face"),
    "weapon_rack": ("prop", "rough wooden weapon rack holding pipes, a road sign and a hockey stick"),
    "kit_wheelie_bin": ("prop", "dented green wheelie bin, lid propped open by overflowing rubbish bags"),
    "kit_bin_bags": ("prop", "heap of shiny black rubbish bags, one torn open spilling cans"),
    "kit_pallets": ("prop", "leaning stack of splintered wooden pallets with a coil of rope"),
    "kit_roadworks": ("prop", "red and white striped roadworks barrier with amber lamp and cones"),
    "kit_utility_box": ("prop", "grey street utility cabinet covered in torn posters and graffiti"),
    "kit_jersey_barrier": ("prop", "chunky concrete road barrier covered in bright graffiti"),
    "kit_fire_barrel": ("prop", "rusty oil drum with cartoon flames rising out of the top"),
    "kit_network_camera": ("prop", "tall thin pole topped with a TV broadcast camera with a red light"),
    "kit_fan_box": ("prop", "gift box wrapped in shiny foil paper printed with hearts, big bow"),
    "kit_debris": ("prop", "low pile of broken bricks, bent pipe and one shoe"),
    "hill_boulders": ("prop", "cluster of three chunky rounded mossy boulders"),
    "hill_outcrop": ("prop", "jagged layered rock outcrop with a flat top"),
    "hill_dead_tree": ("prop", "gnarled leafless twisted tree with clawing branches, rope swing"),
    "hill_junk_heap": ("prop", "big mound of junk: fridge, tyres, broken TV, mattress"),
    "shrine_small": ("prop", "small roadside shrine, little wooden roof over candles and offerings"),
    "altar_tally": ("prop", "altar of stacked ledgers and abacuses, tally marks carved everywhere"),
    "altar_damp": ("prop", "dripping wet stone altar in a shallow pool, brass bell"),
    "altar_hollow_chef": ("prop", "iron cooking range altar with an empty cauldron and set plates"),
    "altar_mother_mould": ("prop", "soft bed shaped altar of moss and mushrooms with a pillow"),
    "altar_rustwright": ("prop", "anvil altar with a ticking clock set into it, gears and spanners"),
    "altar_good_neighbour": ("prop", "white picket fence altar with welcome mat and a pie on a stand"),
    "altar_lady_lumen": ("prop", "altar piled high with lamps, candles and light bulbs, moths"),
    "altar_antlered_viewer": ("prop", "altar of mounted antlers around an old film camera on a tripod"),
    "altar_encore": ("prop", "small glittering stage altar with spotlight, microphone and bouquets"),
    "altar_index": ("prop", "altar of card catalogue drawers with brass lamp and huge open book"),
    "altar_static": ("prop", "wall of old televisions showing static, cables pooled at the base"),
    "empty_plinth": ("prop", "plain grey concrete plinth, empty, small blank brass plaque"),
}
CHARACTERS.update(PROPS)


if __name__ == "__main__":
    import torch
    from diffusers import StableDiffusionXLPipeline

    args = sys.argv[1:]
    seeds_count, first = 8, 5000
    if "--seeds" in args:
        i = args.index("--seeds")
        seeds_count = int(args[i + 1])
        del args[i:i + 2]
    if "--first" in args:
        i = args.index("--first")
        first = int(args[i + 1])
        del args[i:i + 2]
    names = args or list(CHARACTERS)
    os.makedirs(OUT, exist_ok=True)
    pipe = StableDiffusionXLPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.float16, variant="fp16", use_safetensors=True)
    pipe.enable_model_cpu_offload()
    pipe.enable_vae_tiling()
    for name in names:
        pose, description = CHARACTERS[name]
        for k in range(seeds_count):
            seed = first + k * 101
            path = f"{OUT}/{name}_{seed}.png"
            if os.path.exists(path):
                continue
            image = pipe(prompt=f"{POSES[pose]}, {description}", negative_prompt=NEGATIVE[pose], width=1024, height=1024, num_inference_steps=30, guidance_scale=7.0, generator=torch.Generator("cpu").manual_seed(seed)).images[0]
            image.save(path)
            print("saved", path, flush=True)
    print("CONCEPTS DONE", flush=True)
