/**
 * Ecopoint Platform — Core Application Logic & Router
 */
const App = {
  state: {
    currentUser: null,
    currentTab: 'dashboard',
    categories: [],
    rewards: [],
    theme: localStorage.getItem('ecopoint_theme') || 'light'
  },

  async init() {
    this.applyTheme(this.state.theme);
    this.setupEventListeners();
    await this.loadInitialMetadata();
    await this.checkAuth();
  },

  // -------------------------------------------------------------------------
  // Theme & UI Helpers
  // -------------------------------------------------------------------------
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.state.theme = theme;
    localStorage.setItem('ecopoint_theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'dark' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  },

  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

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
    const backdrop = document.getElementById('app-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!backdrop || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = contentHtml;
    backdrop.classList.add('open');
  },

  closeModal() {
    const backdrop = document.getElementById('app-modal');
    if (backdrop) backdrop.classList.remove('open');
  },

  // -------------------------------------------------------------------------
  // Auth & Lifecycle
  // -------------------------------------------------------------------------
  async loadInitialMetadata() {
    try {
      this.state.categories = await API.common.getCategories();
    } catch (err) {
      console.warn('Categories load error:', err);
    }
  },

  async checkAuth() {
    try {
      const user = await API.auth.me();
      this.handleAuthSuccess(user);
    } catch (err) {
      // Default to demo switch for Aarav Sharma (Citizen User) on initial visit
      await this.switchDemoAccount('user@ecopoint.com');
    }
  },

  handleAuthSuccess(user) {
    this.state.currentUser = user;
    this.renderUserProfile();
    this.renderNavigation();
    this.updateDemoButtons();

    // Default starting tab based on role
    if (user.role === 'ROLE_COLLECTOR') {
      this.switchTab('collector-pickups');
    } else if (user.role === 'ROLE_OPERATOR') {
      this.switchTab('facility-queue');
    } else if (user.role === 'ROLE_ADMIN') {
      this.switchTab('admin-dashboard');
    } else {
      this.switchTab('user-dashboard');
    }
  },

  async switchDemoAccount(email) {
    try {
      const user = await API.auth.switchDemo(email);
      this.showToast(`Switched active profile to ${user.fullName} (${user.role.replace('ROLE_', '')})`, 'success');
      this.handleAuthSuccess(user);
    } catch (err) {
      this.showToast(`Failed to switch demo account: ${err.message}`, 'error');
    }
  },

  async logout() {
    try {
      await API.auth.logout();
      this.showToast('Logged out. Reconnecting demo user...', 'info');
      await this.switchDemoAccount('user@ecopoint.com');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // -------------------------------------------------------------------------
  // Rendering Navigation & Topbar
  // -------------------------------------------------------------------------
  renderUserProfile() {
    const user = this.state.currentUser;
    if (!user) return;

    const nameEl = document.getElementById('user-full-name');
    const roleEl = document.getElementById('user-role-label');
    const avatarEl = document.getElementById('user-avatar');
    const pointsBadge = document.getElementById('topbar-points-badge');

    if (nameEl) nameEl.textContent = user.fullName;
    if (roleEl) roleEl.textContent = user.role.replace('ROLE_', '');
    if (avatarEl) avatarEl.textContent = user.fullName.charAt(0);
    if (pointsBadge) {
      pointsBadge.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${user.pointsBalance || 0} pts`;
    }
  },

  updateDemoButtons() {
    const user = this.state.currentUser;
    if (!user) return;

    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.role === user.role) {
        btn.classList.add('active');
      }
    });
  },

  renderNavigation() {
    const user = this.state.currentUser;
    const navContainer = document.getElementById('sidebar-nav');
    if (!navContainer || !user) return;

    let html = '';

    if (user.role === 'ROLE_USER' || user.role === 'ROLE_ADMIN') {
      html += `
        <div class="nav-label">Citizen Portal</div>
        <div class="nav-item" onclick="App.switchTab('user-dashboard')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          My EcoDashboard
        </div>
        <div class="nav-item" onclick="App.openDepositModal()">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Register Bag Deposit
        </div>
        <div class="nav-item" onclick="App.switchTab('user-deposits')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Deposit History & Timeline
        </div>
        <div class="nav-item" onclick="App.switchTab('user-rewards')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>
          Rewards & Vouchers
        </div>
        <div class="nav-item" onclick="App.switchTab('user-ledger')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          EcoPoints Ledger
        </div>
      `;
    }

    if (user.role === 'ROLE_COLLECTOR' || user.role === 'ROLE_ADMIN') {
      html += `
        <div class="nav-label">Collector Portal</div>
        <div class="nav-item" onclick="App.switchTab('collector-pickups')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"/><path d="M23 13v-2a2 2 0 0 0-2-2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          Pending Bag Pickups
        </div>
      `;
    }

    if (user.role === 'ROLE_OPERATOR' || user.role === 'ROLE_ADMIN') {
      html += `
        <div class="nav-label">Facility Operator Portal</div>
        <div class="nav-item" onclick="App.switchTab('facility-queue')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Weigh & Grade Incoming Waste
        </div>
      `;
    }

    if (user.role === 'ROLE_ADMIN') {
      html += `
        <div class="nav-label">Administrator</div>
        <div class="nav-item" onclick="App.switchTab('admin-dashboard')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Platform Analytics
        </div>
        <div class="nav-item" onclick="App.switchTab('admin-deposits')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          All Deposits & Audit
        </div>
        <div class="nav-item" onclick="App.switchTab('admin-bags')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Reusable Bags Registry
        </div>
        <div class="nav-item" onclick="App.switchTab('admin-categories')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Waste Categories & Rates
        </div>
        <div class="nav-item" onclick="App.switchTab('admin-rewards')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/></svg>
          Rewards Management
        </div>
        <div class="nav-item" onclick="App.switchTab('admin-ledger')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Global Audit Ledger
        </div>
      `;
    }

    navContainer.innerHTML = html;
  },

  switchTab(tabId) {
    this.state.currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    contentArea.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);">Loading view...</div>`;

    switch(tabId) {
      case 'user-dashboard': this.renderUserDashboard(contentArea); break;
      case 'user-deposits': this.renderUserDeposits(contentArea); break;
      case 'user-rewards': this.renderUserRewards(contentArea); break;
      case 'user-ledger': this.renderUserLedger(contentArea); break;
      case 'collector-pickups': this.renderCollectorPickups(contentArea); break;
      case 'facility-queue': this.renderFacilityQueue(contentArea); break;
      case 'admin-dashboard': this.renderAdminDashboard(contentArea); break;
      case 'admin-deposits': this.renderAdminDeposits(contentArea); break;
      case 'admin-bags': this.renderAdminBags(contentArea); break;
      case 'admin-categories': this.renderAdminCategories(contentArea); break;
      case 'admin-rewards': this.renderAdminRewards(contentArea); break;
      case 'admin-ledger': this.renderAdminLedger(contentArea); break;
      default: this.renderUserDashboard(contentArea);
    }
  },

  // -------------------------------------------------------------------------
  // Citizen Portal Views
  // -------------------------------------------------------------------------
  async renderUserDashboard(container) {
    try {
      const deposits = await API.user.getDeposits();
      const wallet = await API.user.getWallet();

      const activeDeposits = deposits.filter(d => ['SUBMITTED', 'PICKED_UP', 'AT_FACILITY'].includes(d.status));
      const verifiedDeposits = deposits.filter(d => d.status === 'VERIFIED');
      const totalDiverted = verifiedDeposits.reduce((sum, d) => sum + (d.actualWeight || 0), 0);

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h2 style="font-size: 1.45rem; font-weight: 800;">Welcome back, ${this.state.currentUser.fullName}</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Trace your segregated waste, prevent land-filling, and earn verified EcoPoints.</p>
          </div>
          <button class="btn btn-primary" onclick="App.openDepositModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Register Bag Deposit
          </button>
        </div>

        <div class="stat-grid">
          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(102, 131, 91, 0.2); color: var(--color-primary);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">EcoWallet Balance</div>
              <div class="stat-value">${wallet.balance} <span style="font-size: 1rem; font-weight: 500;">pts</span></div>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(142, 106, 75, 0.18); color: var(--color-accent);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Active in Transit</div>
              <div class="stat-value">${activeDeposits.length}</div>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(62, 126, 85, 0.2); color: var(--color-success);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Verified Diverted</div>
              <div class="stat-value">${totalDiverted.toFixed(1)} <span style="font-size: 1rem; font-weight: 500;">kg</span></div>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(184, 123, 46, 0.18); color: var(--color-warning);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Lifetime Points Earned</div>
              <div class="stat-value">${wallet.totalEarned} <span style="font-size: 1rem; font-weight: 500;">pts</span></div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 24px;">
          <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
              <h3 style="font-size: 1.05rem; font-weight: 700;">Recent Waste Deposits</h3>
              <a href="javascript:void(0)" onclick="App.switchTab('user-deposits')" style="font-size: 0.82rem; color: var(--color-primary); font-weight: 600;">View All →</a>
            </div>
            ${this.renderDepositsTableHtml(deposits.slice(0, 5))}
          </div>

          <div class="glass-card">
            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 14px;">Segregation Rates</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">EcoPoints are credited only upon facility verification based on net accepted weight.</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${this.state.categories.map(c => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  <span style="font-weight: 600; font-size: 0.85rem;">${c.name}</span>
                  <span class="badge" style="background: var(--color-primary-light); color: var(--color-primary);">${c.pointsPerKg} pts/kg</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">Error loading dashboard: ${err.message}</div>`;
    }
  },

  async renderUserDeposits(container) {
    try {
      const deposits = await API.user.getDeposits();
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800;">My Deposit Traceability History</h2>
            <p style="color: var(--text-secondary); font-size: 0.88rem;">Click any deposit to inspect its complete timestamped chain-of-custody audit trail.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.openDepositModal()">+ New Deposit</button>
        </div>
        <div class="glass-card">
          ${this.renderDepositsTableHtml(deposits)}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  async renderUserRewards(container) {
    try {
      const rewards = await API.common.getRewards();
      const redemptions = await API.user.getMyRedemptions();
      const wallet = await API.user.getWallet();

      container.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 800;">Rewards Catalogue</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem;">
            Redeem your verified EcoPoints for zero-waste products and community vouchers. 
            <span style="font-weight: 700; color: var(--color-primary);">Current Balance: ${wallet.balance} pts</span>
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-bottom: 36px;">
          ${rewards.map(r => `
            <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span class="badge" style="background: var(--color-accent-light); color: var(--color-accent);">${r.category}</span>
                  <span style="font-weight: 800; color: var(--color-primary); font-size: 1.1rem;">${r.pointsCost} pts</span>
                </div>
                <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 6px;">${r.title}</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px;">${r.description}</p>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 16px;">
                  Sponsor: <span style="font-weight: 600;">${r.sponsorName}</span><br>
                  Stock: <span style="font-weight: 600;">${r.stock} units remaining</span>
                </div>
              </div>
              <button 
                class="btn btn-primary" 
                style="width: 100%;" 
                ${wallet.balance < r.pointsCost || r.stock <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                onclick="App.redeemReward(${r.id}, '${r.title}', ${r.pointsCost})">
                ${r.stock <= 0 ? 'Out of Stock' : (wallet.balance < r.pointsCost ? 'Insufficient Points' : 'Redeem Reward')}
              </button>
            </div>
          `).join('')}
        </div>

        <div class="glass-card">
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 14px;">My Redeemed Vouchers & Codes</h3>
          ${redemptions.length === 0 ? `<p style="color: var(--text-muted); font-size: 0.85rem;">No rewards redeemed yet. Earn points by segregating waste!</p>` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Redemption Code</th>
                    <th>Reward Title</th>
                    <th>Category</th>
                    <th>Points Spent</th>
                    <th>Redeemed Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${redemptions.map(red => `
                    <tr>
                      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${red.redemptionCode}</td>
                      <td style="font-weight: 600;">${red.rewardTitle}</td>
                      <td><span class="badge" style="background: var(--bg-secondary);">${red.rewardCategory}</span></td>
                      <td>${red.pointsSpent} pts</td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(red.redeemedAt).toLocaleDateString()}</td>
                      <td><span class="badge badge-verified">${red.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  async renderUserLedger(container) {
    try {
      const transactions = await API.user.getTransactions();
      const wallet = await API.user.getWallet();

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800;">EcoWallet Transaction Ledger</h2>
            <p style="color: var(--text-secondary); font-size: 0.88rem;">Immutable, auditable ledger of all EcoPoints credits and debits.</p>
          </div>
          <div class="badge" style="font-size: 0.95rem; padding: 8px 16px; background: var(--color-primary-light); color: var(--color-primary);">
            Balance: ${wallet.balance} pts
          </div>
        </div>

        <div class="glass-card">
          ${transactions.length === 0 ? `<p style="color: var(--text-muted);">No ledger entries recorded yet.</p>` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tx ID</th>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Balance After</th>
                    <th>Description</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map(t => `
                    <tr>
                      <td style="font-family: var(--font-mono); font-size: 0.8rem;">#TX-${t.id}</td>
                      <td>
                        <span class="badge ${t.type === 'CREDIT_EARNED' ? 'badge-verified' : 'badge-rejected'}">
                          ${t.type === 'CREDIT_EARNED' ? '+ CREDIT' : '- DEBIT'}
                        </span>
                      </td>
                      <td style="font-weight: 700; color: ${t.points > 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
                        ${t.points > 0 ? '+' : ''}${t.points}
                      </td>
                      <td style="font-weight: 600;">${t.balanceAfter} pts</td>
                      <td style="font-size: 0.85rem;">${t.description}</td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(t.timestamp).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  // -------------------------------------------------------------------------
  // Collector Portal Views
  // -------------------------------------------------------------------------
  async renderCollectorPickups(container) {
    try {
      const pickups = await API.collector.getPendingPickups();

      container.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 800;">Collector Dashboard — Pending Pickups</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem;">Scan reusable bag code or verify bag code to confirm custody and transfer to facility.</p>
        </div>

        <div class="glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.05rem; font-weight: 700;">Awaiting Collection (${pickups.length})</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Status: SUBMITTED</span>
          </div>

          ${pickups.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.4;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <p>All pending deposits have been collected. Outstanding queue is empty!</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Deposit Code</th>
                    <th>Bag Identifier Code</th>
                    <th>Citizen</th>
                    <th>Category</th>
                    <th>Estimated Weight</th>
                    <th>Registered At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pickups.map(p => `
                    <tr>
                      <td style="font-family: var(--font-mono); font-weight: 700;">${p.depositCode}</td>
                      <td>
                        <span class="badge" style="background: var(--color-primary-light); color: var(--color-primary); font-family: var(--font-mono);">
                          ${p.bagCode}
                        </span>
                      </td>
                      <td>${p.userFullName}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${p.userEmail}</span></td>
                      <td>${p.initialCategoryName}</td>
                      <td>${p.estimatedWeight} kg</td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td>
                        <button class="btn btn-primary btn-sm" onclick="App.openPickupModal(${p.id}, '${p.depositCode}', '${p.bagCode}')">
                          Confirm Pickup
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  // -------------------------------------------------------------------------
  // Facility Operator Portal Views
  // -------------------------------------------------------------------------
  async renderFacilityQueue(container) {
    try {
      const queue = await API.facility.getQueue();

      container.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 800;">Material Recovery Facility — Inbound Queue</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem;">Weigh, verify waste category, record circular processing outcome, and approve EcoPoint credits.</p>
        </div>

        <div class="glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.05rem; font-weight: 700;">Incoming Deposits for Grading (${queue.length})</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Status: PICKED_UP / AT_FACILITY</span>
          </div>

          ${queue.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.4;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <p>No incoming waste deposits waiting for facility verification.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Deposit Code</th>
                    <th>Bag Code</th>
                    <th>Citizen User</th>
                    <th>Declared Category</th>
                    <th>Est. Weight</th>
                    <th>Collector</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${queue.map(q => `
                    <tr>
                      <td style="font-family: var(--font-mono); font-weight: 700;">${q.depositCode}</td>
                      <td><span class="badge" style="background: var(--color-primary-light); color: var(--color-primary); font-family: var(--font-mono);">${q.bagCode}</span></td>
                      <td>${q.userFullName}</td>
                      <td>${q.initialCategoryName}</td>
                      <td>${q.estimatedWeight} kg</td>
                      <td>${q.collectorName || 'Assigned'}</td>
                      <td><span class="badge badge-${q.status.toLowerCase()}">${q.status}</span></td>
                      <td>
                        <button class="btn btn-primary btn-sm" onclick="App.openVerifyModal(${q.id}, '${q.depositCode}', ${q.initialCategoryId}, ${q.estimatedWeight})">
                          Inspect & Grade
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  // -------------------------------------------------------------------------
  // Admin Portal Views
  // -------------------------------------------------------------------------
  async renderAdminDashboard(container) {
    try {
      const stats = await API.admin.getStats();

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.45rem; font-weight: 800;">Platform Administration & Governance</h2>
            <p style="color: var(--text-secondary); font-size: 0.88rem;">Oversee municipal waste flows, token ledger integrity, and download official reports.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <a href="/api/admin/reports/deposits/csv" class="btn btn-secondary btn-sm" download>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Deposits CSV
            </a>
            <a href="/api/admin/reports/ledger/csv" class="btn btn-secondary btn-sm" download>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Ledger CSV
            </a>
          </div>
        </div>

        <div class="stat-grid">
          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(62, 126, 85, 0.2); color: var(--color-success);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Waste Diverted</div>
              <div class="stat-value">${stats.totalWeightKg} <span style="font-size: 1rem; font-weight: 500;">kg</span></div>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(102, 131, 91, 0.2); color: var(--color-primary);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Points Awarded</div>
              <div class="stat-value">${stats.totalPointsAwarded} <span style="font-size: 1rem; font-weight: 500;">pts</span></div>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(142, 106, 75, 0.18); color: var(--color-accent);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Active Reusable Bags</div>
              <div class="stat-value">${stats.activeBagsCount}</div>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon" style="background: rgba(184, 123, 46, 0.18); color: var(--color-warning);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Registered Accounts</div>
              <div class="stat-value">${stats.totalUsersCount}</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;">
          <div class="glass-card">
            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px;">Traceability Queue Status</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                <span>Awaiting Collector Pickup</span>
                <span class="badge badge-submitted">${stats.pendingPickupsCount} pending</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                <span>Awaiting Facility Verification</span>
                <span class="badge badge-picked_up">${stats.pendingVerificationsCount} pending</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                <span>Successfully Verified & Credited</span>
                <span class="badge badge-verified">${stats.verifiedCount} verified</span>
              </div>
            </div>
          </div>

          <div class="glass-card">
            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px;">Quick Administrative Actions</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button class="btn btn-secondary" onclick="App.openRegisterBagModal()">
                + Register New Reusable Bag Code
              </button>
              <button class="btn btn-secondary" onclick="App.switchTab('admin-categories')">
                Configure Waste Point Rules
              </button>
              <button class="btn btn-secondary" onclick="App.switchTab('admin-rewards')">
                Manage Rewards Catalogue
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  async renderAdminDeposits(container) {
    try {
      const deposits = await API.admin.getDeposits();
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800;">All Municipal Deposits & Audit Records</h2>
            <p style="color: var(--text-secondary); font-size: 0.88rem;">Complete transparency log of all submitted, collected, and verified deposits.</p>
          </div>
          <a href="/api/admin/reports/deposits/csv" class="btn btn-secondary btn-sm" download>Download CSV</a>
        </div>
        <div class="glass-card">
          ${this.renderDepositsTableHtml(deposits)}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  async renderAdminBags(container) {
    try {
      const bags = await API.admin.getBags();
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800;">Reusable Waste Bags Registry</h2>
            <p style="color: var(--text-secondary); font-size: 0.88rem;">Each reusable bag features a unique code that prevents duplicate active deposits.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.openRegisterBagModal()">+ Register Bag Code</button>
        </div>

        <div class="glass-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bag ID</th>
                  <th>Bag Code</th>
                  <th>Status</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                ${bags.map(b => `
                  <tr>
                    <td>#${b.id}</td>
                    <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${b.bagCode}</td>
                    <td><span class="badge ${b.status === 'AVAILABLE' ? 'badge-verified' : 'badge-submitted'}">${b.status}</span></td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  async renderAdminCategories(container) {
    try {
      const categories = await API.admin.getCategories();
      container.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 800;">Waste Categories & Point Incentive Rules</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem;">Adjust EcoPoints earned per kilogram for each segregated waste stream.</p>
        </div>

        <div class="glass-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Rate (EcoPoints / kg)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${categories.map(c => `
                  <tr>
                    <td style="font-weight: 700;">${c.name}</td>
                    <td style="font-size: 0.85rem; color: var(--text-secondary);">${c.description}</td>
                    <td style="font-weight: 800; color: var(--color-primary);">${c.pointsPerKg} pts/kg</td>
                    <td><span class="badge badge-verified">ACTIVE</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="App.openEditRateModal(${c.id}, '${c.name}', ${c.pointsPerKg})">
                        Edit Rate
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  async renderAdminRewards(container) {
    try {
      const rewards = await API.admin.getRewards();
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800;">Rewards Management</h2>
            <p style="color: var(--text-secondary); font-size: 0.88rem;">Configure voucher stock and partner integrations.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.openAddRewardModal()">+ Add New Reward</button>
        </div>

        <div class="glass-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Points Cost</th>
                  <th>Stock Available</th>
                  <th>Sponsor</th>
                </tr>
              </thead>
              <tbody>
                ${rewards.map(r => `
                  <tr>
                    <td style="font-weight: 700;">${r.title}</td>
                    <td><span class="badge" style="background: var(--bg-secondary);">${r.category}</span></td>
                    <td style="font-weight: 700; color: var(--color-primary);">${r.pointsCost} pts</td>
                    <td style="font-weight: 600;">${r.stock} units</td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${r.sponsorName}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  async renderAdminLedger(container) {
    try {
      const ledger = await API.admin.getLedger();
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800;">Platform-Wide Audit Ledger</h2>
            <p style="color: var(--text-secondary); font-size: 0.88rem;">Complete tamper-evident double-entry ledger of all transactions across all citizens.</p>
          </div>
          <a href="/api/admin/reports/ledger/csv" class="btn btn-secondary btn-sm" download>Download Ledger CSV</a>
        </div>

        <div class="glass-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Balance After</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${ledger.map(t => `
                  <tr>
                    <td style="font-family: var(--font-mono); font-size: 0.8rem;">#TX-${t.id}</td>
                    <td>${t.wallet && t.wallet.user ? t.wallet.user.fullName : 'User'}</td>
                    <td>
                      <span class="badge ${t.type === 'CREDIT_EARNED' ? 'badge-verified' : 'badge-rejected'}">
                        ${t.type === 'CREDIT_EARNED' ? '+ CREDIT' : '- DEBIT'}
                      </span>
                    </td>
                    <td style="font-weight: 700; color: ${t.points > 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
                      ${t.points > 0 ? '+' : ''}${t.points}
                    </td>
                    <td style="font-weight: 600;">${t.balanceAfter} pts</td>
                    <td style="font-size: 0.85rem;">${t.description}</td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(t.timestamp).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="color: var(--color-danger);">${err.message}</div>`;
    }
  },

  // -------------------------------------------------------------------------
  // Shared Table Helper
  // -------------------------------------------------------------------------
  renderDepositsTableHtml(deposits) {
    if (!deposits || deposits.length === 0) {
      return `<p style="color: var(--text-muted); padding: 16px 0;">No deposits found.</p>`;
    }

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Deposit Code</th>
              <th>Bag Code</th>
              <th>Category</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Points Awarded</th>
              <th>Outcome</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${deposits.map(d => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${d.depositCode}</td>
                <td><span class="badge" style="background: var(--color-primary-light); color: var(--color-primary); font-family: var(--font-mono);">${d.bagCode}</span></td>
                <td>${d.actualCategoryName || d.initialCategoryName}</td>
                <td>
                  ${d.actualWeight ? `<span style="font-weight:700;">${d.actualWeight} kg</span> <span style="font-size:0.75rem; color:var(--text-muted);">(est: ${d.estimatedWeight})</span>` : `est: ${d.estimatedWeight} kg`}
                </td>
                <td><span class="badge badge-${d.status.toLowerCase()}">${d.status}</span></td>
                <td style="font-weight: 700; color: ${d.pointsAwarded > 0 ? 'var(--color-success)' : 'var(--text-muted)'};">
                  ${d.pointsAwarded > 0 ? `+${d.pointsAwarded} pts` : '—'}
                </td>
                <td><span style="font-size: 0.78rem; font-weight: 600;">${d.processingOutcome || 'PENDING'}</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="App.openTimelineModal('${d.depositCode}')">
                    Inspect Timeline
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // -------------------------------------------------------------------------
  // Modals & Action Handlers
  // -------------------------------------------------------------------------
  openDepositModal() {
    const categoriesHtml = this.state.categories.map(c => 
      `<option value="${c.id}">${c.name} (${c.pointsPerKg} pts/kg) — ${c.description}</option>`
    ).join('');

    const html = `
      <form id="deposit-form" onsubmit="App.handleDepositSubmit(event)">
        <div class="form-group">
          <label class="form-label">Reusable Bag Identifier Code</label>
          <input type="text" id="dep-bag-code" class="form-input" placeholder="e.g. BAG-1001" required value="BAG-1001">
          <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">
            Rule: A reusable bag cannot have multiple active deposits in progress simultaneously.
          </small>
        </div>

        <div class="form-group">
          <label class="form-label">Waste Category</label>
          <select id="dep-category-id" class="form-select" required>
            ${categoriesHtml}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Estimated Weight (kg)</label>
          <input type="number" id="dep-weight" class="form-input" min="0.1" step="0.1" value="2.5" required>
        </div>

        <div class="form-group">
          <label class="form-label">Notes for Collector (Optional)</label>
          <input type="text" id="dep-notes" class="form-input" placeholder="e.g. Placed at apartment doorstep">
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Submit Deposit</button>
        </div>
      </form>
    `;

    this.openModal('Register New Waste Deposit', html);
  },

  async handleDepositSubmit(e) {
    e.preventDefault();
    const bagCode = document.getElementById('dep-bag-code').value.trim();
    const categoryId = parseInt(document.getElementById('dep-category-id').value);
    const estimatedWeight = parseFloat(document.getElementById('dep-weight').value);
    const notes = document.getElementById('dep-notes').value.trim();

    try {
      const res = await API.user.createDeposit({ bagCode, categoryId, estimatedWeight, notes });
      this.closeModal();
      this.showToast(`Deposit ${res.depositCode} registered successfully!`, 'success');
      this.switchTab('user-deposits');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async openTimelineModal(depositCode) {
    try {
      const dep = await API.user.getDepositTimeline(depositCode);
      const timelineHtml = dep.timeline.map(event => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-title">${event.status}</span>
              <span class="timeline-time">${new Date(event.timestamp).toLocaleString()}</span>
            </div>
            <div class="timeline-note">${event.note || 'Status updated'}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
              Actor: <span style="font-weight: 600;">${event.actorName || 'System'}</span> (${event.actorRole || 'SYSTEM'})
            </div>
          </div>
        </div>
      `).join('');

      const html = `
        <div style="margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: var(--color-primary);">${dep.depositCode}</span>
            <span class="badge badge-${dep.status.toLowerCase()}">${dep.status}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 0.85rem;">
            <div>Bag Code: <span style="font-weight: 600; font-family: var(--font-mono);">${dep.bagCode}</span></div>
            <div>Category: <span style="font-weight: 600;">${dep.actualCategoryName || dep.initialCategoryName}</span></div>
            <div>Actual Weight: <span style="font-weight: 600;">${dep.actualWeight != null ? dep.actualWeight + ' kg' : 'Pending inspection'}</span></div>
            <div>EcoPoints Credited: <span style="font-weight: 700; color: var(--color-success);">${dep.pointsAwarded} pts</span></div>
          </div>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px;">Traceability Chain of Custody</h4>
        <div class="timeline">
          ${timelineHtml}
        </div>

        <div style="text-align: right; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        </div>
      `;

      this.openModal(`Deposit Timeline — ${dep.depositCode}`, html);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openPickupModal(depositId, depositCode, bagCode) {
    const html = `
      <form onsubmit="App.handlePickupSubmit(event, ${depositId})">
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">
          Confirming pickup for deposit <strong style="font-family: var(--font-mono); color: var(--color-primary);">${depositCode}</strong> 
          using reusable bag <strong style="font-family: var(--font-mono);">${bagCode}</strong>.
        </p>

        <div class="form-group">
          <label class="form-label">Collector Notes (Optional)</label>
          <input type="text" id="pickup-notes" class="form-input" placeholder="e.g. Bag seal intact, verified barcode tag">
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Confirm & Take Custody</button>
        </div>
      </form>
    `;
    this.openModal(`Pickup Confirmation — ${depositCode}`, html);
  },

  async handlePickupSubmit(e, depositId) {
    e.preventDefault();
    const notes = document.getElementById('pickup-notes').value.trim();
    try {
      await API.collector.confirmPickup(depositId, notes);
      this.closeModal();
      this.showToast('Bag pickup verified and custody recorded!', 'success');
      this.switchTab('collector-pickups');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openVerifyModal(depositId, depositCode, currentCategoryId, estimatedWeight) {
    const categoriesHtml = this.state.categories.map(c => 
      `<option value="${c.id}" ${c.id === currentCategoryId ? 'selected' : ''}>${c.name} (${c.pointsPerKg} pts/kg)</option>`
    ).join('');

    const outcomesHtml = ['RECYCLED', 'COMPOSTED', 'ENERGY_RECOVERY', 'HAZARDOUS_DISPOSAL', 'LANDFILL_REJECTED'].map(o =>
      `<option value="${o}">${o}</option>`
    ).join('');

    const html = `
      <form onsubmit="App.handleVerifySubmit(event, ${depositId})">
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Deposit Code: <strong style="color: var(--color-primary); font-family: var(--font-mono);">${depositCode}</strong> | Declared Est. Weight: ${estimatedWeight} kg
        </div>

        <div class="form-group">
          <label class="form-label">Accepted Waste Category</label>
          <select id="vf-category-id" class="form-select" onchange="App.calculatePointsPreview()" required>
            ${categoriesHtml}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Actual Scale Weight (kg)</label>
          <input type="number" id="vf-weight" class="form-input" min="0.05" step="0.05" value="${estimatedWeight}" oninput="App.calculatePointsPreview()" required>
        </div>

        <div class="form-group">
          <label class="form-label">Operator Notes (Optional)</label>
          <input type="text" id="vf-operator-notes" class="form-input" placeholder="e.g. Batch inspected and sorted cleanly">
        </div>

        <div class="form-group">
          <label class="form-label">Processing Outcome</label>
          <select id="vf-outcome" class="form-select" required>
            ${outcomesHtml}
          </select>
        </div>

        <div style="padding: 12px 16px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 0.88rem;">Calculated EcoPoints Credit:</span>
            <span id="vf-points-preview" style="font-weight: 800; font-size: 1.25rem; color: var(--color-success);">— pts</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
          <button type="button" class="btn btn-danger btn-sm" onclick="App.handleRejectSubmit(${depositId})">Reject Deposit</button>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Approve & Credit Points</button>
          </div>
        </div>
      </form>
    `;
    this.openModal(`Facility Inspection — ${depositCode}`, html);
    setTimeout(() => this.calculatePointsPreview(), 50);
  },

  calculatePointsPreview() {
    const weightEl = document.getElementById('vf-weight');
    const catEl = document.getElementById('vf-category-id');
    const previewEl = document.getElementById('vf-points-preview');

    if (!weightEl || !catEl || !previewEl) return;

    const weight = parseFloat(weightEl.value) || 0;
    const catId = parseInt(catEl.value);

    const category = this.state.categories.find(c => c.id === catId);
    const rate = category ? category.pointsPerKg : 10;

    const finalPoints = Math.round(weight * rate);
    previewEl.textContent = `+${finalPoints} pts`;
  },

  async handleVerifySubmit(e, depositId) {
    e.preventDefault();
    const actualCategoryId = parseInt(document.getElementById('vf-category-id').value);
    const actualWeight = parseFloat(document.getElementById('vf-weight').value);
    const processingOutcome = document.getElementById('vf-outcome').value;

    try {
      await API.facility.verifyDeposit(depositId, {
        actualCategoryId,
        actualWeight,
        processingOutcome,
        reject: false
      });
      this.closeModal();
      this.showToast('Deposit verified and EcoPoints credited to user wallet!', 'success');
      this.switchTab('facility-queue');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async handleRejectSubmit(depositId) {
    if (!confirm('Are you sure you want to REJECT this deposit? Zero points will be credited.')) return;
    try {
      await API.facility.verifyDeposit(depositId, {
        actualCategoryId: parseInt(document.getElementById('vf-category-id').value),
        actualWeight: parseFloat(document.getElementById('vf-weight').value) || 1.0,
        processingOutcome: 'LANDFILL_REJECTED',
        reject: true
      });
      this.closeModal();
      this.showToast('Deposit rejected and marked LANDFILL_REJECTED.', 'info');
      this.switchTab('facility-queue');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async redeemReward(rewardId, title, pointsCost) {
    if (!confirm(`Redeem "${title}" for ${pointsCost} EcoPoints?`)) return;

    try {
      const red = await API.user.redeemReward(rewardId);
      this.showToast(`Reward redeemed! Your voucher code: ${red.redemptionCode}`, 'success');
      // Refresh current user wallet balance
      const me = await API.auth.me();
      this.state.currentUser = me;
      this.renderUserProfile();
      this.switchTab('user-rewards');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openRegisterBagModal() {
    const html = `
      <form onsubmit="App.handleRegisterBagSubmit(event)">
        <div class="form-group">
          <label class="form-label">Reusable Bag Code</label>
          <input type="text" id="new-bag-code" class="form-input" placeholder="e.g. BAG-1006" required>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Register Bag</button>
        </div>
      </form>
    `;
    this.openModal('Register New Reusable Bag', html);
  },

  async handleRegisterBagSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('new-bag-code').value.trim();
    try {
      await API.admin.registerBag(code);
      this.closeModal();
      this.showToast(`Bag ${code} registered successfully!`, 'success');
      this.switchTab('admin-bags');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openEditRateModal(categoryId, name, currentRate) {
    const html = `
      <form onsubmit="App.handleEditRateSubmit(event, ${categoryId})">
        <p style="margin-bottom: 14px; font-size: 0.88rem;">Updating point incentive rate for <strong>${name}</strong>.</p>
        <div class="form-group">
          <label class="form-label">Points per Kilogram</label>
          <input type="number" id="new-cat-rate" class="form-input" min="1" max="500" value="${currentRate}" required>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Rate</button>
        </div>
      </form>
    `;
    this.openModal(`Edit Rate — ${name}`, html);
  },

  async handleEditRateSubmit(e, categoryId) {
    e.preventDefault();
    const rate = parseInt(document.getElementById('new-cat-rate').value);
    try {
      await API.admin.updateCategoryRate(categoryId, rate);
      this.closeModal();
      this.showToast('Category rate updated!', 'success');
      await this.loadInitialMetadata();
      this.switchTab('admin-categories');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openAddRewardModal() {
    const html = `
      <form onsubmit="App.handleAddRewardSubmit(event)">
        <div class="form-group">
          <label class="form-label">Reward Title</label>
          <input type="text" id="rw-title" class="form-input" placeholder="e.g. ₹50 Coffee Voucher" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="rw-category" class="form-select">
            <option value="VOUCHER">VOUCHER</option>
            <option value="ECO_PRODUCT">ECO_PRODUCT</option>
            <option value="TRANSIT_PASS">TRANSIT_PASS</option>
            <option value="TREE_PLANTING">TREE_PLANTING</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Points Cost</label>
          <input type="number" id="rw-points" class="form-input" min="1" value="50" required>
        </div>
        <div class="form-group">
          <label class="form-label">Initial Stock</label>
          <input type="number" id="rw-stock" class="form-input" min="1" value="20" required>
        </div>
        <div class="form-group">
          <label class="form-label">Sponsor Name (Simulated)</label>
          <input type="text" id="rw-sponsor" class="form-input" placeholder="e.g. Green Bean Cafe (Simulated)" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="rw-desc" class="form-textarea" rows="2" placeholder="Reward details and redemption instructions"></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Reward</button>
        </div>
      </form>
    `;
    this.openModal('Add Catalogue Reward', html);
  },

  async handleAddRewardSubmit(e) {
    e.preventDefault();
    const payload = {
      title: document.getElementById('rw-title').value.trim(),
      category: document.getElementById('rw-category').value,
      pointsCost: parseInt(document.getElementById('rw-points').value),
      stock: parseInt(document.getElementById('rw-stock').value),
      sponsorName: document.getElementById('rw-sponsor').value.trim(),
      description: document.getElementById('rw-desc').value.trim(),
      active: true
    };
    try {
      await API.admin.saveReward(payload);
      this.closeModal();
      this.showToast('Reward created successfully!', 'success');
      this.switchTab('admin-rewards');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    const backdrop = document.getElementById('app-modal');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeModal();
      });
    }
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
