import React, { useState } from 'react';
import MainSidebar from './investor_layouts/MainSidebar';
import PannelSidebar from './investor_layouts/PannelSidebar';

function PortalSidebarLayout() {

    return (
        <div style={{ display: 'flex' }}>
            <MainSidebar />
            <PannelSidebar />
        </div>
    );
}

export default PortalSidebarLayout;
