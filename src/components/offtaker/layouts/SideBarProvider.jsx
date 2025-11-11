'use client'
import React, { createContext, useContext, useState } from 'react'

const SideBarContext = createContext()

export const useSideBar = () => {
    const context = useContext(SideBarContext)
    if (!context) {
        throw new Error('useSideBar must be used within a SideBarProvider')
    }
    return context
}

const SideBarProvider = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const toggleCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed)
    }

    const openSidebar = () => {
        setSidebarOpen(true)
    }

    const closeSidebar = () => {
        setSidebarOpen(false)
    }

    return (
        <SideBarContext.Provider 
            value={{ 
                sidebarOpen, 
                sidebarCollapsed,
                toggleSidebar, 
                toggleCollapse,
                openSidebar,
                closeSidebar,
                setSidebarOpen,
                setSidebarCollapsed
            }}
        >
            {children}
        </SideBarContext.Provider>
    )
}

export default SideBarProvider
