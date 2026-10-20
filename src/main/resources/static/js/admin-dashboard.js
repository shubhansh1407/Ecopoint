/**
 * Ecopoint Platform — Admin Portal Dashboard Logic
 * High-performance browser-side JavaScript for platform management.
 */
const AdminDashboard = {
  stats: null,
  users: [],
  deposits: [],
  bags: [],
  categories: [],
  rewards: [],
  ledger: [],

  async init() {
    const user = await Common.requireAuth(['ROLE_ADMIN']);
    if (!user) return;

    await this.loadAllData();
    this.renderStats();
    this.renderUsers();
    this.renderDeposits();
    this.renderBags();
    this.renderCategories();
    this.renderRewards();
    this.renderLedger();
  },

  async loadAllData() {
    try {
      const [stats, users, deposits, bags, categories, rewards, ledger] = await Promise.all([
        API.admin.getStats(),
        API.admin.getUsers(),
        API.admin.getDeposits(),
        API.admin.getBags(),
        API.admin.getCategories(),
        API.admin.getRewards(),
        API.admin.getLedger()
      ]);
      this.stats = stats;
      this.users = users;
      this.deposits = deposits;
      this.bags = bags;
      this.categories = categories;
      this.rewards = rewards;
      this.ledger = ledger;
    } catch (err) {
      Common.showToast(`Error loading admin data: ${err.message}`, 'error');
    }
  },

  renderStats() {
    if (!this.stats) return;
    const statsContainer = document.getElementById('kpi-grid');
    if (!statsContainer) return;

    const totalWeight = Number(this.stats.totalWeightKg || 0).toFixed(1);
    const totalPoints = this.stats.totalPointsAwarded || 0;
    const activeDeposits = (this.stats.pendingPickupsCount || 0) + (this.stats.pendingVerificationsCount || 0);
    const verifiedCount = this.stats.verifiedCount || 0;
    const usersCount = this.stats.totalUsersCount || 0;
    const bagsCount = this.stats.activeBagsCount || 0;

    statsContainer.innerHTML = `
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(102, 131, 91, 0.18); color: var(--color-primary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Verified Waste</div>
          <div class="stat-value">${totalWeight} <span style="font-size: 0.95rem; font-weight: 500;">kg</span></div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Diverted from city landfills</div>
        </div>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(142, 106, 75, 0.16); color: var(--color-accent);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">EcoPoints in Circulation</div>
          <div class="stat-value" style="color: var(--color-primary);">${totalPoints} <span style="font-size: 0.95rem; font-weight: 500;">pts</span></div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Awarded to citizen wallets</div>
        </div>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(184, 123, 46, 0.16); color: var(--color-warning);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Active Deposits</div>
          <div class="stat-value">${activeDeposits}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">In collection or facility pipeline</div>
        </div>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(62, 126, 85, 0.16); color: var(--color-success);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Verified Deposits</div>
          <div class="stat-value" style="color: var(--color-success);">
            ${verifiedCount}
          </div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Successfully verified deliveries</div>
        </div>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(102, 131, 91, 0.18); color: var(--color-primary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Registered Citizens</div>
          <div class="stat-value">${usersCount}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Active community accounts</div>
        </div>
      </div>

      <div class="glass-card stat-card">
        <div class="stat-icon" style="background: rgba(142, 106, 75, 0.16); color: var(--color-accent);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Registered Smart Reusable Bags</div>
          <div class="stat-value">${bagsCount}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Circular reusable custody carriers</div>
        </div>
      </div>
    `;
  },

  renderUsers() {
    const container = document.getElementById('users-table-container');
    if (!container) return;

    if (!this.users || this.users.length === 0) {
      container.innerHTML = `<p style="padding: 24px; text-align: center; color: var(--text-muted);">No accounts found.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Wallet Balance</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${this.users.map(u => `
              <tr>
                <td style="font-family: var(--font-mono); font-size: 0.82rem;">#${u.id}</td>
                <td style="font-weight: 600;">${Common.escapeHtml(u.fullName)}</td>
                <td style="font-family: var(--font-mono); font-size: 0.85rem;">${Common.escapeHtml(u.email)}</td>
                <td>${Common.escapeHtml(u.phone || '—')}</td>
                <td>
                  <span class="badge ${
                    u.role === 'ROLE_ADMIN' ? 'badge-verified' :
                    u.role === 'ROLE_COLLECTOR' ? 'badge-picked' :
                    u.role === 'ROLE_OPERATOR' ? 'badge-facility' : 'badge-submitted'
                  }">
                    ${u.role.replace('ROLE_', '')}
                  </span>
                </td>
                <td style="font-weight: 700; color: var(--color-primary);">${u.walletBalance || 0} pts</td>
                <td style="font-size: 0.82rem; color: var(--text-muted);">${Common.formatDate(u.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openCreateUserModal() {
    const html = `
      <form onsubmit="AdminDashboard.handleCreateUserSubmit(event)">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Provision staff members (Waste Collectors, Facility Operators) or citizen accounts.
        </p>
        <div class="form-group">
          <label class="form-label" for="new-user-name">Full Name</label>
          <input type="text" id="new-user-name" class="form-input" placeholder="e.g. Ramesh Kumar" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-user-email">Email Address</label>
          <input type="email" id="new-user-email" class="form-input" placeholder="e.g. ramesh.collector@ecopoint.com" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-user-password">Temporary Password (min 6 chars)</label>
          <input type="password" id="new-user-password" class="form-input" placeholder="Temporary password" minlength="6" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-user-phone">Phone Number</label>
          <input type="tel" id="new-user-phone" class="form-input" placeholder="e.g. 9876543210">
        </div>
        <div class="form-group">
          <label class="form-label" for="new-user-role">Assigned Role</label>
          <select id="new-user-role" class="form-select" required>
            <option value="ROLE_COLLECTOR" selected>🚚 Waste Collector (Pickup &amp; Bag Transfer)</option>
            <option value="ROLE_OPERATOR">🏭 Facility Operator (Weighing &amp; Quality Grading)</option>
            <option value="ROLE_USER">🌱 Citizen User (Segregation &amp; Rewards)</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="Common.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Account</button>
        </div>
      </form>
    `;
    Common.openModal('Provision Staff / User Account', html);
  },

  async handleCreateUserSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value;
    const phone = document.getElementById('new-user-phone').value.trim();
    const role = document.getElementById('new-user-role').value;

    try {
      const created = await API.admin.createUser({ fullName, email, password, phone, role });
      Common.closeModal();
      Common.showToast(`Account provisioned successfully for ${created.fullName} (${created.role.replace('ROLE_', '')})!`, 'success');
      this.users = await API.admin.getUsers();
      this.renderUsers();
      if (this.stats) {
        this.stats.totalUsersCount = this.users.length;
        this.renderStats();
      }
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  },

  renderDeposits() {
    const container = document.getElementById('deposits-table-container');
    if (!container) return;

    if (this.deposits.length === 0) {
      container.innerHTML = `<p style="padding: 24px; text-align: center; color: var(--text-muted);">No deposits recorded yet.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Deposit ID</th>
              <th>Bag Identifier Code</th>
              <th>Citizen Name</th>
              <th>Declared Waste Category</th>
              <th>Estimated Weight</th>
              <th>Verified Waste Category</th>
              <th>Verified Scale Weight</th>
              <th>Points Awarded</th>
              <th>Verification Status</th>
              <th>Processing Outcome</th>
              <th>Deposit Date</th>
            </tr>
          </thead>
          <tbody>
            ${this.deposits.map(d => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${d.depositCode}</td>
                <td><span class="badge" style="background: var(--color-primary-light); color: var(--color-primary); font-family: var(--font-mono);">${d.bagCode}</span></td>
                <td style="font-weight: 600;">${d.userFullName}</td>
                <td>${d.initialCategoryName}</td>
                <td>${d.estimatedWeight} kg</td>
                <td>${d.actualCategoryName || '—'}</td>
                <td>${d.actualWeight ? d.actualWeight + ' kg' : '—'}</td>
                <td style="font-weight: 700; color: var(--color-success);">${d.pointsAwarded !== null ? '+' + d.pointsAwarded : '—'}</td>
                <td><span class="badge badge-${d.status.toLowerCase()}">${d.status}</span></td>
                <td><span style="font-size: 0.78rem; font-weight: 600;">${d.processingOutcome || 'PENDING'}</span></td>
                <td style="font-size: 0.75rem; color: var(--text-muted);">${new Date(d.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderBags() {
    const container = document.getElementById('bags-table-container');
    if (!container) return;

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Bag ID</th>
              <th>Bag Unique Code</th>
              <th>Digital Tag / Barcode Identifier</th>
              <th>Registration Date</th>
              <th>Bag Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.bags.map(b => `
              <tr>
                <td>#${b.id}</td>
                <td><span class="badge" style="font-family: var(--font-mono); font-weight: 700; background: var(--color-primary-light); color: var(--color-primary);">${b.bagCode}</span></td>
                <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">${b.qrCodePayload || 'ECOPOINT-BAG-' + b.bagCode}</td>
                <td style="font-size: 0.8rem;">${new Date(b.createdAt).toLocaleDateString()}</td>
                <td><span class="badge badge-verified">${b.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openRegisterBagModal() {
    const html = `
      <form onsubmit="AdminDashboard.handleRegisterBagSubmit(event)">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Register a new reusable municipal smart waste bag into the circular inventory system.
        </p>
        <div class="form-group">
          <label class="form-label" for="new-bag-code">Bag Unique Code (e.g. ECO-BAG-999)</label>
          <input type="text" id="new-bag-code" class="form-input" placeholder="ECO-BAG-005" required pattern="[A-Za-z0-9-_]+" style="font-family: var(--font-mono);">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="Common.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Register Bag</button>
        </div>
      </form>
    `;
    Common.openModal('Register Reusable Bag', html);
  },

  async handleRegisterBagSubmit(e) {
    e.preventDefault();
    const bagCode = document.getElementById('new-bag-code').value.trim().toUpperCase();
    try {
      await API.admin.registerBag(bagCode);
      Common.closeModal();
      Common.showToast(`Bag ${bagCode} successfully registered!`, 'success');
      this.bags = await API.admin.getBags();
      this.renderBags();
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  },

  renderCategories() {
    const container = document.getElementById('categories-table-container');
    if (!container) return;

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Points Rate (pts / kg)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.categories.map(c => `
              <tr>
                <td>#${c.id}</td>
                <td style="font-weight: 700;">${c.name}</td>
                <td style="font-size: 0.82rem; color: var(--text-secondary); max-width: 320px;">${c.description}</td>
                <td><span class="badge" style="background: var(--color-primary-light); color: var(--color-primary); font-size: 0.9rem; font-weight: 700;">${c.pointsPerKg} pts/kg</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="AdminDashboard.openEditRateModal(${c.id}, '${c.name}', ${c.pointsPerKg})">
                    Edit Rate
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openEditRateModal(id, name, currentRate) {
    const html = `
      <form onsubmit="AdminDashboard.handleEditRateSubmit(event, ${id})">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Adjust community incentive conversion rate for <strong>${name}</strong>.
        </p>
        <div class="form-group">
          <label class="form-label" for="edit-points-rate">Points Awarded per Kilogram</label>
          <input type="number" id="edit-points-rate" class="form-input" min="1" max="1000" step="1" value="${currentRate}" required>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="Common.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Rate</button>
        </div>
      </form>
    `;
    Common.openModal(`Edit Points Rate — ${name}`, html);
  },

  async handleEditRateSubmit(e, id) {
    e.preventDefault();
    const rate = parseInt(document.getElementById('edit-points-rate').value);
    try {
      await API.admin.updateCategoryRate(id, rate);
      Common.closeModal();
      Common.showToast('Points rate updated successfully!', 'success');
      this.categories = await API.admin.getCategories();
      this.renderCategories();
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  },

  renderRewards() {
    const container = document.getElementById('rewards-table-container');
    if (!container) return;

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reward Item</th>
              <th>Category</th>
              <th>Cost (Points)</th>
              <th>Stock Available</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.rewards.map(r => `
              <tr>
                <td>#${r.id}</td>
                <td>
                  <div style="font-weight: 700;">${r.title}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${r.description}</div>
                </td>
                <td><span class="badge">${r.category}</span></td>
                <td style="font-weight: 700; color: var(--color-primary);">${r.pointsCost} pts</td>
                <td>${r.stock} remaining</td>
                <td><span class="badge ${r.active ? 'badge-verified' : 'badge-rejected'}">${r.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openCreateRewardModal() {
    const html = `
      <form onsubmit="AdminDashboard.handleCreateRewardSubmit(event)">
        <div class="form-group">
          <label class="form-label" for="rw-title">Reward Title</label>
          <input type="text" id="rw-title" class="form-input" placeholder="e.g. Stainless Steel Water Bottle" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="rw-desc">Description</label>
          <input type="text" id="rw-desc" class="form-input" placeholder="Eco-friendly thermal insulated bottle" required>
        </div>
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="rw-points">Points Cost</label>
            <input type="number" id="rw-points" class="form-input" min="5" value="100" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="rw-stock">Initial Stock</label>
            <input type="number" id="rw-stock" class="form-input" min="1" value="25" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="rw-cat">Category</label>
          <select id="rw-cat" class="form-select" required>
            <option value="Merchandise">Merchandise</option>
            <option value="Transit Pass">Transit Pass</option>
            <option value="Voucher">Grocery Voucher</option>
            <option value="Eco Gear">Eco Gear</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="Common.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Reward</button>
        </div>
      </form>
    `;
    Common.openModal('Add Community Reward', html);
  },

  async handleCreateRewardSubmit(e) {
    e.preventDefault();
    const reward = {
      title: document.getElementById('rw-title').value.trim(),
      description: document.getElementById('rw-desc').value.trim(),
      pointsCost: parseInt(document.getElementById('rw-points').value),
      stock: parseInt(document.getElementById('rw-stock').value),
      category: document.getElementById('rw-cat').value,
      active: true
    };
    try {
      await API.admin.saveReward(reward);
      Common.closeModal();
      Common.showToast('Reward created successfully!', 'success');
      this.rewards = await API.admin.getRewards();
      this.renderRewards();
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  },

  renderLedger() {
    const container = document.getElementById('ledger-table-container');
    if (!container) return;

    if (this.ledger.length === 0) {
      container.innerHTML = `<p style="padding: 24px; text-align: center; color: var(--text-muted);">No transactions recorded in wallet ledger.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Citizen Name</th>
              <th>Transaction Type</th>
              <th>Points Earned / Deducted</th>
              <th>Reference Code</th>
              <th>Transaction Description</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            ${this.ledger.map(tx => {
              const userName = tx.userFullName || tx.wallet?.user?.fullName || tx.deposit?.user?.fullName || 'Citizen User';
              const isCredit = tx.type === 'CREDIT_EARNED' || (tx.type && tx.type.includes('CREDIT')) || (tx.points && tx.points > 0);
              const absPoints = Math.abs(tx.points || 0);
              const typeLabel = isCredit ? 'CREDIT' : (tx.type === 'DEBIT_REDEEMED' || (tx.type && tx.type.includes('DEBIT')) ? 'DEBIT' : tx.type);
              const pointsDisplay = isCredit ? `+${absPoints} pts` : `-${absPoints} pts`;
              const badgeClass = isCredit ? 'badge-verified' : 'badge-rejected';
              const pointsColor = isCredit ? 'var(--color-success)' : 'var(--color-danger)';
              const referenceCode = tx.referenceId || tx.deposit?.depositCode || '—';
              const dateVal = tx.timestamp || tx.createdAt;
              const dateDisplay = dateVal ? new Date(dateVal).toLocaleString() : '—';

              return `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 600;">#${tx.id}</td>
                <td style="font-weight: 600;">${userName}</td>
                <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
                <td style="font-weight: 700; color: ${pointsColor};">
                  ${pointsDisplay}
                </td>
                <td style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; color: var(--color-primary);">${referenceCode}</td>
                <td style="font-size: 0.82rem; color: var(--text-secondary);">${tx.description}</td>
                <td style="font-size: 0.78rem; color: var(--text-muted);">${dateDisplay}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

window.addEventListener('DOMContentLoaded', () => AdminDashboard.init());
