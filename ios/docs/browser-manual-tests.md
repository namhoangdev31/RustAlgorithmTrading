# Kịch bản Kiểm thử Thủ công Chi tiết (Manual Test Cases) dành cho AI Agent

Tài liệu này định nghĩa toàn bộ kịch bản kiểm thử trên Simulator tương ứng với 108 Test Cases (TC) kỹ thuật trong [browser-features.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/docs/browser-features.md). Mỗi phần hướng dẫn rõ hành động của Agent, kết quả quan sát trên UI, hoặc cách kiểm tra log hệ thống để verify.

---

## Chuẩn bị thiết bị và môi trường
1. Khởi chạy iOS Simulator (iPhone 15 Pro, iOS 17.0+).
2. Build và khởi chạy ứng dụng từ Xcode.
3. Điều hướng tới màn hình **Browser**.

---

## PHẦN 1: BỘ TEST CHO BỘ CHUẨN HÓA URL (BrowserURLNormalizer)

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (UI & Trạng thái) |
|---|---|---|
| **TC-1.1.1** | Nhập `https://example.com` vào thanh địa chỉ và nhấn Enter. | Tải trang `https://example.com` thành công. |
| **TC-1.1.2** | Nhập `example.com` vào thanh địa chỉ và nhấn Enter. | Tự động chuyển thành `https://example.com` và tải trang thành công. |
| **TC-1.1.3** | Nhập `example.com/path?q=1` và nhấn Enter. | Tải chính xác trang `https://example.com/path?q=1`. |
| **TC-1.1.4** | Nhập `hello world` và nhấn Enter. | Chuyển sang tìm kiếm Google: `https://www.google.com/search?q=hello+world`. |
| **TC-1.1.5** | Nhập chuỗi rỗng (empty string) hoặc không nhập gì rồi nhấn Enter. | Không thực hiện hành động load nào, giữ nguyên trang cũ hoặc trang trống. |
| **TC-1.1.6** | Nhập chuỗi chỉ gồm khoảng trắng `"   "` rồi nhấn Enter. | Không thực hiện hành động load nào, giữ nguyên trang cũ hoặc trang trống. |
| **TC-1.2.1** | Nhập `javascript:alert(1)` và nhấn Enter. | Không chạy lệnh JS. Trình duyệt chuyển từ khóa này thành chuỗi tìm kiếm trên Google. |
| **TC-1.2.2** | Nhập `file:///etc/passwd` và nhấn Enter. | Không mở file cục bộ. Trình duyệt chuyển đổi thành chuỗi tìm kiếm trên Google. |
| **TC-1.2.3** | Nhập `data:text/html,<h1>hi</h1>` và nhấn Enter. | Không hiển thị HTML thô. Trình duyệt chuyển đổi thành chuỗi tìm kiếm trên Google. |
| **TC-1.3.1** | Nhập `127.0.0.1:8765/index.html` và nhấn Enter. | Tự động đổi thành `http://127.0.0.1:8765/index.html` (HTTP thay vì HTTPS). |
| **TC-1.3.2** | Nhập `localhost:3000` và nhấn Enter. | Tự động đổi thành `http://localhost:3000` và tải trang local. |
| **TC-1.3.3** | Nhập `192.168.1.1` và nhấn Enter. | Tự động đổi thành `http://192.168.1.1` (HTTP cho địa chỉ IP mạng cục bộ). |
| **TC-1.3.4** | Nhập `::1` và nhấn Enter. | Tự động đổi thành `http://[::1]` (Hỗ trợ địa chỉ IPv6 localhost). |
| **TC-1.4.1** | Nhập `example.com/path with spaces` và nhấn Enter. | Tự động mã hóa khoảng trắng thành `%20` và tải `https://example.com/path%20with%20spaces`. |
| **TC-1.4.2** | Nhập `example.com/path?q=a&b=c#frag` và nhấn Enter. | Tải đúng URL có đầy đủ tham số query và fragment anchor `#frag`. |
| **TC-1.5.1** | Nhập dấu chấm phẩy ở cổng: `127.0.0.1;8765` và nhấn Enter. | Tự động sửa `;` thành `:` và tải `http://127.0.0.1:8765`. |
| **TC-1.6.1** | Kiểm tra log console khi tải URL có chứa token/password. | Trong log console Xcode, các query parameter nhạy cảm (như `token`, `user`, `password`) được hiển thị dưới dạng `<redacted>` để bảo mật. |

---

## PHẦN 2: BỘ TEST CHO CHÍNH SÁCH ĐIỀU HƯỚNG (BrowserNavigationPolicy)

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (UI & Trạng thái) |
|---|---|---|
| **TC-2.1.1** | Click link dẫn tới `https://apple.com` từ một trang web. | Cho phép điều hướng (tải trang bình thường). |
| **TC-2.1.2** | Click link dẫn tới `http://example.com` từ một trang web. | Cho phép điều hướng. Hiển thị nhãn cảnh báo đỏ "Không an toàn" trên thanh địa chỉ. |
| **TC-2.1.3** | Trang web thực hiện chuyển hướng về `about:blank`. | Cho phép điều hướng (mở trang trống). |
| **TC-2.2.1** | Click link có href `javascript:alert(1)`. | Lệnh bị chặn hoàn toàn, không hiển thị hộp thoại alert nào từ JS. |
| **TC-2.2.2** | Click link có href `file:///etc/hosts`. | Bị chặn, không mở file hệ thống. |
| **TC-2.2.3** | Click link có href `data:text/html,test` làm frame chính. | Bị chặn, không hiển thị nội dung html thô. |
| **TC-2.2.4** | Tải trang web có thẻ `<img>` sử dụng src là base64 `data:image/png;base64,...`. | Cho phép hiển thị ảnh bình thường (subframe/resource tải thành công). |
| **TC-2.4.1** | Click link gửi email `mailto:test@example.com`. | Ứng dụng Mail mặc định của iOS được mở lên. Trình duyệt không thay đổi trang. |
| **TC-2.4.2** | Click link số điện thoại `tel:+84123456789`. | Hệ thống hiển thị hộp thoại gọi điện. Trình duyệt không chuyển trang. |
| **TC-2.4.3** | Click link nhắn tin `sms:+84123456789`. | Ứng dụng Tin nhắn mặc định của iOS được mở lên. |
| **TC-2.4.4** | Click link App Store `itms-apps://itunes.apple.com/...`. | Ứng dụng App Store trên máy được mở lên. |
| **TC-2.4.5** | Click link có custom scheme của bên thứ ba (ví dụ `fb://profile`). | Hệ thống hiển thị hộp thoại yêu cầu mở ứng dụng ngoài (nếu có cài). |

---

## PHẦN 3: BỘ TEST CHO LƯU TRỮ DỮ LIỆU (BrowserPersistenceStore)

*Lưu ý: Để test thủ công phần này, hãy mở mục Lịch sử (History) / Dấu trang (Bookmarks) trong ứng dụng để đối chiếu.*

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (UI & Trạng thái) |
|---|---|---|
| **TC-3.1.1** | Tải trang `https://example.com` (chế độ thường). Mở Lịch sử. | Xuất hiện 1 mục lịch sử mới: "Example" - `https://example.com`. |
| **TC-3.1.2** | Tải liên tiếp `https://example.com` 2 lần. Mở Lịch sử. | Chỉ xuất hiện đúng 1 mục lịch sử của `example.com` (Đã loại bỏ trùng lặp liên tiếp). |
| **TC-3.1.3** | Tải `example.com` -> tải `apple.com`. Mở Lịch sử. | Xuất hiện cả 2 mục lịch sử theo thứ tự thời gian mới nhất lên đầu. |
| **TC-3.2.1** | Chuyển sang Tab ẩn danh. Tải `https://example.com`. Mở Lịch sử. | Lịch sử trống (không ghi lại bất kỳ lịch sử nào ở chế độ ẩn danh). |
| **TC-3.3.1** | Truy cập `a.com` -> `b.com` -> `a.com`. Mở Lịch sử. | Xuất hiện 3 dòng lịch sử theo thứ tự: `a.com` (mới nhất), `b.com`, `a.com` (cũ hơn). |
| **TC-3.4.1** | Duyệt liên tiếp nhiều trang khác nhau (>1000 trang). | Số lượng lịch sử lưu tối đa là 1000. Dữ liệu cũ nhất tự động bị xóa. |
| **TC-3.5.1** | Tìm kiếm từ khóa "swift" trên Google Search qua thanh địa chỉ. | Mở danh sách gợi ý tìm kiếm -> Từ khóa "swift" xuất hiện trong danh sách lịch sử tìm kiếm. |
| **TC-3.6.1** | Bấm nút "Xóa lịch sử" trong cài đặt/lịch sử. | Toàn bộ lịch sử duyệt web bị xóa sạch. |
| **TC-3.7.1** | Vuốt sang trái (Swipe left) một mục lịch sử cụ thể và chọn Xóa. | Mục lịch sử đó biến mất, các mục khác giữ nguyên. |
| **TC-3.8.1** | Mở trang tab mới (New Tab). Xem mục "Vừa xem" (Recently Viewed). | Hiển thị tối đa 8 logo/domain độc lập mà bạn vừa truy cập gần đây nhất. |
| **TC-3.9.1** | Truy cập trang `apple.com` nhiều lần hơn các trang khác. | Trên trang Tab mới, biểu tượng của `apple.com` sẽ nhảy lên vị trí đầu tiên của mục "Thường xuyên truy cập" (Frequently Visited). |
| **TC-3.9.2** | Kiểm tra danh sách "Thường xuyên truy cập" trên trang Tab mới. | Hiển thị tối đa không quá 8 ô biểu tượng. |
| **TC-3.10.1** | Mở `example.com`. Bấm nút More (3 chấm) -> Chọn "Thêm vào dấu trang". | Mở màn hình Bookmarks -> Xuất hiện trang `example.com` trong danh sách. |
| **TC-3.11.1** | Tiếp tục bấm "Thêm vào dấu trang" cho trang `example.com` một lần nữa. | Trình duyệt không tạo ra bookmark trùng lặp thứ 2 cho cùng 1 URL. |
| **TC-3.12.1** | Vào Bookmarks, vuốt trái và xóa bookmark `example.com`. | Dấu trang bị xóa khỏi danh sách. |
| **TC-3.13.1** | Vào Bookmarks -> Chọn "Xóa tất cả". | Toàn bộ danh sách dấu trang bị xóa sạch. |
| **TC-3.14.1** | Mở một trang. Bấm More (3 chấm) -> Chọn "Thêm vào Danh sách đọc". | Mở Danh sách đọc (Reading List) -> Xuất hiện trang đó kèm theo tên domain hiển thị rõ ràng. |
| **TC-3.15.1** | Thêm lại trang đó vào Danh sách đọc lần 2. | Không tạo bản ghi trùng lặp. |
| **TC-3.16.1** | Vào Reading List, vuốt trái xóa bản ghi. | Bản ghi bị xóa khỏi danh sách. |
| **TC-3.17.1** | Vào Reading List -> Chọn "Xóa tất cả". | Danh sách đọc trống rỗng. |
| **TC-3.18.1** | Nhập từ khóa tìm kiếm "ios dev" trên thanh địa chỉ. | Lịch sử tìm kiếm lưu lại từ khóa "ios dev". |
| **TC-3.19.1** | Tìm kiếm "ios" -> "android" -> "ios". | Từ khóa "ios" được đưa lên trên cùng của danh sách lịch sử tìm kiếm. |
| **TC-3.20.1** | Thực hiện hơn 100 lượt tìm kiếm các từ khóa khác nhau. | Danh sách lịch sử tìm kiếm tối đa chỉ lưu 100 từ khóa gần nhất. |
| **TC-3.21.1** | Bấm nút xóa lịch sử tìm kiếm. | Danh sách gợi ý tìm kiếm cũ bị xóa sạch. |
| **TC-3.22.1** | Tải trang, lưu bookmark. Tắt hẳn ứng dụng (Force close) rồi mở lại. | Kiểm tra lịch sử và bookmark: mọi dữ liệu vẫn còn nguyên vẹn (Đã lưu xuống ổ đĩa thành công). |

---

## PHẦN 4: BỘ TEST CHO QUẢN LÝ TAB (BrowserViewModel)

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (UI & Trạng thái) |
|---|---|---|
| **TC-4.1.1** | Nhấp vào biểu tượng Quản lý Tab -> Bấm nút **+** (Tạo tab mới thường). | Một tab mới dạng thường được tạo, giao diện sáng/mặc định. |
| **TC-4.1.2** | Bấm giữ một liên kết -> Chọn "Mở trong tab mới". | Tab mới tự động tải URL của liên kết đó ở chế độ nền hoặc chuyển hướng sang. |
| **TC-4.1.3** | Nhấp biểu tượng Quản lý Tab -> Chuyển sang tab Ẩn danh -> Bấm **+**. | Tạo tab ẩn danh mới thành công. Thanh địa chỉ/giao diện chuyển sang màu tối. |
| **TC-4.2.1** | Đóng tab duy nhất đang hoạt động. | Tab bị đóng và trình duyệt tự động tạo lại một tab trống mặc định (Không bị trống màn hình). |
| **TC-4.2.2** | Đang mở Tab A và Tab B (đang active). Đóng Tab B. | Màn hình tự động chuyển sang hiển thị nội dung của Tab A. |
| **TC-4.2.3** | Đang active Tab B. Vào quản lý tab, đóng Tab A (inactive). | Tab B vẫn hoạt động bình thường, không bị tải lại hay mất dữ liệu. |
| **TC-4.3.1** | Đang mở 3 tabs. Chọn "Đóng các tab khác" trên Tab 2. | Chỉ còn lại duy nhất Tab 2 hoạt động. Tab 1 và Tab 3 bị đóng. |
| **TC-4.4.1** | Đang mở nhiều tab thường. Chọn "Đóng tất cả tab". | Tất cả tab thường bị đóng. Trình duyệt tự động mở 1 tab thường trống mới. |
| **TC-4.4.2** | Đang mở cả tab thường lẫn tab ẩn danh. Chọn "Đóng tất cả tab ẩn danh". | Chỉ các tab ẩn danh bị xóa sạch. Các tab thường vẫn giữ nguyên trạng thái. |
| **TC-4.5.1** | Đang mở trang `apple.com`. Chọn **Nhân đôi tab** (Duplicate Tab). | Tab mới được tạo ra ngay bên cạnh và tải trang `apple.com`. |
| **TC-4.6.1** | Mở quản lý tab, chạm vào hình thu nhỏ của Tab 1. | Trình duyệt chuyển tiêu điểm hiển thị sang Tab 1 ngay lập tức. |
| **TC-4.6.2** | Chạm ra ngoài vùng trống hoặc nhấn huỷ trong quản lý tab. | Giữ nguyên tab đang xem trước đó. |
| **TC-4.7.1** | Đóng toàn bộ các tab. | Trình duyệt luôn luôn đảm bảo biến `activeTab` không bị lỗi crash (bằng cách tự tạo tab trống thay thế). |
| **TC-4.8.1** | Nhập `https://example.com` vào thanh địa chỉ của tab hiện tại. | Trang web được tải ngay trên tab hiện tại. |
| **TC-4.8.2** | Nhập từ khóa tìm kiếm bất kỳ. | Tab hiện tại tải trang kết quả tìm kiếm của Google. |
| **TC-4.8.3** | Nhập URL trống hoặc chỉ toàn khoảng trắng. | Không có phản ứng load nào xảy ra trên tab. |
| **TC-4.10.1**| Truy cập `https://example.com` -> Bấm More (3 chấm) -> Chọn "Thêm vào dấu trang". | Xuất hiện thông báo dạng banner/toast: "Đã thêm vào Dấu trang." phía dưới màn hình. |
| **TC-4.10.2**| Ở trang Tab mới trống, thử bấm "Thêm vào dấu trang". | Nút bấm bị mờ (disabled) hoặc không có phản ứng gì (do không có URL hợp lệ). |
| **TC-4.11.1**| Mở trang bất kỳ -> Bấm More -> Chọn "Thêm vào Danh sách đọc". | Xuất hiện thông báo banner/toast: "Đã thêm vào Danh sách đọc." |
| **TC-4.12.1**| Bấm More (3 chấm) -> Chọn **Xóa dữ liệu duyệt web**. Xác nhận Xóa. | Xuất hiện toast báo xóa thành công. Lịch sử và dữ liệu gợi ý biến mất hoàn toàn. |
| **TC-4.13.1**| Bấm nút Home/Reset hoặc gọi hàm reset trạng thái của VM. | Trình duyệt quay về trạng thái mặc định: 1 tab trống duy nhất, hiển thị đầy đủ thanh công cụ. |
| **TC-4.14.1**| Mở trang `https://example.com`. Nhìn vào thanh địa chỉ. | Thanh địa chỉ hiển thị chính xác chuỗi `https://example.com`. |
| **TC-4.14.2**| Mở một tab trống mới. Nhìn vào thanh địa chỉ. | Thanh địa chỉ hiển thị rỗng hoặc chuỗi gợi ý "Tìm kiếm hoặc nhập địa chỉ web". |
| **TC-4.15.1**| Gõ chữ `sw` vào thanh địa chỉ (không nhấn Enter). | Bên dưới thanh địa chỉ xuất hiện danh sách các từ khóa gợi ý từ Google (ví dụ: `swift`, `swagger`, `swiftui`). |
| **TC-4.15.2**| Gõ một URL đầy đủ `https://example.com` vào thanh địa chỉ. | Không hiển thị danh sách từ khóa gợi ý tìm kiếm (vì đây là URL trực tiếp). |

---

## PHẦN 5: BỘ TEST CHO TỪNG TAB RIÊNG LẺ (BrowserTabViewModel)

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (UI & Trạng thái) |
|---|---|---|
| **TC-5.1.1** | Gọi load URL `https://example.com`. | Thanh tiến trình (progress bar) chạy. Trạng thái hiển thị là đang tải. |
| **TC-5.1.2** | Cố tình truy cập liên kết bị chặn `javascript:alert(1)`. | Hiển thị màn hình báo lỗi bảo mật: "Trang web bị chặn vì lý do bảo mật...". |
| **TC-5.1.3** | Bấm vào liên kết gửi email `mailto:test@example.com`. | Ứng dụng ngoài (Mail) được mở lên, trang hiện tại giữ nguyên không đổi. |
| **TC-5.5.1** | Đang tải một trang nặng, nhấn nút **X** (Stop) trên thanh địa chỉ. | Quá trình tải dừng lại ngay lập tức. Nút **X** chuyển lại thành nút **Reload** (mũi tên xoay vòng). |
| **TC-5.7.1** | Chọn "Tìm trong trang", gõ từ khóa có trên trang. | Từ khóa khớp được tô màu sáng trên trang web. |
| **TC-5.7.2** | Nhấn nút mũi tên Lên (Backwards) trên thanh công cụ tìm kiếm trong trang. | Tiêu điểm nhảy ngược về từ khớp phía trước đó trong văn bản. |
| **TC-5.8.1** | Nhập từ khóa không tồn tại vào ô tìm kiếm trong trang. | Hiển thị kết quả tìm kiếm là `0 / 0`. |
| **TC-5.13.1**| Bấm More -> Zoom chữ -> Tăng kích thước (+10%). | Chữ trên trang web hiển thị to hơn rõ rệt (Tỷ lệ 110%). |
| **TC-5.13.2**| Bấm giảm kích thước chữ xuống mức tối thiểu (dưới 50%). | Cỡ chữ dừng lại ở mức tối thiểu 50%, không thể nhỏ hơn được nữa. |
| **TC-5.13.3**| Bấm tăng kích thước chữ lên mức tối đa (trên 200%). | Cỡ chữ dừng lại ở mức tối đa 200%, không thể to hơn được nữa. |
| **TC-5.14.1**| Bấm More -> Chọn **Yêu cầu trang web cho máy tính**. | Trang tải lại với bố cục của bản Desktop (ví dụ: Google Drive/Youtube đổi sang giao diện PC). |
| **TC-5.14.2**| Bấm chọn lại **Yêu cầu trang web cho di động** (Mobile Site). | Trang tải lại và trở về giao diện di động bình thường. |
| **TC-5.15.1**| Bấm More -> Chọn **Copy chẩn đoán trang**. Mở ứng dụng khác (Notes) và Paste. | Đoạn text dán ra có dạng: `Title: <tên tiêu đề>\nURL: <đường dẫn URL trang>`. |
| **TC-5.17.1**| Mở trang HTTPS ở chế độ ẩn danh. Xem chi tiết thông tin bảo mật. | Hiển thị thông báo kết nối an toàn (HTTPS) và chế độ riêng tư đang bật. |
| **TC-5.17.2**| Mở trang HTTP ở chế độ thường. Xem chi tiết thông tin bảo mật. | Hiển thị cảnh báo kết nối không bảo mật (HTTP) và chế độ thường. |
| **TC-5.18.1**| Giả lập sập bộ nhớ web (ví dụ: mở trang gây tràn RAM hoặc ép tiến trình WebKit dừng). | Trình duyệt tự động hiển thị thanh tiến trình và tải lại trang sau 1 giây. |
| **TC-5.18.2**| Trang web liên tục bị sập (3 lần liên tiếp trong 60 giây). | Trình duyệt dừng tự động tải lại, hiển thị màn hình thông báo lỗi sập trang để người dùng tự nhấn nút tải lại thủ công (Tránh lặp vô hạn). |
| **TC-5.19.1**| Sau khi trang bị dừng do sập nhiều lần, bấm vào nút **Thử lại** (Retry) trên màn hình lỗi. | Đặt lại số lần đếm lỗi về 0 và thực hiện tải lại trang thành công. |
| **TC-5.24.1**| Click vào một liên kết có thuộc tính `target="_blank"` (yêu cầu mở cửa sổ mới). | Trình duyệt tự động tạo một tab mới và mở liên kết đó trong tab mới này. |
| **TC-5.26.1**| Nhìn vào thanh tiến trình ngay khi vừa nhấn Enter truy cập web. | Thanh tiến trình màu xanh xuất hiện dưới thanh địa chỉ, bắt đầu chạy từ 0%. |
| **TC-5.27.1**| Chờ trang web tải xong hoàn toàn. | Thanh tiến trình biến mất hoàn toàn. Tiêu đề của tab cập nhật đúng theo tiêu đề trang web. |
| **TC-5.28.1**| Đang tải trang, bấm nút Stop hoặc thoát trang (Huỷ yêu cầu). | Trạng thái trang không chuyển sang chế độ lỗi kết nối (Bỏ qua lỗi huỷ yêu cầu hệ thống). |
| **TC-5.28.2**| Truy cập một URL không tồn tại hoặc sai DNS (ví dụ: `https://thisdomaindoesnotexist12345.com`). | Hiển thị màn hình thông báo lỗi kết nối mạng tương ứng. |
| **TC-5.30.1**| Chạy script tạo popup hoặc link tự mở cửa sổ mới. | Kích hoạt callback mở tab mới thành công trên UI. |

---

## PHẦN 6: BỘ TEST CHO TRÌNH QUẢN LÝ DỮ LIỆU (BrowserWebsiteDataManager)

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (UI & Trạng thái) |
|---|---|---|
| **TC-6.1.1** | Thực hiện hành động **Xóa toàn bộ dữ liệu** trong cài đặt của trình duyệt. | Tất cả cookie, bộ nhớ đệm (cache), dữ liệu form đã lưu trên toàn bộ các trang web bị xóa sạch. Người dùng bị đăng xuất khỏi các trang web đã đăng nhập trước đó (ví dụ: Facebook, Google). |
| **TC-6.2.1** | Thực hiện hành động **Chỉ xóa Cookie và Cache** nhưng giữ lại cấu hình khác. | Các phiên đăng nhập trên web bị đăng xuất, nhưng các tùy chỉnh cá nhân hóa của trình duyệt hoặc danh sách trang đọc ngoại tuyến vẫn được giữ lại. |

---

## PHẦN 7: BỘ TEST CHO BỘ NHỚ ĐỆM FAVICON (FaviconCache)

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (UI & Trạng thái) |
|---|---|---|
| **TC-7.1.1** | Mở một trang web mới tinh chưa từng truy cập. | Ban đầu hiển thị biểu tượng quả địa cầu mặc định (hoặc chữ cái đầu của tên miền). |
| **TC-7.2.1** | Nhập chuỗi rỗng vào trình duyệt. | Không có yêu cầu tải ảnh favicon nào được gửi đi. |
| **TC-7.2.2** | Tải trang `https://github.com`. | Biểu tượng của Github (hình con mèo) được tải về và hiển thị trên tab cũng như trong danh sách lịch sử. |
| **TC-7.4.1** | Mở 3 tab cùng truy cập trang `https://github.com` đồng thời. | Chỉ có duy nhất 1 luồng mạng tải ảnh favicon được kích hoạt (Ngăn chặn việc tải trùng lặp song song). |

---

## PHẦN 8: BỘ TEST CHO MÔ HÌNH DỮ LIỆU (BrowserModels)

| Mã Test Case | Thao tác thực hiện | Kết quả mong đợi (Kiểm tra Log / Trạng thái cấu trúc) |
|---|---|---|
| **TC-8.1.1** | Khởi chạy trình duyệt ở trạng thái nghỉ (idle). | Trạng thái nội bộ của trình duyệt báo `.idle`. |
| **TC-8.1.2** | Trang đang tải được một nửa (50%). | Trạng thái hiển thị tiến trình lưu trữ là `.loading(0.5)`. |
| **TC-8.1.3** | Tiến trình tải thay đổi từ 50% lên 70%. | Trạng thái cập nhật chính xác từ `.loading(0.5)` sang `.loading(0.7)`. |
| **TC-8.1.4** | Trang tải xong hoàn toàn. | Trạng thái chuyển đổi từ `.loading` sang `.loaded`. |
| **TC-8.2.1** | Gặp lỗi URL không hợp lệ. | Hiển thị đúng thông báo lỗi đã được bản địa hóa: *"Địa chỉ URL không hợp lệ."* |
| **TC-8.2.2** | Gặp lỗi sập tiến trình (Web Process Crashed). | Hiển thị đúng thông báo: *"Trình duyệt bị sập bộ nhớ. Vui lòng tải lại trang."* |
| **TC-8.5.1** | Lưu lịch sử và xuất file backup dữ liệu. | Dữ liệu lịch sử được chuyển đổi (encode) sang JSON và đọc ngược lại (decode) chuẩn xác không bị mất mát thông tin. |
| **TC-8.6.1** | Xuất / Nhập danh sách Dấu trang (Bookmarks). | Định dạng lưu trữ khớp hoàn toàn với cấu trúc dữ liệu JSON đã thiết kế. |
| **TC-8.7.1** | Xuất / Nhập Danh sách đọc (Reading List). | Định dạng lưu trữ khớp hoàn toàn với cấu trúc dữ liệu JSON đã thiết kế. |
| **TC-8.9.1** | Xem danh sách các trang thường xuyên truy cập trên trang Tab mới. | Các trang được định danh duy nhất dựa theo tên miền (domain) của chúng để gom nhóm chính xác số lần truy cập. |
