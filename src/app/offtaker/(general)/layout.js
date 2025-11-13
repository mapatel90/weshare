'use client'
import { usePathname } from "next/navigation";
import Header from "@/components/shared/header/Header";
import NavigationManu from "@/components/shared/navigationMenu/NavigationMenu";
import SupportDetails from "@/components/supportDetails";
import ProtectedRoute from "@/components/ProtectedRoute";
import dynamic from "next/dynamic";
import useBootstrapUtils from "@/hooks/useBootstrapUtils";

// const useBootstrapUtils = dynamic(() => import('@/hooks/useBootstrapUtils'), { ssr: false })
// const AddInverter = dynamic(() => import('@/components/inverter/AddInverter'), { ssr: false })

const layout = ({ children }) => {
    const pathName = usePathname()
    useBootstrapUtils(pathName)

    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    {children}
                </div>
            </main>
            <SupportDetails />
            {/* <AddInverter /> */}
        </ProtectedRoute>
    )
}

export default layout