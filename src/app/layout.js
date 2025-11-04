import "../assets/scss/theme.scss";
import 'react-circular-progressbar/dist/styles.css';
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-datetime/css/react-datetime.css";
import NavigationProvider from "@/contentApi/navigationProvider";
import SettingSideBarProvider from "@/contentApi/settingSideBarProvider";
import ThemeCustomizer from "@/components/shared/ThemeCustomizer";
import AuthProvider from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GlobalLoader from "@/components/shared/GlobalLoader";
import DynamicFavicon from "@/components/common/DynamicFavicon";

export const metadata = {
  title: "Sunshare | Dashboard",
  description: "Sunshare is a admin Dashboard create for multipurpose,",
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
        </LanguageProvider>
      </body>
    </html>
  );
}
