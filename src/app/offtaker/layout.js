// import "../assets/scss/theme.scss";
import 'react-circular-progressbar/dist/styles.css';
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-datetime/css/react-datetime.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GlobalLoader from "@/components/shared/GlobalLoader";
import DynamicFavicon from "@/components/common/DynamicFavicon";
import Script from "next/script";
import { Header } from '@/components/portal/layouts/Header';
import { ThemeProvider } from '@/contexts/portal/theme/Provider';
import { BreakpointProvider } from '@/contexts/portal/breakpoint/Provider';
import { SidebarProvider } from '@/contexts/portal/sidebar/Provider';
import clsx from 'clsx';

import "@/styles/offtaker/index.css";

export const metadata = {
  title: "Offtaker Dashboard | Sunshare",
  description: "Sunshare Offtaker Panel",
};

export default function OfftakerLayout({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <BreakpointProvider>
          <SidebarProvider>
            <Header />
            <main
              className={clsx("main-content transition-content grid grid-cols-1")}
            >
              {children}
            </main>
            <GlobalLoader />
            <DynamicFavicon />
          </SidebarProvider>
        </BreakpointProvider>
      </ThemeProvider>
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
    </LanguageProvider>
  );
}
