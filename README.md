# Ứng Dụng Luyện Thi Trắc Nghiệm: Lý Luận & Phương Pháp GDTC

Hệ thống web luyện tập toàn bộ 6 đề thi chuẩn (120 câu hỏi) trích xuất chính xác 100% từ file PDF tài liệu môn học Lý luận Giáo dục Thể chất.

---

## 🌟 Tính Năng Nổi Bật

1. **Trích Xuất Chuẩn Xác 100% Từ File PDF**:
   - Nhận diện toàn bộ 120 câu hỏi (6 đề x 20 câu).
   - Đáp án đúng được nhận diện tự động từ định dạng **chữ màu đỏ** (`#ff0000`) trong file gốc.
   - Hỗ trợ đầy đủ các câu 2 phương án (Đúng/Sai), 3 phương án, 4 phương án (A, B, C, D) và 5 phương án (A, B, C, D, E), cùng các câu điền khuyết tương tác.

2. **Chế Độ Luyện Tập Đa Dạng**:
   - 📚 **Luyện theo Đề**: Lựa chọn từng đề từ Đề 1 đến Đề 6 (mỗi đề 20 câu chuẩn).
   - 🎯 **Tất cả 120 câu**: Luyện tập toàn diện không giới hạn.
   - ❌ **Chế độ làm lại những câu đã sai**: Tự động lọc và tập trung ôn lại những câu bạn đã trả lời sai. Có thể làm lại đến khi nắm vững.
   - 🚩 **Chế độ câu hỏi đã gắn cờ**: Ôn tập các câu hỏi bạn đánh dấu cần chú ý.
   - ⏱️ **Chế độ thi thử (Mock Exam)**: Đếm ngược 20 phút (chuẩn thời gian thi thật), nộp bài tính điểm thang 10, xếp loại học lực và phân tích chi tiết kết quả.

3. **Lưu Trữ Dữ Liệu Trên LocalStorage**:
   - Tự động lưu tiến độ học tập: câu đã làm, đáp án đã chọn, câu đúng, câu sai, câu gắn cờ.
   - Dữ liệu được lưu trữ trực tiếp trên trình duyệt của người dùng, không lo mất khi đóng tab hay tải lại trang.
   - Hỗ trợ tính năng **Xuất dữ liệu (JSON)** và **Nhập dữ liệu** để sao lưu hoặc chuyển đổi giữa các thiết bị.

4. **Giao Diện Hiện Đại & Tối Ưu Cho Cả Điện Thoại Và Máy Tính**:
   - Tương thích 100% màn hình máy tính, laptop, iPad, điện thoại (iOS & Android).
   - Chế độ Sáng / Tối (Dark / Light Mode) bảo vệ mắt khi học ban đêm.
   - Ma trận danh sách câu hỏi trực quan: xem nhanh câu đúng (xanh), câu sai (đỏ), câu gắn cờ (sao vàng), câu chưa làm.
   - Trên điện thoại: Có thanh điều hướng ngón tay cái và Bottom Sheet danh sách câu hỏi tiện lợi, hỗ trợ vuốt chạm (swipe).
   - Trên máy tính: Hỗ trợ phím tắt (`A`, `B`, `C`, `D`, `E` để chọn đáp án; `←`/`→` để chuyển câu; `F` để gắn cờ; `R` để làm lại câu).

---

## 🚀 Hướng Dẫn Sử Dụng

1. **Mở trực tiếp**:
   - Nhấp đúp vào file `run_web.bat` hoặc mở trực tiếp file `index.html` bằng bất kỳ trình duyệt nào (Google Chrome, Microsoft Edge, Firefox, Safari, Cốc Cốc,...).
   - Ứng dụng chạy hoàn toàn **offline**, không cần cài đặt thêm phần mềm nào và không cần kết nối internet.

2. **Chạy qua Local Server (Tùy chọn)**:
   Nếu muốn chạy qua địa chỉ `http://localhost`:
   ```bash
   python -m http.server 8080
   ```
   Sau đó truy cập `http://localhost:8080` trên trình duyệt máy tính hoặc điện thoại cùng mạng Wi-Fi.

---

## 📂 Cấu Trúc Thư Mục

- `index.html`: Giao diện chính của ứng dụng web.
- `styles.css`: Bộ stylesheet tùy biến cao cấp, hỗ trợ Light/Dark mode và responsive đa kích thước màn hình.
- `app.js`: Logic điều khiển ứng dụng, quản lý trạng thái, tính điểm và đồng bộ LocalStorage.
- `questions.js`: Toàn bộ bộ dữ liệu 120 câu hỏi và đáp án đúng.
- `questions.json`: Dữ liệu dạng JSON chuẩn.
- `run_web.bat`: File shortcut mở nhanh web trên Windows.

