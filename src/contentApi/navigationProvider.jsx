'use client'
import React, { createContext, useState } from 'react';

// Default context value for when provider is not mounted
const defaultNavigationValue = {
    navigationOpen: false,
    setNavigationOpen: () => {},
    navigationExpend: false,
    setNavigationExpend: () => {}
};

export const NavigationContext = createContext(defaultNavigationValue);

const NavigationProvider = ({ children }) => {
    const [navigationOpen, setNavigationOpen] = useState(false)
    const [navigationExpend, setNavigationExpend] = useState(false)

    const obj = {
        navigationOpen,
        setNavigationOpen,
        navigationExpend,
        setNavigationExpend
    }

    return (
        <NavigationContext.Provider value={obj}>
            {children}
        </NavigationContext.Provider>
    );
};

export default NavigationProvider