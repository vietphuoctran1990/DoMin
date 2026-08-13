# 🌸 Chiến Sĩ Dò Mìn

Game trả lời câu hỏi vui nhộn dành cho bé **6 tuổi**: bé vào vai một chiến sĩ nhí
đội mũ bộ đội, băng qua bãi "hoa mìn" bằng cách chọn đúng đáp án.

Chơi ngay: mở file `index.html` bằng trình duyệt (không cần cài đặt gì thêm).

---

## 🎮 Cách chơi

| | |
|---|---|
| 🌸 | Mỗi câu hỏi có **4 bông hoa mìn** ở 4 vị trí khác nhau, mỗi bông mang một đáp án. |
| ✅ | Chọn **đúng** → bé reo mừng, được cộng điểm và đi tiếp câu sau. |
| 💥 | Chọn **sai** → mìn nổ, bé bị hất **quay về vạch xuất phát**, bông hoa đó héo đi và bé thử lại. |
| 🚩 | Mỗi chặng gồm **8 câu**. Hết chặng bé được chấm **1–3 ngôi sao** (không sai câu nào = 3 sao). |
| 🗺️ | Cứ **3 câu đúng**, bé hành quân sang một **địa hình mới**. |

**Điều khiển:** chạm/bấm vào bông hoa. Trên máy tính có thể dùng phím `1` `2` `3` `4`
để chọn đáp án, `H` kính lúp, `F` 50:50, `S` trái tim.

## 🎒 Vật phẩm hỗ trợ

| Vật phẩm | Tác dụng |
|---|---|
| 🔍 **Kính lúp** | Hiện (và đọc to) một câu gợi ý dẫn dắt bé tới đáp án đúng. |
| ✂️ **50 : 50** | Loại bỏ 2 đáp án sai, chỉ còn 2 bông hoa để bé chọn. |
| 💖 **Trái tim chống bom** | Kích hoạt lá chắn: nếu chọn sai, mìn **không nổ** và bé **không bị lùi về**. |

Bé bắt đầu với mỗi loại 1 cái, nhận thêm 1 vật phẩm ngẫu nhiên sau **mỗi 3 câu đúng liên tiếp**
và sau mỗi chặng hoàn thành.

## 📚 Chủ đề câu hỏi

➕ Phép tính · 🔢 Đếm số · 🎨 Màu sắc · 🐻 Con vật · 🧩 Câu đố · 🔷 Hình khối · 🎲 Tổng hợp

Ba mức độ khó: 🐣 **Dễ** (cộng trong phạm vi 5, đếm đến 5) · 🐤 **Vừa** (cộng trừ trong 10)
· 🦅 **Giỏi** (cộng trừ trong 20). Càng qua nhiều chặng, câu hỏi càng khó dần.

Câu hỏi được **sinh ngẫu nhiên** ở mỗi ván nên bé chơi lại không bị lặp.

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
index.html          khung giao diện
css/style.css       toàn bộ giao diện, hoạt ảnh, bảng màu 5 địa hình
js/questions.js     ngân hàng + bộ sinh câu hỏi theo chủ đề và độ khó
js/audio.js         nhạc nền, hiệu ứng âm thanh, giọng đọc tiếng Việt
js/sprites.js       nhân vật, bông hoa mìn, trang trí địa hình (SVG vẽ tay)
js/game.js          luồng chơi, vật phẩm, tính điểm, hiệu ứng
```

Không dùng thư viện ngoài, không cần build. Nhân vật và hoa mìn đều là **SVG vẽ tay**
nên hình sắc nét ở mọi kích thước màn hình (điện thoại dọc, ngang và máy tính).

## 👨‍👩‍👧 Ghi chú cho bố mẹ

- Trả lời sai **không bị trừ điểm và không thua cuộc** — bé chỉ quay lại vạch xuất
  phát rồi thử lại, để bé không sợ sai.
- Điểm cao nhất, chủ đề và độ khó bé chọn được lưu lại trong máy (localStorage).
- Game tôn trọng thiết lập `prefers-reduced-motion` của hệ điều hành: nếu bật, hoạt
  ảnh sẽ được giảm tối đa.
