# 🌸 Chiến Sĩ Dò Mìn

Game trả lời câu hỏi vui nhộn dành cho bé **6 tuổi**: bé vào vai một chiến sĩ nhí
đội mũ bộ đội, băng qua bãi "hoa mìn" bằng cách chọn đúng đáp án.

Chơi ngay: mở file `index.html` bằng trình duyệt (không cần cài đặt gì thêm),
hoặc deploy lên Netlify rồi **cài vào màn hình chính** cho bé chơi như một ứng dụng.

---

## 🚀 Đưa game lên mạng (Netlify)

Game là web tĩnh thuần — **không cần build, không cần cài gói nào**.

**Cách 1 — Kéo thả (nhanh nhất, 1 phút):**
1. Tải toàn bộ thư mục dự án về máy.
2. Vào [app.netlify.com/drop](https://app.netlify.com/drop) và kéo cả thư mục vào.
3. Xong! Netlify trả về link dạng `https://ten-gi-do.netlify.app`.

**Cách 2 — Nối với GitHub (tự động cập nhật mỗi lần push):**
1. Netlify → *Add new site* → *Import an existing project* → chọn repo này.
2. Để trống **Build command**, đặt **Publish directory** là `.` (file `netlify.toml`
   trong repo đã khai báo sẵn, thường Netlify tự nhận).
3. *Deploy site*. Từ đó mỗi lần push lên nhánh đã chọn, site tự cập nhật.

> Đổi tên miền cho dễ nhớ: *Site configuration → Change site name*, ví dụ
> `bedo-min.netlify.app`.

Sau khi deploy, mỗi lần cập nhật game nhớ **tăng `CACHE_VERSION` trong `sw.js`**
(vd `domin-v1` → `domin-v2`) để máy của bé nhận bản mới thay vì dùng bản đã lưu.

## 📲 Cho bé chơi như một ứng dụng

Game là **PWA**: cài được vào màn hình chính, mở lên là toàn màn hình, không có
thanh địa chỉ, và **chơi được cả khi không có mạng**.

- **Android (Chrome):** mở link → bấm nút **📲 Cài vào máy** ngay trên màn hình
  chính của game (hoặc menu ⋮ → *Thêm vào Màn hình chính*).
- **iPhone / iPad (Safari):** mở link → nút **Chia sẻ** ⬆️ → *Thêm vào MH chính*.
- **Máy tính (Chrome/Edge):** biểu tượng cài đặt ở thanh địa chỉ.

Khi bé đang chơi, game **giữ màn hình không tự tắt** (Wake Lock) và có nút
**⛶ Toàn màn hình** cho trình duyệt thường.

---

## 🎮 Cách chơi

| | |
|---|---|
| 🌸 | Mỗi câu hỏi có **4 bông hoa mìn** ở 4 vị trí khác nhau, mỗi bông mang một đáp án. |
| ✅ | Chọn **đúng** → bé reo mừng, được cộng điểm và đi tiếp câu sau. |
| 💥 | Chọn **sai** → mìn nổ, bé bị hất **quay về vạch xuất phát**, bông hoa đó héo đi và bé thử lại. |
| 🚩 | Mỗi chặng gồm **8 câu**. Hết chặng bé được chấm **1–3 ngôi sao** (không sai câu nào = 3 sao). |
| 🗺️ | Cứ **3 câu đúng**, bé hành quân sâu hơn vào vùng đất mới. |

**Điều khiển:** chạm/bấm vào bông hoa. Trên máy tính có thể dùng phím `1` `2` `3` `4`
để chọn đáp án, `H` kính lúp, `F` 50:50, `S` trái tim.

## 🗺️ Hành trình & Sếp Bom

Ngoài chế độ **⚡ Chơi nhanh** (chọn chủ đề rồi chơi liên tục), game có chế độ
**🗺️ Hành trình** — trục chính của trò chơi:

- **5 vùng đất**, mỗi vùng **3 chặng thường + 1 trận Sếp Bom**.
- Bản đồ hiện rõ đường đi, số sao đã đạt từng chặng, và **bé đang đứng ở đâu**.
- Chặng sau mở khi bé qua chặng trước; **vùng sau mở khi hạ được Sếp Bom** của vùng trước.
- Mỗi vùng có chủ đề câu hỏi riêng và độ khó tăng dần.

**Trận Sếp Bom** 💣 là điểm nhấn cuối mỗi vùng: một quả bom khổng lồ có **5–7 ngòi nổ**.
Mỗi câu trả lời đúng cắt được một ngòi; trả lời sai thì bé mất **1 trong 3 trái tim**
và Sếp Bom cười khoái chí. Hết tim thì thử lại — **bé không mất sao hay đồ đạc gì cả**,
chỉ cần bấm “Thử lại”.

## 🌌 Vùng Đất Bí Ẩn (chế độ vô tận)

Mở khoá sau khi bé hạ Sếp Bom cuối cùng. Câu hỏi sinh ra không bao giờ hết, khó dần
theo từng chặng, bé có **3 trái tim** — đi được càng xa càng giỏi. Game ghi lại
**kỷ lục** của bé và thưởng 1 ⭐ cho mỗi 4 chặng đi được. Đây là phần giữ bé quay lại
chơi sau khi đã đi hết hành trình.

## 👩‍🏫 Bé sai thì được chỉ, không bị bỏ mặc

- Sai **lần 1**: mìn nổ, bé quay về vạch xuất phát và thử lại.
- Sai **lần 2** ở cùng một câu: **cô giáo hiện ra chỉ cách làm** bằng hình minh hoạ
  (ví dụ 3 + 1 → 🍎🍎🍎 thêm 🍎 = 4 quả), đọc to lời giải thích, và bông hoa đúng
  nhấp nháy kèm ngón tay 👉 mời bé bước tới. Bé luôn tự tay chọn đáp án đúng.
- Những câu bé từng sai được **ghi vào sổ và cho gặp lại** ở các chặng sau. Tần suất
  tăng dần theo số câu trong sổ (nhiều nhất 30%) và không lặp lại đúng câu vừa ôn,
  đáp án cũng xếp lại vị trí để bé phải nghĩ chứ không nhớ chỗ.
  Làm đúng ngay lần đầu thì câu đó được xoá khỏi sổ — bé thấy dòng chữ *"THUỘC RỒI! 🎓"*.

## 🎒 Tủ đồ & 🏅 Album sticker

Sao ⭐ kiếm được ở mỗi chặng dùng để **mua đồ cho nhân vật** trong Tủ đồ.
Đi hết hành trình với 3 sao mọi chặng được **100 ⭐** (mỗi chặng lần đầu qua
được thưởng thêm 2 ⭐), mua được khoảng **2/3 tủ đồ** — phần còn lại kiếm thêm ở
Vùng Đất Bí Ẩn hoặc chơi lại chặng cũ:

- **Mũ:** mũ bộ đội · mũ tai bèo · mũ sinh nhật · mũ phi hành gia · vương miện
- **Quân phục:** xanh bộ đội · xanh hải quân · cam sa mạc · hồng kẹo ngọt · tím vũ trụ
- **Phụ kiện:** khăn quàng đỏ · ba lô · kính râm · đôi cánh
- **Thú cưng đi theo bé:** Cún Mực · Mèo Mun · Gà Bông · Cánh Cụt · Rô Bốt

Đồ bé mặc hiện ngay trên bản đồ và trong lúc chơi. Ngoài ra mỗi chặng hoàn thành
tặng **1 sticker mới** trong bộ sưu tập **24 sticker**, hạ Sếp Bom được sticker hiếm.
Bé xem lại cả bộ trong **🏅 Album**.

## 📚 Chủ đề câu hỏi

| Chủ đề | Gồm những gì |
|---|---|
| ➕ **Phép tính** | cộng, trừ, so sánh lớn/bé nhất, chia đều cho các bạn |
| 🔢 **Đếm số** | đếm số lượng, số liền trước/liền sau, tìm số còn thiếu trong dãy |
| 🎨 **Màu sắc** | nhận màu và màu của đồ vật quen thuộc |
| 🐻 **Con vật** | 42 câu về tiếng kêu, nơi sống, đặc điểm |
| 🧩 **Câu đố** | 42 câu đố dân gian, đồ vật, nghề nghiệp, thiên nhiên |
| 🔷 **Hình khối** | 22 câu về hình tròn, vuông, tam giác, chữ nhật… |
| 🔤 **Chữ cái** | chữ cái đầu của từ, tìm từ theo chữ, thứ tự bảng chữ cái |
| ⏰ **Giờ & Tiền** | xem đồng hồ (có hình vẽ), cộng tiền, thứ trong tuần |
| 🎲 **Tổng hợp** | trộn tất cả |

Ba mức độ khó: 🐣 **Dễ** (cộng trong phạm vi 5, đếm đến 5) · 🐤 **Vừa** (cộng trừ trong 10)
· 🦅 **Giỏi** (cộng trừ trong 20). Càng qua nhiều chặng, câu hỏi càng khó dần.

Phần lớn câu hỏi được **sinh ngẫu nhiên** nên gần như không lặp; các ngân hàng cố định
(con vật, câu đố, hình khối, từ vựng) có tổng cộng hơn 130 câu và có bộ nhớ chống lặp lại
câu vừa hỏi.

## 🗺️ Địa hình

Cảnh nền đổi liên tục theo tiến trình để bé luôn thấy mới lạ:

🌼 Cánh Đồng Hoa → 🏖️ Bãi Biển Vàng → 🌲 Rừng Xanh Bí Ẩn → ❄️ Đỉnh Núi Tuyết → 🚀 Hành Tinh Lạ

## 🔊 Âm thanh

Toàn bộ nhạc nền và hiệu ứng (bước chân, tiếng nổ, tiếng reo mừng…) được **tổng hợp
trực tiếp bằng Web Audio API** — không cần tải file nhạc nào.

Game còn **đọc to câu hỏi bằng tiếng Việt** (Web Speech API) để bé chưa đọc thạo
vẫn chơi được. Ba nút ở góc phải: 🎵 nhạc nền · 🗣️ giọng đọc · ⏸️ tạm dừng.

> Giọng đọc phụ thuộc vào giọng tiếng Việt có sẵn của thiết bị. Nếu máy không có,
> game vẫn chạy bình thường, chỉ là không có tiếng đọc.

## 🧩 Cấu trúc mã nguồn

```
index.html              khung giao diện
css/style.css           giao diện, hoạt ảnh, bảng màu 5 địa hình
css/fonts.css           khai báo font Baloo 2 nhúng sẵn
fonts/*.woff2           font Baloo 2 (SIL OFL 1.1) - để chơi offline
js/content.js           hành trình 5 vùng, trang phục, danh sách sticker
js/save.js              lưu tiến trình, sao, đồ đã mua (localStorage)
js/questions.js         ngân hàng + bộ sinh câu hỏi theo chủ đề và độ khó
js/audio.js             nhạc nền, hiệu ứng âm thanh, giọng đọc tiếng Việt
js/sprites.js           nhân vật, bông hoa mìn, trang trí địa hình (SVG vẽ tay)
js/map.js               màn hình bản đồ hành trình
js/collection.js        tủ đồ và album sticker
js/game.js              luồng chơi, Sếp Bom, vật phẩm, tính điểm, hiệu ứng
js/pwa.js               cài vào máy, offline, toàn màn hình, giữ màn hình sáng
sw.js                   service worker (bộ nhớ đệm để chơi offline)
manifest.webmanifest    khai báo web app
icons/                  bộ icon ứng dụng
netlify.toml            cấu hình deploy + cache cho Netlify
```

Không dùng thư viện ngoài, không cần build. Nhân vật và hoa mìn đều là **SVG vẽ tay**
nên hình sắc nét ở mọi kích thước màn hình. Bố cục tự đổi theo màn hình: điện thoại
dọc xếp hoa 2 hàng, xoay ngang thì xếp thành vòng cung một hàng cho khỏi chật.

## 👨‍👩‍👧 Ghi chú cho bố mẹ

- Trả lời sai **không bị trừ điểm và không thua cuộc** — bé chỉ quay lại vạch xuất
  phát rồi thử lại, để bé không sợ sai.
- Tiến trình hành trình, sao, đồ đã mua và sticker đều lưu trong máy (localStorage) —
  bé tắt game rồi mở lại vẫn còn nguyên.
- Thua trận Sếp Bom hay hết tim ở Vùng Đất Bí Ẩn đều **không mất gì cả**, chỉ chơi lại;
  game không có màn hình "game over" gây nản.
- Game **ghi nhớ những dạng câu bé hay sai** để cho ôn lại, và tự giải thích cách làm
  khi bé sai hai lần cùng một câu.
- Game tôn trọng thiết lập `prefers-reduced-motion` của hệ điều hành: nếu bật, hoạt
  ảnh sẽ được giảm tối đa.
- **Không quảng cáo, không thu thập dữ liệu, không cần tài khoản.** Game không gửi
  bất cứ thông tin gì ra ngoài; mọi thứ chạy ngay trong máy của bé.
- Đã chặn kéo-để-tải-lại và phóng to bằng hai chạm, nên bé bấm loạn cũng không
  làm lệch màn hình.
