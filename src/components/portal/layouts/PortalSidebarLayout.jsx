import React, { useState } from 'react';
import MainSidebar from './MainSidebar';
import PannelSidebar from './PannelSidebar';

function PortalSidebarLayout() {
    const [activeMenu, setActiveMenu] = useState('dashboard');

    return (
        <div style={{ display: 'flex' }}>
            <MainSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            <PannelSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
        </div>
    );
}

export default PortalSidebarLayout;
