"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import React from "react";

const PrivacyPolicy = () => {
  const { lang, currentLanguage } = useLanguage();
  console.log(currentLanguage);
  return (
    <>
      {currentLanguage === "vi" ? (
        <section className="privacy-policy-section py-5">
          <div className="container">
            <div className="privacy-policy">
              <h2 className="title-text">1. Giới thiệu</h2>
              <p className="sub-text">Chào mừng bạn đến với WeShare.</p>
              <p className="sub-text">
                Quyền riêng tư của bạn rất quan trọng đối với chúng tôi. Chúng tôi cam kết bảo vệ
                thông tin cá nhân của bạn. Chính sách quyền riêng tư này giải thích những dữ liệu
                chúng tôi thu thập, cách chúng tôi sử dụng, bảo vệ dữ liệu đó và các quyền của bạn với tư cách là người dùng.
              </p>
              <p className="sub-text">
                Bằng việc sử dụng WeShare, bạn đồng ý với các điều khoản được mô tả trong chính sách này.
              </p>

              <h2 className="title-text">2. Thông tin chúng tôi thu thập</h2>
              <p className="sub-text">
                Chúng tôi thu thập thông tin để cung cấp và cải thiện trải nghiệm của bạn trên WeShare.
                Các loại dữ liệu bao gồm:
              </p>

              <h3 className="sub-title-text">A. Thông tin cá nhân</h3>
              <ul className="sub-text">
                <li>Họ và tên</li>
                <li>Địa chỉ email</li>
                <li>Số điện thoại</li>
                <li>Thông tin hồ sơ cá nhân</li>
                <li>Xác minh danh tính (nếu cần)</li>
              </ul>

              <h3 className="sub-title-text">B. Dữ liệu sử dụng</h3>
              <ul className="sub-text">
                <li>Thông tin thiết bị (trình duyệt, hệ điều hành, loại thiết bị)</li>
                <li>Địa chỉ IP</li>
                <li>Nhật ký tương tác (nút đã nhấp, trang đã truy cập)</li>
              </ul>

              <h3 className="sub-title-text">C. Nội dung bạn tải lên</h3>
              <ul className="sub-text">
                <li>Bài đăng</li>
                <li>Tệp phương tiện (hình ảnh/video)</li>
                <li>Tài liệu</li>
                <li>Thông tin hồ sơ</li>
              </ul>

              <h3 className="sub-title-text">D. Cookie &amp; Dữ liệu theo dõi</h3>
              <ul className="sub-text">
                <li>Cookie phiên</li>
                <li>Cookie tùy chọn</li>
                <li>Cookie phân tích</li>
              </ul>

              <h2 className="title-text">3. Cách chúng tôi sử dụng dữ liệu của bạn</h2>
              <p className="sub-text">Chúng tôi sử dụng thông tin của bạn để:</p>
              <ul className="sub-text">
                <li>Cung cấp và duy trì dịch vụ của WeShare</li>
                <li>Cá nhân hóa nội dung và đề xuất</li>
                <li>Cải thiện hiệu suất và trải nghiệm người dùng</li>
                <li>Gửi thông báo, cập nhật và ưu đãi quan trọng</li>
                <li>Đảm bảo an toàn, xác minh và phòng chống gian lận</li>
                <li>Phân tích việc sử dụng để cải thiện tính năng và độ ổn định</li>
              </ul>
              <p className="sub-text note-box">
                <strong>Lưu ý:</strong> Chúng tôi <span className="fw-semibold">KHÔNG</span> bán thông tin cá nhân của bạn cho bất kỳ ai.
              </p>

              <h2 className="title-text">4. Quyền của người dùng</h2>
              <p className="sub-text">Là người dùng WeShare, bạn có quyền:</p>
              <ul className="sub-text">
                <li>Truy cập dữ liệu chúng tôi lưu trữ về bạn</li>
                <li>Yêu cầu chỉnh sửa hoặc cập nhật thông tin</li>
                <li>Yêu cầu xóa tài khoản và dữ liệu</li>
                <li>Rút lại sự đồng ý</li>
                <li>Yêu cầu bản sao dữ liệu của bạn</li>
                <li>Từ chối nhận thông tin tiếp thị</li>
              </ul>
              <p className="sub-text note-box-important">
                Để thực hiện các quyền này, vui lòng gửi email đến: <a href="mailto:support@weshare.com">support@weshare.com</a>
              </p>

              <h2 className="title-text">6. Bảo vệ &amp; An toàn dữ liệu</h2>
              <p className="sub-text">Chúng tôi áp dụng các biện pháp bảo mật mạnh mẽ bao gồm:</p>
              <ul className="sub-text">
                <li>Mã hóa giao tiếp đầu cuối</li>
                <li>Lưu trữ đám mây an toàn</li>
                <li>Kiểm soát truy cập và xác thực</li>
                <li>Kiểm tra bảo mật định kỳ</li>
                <li>Giám sát lỗ hổng và mối đe dọa</li>
              </ul>
              <p className="sub-text note-box-important">
                Mặc dù chúng tôi thực hiện mọi biện pháp phòng ngừa, không có hệ thống nào an toàn tuyệt đối,
                nhưng chúng tôi luôn nỗ lực bảo vệ dữ liệu của bạn.
              </p>

              <h2 className="title-text">7. Chia sẻ với bên thứ ba</h2>
              <p className="sub-text">Chúng tôi có thể chia sẻ dữ liệu hạn chế với:</p>
              <ul className="sub-text">
                <li>Đối tác lưu trữ đám mây</li>
                <li>Cổng thanh toán</li>
                <li>Công cụ phân tích</li>
                <li>Công cụ hỗ trợ khách hàng</li>
              </ul>
              <p className="sub-text">
                Chỉ khi cần thiết cho chức năng dịch vụ và luôn theo các thỏa thuận bảo mật nghiêm ngặt.
              </p>
              <p className="sub-text note-box">
                <strong>Lưu ý:</strong> Chúng tôi <span className="fw-semibold">KHÔNG</span> chia sẻ, cho thuê hoặc bán dữ liệu cá nhân của bạn cho nhà quảng cáo.
              </p>

              <h2 className="title-text">8. Thay đổi chính sách</h2>
              <p className="sub-text">Chúng tôi có thể cập nhật chính sách này khi:</p>
              <ul className="sub-text">
                <li>Luật pháp thay đổi</li>
                <li>Dịch vụ được cải thiện</li>
                <li>Có tính năng mới</li>
              </ul>
              <p className="sub-text">
                Nếu có thay đổi quan trọng, chúng tôi sẽ thông báo qua email hoặc thông báo trên nền tảng.
              </p>

              <h2 className="title-text">9. Liên hệ</h2>
              <p className="sub-text">
                Nếu bạn có câu hỏi về Chính sách quyền riêng tư này, vui lòng liên hệ:
              </p>
              <ul className="sub-text">
                <li><span className="fw-semibold">Email:</span> <a href="mailto:support@weshare.com">support@weshare.com</a></li>
                <li><span className="fw-semibold">Website:</span> <a href="https://www.weshare.com">www.weshare.com</a></li>
              </ul>
            </div>
          </div>
        </section>
      ) : (
        <section className="privacy-policy-section py-5">
          <div className="container">
            <div className="privacy-policy">
              <h2 className="title-text">1. Introduction</h2>
              <p className="sub-text">Welcome to WeShare.</p>
              <p className="sub-text">
                Your privacy is important to us, and we are committed to protecting your
                personal information. This Privacy Policy explains what data we collect,
                how we use it, how we protect it, and what rights you have as a user.
              </p>
              <p className="sub-text">
                By using SuShare, you agree to the practices described in this policy.
              </p>

              <h2 className="title-text">2. Information We Collect</h2>
              <p className="sub-text">
                We collect information to provide and improve your experience on SuShare.
                The types of data we collect include:
              </p>

              <h3 className="sub-title-text">A. Personal Information</h3>
              <ul className="sub-text">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Profile details</li>
                <li>ID verification (if required)</li>
              </ul>

              <h3 className="sub-title-text">B. Usage Data</h3>
              <ul className="sub-text">
                <li>Device information (browser, OS, device type)</li>
                <li>IP address</li>
                <li>Interaction logs (buttons clicked, pages visited)</li>
              </ul>

              <h3 className="sub-title-text">C. Content You Upload</h3>
              <ul className="sub-text">
                <li>Posts</li>
                <li>Media files (images/videos)</li>
                <li>Documents</li>
                <li>Profile information</li>
              </ul>

              <h3 className="sub-title-text">D. Cookies &amp; Tracking Data</h3>
              <ul className="sub-text">
                <li>Session cookies</li>
                <li>Preference cookies</li>
                <li>Analytics cookies</li>
              </ul>

              <h2 className="title-text">3. How We Use Your Data</h2>
              <p className="sub-text">We use your information to:</p>
              <ul className="sub-text">
                <li>Provide and maintain WeShare&apos;s services</li>
                <li>Personalize your feed and recommendations</li>
                <li>Improve platform performance and user experience</li>
                <li>Communicate updates, offers, and important notifications</li>
                <li>Ensure safety, verification, and fraud prevention</li>
                <li>Analyze usage to improve features and stability</li>
              </ul>
              <p className="sub-text note-box">
                <strong>Note:</strong> We <span className="fw-semibold">DO NOT</span> sell your personal information to anyone.
              </p>

              <h2 className="title-text">4. Cookies &amp; Tracking Technologies</h2>
              <p className="sub-text">As a WeShare user, you have the right to:</p>
              <ul className="sub-text">
                <li>Access the data we have about you</li>
                <li>Request corrections or updates</li>
                <li>Request deletion of your account and data</li>
                <li>Withdraw consent</li>
                <li>Request a copy of your stored information</li>
                <li>Opt-out of marketing messages</li>
              </ul>
              <p className="sub-text note-box-important">
                To exercise these rights, email us at: <a href="mailto:support@weshare.com">support@weshare.com</a>
              </p>

              <h2 className="title-text">6. Data Protection &amp; Security</h2>
              <p className="sub-text">We take strong measures to protect your data, including:</p>
              <ul className="sub-text">
                <li>End-to-end encrypted communication</li>
                <li>Secure cloud storage</li>
                <li>Access control and authentication layers</li>
                <li>Regular security audits</li>
                <li>Monitoring for vulnerabilities and threats</li>
              </ul>
              <p className="sub-text note-box-important">
                While we take all precautions, no system is 100% secure; however, we
                strive to keep your data safe.
              </p>

              <h2 className="title-text">7. Third-Party Sharing</h2>
              <p className="sub-text">We may share limited data with:</p>
              <ul className="sub-text">
                <li>Cloud hosting partners</li>
                <li>Payment gateways</li>
                <li>Analytics tools</li>
                <li>Customer support tools</li>
              </ul>
              <p className="sub-text">
                But only when required for service functionality, and always under strict
                confidentiality agreements.
              </p>
              <p className="sub-text note-box">
                <strong>Note:</strong> We <span className="fw-semibold">DO NOT</span> share, rent, or sell your personal data
                to advertisers.
              </p>

              <h2 className="title-text">8. Changes to This Policy</h2>
              <p className="sub-text">We may update this Privacy Policy from time to time to reflect:</p>
              <ul className="sub-text">
                <li>Changes in the law</li>
                <li>Improvements in our services</li>
                <li>New features</li>
              </ul>
              <p className="sub-text">
                If changes are significant, we will notify you via email or platform
                notification.
              </p>

              <h2 className="title-text">9. Contact Us</h2>
              <p className="sub-text">
                If you have any questions about this Privacy Policy, you can contact us
                at:
              </p>
              <ul className="sub-text">
                {/* email link */}
                <li><span className="fw-semibold">Email:</span> <a href="mailto:support@weshare.com">support@weshare.com</a></li>
                <li><span className="fw-semibold">Website:</span> <a href="https://www.weshare.com">www.weshare.com</a></li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default PrivacyPolicy;