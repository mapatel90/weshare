'use client'
import { usePathname } from "next/navigation";
import Header from "@/components/shared/header/Header";
import NavigationManu from "@/components/shared/navigationMenu/NavigationMenu";
import SupportDetails from "@/components/supportDetails";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoutePermissionGuard from "@/components/common/RoutePermissionGuard";
import useBootstrapUtils from "@/hooks/useBootstrapUtils";

const layout = ({ children }) => {
    const pathName = usePathname()
    useBootstrapUtils(pathName)

    return (
        <ProtectedRoute>
            <RoutePermissionGuard>
                <Header />
                <NavigationManu />
                <main className="nxl-container">
                    <div className="nxl-content">
                        {children}
                    </div>
                </main>
                <SupportDetails />
            </RoutePermissionGuard>
        </ProtectedRoute>
    )
}

export default layout