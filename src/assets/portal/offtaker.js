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
};

export const toggleSidebar = () => {
    if (typeof window === 'undefined') return;

    const textSidebar = document.getElementById('textSidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.querySelector('.toggle-btn');

    if (textSidebar && mainContent) {
        const isCollapsed = textSidebar.classList.contains('collapsed');

        if (isCollapsed) {
            textSidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            if (toggleBtn) toggleBtn.innerHTML = '❮';
        } else {
            textSidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            if (toggleBtn) toggleBtn.innerHTML = '☰';
        }
    }
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