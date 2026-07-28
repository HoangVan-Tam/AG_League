# AG League ⚽

Website hiển thị **dự chi và kế hoạch tổ chức giải đá banh giữa các hội thánh** — sân 7, 4–6 đội, không lợi nhuận.

## Tính năng

- 🧮 **Máy tính dự chi** — thay đổi số đội, phí, tài trợ, giá sân → quỹ giải thưởng tự cập nhật.
- 💰 **Bảng phân bổ chi phí** so sánh 4 đội / 6 đội.
- 🏆 **Phân chia giải thưởng** chi tiết.
- 📅 **Lịch thi đấu** 4 đội trong 1 ngày.
- 📜 **Luật & thể thức** (handicap đương kim vô địch, cầu khách, ghép đội).

## Chạy locally

Chỉ là HTML/CSS/JS tĩnh — mở `index.html` bằng trình duyệt, hoặc:

```bash
npx serve .
# hoặc
python -m http.server 8000
```

## Host trên GitHub Pages

1. Tạo repo mới trên GitHub (ví dụ `AG_League`).
2. Push toàn bộ file lên branch `main`:
   ```bash
   git init
   git add .
   git commit -m "AG League website"
   git branch -M main
   git remote add origin https://github.com/<tên-bạn>/AG_League.git
   git push -u origin main
   ```
3. Vào **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **/(root)**
4. Lưu lại, chờ ~1 phút. Site online tại `https://<tên-bạn>.github.io/AG_League/`.

## Cấu trúc

```
AG_League/
├── index.html   # Nội dung trang
├── styles.css   # Style (giao diện tối, tone xanh sân cỏ)
├── script.js    # Logic máy tính dự chi
└── README.md
```

---
AG League · Giải giao lưu giữa các hội thánh · 2026