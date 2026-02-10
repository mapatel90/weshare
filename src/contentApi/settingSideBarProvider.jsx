'use client'
import React, { createContext, useState } from 'react'

// Default context value for when provider is not mounted
const defaultSidebarValue = {
    sidebarOpen: false,
    setSidebarOpen: () => {}
};

export const SettingSidebarContext = createContext(defaultSidebarValue)
const SettingSideBarProvider = ({children}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    return (
        <SettingSidebarContext.Provider value={{sidebarOpen, setSidebarOpen}}>
            {children}
        </SettingSidebarContext.Provider>
    )
}

export default SettingSideBarProvider