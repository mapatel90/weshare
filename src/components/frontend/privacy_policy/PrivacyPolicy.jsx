"use client";

import React from "react";

const PrivacyPolicy = () => {
    return (
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
            To exercise these rights, email us at <strong>support@weshare.com</strong>
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
            <li><span className="fw-semibold">Email:</span> support@weshare.com</li>
            <li><span className="fw-semibold">Website:</span> www.weshare.com</li>
          </ul>
        </div>
        </div>
    </section>
    );
}

export default PrivacyPolicy;