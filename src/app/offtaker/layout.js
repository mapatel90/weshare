// import "../assets/scss/theme.scss";
import 'react-circular-progressbar/dist/styles.css';
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-datetime/css/react-datetime.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GlobalLoader from "@/components/shared/GlobalLoader";
import DynamicFavicon from "@/components/common/DynamicFavicon";
import OfftakerLayoutWrapper from "@/components/offtaker/layouts/OfftakerLayoutWrapper";
import SideBarProvider from "@/components/offtaker/layouts/SideBarProvider";
import Script from "next/script";

export const metadata = {
  title: "Offtaker Dashboard | Sunshare",
  description: "Sunshare Offtaker Panel",
};

export default function OfftakerLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider>
          <SideBarProvider>
            <OfftakerLayoutWrapper>
              {children}
            </OfftakerLayoutWrapper>
          </SideBarProvider>
          <GlobalLoader />
          <DynamicFavicon />
        </LanguageProvider>
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
