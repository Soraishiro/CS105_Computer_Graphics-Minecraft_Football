# Tài liệu kỹ thuật

---

## 1. Lý thuyết tổng quan

### 1.1 Mô hình Minecraft-clone (WebGL)

Dự án sử dụng kiến trúc **Minecraft-clone** chạy trên nền **Three.js** (WebGL). Thế giới được chia thành các **chunk** (khối 16×16 block). Mỗi chunk được tạo thủ tục bởi một *world generator*.

```
Trình duyệt
 └── Three.js WebGL Renderer
      └── Scene (3D world)
           ├── ChunkSection mesh (solid blocks)
           ├── ChunkSection mesh (translucent blocks)
           └── Entity mesh (player, ball, NPCs)
```

### 1.2 Hệ tọa độ

```
       +Y (lên cao)
        |
        |
        +-------> +X  (dọc sân: goal ← → goal)
       /
      /
    +Z  (ngang sân: touchline ← → touchline)
```

- **Origin (0,0,0)**: tâm sân, mặt cỏ tại `Y = seaLevel = 64`
- **1 block = 2 m** (scale 50% so với tiêu chuẩn FIFA)
- **Pitch**: `X ∈ [-30, +30]`, `Z ∈ [-21, +21]` (Đã tăng thêm 8 block mỗi chiều từ v5.1)

### 1.3 Texture Atlas

Toàn bộ texture được đóng gói vào **một ảnh duy nhất** `terrain_stadium.png` (256×256 px, lưới 16×16 ô, mỗi ô 16px).

```
Slot ID → vị trí trong atlas:
  col = ID % 16      → pixel_x = col * 16
  row = floor(ID/16) → pixel_y = row * 16
```

**Bảng block ID quan trọng:**

| Block                | ID  | Texture Slot | File asset                         |
|----------------------|-----|--------------|------------------------------------|
| `TURF_DARK`          | 100 | 200          | `01_dark_turf_block.png`           |
| `TURF_LIGHT`         | 101 | 201          | `02_light_turf_block.png`          |
| `PITCH_LINE`         | 102 | 215          | `16_light_concrete_block.png`      |
| `GOAL_POST`          | 103 | 206          | `07_goal_post_block.png`           |
| `GOAL_NET`           | 104 | 208          | `09_goal_net_texture.png`          |
| `SEAT_RED`           | 105 | 212          | `13_red_seat_block.png`            |
| `CONCRETE_LIGHT`     | 107 | 215          | `16_light_concrete_block.png`      |
| `CONCRETE_DARK`      | 108 | 216          | `17_dark_concrete_block.png`       |
| `SEAT_GREEN` (teal)  | 114 | 214          | `15_teal_seat_block.png`           |
| `CORNER_ARC`         | 113 | 205          | `06_corner_arc_tile.png`           |

---

## 2. Sơ đồ kiến trúc code

```
source/
├── index.html                    ← Entry point, HUD HTML
├── style.css                     ← Toàn bộ CSS (HUD, font)
└── src/
    ├── resources/
    │   ├── terrain/
    │   │   └── terrain_stadium.png   ← Texture atlas (stitched at runtime)
    │   └── stadium_assets/
    │       └── 01~39_*.png           ← Các asset texture gốc
    │
    └── js/
        ├── Start.js                  ← Entry JS, load texture → stitch atlas → boot Minecraft
        └── net/minecraft/client/
            ├── Minecraft.js          ← Game loop chính, spawn world/player/entities
            ├── GameSettings.js       ← Cài đặt: FOV, viewDistance, keybinds...
            ├── GameWindow.js         ← Xử lý input chuột, bàn phím, resize
            │
            ├── world/
            │   ├── World.js          ← Quản lý entity + chunk + lighting
            │   ├── Chunk.js          ← 1 chunk = 16 ChunkSection xếp chồng
            │   ├── ChunkSection.js   ← Render 1 section, 2 pass (solid + translucent)
            │   ├── block/
            │   │   ├── Block.js              ← Base class block
            │   │   ├── BlockRegistry.js      ← Đăng ký & tra cứu block theo ID
            │   │   ├── StadiumTextureMappings.js  ← Map tên → slot ID atlas
            │   │   └── type/
            │   │       ├── BlockTurf.js      ← Block cỏ/ghế thường
            │   │       ├── BlockGoalPost.js  ← Cột khung thành (trắng, solid)
            │   │       ├── BlockGoalNet.js   ← Lưới (translucent, alphaTest)
            │   │       ├── BlockCornerFlag.js← Cột cờ góc
            │   │       └── BlockFlagTop.js   ← Đỉnh cờ
            │   └── generator/
            │       └── StadiumGenerator.js   ← CORE: Tạo toàn bộ sân
            │
            ├── entity/
            │   ├── Entity.js         ← Base class entity
            │   ├── EntityLiving.js   ← Entity có vật lý (trọng lực, va chạm)
            │   ├── PlayerEntity.js   ← Người chơi: input, fly, sprint
            │   ├── PlayerEntityMultiplayer.js ← NPC/multiplayer (dùng cho sub players)
            │   └── BallEntity.js     ← Quả bóng
            │
            └── render/
                ├── WorldRenderer.js  ← Điều phối render chunks + entities + sky
                ├── BlockRenderer.js  ← Render từng face của block (UV, lighting)
                └── Tessellator.js    ← Buffer geometry, material (alphaTest: 0.1)
```

---

## 3. Luồng khởi động

```
index.html
  └── Start.js → launch()
        1. loadTextures([...])           // tải các PNG
        2. buildStadiumAtlas(resources)  // stitching atlas 256×256
        3. new Minecraft(canvasId, resources)
              ├── new World() + new ChunkProviderGenerate(world, seed)
              ├── loadWorld(world)
              │     ├── createPlayer()
              │     ├── world.addEntity(player)
              │     ├── world.loadSpawnChunks()
              │     ├── new BallEntity() → addEntity
              │     └── 6× new PlayerEntity() (substitutions) → addEntity
              └── init() → requestNextFrame() → game loop
```

---

## 4. StadiumGenerator — Tham chiếu hàm

File: `src/js/net/minecraft/client/world/generator/StadiumGenerator.js`

### 4.1 Constructor & Constants

```js
constructor(world, seed)
```

**Chỉnh được:**

| Thuộc tính        | Giá trị | Ý nghĩa                                         |
|-------------------|---------|-------------------------------------------------|
| `this.halfLength` | `30`    | Nửa chiều dài sân (block). Tổng = 60 blocks     |
| `this.halfWidth`  | `21`    | Nửa chiều ngang sân. Tổng = 42 blocks           |
| `this.goalHalfWidth` | `4` | Nửa bề ngang khung thành (cột cách tâm 4 block) |
| `this.goalHeight` | `3`     | Chiều cao khung thành (block)                   |
| `this.goalDepth`  | `3`     | Độ sâu lưới phía sau khung thành               |
| `this.STAND_MARGIN` | `9`  | Khoảng trống từ vạch biên đến hàng ghế đầu tiên (Ap-ron 8 block) |
| `this.STAND_TIERS` | `6`   | Số tầng ghế khán đài                           |
| `this.STAND_SLOPE` | `2`   | Blocks ngang / 1 bậc lên (càng nhỏ = càng dốc) |
| `this.seaLevel`   | `64`    | Độ cao mặt sân (Y absolute)                    |

---

### 4.2 `generateInChunk(chunk)`

Hàm chính được gọi cho **mỗi chunk** khi tải. Duyệt toàn bộ 16×16 cột block trong chunk, gọi:
- `_setSurface()` — đặt block mặt đất
- `_generateGoals()` — đặt khung thành
- `_generateCornerFlags()` — đặt cột cờ góc

---

### 4.3 `_setSurface(chunk, lx, wx, lz, wz)`

Quyết định block **mặt đất** tại cột `(wx, wz)`:

```
_isOnPitch?
  ├── _isCornerArc?  → CORNER_ARC (vòng tròn góc)
  ├── _isPitchMarking? → PITCH_LINE (vạch sân trắng)
  └── else → TURF_DARK / TURF_LIGHT (sọc cỏ xen kẽ mỗi 5 block)

_isStadiumFloor?
  ├── TURF_DARK (viền xanh đậm quanh sân)
  ├── _generateStands() → xây khán đài
  └── _generateTunnelArch() → xây vòm đường hầm

else → TURF_DARK (ngoài sân)
```

**Để đổi màu viền sân** (apron): thay `BlockRegistry.TURF_DARK` thành block khác ở dòng:
```js
chunk.setBlockAt(lx, sl, lz, BlockRegistry.TURF_DARK.getId());
```

---

### 4.4 `_isPitchMarking(x, z)` → `boolean`

Trả về `true` nếu tọa độ `(x, z)` nằm trên một **vạch kẻ sân**. Bao gồm:
- Vạch biên ngoài (4 cạnh)
- Vạch giữa sân (`x = 0`)
- Vòng tròn giữa sân (bán kính 5)
- Vùng cấm lớn (8×16 block mỗi đầu)
- Vùng cấm nhỏ / goal box (3×6 block mỗi đầu)
- Chấm phạt đền (5 block từ vạch gôn)
- Vòng cung phạt đền (bán kính 4 từ chấm phạt đền)

**Để thêm vạch mới:** thêm điều kiện `if (...)  return true;` trong hàm này.

---

### 4.5 `_isCornerArc(x, z)` → `boolean`

Trả `true` cho đúng 4 góc sân, dùng block `CORNER_ARC` (texture vòng cung góc).

**Để mở rộng vùng cung góc**: đổi điều kiện từ `===` sang `<=` với epsilon.

---

### 4.6 `_generateStands(chunk, lx, wx, lz, wz)`

Xây khán đài theo **tier** (bậc):

```
dist = khoảng cách từ vạch biên
tier = floor((dist - STAND_MARGIN) / STAND_SLOPE)

Nếu tier >= STAND_TIERS → bỏ qua (ngoài khán đài)
Nếu |dX - dZ| <= 1      → bỏ qua (góc khán đài, khoảng hở)
Nếu _isAisle()          → bỏ qua (lối đi)

tier == STAND_TIERS-1   → PITCH_LINE (viền trắng đỉnh)
else                    → CONCRETE_DARK bên dưới + seat block trên đỉnh
```

**Để thêm tầng:** tăng `STAND_TIERS`. Để đổi độ dốc: tăng/giảm `STAND_SLOPE`.

---

### 4.7 `_seatColour(wx, wz, isGoalSide, tier)` → `blockId`

Trả về block ID của **ghế ngồi** tại vị trí đó:

| Điều kiện              | Block trả về   | Màu           |
|------------------------|----------------|---------------|
| `isGoalSide = true`    | `SEAT_RED`     | Đỏ (2 đầu gôn)|
| `isGoalSide = false`   | `SEAT_GREEN`   | Xanh lá (2 bên dọc) |

**Để đổi màu khán đài dọc** → sửa `BlockRegistry.SEAT_GREEN` thành block khác:
```js
// Trong _seatColour:
return BlockRegistry.SEAT_GREEN.getId();  // ← đổi ở đây
```

**Để đổi màu khán đài đầu gôn:**
```js
return BlockRegistry.SEAT_RED.getId();    // ← đổi ở đây
```

---

### 4.8 `_isAisle(wx, wz, isGoalSide)` → `boolean`

Chia mỗi mặt khán đài thành **4 phần** (3 lối đi). Hiện tại lối đi = **không đặt block** (empty air).

**Để đổi số lối đi:** thay `4` thành số khác trong `Math.floor(span / 4)`.
**Để render lối đi bằng block thay vì để trống:** trong `_generateStands`, xóa dòng `if (this._isAisle(...)) return;` và xử lý riêng.

---

### 4.9 `_generateTunnelArch(chunk, lx, wx, lz, wz)`

Xây **vòm cổng đường hầm** dạng khung thành tại vị trí `Z = -(halfWidth + 1)`:

```
wz == archZ và |wx| <= 4:
  wx == ±3      → cột đứng GOAL_POST cao archHeight block
  |wx| < 3      → xà ngang GOAL_POST tại đỉnh
```

**Để dời tunnel sang đầu khác (±X):** đổi điều kiện `wz` thành `wx` và điều chỉnh tọa độ.
**Để thay đổi chiều cao vòm:** đổi `let archHeight = 4;`

---

### 4.10 `_buildGoalAt(chunk, lx, wx, lz, wz, goalLineX, dir)`

Xây **1 khung thành + lưới** tại `X = goalLineX`:

```
d = (wx - goalLineX) * dir  (khoảng cách phía sau vạch gôn)

d == 0:
  |wz| == hw    → cột đứng GOAL_POST (y: 1..h)
  |wz| < hw     → xà ngang GOAL_POST (tại y=h)

d in [1..dep]:
  roofY = h - d + 1   (lưới nghiêng dần về phía sau)
  |wz| == hw    → tường lưới bên (y: 1..roofY)
  |wz| < hw     → nóc lưới nghiêng (y = roofY)
```

**Để đổi kiểu lưới (phẳng thay vì nghiêng):** xóa `roofY` và dùng cố định `y: 1..h`.

---

### 4.11 `_generateCornerFlags(chunk, lx, wx, lz, wz)`

Đặt cột cờ góc tại đúng 4 góc pitch:
- 2 block `CORNER_FLAG` (thân cột)
- 1 block `FLAG_TOP` (đỉnh cờ)

---

## 5. BlockRegistry — Thêm block mới

File: `src/js/net/minecraft/client/world/block/BlockRegistry.js`

### Quy trình thêm 1 block mới:

```js
// 1. Thêm vào StadiumTextureMappings.js
export const StadiumTextures = {
    ...
    MY_NEW_BLOCK: 240,   // ← slot chưa dùng (200-255)
};

// 2. Thêm ảnh vào Start.js SLOT_MAP
240: 'stadium_assets/my_texture.png',

// 3. Đặt ảnh vào thư mục
source/src/resources/stadium_assets/my_texture.png

// 4. Đăng ký block trong BlockRegistry.create()
BlockRegistry.MY_BLOCK = new BlockTurf(115, StadiumTextures.MY_NEW_BLOCK);

// 5. Dùng trong StadiumGenerator
chunk.setBlockAt(lx, y, lz, BlockRegistry.MY_BLOCK.getId());
```

### Chọn class block phù hợp:

| Class           | Dùng khi                                      |
|-----------------|-----------------------------------------------|
| `BlockTurf`     | Block solid thông thường (ghế, cỏ, bê tông)  |
| `BlockGoalNet`  | Block trong suốt (lưới, kính)                |
| `BlockGoalPost` | Block trắng solid (cột, xà)                  |
| `BlockGlass`    | Block có `isTranslucent()` (vanilla glass)   |

---

## 6. GameSettings — Cài đặt nhanh

File: `src/js/net/minecraft/client/GameSettings.js`

| Thuộc tính       | Mặc định | Ý nghĩa                                           |
|------------------|----------|---------------------------------------------------|
| `viewDistance`   | `8`      | Số chunk render xung quanh (tăng = thấy xa hơn, nặng hơn) |
| `fov`            | `70`     | Field of view (độ)                               |
| `ambientOcclusion` | `true` | Đổ bóng góc (tắt để sáng hơn, nhẹ hơn)         |
| `sensitivity`    | `100`    | Độ nhạy chuột                                    |
| `viewBobbing`    | `true`   | Hiệu ứng rung camera khi đi bộ                  |

---

## 7. Minecraft.js — Spawn entity

File: `src/js/net/minecraft/client/Minecraft.js`

### Spawn entity mới:

```js
// Sau khi world được load (trong loadWorld):
import MyEntity from ".../MyEntity.js";

let e = new MyEntity(this, this.world, uniqueId);
e.setPosition(x, y, z);
this.world.addEntity(e);
```

### 6 cầu thủ dự bị (substitutions):

```js
for (let i = 0; i < 6; i++) {
    let sub = new PlayerEntity(this, this.world, 200 + i);
    sub.username = "Sub " + (i + 1);
    let x = (i < 3) ? -4.5 - (i * 1.5) : 4.5 + ((i - 3) * 1.5);
    let z = -20; // ← đổi z để dời vị trí đứng
    sub.setPosition(x, this.world.getHeightAt(x, z) + 1, z);
    this.world.addEntity(sub);
}
```

**Để dời vị trí spawn player (camera ban đầu):** chỉnh trong `StadiumGenerator.constructor`:
```js
this.world.spawn.x = 0;  // ← X
this.world.spawn.z = 0;  // ← Z
```

---

## 8. Cấu trúc atlas texture (quan trọng để debug)

```
terrain_stadium.png (256×256)

Row 12 (py=192): slot 192-207
Row 13 (py=208): slot 208-223  ← GOAL_NET tại slot 208, px=0
Row 14 (py=224): slot 224-239
Row 15 (py=240): slot 240-255

Xem nhanh slot N đang render gì:
  px = (N % 16) * 16
  py = floor(N / 16) * 16
```

---

## 9. Checklist tự chỉnh nhanh

| Muốn làm gì                         | Sửa ở đâu                                      |
|--------------------------------------|------------------------------------------------|
| Đổi màu khán đài dọc               | `StadiumGenerator._seatColour()` → `SEAT_GREEN` |
| Đổi màu khán đài đầu gôn           | `StadiumGenerator._seatColour()` → `SEAT_RED`  |
| Thêm/bớt tầng khán đài             | `this.STAND_TIERS` trong constructor           |
| Thay đổi độ dốc khán đài           | `this.STAND_SLOPE` (nhỏ = dốc hơn)            |
| Đổi kích thước khung thành         | `goalHalfWidth`, `goalHeight`, `goalDepth`     |
| Thêm vạch kẻ sân                   | `StadiumGenerator._isPitchMarking()`           |
| Thêm block texture mới             | Xem Mục 5                                      |
| Đổi góc nhìn ban đầu               | `world.spawn` trong constructor                |
| Tăng render distance               | `GameSettings.viewDistance`                    |
| Dời vị trí tunnel/cổng vòm         | `StadiumGenerator._generateTunnelArch()`       |
| Dời vị trí cầu thủ dự bị          | `Minecraft.js` block spawn substitutions       |

---

## 10. Giải thích chi tiết logic và cơ chế cốt lõi

### 10.1 Khối khán đài và cơ chế đặt màu (Spectator Stands Seating)

Khán đài của sân vận động được sinh hoàn toàn bằng **thuật toán thủ tục (Procedural Generation)** trong hàm `_generateStands` của lớp `StadiumGenerator.js`.

#### Thuật toán dựng hình hình học
Khán đài được xây dựng dựa trên khoảng cách từ cột block hiện tại tới vạch biên của sân cỏ (sử dụng **khoảng cách Chebyshev** - lấy giá trị lớn nhất giữa khoảng cách theo trục X và Z):
```javascript
_distFromPitchEdge(wx, wz) {
    let dX = Math.abs(wx) - this.halfLength;
    let dZ = Math.abs(wz) - this.halfWidth;
    return Math.max(dX, dZ);
}
```
Khi duyệt qua các tọa độ `(wx, wz)`, thuật toán hoạt động như sau:
1. **Xác định tầng khán đài (Tier row):** Khoảng trống từ biên sân tới khán đài được xác định bởi `this.STAND_MARGIN = 4`. Nếu khoảng cách `dist < 4`, khu vực đó là hành lang bao quanh sân (apron). Nếu `dist >= 4`, thuật toán tính toán xem block đang nằm ở tầng ghế thứ mấy:
   ```javascript
   let standDist = dist - this.STAND_MARGIN; // Khoảng cách đi vào vùng khán đài
   let tier = Math.floor(standDist / this.STAND_SLOPE); // STAND_SLOPE = 2 (cứ 2 block ngang thì lên 1 tầng dọc)
   ```
2. **Xác định độ cao khán đài (Height):** Độ cao được ánh xạ trực tiếp từ chỉ số tầng: `height = tier + 1` (các tầng từ `0` đến `5` tương đương độ cao nâng lên từ `1` đến `6` block).
3. **Cơ cấu chịu lực dưới khán đài:** Thay vì chỉ đặt một block ghế bay lơ lửng, thuật toán tự động xây dựng phần kết cấu nâng đỡ bằng bê tông xám đậm bên dưới ghế:
   ```javascript
   // Xây dựng kết cấu bê tông xám đậm bên dưới ghế ngồi
   for (let y = 1; y < height; y++) {
       chunk.setBlockAt(lx, sl + y, lz, BlockRegistry.CONCRETE_DARK.getId());
   }
   ```
4. **Tạo khe hở góc sân (Corner Gaps):** Để khán đài trông chân thực và không bị giao nhau chồng chéo ở góc, một khoảng trống đường chéo rộng 3 block được để trống:
   ```javascript
   if (Math.abs(dX - dZ) <= 1) return; // Khoảng hở chéo 3 block ở 4 góc khán đài
   ```
5. **Lối đi bậc thang (Aisles):** Các lối đi chia dọc khán đài được tính toán bằng hàm `_isAisle` để bỏ qua việc đặt block ghế ngồi, tạo khoảng hở chân thực:
   ```javascript
   if (this._isAisle(wx, wz, isGoalSide)) return;
   ```

#### Cơ chế phân bổ màu sắc ghế (`_seatColour`)
Màu sắc của ghế được quyết định dựa trên việc vị trí đó thuộc **Khán đài dọc biên (Sideline stands)** hay **Khán đài sau khung thành (Goal-end stands)**:
```javascript
_seatColour(wx, wz, isGoalSide, tier) {
    if (isGoalSide) {
        return BlockRegistry.SEAT_RED.getId();    // Khán đài đầu gôn: Ghế ĐỎ (Solid Red)
    } else {
        return BlockRegistry.SEAT_GREEN.getId();  // Khán đài dọc biên: Ghế XANH LÁ ĐẬM (Teal)
    }
}
```
* **Khán đài dọc biên (`isGoalSide = false`)**: Được ánh xạ tới block `SEAT_GREEN` (ID 114), sử dụng texture `teal_seat_block.png` để tạo màu xanh lá đậm ánh xanh mướt mắt đặc trưng của các sân vận động hiện đại.
* **Khán đài đầu gôn (`isGoalSide = true`)**: Được ánh xạ tới block `SEAT_RED` (ID 105), sử dụng texture `red_seat_block.png`.

---

### 10.2 Khối màu trắng biên sân & Cách đổi sang màu xanh lá đậm (Apron / Boundary Block)

Khối màu trắng chạy dọc bao quanh rìa ngoài sân cỏ thực chất chính là **Vạch biên ngoài của sân (Touchlines & Goal lines)**.

#### Tại sao khối này có màu trắng?
Trong hàm `_setSurface` của `StadiumGenerator.js`, bề mặt sân cỏ được kiểm tra:
```javascript
if (this._isOnPitch(wx, wz)) {
    if (this._isCornerArc(wx, wz)) {
        chunk.setBlockAt(lx, sl, lz, BlockRegistry.CORNER_ARC.getId());
    } else if (this._isPitchMarking(wx, wz)) {
        chunk.setBlockAt(lx, sl, lz, BlockRegistry.PITCH_LINE.getId()); // Đặt vạch biên màu trắng
    } else { ... }
}
```
Trong hàm `_isPitchMarking(x, z)` xác định các đường biên ngoài:
```javascript
// Đường biên dọc (Touchlines) và biên ngang (Goal lines)
if (Math.abs(Math.abs(x) - this.halfLength) < E) return true;
if (Math.abs(Math.abs(z) - this.halfWidth)  < E) return true;
```
Khi các tọa độ biên này trả về `true`, hệ thống đặt block `BlockRegistry.PITCH_LINE` (ID 102). Trong `BlockRegistry.js`, nó được gán texture `LIGHT_CONCRETE_BLOCK` (bê tông trắng sáng) nên hiển thị thành một dải block màu trắng nổi bật ngăn cách giữa vùng cỏ trong sân bóng và vùng hành lang bên ngoài.

#### Cách đổi sang khối màu xanh lá đậm
Có **hai cách** để thay đổi khối này sang màu xanh lá đậm (`BlockRegistry.TURF_DARK`):

* **Cách A: Đổi trực tiếp ánh xạ Texture trong `BlockRegistry.js` (Ảnh hưởng toàn bộ vạch kẻ sân)**
  Mở `BlockRegistry.js` và thay đổi texture gán cho `PITCH_LINE` từ `LIGHT_CONCRETE_BLOCK` sang `DARK_TURF_BLOCK`:
  ```javascript
  // Trước:
  BlockRegistry.PITCH_LINE = new BlockTurf(102, StadiumTextures.LIGHT_CONCRETE_BLOCK);

  // Sau khi đổi:
  BlockRegistry.PITCH_LINE = new BlockTurf(102, StadiumTextures.DARK_TURF_BLOCK);
  ```

* **Cách B: Chỉ đổi riêng viền biên ngoài của sân trong `StadiumGenerator.js` (Giữ nguyên các vạch kẻ trong sân như vòng tròn giữa sân, vòng cấm địa vẫn màu trắng)**
  Mở `StadiumGenerator.js` và sửa đoạn kiểm tra biên ngoài trong hàm `_isPitchMarking(x, z)` để tách nó ra, sau đó vẽ bằng `BlockRegistry.TURF_DARK` trong `_setSurface`:
  1. Loại bỏ kiểm tra biên ngoài khỏi `_isPitchMarking`:
     ```javascript
     // Xóa hoặc comment 2 dòng này trong _isPitchMarking:
     // if (Math.abs(Math.abs(x) - this.halfLength) < E) return true;
     // if (Math.abs(Math.abs(z) - this.halfWidth)  < E) return true;
     ```
  2. Bổ sung logic vẽ riêng viền biên ngoài bằng cỏ đậm (`BlockRegistry.TURF_DARK`) hoặc xanh lá đậm trong `_setSurface`:
     ```javascript
     let E = 0.5;
     let isOuterBoundary = Math.abs(Math.abs(wx) - this.halfLength) < E || Math.abs(Math.abs(wz) - this.halfWidth) < E;
     
     if (isOuterBoundary) {
         chunk.setBlockAt(lx, sl, lz, BlockRegistry.TURF_DARK.getId()); // Đổi sang cỏ đậm
     }
     ```

---

### 10.3 Vị trí đặt cột cờ góc & Lý do đặt lệch ra khỏi mặt sân màu xanh

#### Vị trí đặt cột cờ góc trong mã nguồn
Trong `StadiumGenerator.js`:
```javascript
_generateCornerFlags(chunk, lx, wx, lz, wz) {
    let corners = [
        [+this.halfLength, +this.halfWidth],
        [+this.halfLength, -this.halfWidth],
        [-this.halfLength, +this.halfWidth],
        [-this.halfLength, -this.halfWidth],
    ];

    for (let [cx, cz] of corners) {
        if (wx === cx && wz === cz) {
            // Thân cột cờ trắng cao 2 block
            chunk.setBlockAt(lx, this.seaLevel + 1, lz, BlockRegistry.CORNER_FLAG.getId());
            chunk.setBlockAt(lx, this.seaLevel + 2, lz, BlockRegistry.CORNER_FLAG.getId());
            // Lá cờ đỏ ở đỉnh cao thêm 1 block
            chunk.setBlockAt(lx, this.seaLevel + 3, lz, BlockRegistry.FLAG_TOP.getId());
        }
    }
}
```
Cột cờ góc được sinh ra tại tọa độ chính xác: `x = ±halfLength` (±26) và `z = ±halfWidth` (±17). 

#### Tại sao cột cờ lại đặt đè lên khối màu trắng biên ngoài (lệch ra ngoài sân xanh)?
Điều này hoàn toàn đúng với **Luật thi đấu bóng đá của FIFA (FIFA Laws of the Game — Law 1: The Field of Play)**:
1. **Quy định FIFA:** Cột cờ góc phải được đặt chính xác tại giao điểm của đường biên dọc (touchline) và đường biên ngang (goal line). 
2. **Quy định đường kẻ sân:** Tất cả các đường kẻ sân (vạch biên ngoài) đều là một phần thuộc diện tích sân bóng. 
3. **Mã nguồn thực thi:** Vì đường biên ngoài được kẻ bằng khối bê tông trắng sáng (`BlockRegistry.PITCH_LINE`) tại tọa độ `x = ±26` và `z = ±17`, nên các tọa độ của cột cờ góc trùng khớp hoàn toàn trên vạch kẻ trắng này.
4. **Vòng cung góc sân (Corner Arc):** Góc sút phạt góc thực tế vẽ lùi vào trong sân 1 block (`x = ±25`, `z = ±16`):
   ```javascript
   _isCornerArc(x, z) {
       return Math.abs(x) === this.halfLength - 1 && Math.abs(z) === this.halfWidth - 1;
   }
   ```
   Do đó, cột cờ đứng ở điểm mút ngoài cùng góc sân (trên nền vạch trắng), còn cung phạt góc thì nằm lùi lại bên trong mặt cỏ xanh. Điều này tạo nên sự bất đối xứng vô cùng chân thực và chính xác so với ngoài đời thực.

---

### 10.4 Vật lý Game (Chuyển động, nảy bóng và cơ chế sút bóng)

Vật lý của quả bóng được điều khiển độc lập thông qua lớp `BallEntity.js`, kế thừa các hành vi va chạm không gian (AABB collision) từ lớp cơ sở `Entity.js`.

#### Phương trình vi phân mô phỏng chuyển động bóng
Tại mỗi tick cập nhật khung hình (`onUpdate()`), vật lý bóng tính toán các lực tác động cơ bản bao gồm Trọng lực, Lực cản không khí và Ma sát mặt đất:
```javascript
// 1. Trọng lực kéo bóng xuống dưới (Gia tốc rơi tự do y-axis)
this.motionY -= 0.04;

// 2. Lực cản không khí (Air Resistance làm chậm bóng dần khi bay)
this.motionX *= this.airResistance; // airResistance = 0.99 (giữ 99% vận tốc)
this.motionY *= 0.98;               // Giảm vận tốc dọc nhẹ
this.motionZ *= this.airResistance;
```

#### Thuật toán va chạm và phản lực nảy (Elastic Bounding Box Collision)
Bóng di chuyển trong không gian bằng phương thức `moveCollide` để phát hiện và ngăn cản bóng đi xuyên qua các block solid:
```javascript
let prevMotionX = this.motionX;
let prevMotionY = this.motionY;
let prevMotionZ = this.motionZ;

// Tính toán va chạm thực tế với lưới trục AABB của block
this.moveCollide(this.motionX, this.motionY, this.motionZ);
```
Nếu có va chạm xảy ra trên bất kỳ trục nào, vận tốc thực tế của bóng trục đó sẽ bị triệt tiêu (về `0` hoặc rất nhỏ). Bằng cách so sánh vận tốc mong muốn trước khi va chạm (`prevMotion`) và vận tốc sau va chạm thực tế, hệ thống xác định được mặt va chạm và thực hiện **phản lực nảy**:
```javascript
if (Math.abs(prevMotionX - this.motionX) > 0.001) {
    this.motionX = -prevMotionX * this.restitution; // restitution = 0.7 (nảy lại 70% lực)
}
if (Math.abs(prevMotionY - this.motionY) > 0.001) {
    this.motionY = -prevMotionY * this.restitution;
    // Ngăn chặn rung lắc nhẹ liên tục khi vận tốc quá nhỏ (jittering)
    if (Math.abs(this.motionY) < 0.05) this.motionY = 0;
}
if (Math.abs(prevMotionZ - this.motionZ) > 0.001) {
    this.motionZ = -prevMotionZ * this.restitution;
}
```

#### Ma sát mặt đất (Ground Friction)
Nếu quả bóng đang lăn hoặc chạm trên mặt đất (`this.onGround === true`), vận tốc di chuyển X-Z của bóng sẽ chịu lực ma sát và suy giảm nhanh hơn so với khi bay trên không:
```javascript
if (this.onGround) {
    this.motionX *= this.friction; // friction = 0.98
    this.motionZ *= this.friction;
}
```

#### Cơ chế va chạm và sút bóng của cầu thủ (`checkPlayerCollision`)
Bóng liên tục kiểm tra va chạm với hộp giới hạn (Bounding Box) của Player:
```javascript
checkPlayerCollision() {
    let player = this.minecraft.player;
    if (!player) return;

    // Kiểm tra giao cắt không gian giữa bóng và Player
    if (this.boundingBox.intersects(player.boundingBox)) {
        // 1. Tính toán hướng đẩy (Đẩy bóng ra xa tâm Player)
        let dx = this.x - player.x;
        let dz = this.z - player.z;
        let length = Math.sqrt(dx * dx + dz * dz);

        if (length > 0) {
            dx /= length; // Chuẩn hóa vector hướng đẩy
            dz /= length;

            // 2. Truyền vận tốc sút (Kick!)
            let kickPower = 0.5;
            this.motionX += dx * kickPower;
            this.motionZ += dz * kickPower;
            
            // 3. Hiệu ứng sút bổng nhẹ nếu bóng đang lăn sệt dưới mặt đất
            if (this.onGround) {
                this.motionY = 0.2;
            }
        }
    }
}
```

---

### 10.5 Giao diện Inventory Creative, cơ chế Phá block và Tạo block

Hệ thống quản lý vật phẩm và tương tác kiến tạo thế giới tuân thủ chặt chẽ kiến trúc lõi của Minecraft cổ điển.

#### Giao diện Inventory Creative
Lớp `GuiContainerCreative.js` và `ContainerCreative.js` quản lý UI kho đồ sáng tạo:
* **Thu thập danh sách block:** Khi khởi tạo, nó quét qua toàn bộ các block đã đăng ký trong hệ thống để tự động đưa vào kho đồ:
  ```javascript
  initItems() {
      Block.blocks.forEach((block) => {
          this.itemList.push(block.getId());
      });
  }
  ```
* **Lưới phân trang (Grid Slots layout):** Kho đồ Creative chia thành **5 hàng × 9 cột = 45 ô vật phẩm**, và dưới cùng là **1 hàng hotbar × 9 ô**. Tương tác nhấp chuột (`onSlotClick`) cho phép nhấc block và gắn vào con trỏ chuột (`itemInCursor`) để kéo thả dễ dàng.

#### Cơ chế Ray-Casting phát hiện Block
Khi người chơi bấm chuột ngoài thế giới, hệ thống phát ra một tia từ camera (Ray-cast) kéo dài tối đa 5 mét để kiểm tra va chạm vật lý với các khối block:
```javascript
let hitResult = this.player.rayTrace(5, this.timer.partialTicks);
```

#### Cơ chế Phá Block (Chuột trái - Left Click / Button 0)
Trong `Minecraft.js`:
```javascript
if (button === 0) { // Chuột trái
    if (hitResult != null) {
        let typeId = this.world.getBlockAt(hitResult.x, hitResult.y, hitResult.z);
        let block = Block.getById(typeId);

        if (typeId !== 0) {
            this.soundManager.playSound(block.getSound().getBreakSound(), hitResult.x + 0.5, hitResult.y + 0.5, hitResult.z + 0.5, 1.0, 1.0);
            this.particleRenderer.spawnBlockBreakParticle(this.world, hitResult.x, hitResult.y, hitResult.z);
            this.world.setBlockAt(hitResult.x, hitResult.y, hitResult.z, 0); // Đặt về Air (0)
        }
    }
    this.player.swingArm();
}
```

#### Cơ chế Tạo Block (Chuột phải - Right Click / Button 2)
Trong `Minecraft.js`:
```javascript
if (button === 2) { // Chuột phải
    if (hitResult != null) {
        let x = hitResult.x + hitResult.face.x;
        let y = hitResult.y + hitResult.face.y;
        let z = hitResult.z + hitResult.face.z;

        let placedBoundingBox = new BoundingBox(x, y, z, x + 1, y + 1, z + 1);

        if (!placedBoundingBox.intersects(this.player.boundingBox)) {
            let typeId = this.player.inventory.getItemInSelectedSlot();
            let prevTypeId = this.world.getBlockAt(x, y, z);

            if (typeId !== 0 && prevTypeId !== typeId) {
                this.world.setBlockAt(x, y, z, typeId); // Đặt block ID mới
                this.player.swingArm();
                let block = Block.getById(typeId);
                block.onBlockPlaced(this.world, x, y, z, hitResult.face);

                let sound = block.getSound();
                this.soundManager.playSound(sound.getStepSound(), hitResult.x + 0.5, hitResult.y + 0.5, hitResult.z + 0.5, 1.0, sound.getPitch() * 0.8);
            }
        }
    }
    this.worldRenderer.flushRebuild = true;
}
```

---

