'use client'
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import useBootstrapUtils from "@/hooks/useBootstrapUtils";
import '@/assets/portal/offtaker.css';
import Header from "@/components/portal/layouts/Header";
import PannelSidebar from "@/components/portal/layouts/PannelSidebar";
import MainSidebar from "@/components/portal/layouts/MainSidebar";

const layout = ({ children }) => {
    const pathName = usePathname()
    useBootstrapUtils(pathName)

    return (
        <ProtectedRoute>
            <MainSidebar />
            <PannelSidebar />
                <div class="main-content" id="mainContent">
            <Header />
                    {/* {children} */}
                </div>
        </ProtectedRoute>
    )
}

export default layout