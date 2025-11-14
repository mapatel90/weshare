// Offtaker Portal Utility Functions for Client-Side
export const initializeOfftakerPortal = () => {
    if (typeof window === 'undefined') return;

    // Icon sidebar click handlers
    const iconItems = document.querySelectorAll('.icon-item:not(.support)');
    iconItems.forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.icon-item').forEach(i => {
                if (!i.classList.contains('support')) {
                    i.classList.remove('active');
                }
            });
            this.classList.add('active');
        });
    });

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const parent = this.closest('.tabs');
            parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Bar chart hover effects
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.addEventListener('mouseenter', function () {
            this.style.transform = 'scaleY(1.05)';
        });
        bar.addEventListener('mouseleave', function () {
            this.style.transform = 'scaleY(1)';
        });
    });

    // Animate stats on load
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Handle window resize
    const handleResize = () => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const iconSidebar = document.getElementById('iconSidebar');
        const textSidebar = document.getElementById('textSidebar');
        const mainContent = document.getElementById('mainContent');
        const overlay = document.getElementById('sidebarOverlay');

        if (!isMobile) {
            // Reset to desktop mode
            if (overlay) overlay.classList.remove('show');
            if (iconSidebar) iconSidebar.classList.remove('show');
            if (textSidebar) textSidebar.classList.remove('show');
            mobileSidebarsOpen = false;

            // Restore desktop sidebar state
            if (textSidebar && mainContent) {
                if (sidebarCollapsed) {
                    textSidebar.classList.add('collapsed');
                    mainContent.classList.add('expanded');
                } else {
                    textSidebar.classList.remove('collapsed');
                    mainContent.classList.remove('expanded');
                }
            }
        } else {
            // In mobile mode, hide everything by default
            if (!mobileSidebarsOpen) {
                if (iconSidebar) iconSidebar.classList.remove('show');
                if (textSidebar) textSidebar.classList.remove('show');
                if (overlay) overlay.classList.remove('show');
            }
        }
    };

    window.addEventListener('resize', handleResize);
};

// Store sidebar state
let sidebarCollapsed = false;
let mobileSidebarsOpen = false;

export const toggleSidebar = () => {
    if (typeof window === 'undefined') return;

    const iconSidebar = document.getElementById('iconSidebar');
    const textSidebar = document.getElementById('textSidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.querySelector('.toggle-btn') || document.getElementById('toggleBtn');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        // Mobile behavior - toggle both sidebars and overlay
        mobileSidebarsOpen = !mobileSidebarsOpen;

        if (mobileSidebarsOpen) {
            if (iconSidebar) iconSidebar.classList.add('show');
            if (textSidebar) {
                textSidebar.classList.add('show');
                textSidebar.classList.remove('collapsed');
            }
            if (overlay) overlay.classList.add('show');
        } else {
            if (iconSidebar) iconSidebar.classList.remove('show');
            if (textSidebar) textSidebar.classList.remove('show');
            if (overlay) overlay.classList.remove('show');
        }
        // Mobile toggle button always shows ☰
        if (toggleBtn) toggleBtn.innerHTML = '☰';
    } else {
        // Desktop behavior - just toggle text sidebar
        sidebarCollapsed = !sidebarCollapsed;

        if (textSidebar && mainContent) {
            if (sidebarCollapsed) {
                textSidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
                if (toggleBtn) toggleBtn.innerHTML = '☰';
            } else {
                textSidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
                if (toggleBtn) toggleBtn.innerHTML = '❮';
            }
        }
    }
};

export const closeSidebars = () => {
    if (typeof window === 'undefined') return;

    const iconSidebar = document.getElementById('iconSidebar');
    const textSidebar = document.getElementById('textSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (iconSidebar) iconSidebar.classList.remove('show');
    if (textSidebar) textSidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    mobileSidebarsOpen = false;
};

export const toggleSubmenu = (element) => {
    if (typeof window === 'undefined' || !element) return;

    const submenu = element.nextElementSibling;
    const arrow = element.querySelector('span:last-child');

    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('show');
        if (arrow) {
            arrow.innerHTML = submenu.classList.contains('show') ? '▼' : '▶';
        }
    }

    // Toggle active state
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
};
