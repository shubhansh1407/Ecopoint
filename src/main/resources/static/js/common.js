/**
 * Ecopoint Platform — Common Browser Utilities
 * Handles theme toggling, toast notifications, modals, authentication guard, and demo role switching.
 */
const Common = {
  theme: localStorage.getItem('ecopoint_theme') || 'light',

  init() {
    this.applyTheme(this.theme);
    this.setupModalListeners();
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.theme = theme;
    localStorage.setItem('ecopoint_theme', theme);

    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  },

  toggleTheme() {
    this.applyTheme(this.theme === 'light' ? 'dark' : 'light');
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  openModal(title, contentHtml) {
    let backdrop = document.getElementById('app-modal');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'app-modal';
      backdrop.className = 'modal-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.innerHTML = `
        <div class="modal-window">
          <div class="modal-header">
            <h3 id="modal-title">${title}</h3>
            <button class="modal-close-btn" onclick="Common.closeModal()" aria-label="Close dialog">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body" id="modal-body">${contentHtml}</div>
        </div>
      `;
      document.body.appendChild(backdrop);
    } else {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = contentHtml;
    }
    backdrop.classList.add('open');
  },

  closeModal() {
    const backdrop = document.getElementById('app-modal');
    if (backdrop) backdrop.classList.remove('open');
  },

  setupModalListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
    document.addEventListener('click', (e) => {
      const backdrop = document.getElementById('app-modal');
      if (backdrop && e.target === backdrop) this.closeModal();
    });
  },

  async requireAuth(allowedRoles = []) {
    try {
      const user = await API.auth.me();
      if (!user) {
        window.location.href = '/login.html';
        return null;
      }
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        this.showToast(`Access restricted for role ${user.role}`, 'error');
        this.redirectToRoleHome(user.role);
        return null;
      }
      this.populateUserPill(user);
      return user;
    } catch (err) {
      window.location.href = '/login.html';
      return null;
    }
  },

  populateUserPill(user) {
    const nameEl = document.getElementById('user-full-name');
    const roleEl = document.getElementById('user-role-label');
    const avatarEl = document.getElementById('user-avatar');
    const pointsBadge = document.getElementById('topbar-points-badge');

    if (nameEl) nameEl.textContent = user.fullName;
    if (roleEl) roleEl.textContent = user.role.replace('ROLE_', '');
    if (avatarEl) avatarEl.textContent = user.fullName.charAt(0);
    if (pointsBadge && user.pointsBalance !== undefined) {
      pointsBadge.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${user.pointsBalance} pts`;
    }
  },

  redirectToRoleHome(role) {
    switch (role) {
      case 'ROLE_USER': window.location.href = '/user-dashboard.html'; break;
      case 'ROLE_COLLECTOR': window.location.href = '/collector-dashboard.html'; break;
      case 'ROLE_OPERATOR': window.location.href = '/facility-dashboard.html'; break;
      case 'ROLE_ADMIN': window.location.href = '/admin-dashboard.html'; break;
      default: window.location.href = '/user-dashboard.html';
    }
  },

  async switchDemo(email) {
    try {
      const user = await API.auth.switchDemo(email);
      this.showToast(`Switched account to ${user.fullName}`, 'success');
      this.redirectToRoleHome(user.role);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async logout() {
    try {
      await API.auth.logout();
      window.location.href = '/login.html';
    } catch (err) {
      window.location.href = '/login.html';
    }
  }
};

window.addEventListener('DOMContentLoaded', () => Common.init());
