from PIL import Image

def analyze():
    for name in ["char.png", "char_1.png", "char_2.png"]:
        try:
            img = Image.open(f"s:/cs105_graphic/do_an/source/src/resources/{name}")
            print(f"{name}: size={img.size}, mode={img.mode}")
        except Exception as e:
            print(f"Error {name}: {e}")

if __name__ == "__main__":
    analyze()
