import React from 'react';

function MainSidebar() {
    return (
        <div className="icon-sidebar">
            {/* <div className="logo-icon">⬡</div> */}
            <img src="../images/default_icon.png" className="logo-icon" alt="weshare logo" />
            <div className="logo-separator" />

            <div className="icon-menu">
                <div className="icon-item active" data-menu="dashboard" title="Dashboard">📊</div>
                <div className="icon-item" data-menu="home" title="Home">🏠</div>
                <div className="icon-item" data-menu="building" title="Building">🏢</div>
                <div className="icon-item" data-menu="list" title="List">📋</div>
                <div className="icon-item" data-menu="user" title="User">👤</div>
                <div className="icon-item" data-menu="settings" title="Settings">⚙️</div>
                <div className="icon-item" data-menu="globe" title="Globe">🌐</div>
                <div className="icon-item" data-menu="photo" title="Photo">📷</div>
                {/* <div className="icon-item support">💬</div> */}
            </div>
        </div>
    );
}

export default MainSidebar;