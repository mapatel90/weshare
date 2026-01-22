import "../assets/scss/theme.scss";
import 'react-circular-progressbar/dist/styles.css';
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-datetime/css/react-datetime.css";
import NavigationProvider from "@/contentApi/navigationProvider";
import SettingSideBarProvider from "@/contentApi/settingSideBarProvider";
import ThemeCustomizer from "@/components/shared/ThemeCustomizer";
import AuthProvider from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import GlobalLoader from "@/components/shared/GlobalLoader";
import DynamicFavicon from "@/components/common/DynamicFavicon";
import Script from "next/script";

export const metadata = {
  title: "WeShare | Dashboard",
  description: "WeShare is a admin Dashboard create for multipurpose,",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider>
          <PageTitleProvider defaultSuffix="WeShare">
            <SettingsProvider>
              <AuthProvider>
                <SettingSideBarProvider>
                  <NavigationProvider>
                    {children}
                  </NavigationProvider>
                </SettingSideBarProvider>
                {/* <ThemeCustomizer /> */}
                <GlobalLoader />
                <DynamicFavicon />
              </AuthProvider>
            </SettingsProvider>
          </PageTitleProvider>
        </LanguageProvider>
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
