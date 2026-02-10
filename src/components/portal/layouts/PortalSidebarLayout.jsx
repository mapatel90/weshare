import React from 'react';
import MainSidebar from './MainSidebar';
import PannelSidebar from './PannelSidebar';

function PortalSidebarLayout() {
    
    return (
        <div style={{ display: 'flex' }}>
            <MainSidebar />
            <PannelSidebar />
        </div>
    );
}

export default PortalSidebarLayout;
