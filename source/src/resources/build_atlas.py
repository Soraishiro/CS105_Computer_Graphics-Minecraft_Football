import os
from PIL import Image

def build_atlas():
    base_atlas_path = "s:/cs105_graphic/do_an/source/src/resources/terrain/terrain.png"
    assets_dir = "s:/cs105_graphic/do_an/source/src/resources/stadium_assets"
    output_path = "s:/cs105_graphic/do_an/source/src/resources/terrain/terrain_stadium.png"

    # Ensure output dir exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    try:
        atlas = Image.open(base_atlas_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to open base atlas: {e}")
        return

    atlas_width, atlas_height = atlas.size
    cols, rows = 16, 16
    tile_w = atlas_width // cols
    tile_h = atlas_height // rows
    
    print(f"Atlas size: {atlas.size}, Tile size: {tile_w}x{tile_h}")

    # We start assigning new assets from slot 200
    start_slot = 200
    current_slot = start_slot

    asset_map = {}

    for filename in sorted(os.listdir(assets_dir)):
        if filename.endswith(".png") and not filename.startswith("."):
            filepath = os.path.join(assets_dir, filename)
            try:
                img = Image.open(filepath).convert("RGBA")
                # Resize if necessary
                if img.size != (tile_w, tile_h):
                    img = img.resize((tile_w, tile_h), Image.NEAREST)
                
                # Calculate position
                col = current_slot % cols
                row = current_slot // cols
                x = col * tile_w
                y = row * tile_h
                
                # Paste the asset
                atlas.paste(img, (x, y), img) # Use img as mask to preserve transparency
                
                asset_map[filename] = current_slot
                print(f"Added {filename} to slot {current_slot} (x:{x}, y:{y})")
                
                current_slot += 1
                if current_slot >= 256:
                    print("Warning: Ran out of texture slots in atlas!")
                    break
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    atlas.save(output_path)
    print(f"Successfully generated new atlas at {output_path}")

    # Generate a JS file with the mappings for easier block registration
    js_mappings_path = "s:/cs105_graphic/do_an/source/src/js/net/minecraft/client/world/block/StadiumTextureMappings.js"
    with open(js_mappings_path, "w") as f:
        f.write("export const StadiumTextures = {\n")
        for name, slot in asset_map.items():
            key = name.replace(".png", "").replace("-", "_").upper()
            # if starts with number, remove it
            if key[0].isdigit():
                parts = key.split("_", 1)
                if len(parts) > 1:
                    key = parts[1]
            f.write(f"    {key}: {slot},\n")
        f.write("};\n")
    print(f"Generated mappings at {js_mappings_path}")

if __name__ == "__main__":
    build_atlas()
