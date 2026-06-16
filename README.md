# CS105

---

## Yêu cầu cài đặt

- Trình duyệt hỗ trợ WebGL (Chrome, Firefox, Edge)
- Python 3.x để chạy HTTP server cục bộ

## Cách chạy

```sh
cd source
python -m http.server 8000
```

Mở `http://localhost:8000/index.html`

---

## Điều khiển

| Phím                          | Tác dụng                   |
| ----------------------------- | -------------------------- |
| `W` `A` `S` `D`               | Di chuyển                  |
| `Space`                       | Nhảy                       |
| `Space ×2`                    | Bật/tắt chế độ bay         |
| `Space` / `Shift` _(khi bay)_ | Lên / Xuống                |
| `Ctrl` hoặc `W ×2`            | Chạy nhanh                 |
| Chuột                         | Xoay góc nhìn              |
| `F5`                          | Góc nhìn thứ nhất / thứ ba |
| `F3`                          | Debug overlay              |
| `E`                           | Kho đồ Creative            |
| `T`                           | Chat                       |
| `Esc`                         | Menu tạm dừng              |
| Chuột trái                    | Phá khối / Đá bóng         |
| Chuột phải                    | Đặt khối                   |

---

## Tính năng

### Đồ họa 3D cơ bản

Sử dụng Three.js để dựng các hình khối trong thế giới:

| Hình khối                       | Nơi sử dụng                                           |
| ------------------------------- | ----------------------------------------------------- |
| **Hình hộp** `BoxGeometry`      | Toàn bộ block, khung chạm block, đế cúp               |
| **Hình cầu** `SphereGeometry`   | Quả bóng (có texture + bump map), mặt trời, mặt trăng |
| **Hình trụ** `CylinderGeometry` | Chân cúp, thân cúp                                    |
| **Hình xuyến** `TorusGeometry`  | Quai cúp                                              |
| **Mặt phẳng** `PlaneGeometry`   | Nền trời, void layer                                  |

Ngoài ra còn 14 loại mob (bò, lợn, cừu, gà, sói, mèo, dân làng, creeper, enderman, zombie, skeleton, mực, slime, magmacube) được load từ file texture để làm khán giả trên khán đài.

### Phép chiếu phối cảnh

- `THREE.PerspectiveCamera` với FOV tùy chỉnh (50–100 độ), near = 0.001, far = 1000
- Điều chỉnh FOV qua menu Options
- Chuyển đổi giữa góc nhìn thứ nhất và thứ ba (phím `F5`)
- Camera góc thứ ba có ray-trace chống kẹt tường
- Tầm nhìn (view distance) tùy chỉnh 2–16 chunks

### Phép biến đổi Affine

- **Tịnh tiến**: Di chuyển tự do trong không gian 3D (WASD, nhảy, bay). Liên tục cập nhật tọa độ x, y, z
- **Quay**: Camera xoay tự do bằng chuột (yaw/pitch). Bóng có góc quay vật lý (quaternion-based rolling) khi lăn
- **Tỉ lệ**: Trophy được scale về kích thước phù hợp

> _Hạn chế hiện tại_: Chưa có giao diện chọn đối tượng và áp dụng Translate/Rotate/Scale trực tiếp. Biến đổi hiện tại là ngầm (qua player/camera) hoặc lập trình cứng (vật lý bóng, scale trophy).

### Ánh sáng

Hệ thống chiếu sáng kết hợp 4 loại nguồn:

| Loại                 | Mô tả                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **AmbientLight**     | Ánh sáng nền toàn cảnh, màu biến đổi theo chu kỳ ngày đêm                                       |
| **DirectionalLight** | Mặt trời (vàng ấm ban ngày → cam đỏ hoàng hôn → tắt ban đêm) và Mặt trăng (xanh lam, ngược pha) |
| **PointLight**       | Pool 50 đèn động gán vào block đuốc (REDSTONE_LAMP_ON) gần người chơi                           |
| **SpotLight**        | 4 đèn pha công suất cao trên cột đèn 4 góc sân, chiếu xuống mặt cỏ                              |

**Shadow Mapping:**

- `THREE.PCFSoftShadowMap` — bóng mềm
- Sun / Moon shadow map: 2048×2048 px, frustum 100×100 block
- Torch / SpotLight shadow map: 512×512 px
- Tất cả vật thể đều castShadow + receiveShadow

**Điều khiển ánh sáng:** Menu Lighting Settings với 3 tab (Global, Sun & Moon, Blocks) — mọi tham số có thể tinh chỉnh nóng, không cần tải lại trang.

### Texture Mapping

- **Atlas địa hình** `terrain_stadium.png` — tổng hợp texture cho tất cả loại block
- **Bóng đá** `football_2.png` + `football_bump.png` — color map + bump map
- **Mặt trời / trăng** `sun.png`, `moon.png`
- **Hạt mưa** `rain.png` — RepeatWrapping + UV animation
- **Mob** — 14 file texture riêng, composite qua pipeline

Tất cả dùng `THREE.NearestFilter` để giữ phong cách pixel.

### Hoạt cảnh

- **Vật lý bóng**: Trọng lực, nảy (restitution = 0.6), ma sát mặt đất, cản không khí, lăn (quaternion roll), va chạm với người chơi (đá bóng)
- **Chu kỳ ngày đêm**: Mặt trời và mặt trăng xoay quanh thế giới, ánh sáng và màu sắc thay đổi liên tục. Hoàng hôn/bình minh màu cam đỏ, đêm có sao
- **Thời tiết**: Mưa (hạt rơi + gió chéo + UV animation), sấm chớp (CSS flash), sương mù (giảm tầm nhìn tỉ lệ với cường độ mưa)
- **Khán giả tĩnh**: 14 loại mob trên khán đài, tối ưu render (không update mỗi tick)

---

## Cấu trúc thư mục

```
source/
  index.html
  style.css
  libraries/                  # Three.js, pako, AES, SHA1
  src/
    js/
      Start.js                # Entry point
      net/minecraft/client/
        Minecraft.js          # Game loop chính
        GameSettings.js       # Cấu hình (lưu cookie)
        GameWindow.js         # Canvas + sự kiện
        entity/
          BallEntity.js       # Vật lý + va chạm bóng
          PlayerEntity.js
        render/
          WorldRenderer.js    # Render thế giới, ánh sáng, trời, thời tiết
          BlockRenderer.js    # Render block voxel
          Tessellator.js      # Batch mesh builder
          entity/BallRenderer.js  # Sphere + texture + bump map
        world/
          generator/StadiumGenerator.js  # Sinh sân FIFA procedural
          Chunk.js / ChunkSection.js / World.js
        gui/screens/
          GuiOptions.js       # Menu cài đặt chung
          GuiLightingOptions.js  # Menu ánh sáng (3 tab)
          GuiControls.js      # Điều khiển
          GuiMainMenu.js
    resources/
      terrain/                # Texture atlas
      entity/                 # Texture bóng + mob
      mob/                    # Texture khán giả
      misc/                   # Texture mưa
      music/                  # Nhạc nền
```

---

## License

MIT
