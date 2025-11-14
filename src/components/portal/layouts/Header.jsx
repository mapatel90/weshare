import React from 'react';

function Header({ toggleSidebar }) {
    const handleToggle = (e) => {
        if (typeof toggleSidebar === 'function') {
            toggleSidebar(e);
        } else {
            // fallback: toggle a body class so existing CSS can react
            document.body.classList.toggle('sidebar-collapsed');
        }
    };

    return (
        <div className="header">
            <div className="header-left">
                <div className="toggle-btn" id="toggleBtn" onClick={handleToggle}>☰</div>
                <div className="header-title">
                    {/* <h1>Energy Dashboard</h1>
                    <p>Monitor your solar energy consumption and savings</p> */}
                </div>
            </div>
            <div className="header-right">
                <div className="profile-icons">
                    <div className="profile-icon">👤</div>
                    <div className="profile-icon">🔔</div>
                    <div className="profile-icon">🇬🇧</div>
                </div>
                {/* <button className="btn btn-dark">Projects ▼</button>
                <button className="btn btn-dark">Investor ▼</button> */}
            </div>
        </div>
    );
}

export default Header;