# CS105

## 0. Yêu cầu

### 1. Hoàn thiện kết cấu sân

- Bổ sung giàn đèn, bảng tỉ số (có thể tham khảo trên https://www.minecraftskins.com/) hoặc genAI như trong (![mẫu](stadium.png))
- Xây lại các góc sân cho giống mẫu, xây lại đường hầm ra sân (tunnel) và phần khán đàn ở đó, xây lại phần đỉnh của khán đài theo dạng bậc thang.
- Optional: Xây tầng 2 và mái che cho các khán đài (![mẫu](image.png))

### 2. Thực hiện chiếu phối cảnh, tăng giảm các toạ độ x,y,z near, far và các màn hình game.

- Cải thiện màn hình chờ vào game để chờ game load ổn, thêm logic chờ load xong game ở màn hình này: ![mẫu](image-1.png) và decorate + tên project, môn học,...
- Cần thêm UI để chỉnh trực tiếp `near`, `far` của `PerspectiveCamera` trong lúc chạy để thấy rõ hiệu ứng frustum culling (đưa vào bên trong màn hình pause) - tận dụng bảng điều khiển hiện tại ở góc trên phải màn hình và phần settings của game.
- Thu gọn bảng điều khiển góc phải trên màn hình hiện tại -> tích hợp vào phần menu của game khi pause để tra cứu toàn bộ phím tắt

### 3. Áp dụng phép biến đổi Affine cơ sở trên các khối hình cơ bản này.

- Lưu ý: phải cho phép chọn các phép biến đổi và thực hiện thao tác bằng sự kiện chuột hoặc bàn phím hoặc tự động
- Thực hiện các phép biến đổi hình học cơ bản như:
  o Tịnh tiến
  o Quay
  o Tỉ lệ

Hiện game chỉ có phép biến đổi ngầm thông qua di chuyển của Player/Camera. Chưa có chức năng (như `dat.GUI` hoặc phím tắt) để chủ động chọn 1 object và tinh chỉnh (Translate, Rotate, Scale)

**Đề xuất**: Thêm một vật thể 3D đặc biệt (VD: [chiếc Cúp vô địch](https://www.minecraftskins.com/skin/10794070/golden-chalice/)) vào sân và tích hợp `dat.GUI` để người dùng có thể tự do tịnh tiến, xoay, thay đổi tỉ lệ của vật thể này.

### 4. Chiếu sáng đối tượng

- Chiếu sáng toàn phần (1)
- Nguồn sáng (2)
- Bóng đổ (3)
- Triển khai mô hình chiếu sáng đơn giản gồm ánh sáng môi trường, ánh sáng điểm và ánh sáng định hướng.
- Tạo hiệu ứng bóng đổ (kĩ thuật shadow mapping).

Đồ án dùng ánh sáng voxel cơ bản và custom Tessellator. Tuy `shadowMap` có bật trong `WebGLRenderer`, nhưng chưa khai thác các nguồn sáng thực tế (PointLight, DirectionalLight, SpotLight) có tính năng bóng đổ rọi lên vật thể.

**Đề xuất**:

- Tùy chỉnh ánh sáng Mặt Trời/Mặt Trăng thành `DirectionalLight` thật để đổ bóng toàn cục (1)
- Thêm `PointLight` vào các khối đuốc (Torch) tạo ánh sáng điểm mang vibe Minecraft cổ điển.
- Lắp 4 đèn `SpotLight` ở 4 góc sân chiếu xuống trung tâm, có chiếu sáng kiểu nguồn sáng (2)
- Bật `castShadow` và `receiveShadow` cho cầu thủ, quả bóng và mặt cỏ.

### Texture:

- Chọn mở 1 ảnh bitmap hoặc thiết kế sẵn các ảnh để người dùng có thể lựa chọn và thực hiện texture mapping trên đối tượng.
- Hoặc có thể texture mapping sẵn trên các đối tượng.

**Đề xuất**: Nâng cấp chất lượng vật liệu bằng `MeshStandardMaterial` và thêm `bumpMap`/`roughnessMap` để sân cỏ và đồ vật (ghế khán đài, quả bóng, khung thành), vật liệu xây sân trông sần sùi và phản quang thật hơn.

### 5. Animation

- Các bạn tự sáng tạo các animation tuỳ ý.
- Các đối tượng sẽ tự di chuyển và biến đổi theo animation mình định nghĩa.
- Xây dựng mô phỏng chuyển động của một hoặc nhiều vật thể trong không gian 3D.

**Đánh giá**: Có animation cơ bản (bước đi, vung tay) và vật lý AABB. Chưa có vật lý thực tế như `cannon-es` cho các va chạm phức tạp.

**Đề xuất**:

- **Va chạm (Collision):** Tích hợp `cannon-es` để quả bóng lăn, nảy lên khi sút, dội ra khi chạm cột gôn thay vì trượt cứng.
- **Animation:**
  - Quả bóng tự lăn tròn (rotation) theo hướng di chuyển.
  - Bắn hiệu ứng hạt (Confetti/Pháo hoa) 2 bên đường hầm khi cầu thủ đi ra.
  - Va chạm các nhân vật khác nhau
  - Mặt các nhân vật npc đều nhìn về phía quả bóng
  - Giam am thanh sountrack nhac xuong ~0.2 hien tai, them cac sound cho qua bong, confetti,...

## 1. Cài Đặt Python

### Windows

1. Truy cập: [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Tải phiên bản mới nhất cho Windows.
3. **Lưu ý:** Trong quá trình cài đặt, hãy tích vào ô `Add Python to PATH`.
4. Sau khi cài xong, mở `Command Prompt` và kiểm tra:
   ```sh
   python --version
   ```

### macOS:

Mở Terminal và gõ:

```sh
brew install python
```

### Linux (Debian/Ubuntu):

```sh
sudo apt update
sudo apt install python3
```

---

## 2. Chạy HTTP Server

Từ thư mục chứa file `index.html`, chạy lệnh:

```sh
python -m http.server 8000
```

Server sẽ khởi động tại địa chỉ:

```
http://localhost:8000/
```

---

## 3. Truy cập game

```
http://localhost:8000/index.html
```

---

## 4. Hướng Dẫn Điều Khiển (Game Controls)

Dưới đây là danh sách đầy đủ tất cả các phím điều khiển có sẵn trong game:

| Phím (Key)                      | Chức năng (Function)                    | Chi tiết (Details)                                                      |
| :------------------------------ | :-------------------------------------- | :---------------------------------------------------------------------- |
| **`W` / `A` / `S` / `D`**       | Di chuyển (Movement)                    | Tiến, Trái, Lùi, Phải                                                   |
| **`Space` (Dấu cách)**          | Nhảy (Jump)                             | Nhảy lên                                                                |
| **`Double Space`**              | Kích hoạt Bay (Toggle Flight)           | Nhấp nhanh phím Space 2 lần liên tiếp để bay                            |
| **`Space` / `Shift`**           | Bay lên / Bay xuống (Fly Up/Down)       | Chỉ hoạt động khi đang ở chế độ Bay (Flight Mode)                       |
| **`Left Control` / `Double W`** | Chạy nhanh (Sprint)                     | Nhấn giữ `Ctrl` hoặc nhấp nhanh `W` 2 lần để tăng tốc chạy              |
| **`F5`**                        | Đổi góc nhìn (Perspective)              | Đổi giữa góc nhìn thứ nhất (1st Person) và góc nhìn thứ ba (3rd Person) |
| **`E`**                         | Mở kho đồ (Inventory)                   | Mở giao diện Creative Inventory để chọn blocks                          |
| **`T`**                         | Khung chat (Chat Menu)                  | Mở bảng gõ câu lệnh hoặc trò chuyện                                     |
| **`Tab`**                       | Bảng danh sách người chơi (Player List) | Xem danh sách người chơi đang kết nối                                   |
| **`Esc`**                       | Menu cài đặt (Pause Menu)               | Dừng game và mở tùy chọn cài đặt                                        |

---

## 5. Phân công & Quản lý nhánh (Branching Rules)

Để giảm thiểu tối đa xung đột mã nguồn (conflict code), 5 yêu cầu của đồ án được chia thành 5 module độc lập và quản lý trên các nhánh (branch) riêng biệt. Mỗi module nên bao trùm cả phần làm hiện tại lẫn phần mở rộng tiềm năng gần nhất, nhưng vẫn giữ một chủ sở hữu chính để tránh đụng chéo. Các nhánh feature đã được tạo sẵn và nên được dùng đúng phạm vi:

| Tính năng / Module                           | Tên nhánh (Branch)           | Phạm vi sửa chính / File chủ đạo                                                                                                             | Mở rộng tiềm năng gần nhất                                                                            |
| :------------------------------------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **1. Kết cấu sân (Stadium Structure)**       | `feature/stadium-structure`  | `StadiumGenerator.js`, `StadiumTextureMappings.js`, `BlockRegistry.js`, atlas texture assets, block type mới, tunnel/stands/scoreboard props | Mái che, tầng 2, hàng rào, khán đài biến thể, chi tiết góc sân, props trang trí                       |
| **2. Camera & Giao diện (Camera & UI)**      | `feature/camera-ui`          | `GameWindow.js`, `GameSettings.js`, `WorldRenderer.js`, pause/loading UI, control help overlay, HUD/keybind panel                            | Near/far live tuning, frustum demo, loading splash, pause dashboard, settings cải tiến                |
| **3. Phép biến đổi (Affine Transform)**      | `feature/affine-transform`   | Object 3D độc lập, control UI, transform interaction surface, selection/pivot logic, `dat.GUI` or equivalent controls                        | Gizmo kéo-thả, snap grid, preset transform, multi-object transform, animation path                    |
| **4. Ánh sáng & Vật liệu (Light & Texture)** | `feature/lighting-materials` | `WorldRenderer.js`, render lighting/shadow setup, material tuning, shadow-enabled meshes, light presets                                      | Day/night cycle, weather, emissive props, bóng đổ nâng cao, vật liệu theo khu vực                     |
| **5. Va chạm & Animation (Physics)**         | `feature/physics-animation`  | `BallEntity.js`, `EntityLiving.js`, render-loop animation hooks, collision/physics integration, particle/sound hooks                         | Physics engine thật, bóng nảy tự nhiên, celebration event, cầu thủ/NPC state machine, replay/cutscene |

**Quy tắc làm việc (Rules):**

1. **Cô lập tính năng:** Khi làm việc trên nhánh nào, chỉ sửa các file thuộc phạm vi nhánh đó. Không trộn sân, UI, transform, lighting và physics trong cùng một branch nếu chưa thật sự cần.
2. **Làm việc trên branch đúng module:** Trước khi code, chuyển sang branch tương ứng, ví dụ `git checkout feature/camera-ui`.
3. **Giữ diff nhỏ:** Nếu một thay đổi đụng sang file ngoài phạm vi module, tách nó ra thành bước riêng hoặc hoãn tới branch phù hợp hơn.
4. **Commit rõ ràng:** Dùng message ngắn, mô tả đúng module, ví dụ `feat(stadium): thêm góc sân` hoặc `fix(ui): chỉnh near/far trong pause menu`.
5. **Merge theo thứ tự an toàn:** Chỉ merge về `main` khi module đã chạy ổn định. Ưu tiên merge các branch độc lập trước, rồi mới merge branch chạm nhiều đến UI/render.
6. **Không sửa chéo tùy tiện:** Nếu cần dùng chung một helper hoặc constant, ưu tiên chỉnh ở nhánh phù hợp nhất và ghi rõ lý do trong commit message.
