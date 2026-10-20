/**
 * Ecopoint Platform — Citizen User Dashboard Logic
 */
const UserDashboard = {
  categories: [],
  deposits: [],
  wallet: null,

  async init() {
    const user = await Common.requireAuth(['ROLE_USER', 'ROLE_ADMIN']);
    if (!user) return;

    await this.loadData();
    this.renderStats();
    this.renderRecentDeposits();
    this.renderRewards();
    this.renderVouchers();
    this.renderLedger();
    this.renderCategoryRates();
  },

  async loadData() {
    try {
      const [categories, deposits, wallet] = await Promise.all([
        API.common.getCategories(),
        API.user.getDeposits(),
        API.user.getWallet()
      ]);
      this.categories = categories;
      this.deposits = deposits;
      this.wallet = wallet;
    } catch (err) {
      Common.showToast(`Error loading dashboard: ${err.message}`, 'error');
    }
  },

  renderStats() {
    if (!this.wallet) return;

    const balanceEl = document.getElementById('stat-balance');
    const divertedEl = document.getElementById('stat-diverted');
    const activeEl = document.getElementById('stat-active');
    const earnedEl = document.getElementById('stat-earned');

    const activeCount = this.deposits.filter(d => ['SUBMITTED', 'PICKED_UP', 'AT_FACILITY'].includes(d.status)).length;
    const verifiedDeposits = this.deposits.filter(d => d.status === 'VERIFIED');
    const totalDiverted = verifiedDeposits.reduce((acc, d) => acc + (d.actualWeight || 0), 0);

    if (balanceEl) balanceEl.textContent = this.wallet.balance;
    if (divertedEl) divertedEl.textContent = totalDiverted.toFixed(1);
    if (activeEl) activeEl.textContent = activeCount;
    if (earnedEl) earnedEl.textContent = this.wallet.totalEarned;
  },

  renderCategoryRates() {
    const container = document.getElementById('category-rates-list');
    if (!container) return;

    container.innerHTML = this.categories.map(c => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <span style="font-weight: 600; font-size: 0.85rem;">${c.name}</span>
        <span class="badge" style="background: var(--color-primary-light); color: var(--color-primary);">${c.pointsPerKg} pts/kg</span>
      </div>
    `).join('');
  },

  renderRecentDeposits() {
    const container = document.getElementById('deposits-table-container');
    if (!container) return;

    if (this.deposits.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); padding: 16px 0;">No deposits registered yet. Register your first bag to start earning!</p>`;
      return;
    }

    container.innerHTML = `
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
              <th>Processing Outcome</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.deposits.map(d => `
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
                  <button class="btn btn-secondary btn-sm" onclick="UserDashboard.openTimelineModal('${d.depositCode}')">
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

  async renderRewards() {
    const container = document.getElementById('rewards-grid');
    if (!container) return;

    try {
      const rewards = await API.common.getRewards();
      container.innerHTML = rewards.map(r => `
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
              Stock: <span style="font-weight: 600;">${r.stock} remaining</span>
            </div>
          </div>
          <button 
            class="btn btn-primary" 
            style="width: 100%;" 
            ${this.wallet.balance < r.pointsCost || r.stock <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
            onclick="UserDashboard.redeemReward(${r.id}, '${r.title}', ${r.pointsCost})">
            ${r.stock <= 0 ? 'Out of Stock' : (this.wallet.balance < r.pointsCost ? 'Insufficient Points' : 'Redeem Reward')}
          </button>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${err.message}</p>`;
    }
  },

  async renderVouchers() {
    const container = document.getElementById('vouchers-table-container');
    if (!container) return;

    try {
      const redemptions = await API.user.getMyRedemptions();
      if (redemptions.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No rewards redeemed yet. Earn points by segregating waste!</p>`;
        return;
      }

      container.innerHTML = `
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
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${err.message}</p>`;
    }
  },

  async renderLedger() {
    const container = document.getElementById('ledger-table-container');
    if (!container) return;

    try {
      const transactions = await API.user.getTransactions();
      if (transactions.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">No ledger entries recorded yet.</p>`;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Transaction Type</th>
                <th>Points Earned / Deducted</th>
                <th>Balance After</th>
                <th>Description</th>
                <th>Date & Time</th>
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
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${err.message}</p>`;
    }
  },

  openDepositModal() {
    const categoriesHtml = this.categories.map(c => 
      `<option value="${c.id}">${c.name} (${c.pointsPerKg} pts/kg) — ${c.description}</option>`
    ).join('');

    const html = `
      <form id="deposit-form" onsubmit="UserDashboard.handleDepositSubmit(event)">
        <div class="form-group">
          <label class="form-label" for="dep-bag-code">Reusable Bag Identifier Code</label>
          <input type="text" id="dep-bag-code" class="form-input" placeholder="e.g. BAG-1001" required value="BAG-1001">
          <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">
            Rule: A reusable bag cannot have multiple active deposits in progress simultaneously.
          </small>
        </div>

        <div class="form-group">
          <label class="form-label" for="dep-category-id">Waste Category</label>
          <select id="dep-category-id" class="form-select" required>
            ${categoriesHtml}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="dep-weight">Estimated Weight (kg)</label>
          <input type="number" id="dep-weight" class="form-input" min="0.1" step="0.1" value="2.5" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="dep-notes">Notes for Collector (Optional)</label>
          <input type="text" id="dep-notes" class="form-input" placeholder="e.g. Placed outside gate">
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="Common.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Submit Deposit</button>
        </div>
      </form>
    `;

    Common.openModal('Register New Waste Deposit', html);
  },

  async handleDepositSubmit(e) {
    e.preventDefault();
    const bagCode = document.getElementById('dep-bag-code').value.trim();
    const categoryId = parseInt(document.getElementById('dep-category-id').value);
    const estimatedWeight = parseFloat(document.getElementById('dep-weight').value);
    const notes = document.getElementById('dep-notes').value.trim();

    try {
      const res = await API.user.createDeposit({ bagCode, categoryId, estimatedWeight, notes });
      Common.closeModal();
      Common.showToast(`Deposit ${res.depositCode} submitted successfully!`, 'success');
      await this.init();
    } catch (err) {
      Common.showToast(err.message, 'error');
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
          <button class="btn btn-secondary" onclick="Common.closeModal()">Close</button>
        </div>
      `;

      Common.openModal(`Deposit Timeline — ${dep.depositCode}`, html);
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  },

  async redeemReward(rewardId, title, pointsCost) {
    if (!confirm(`Redeem "${title}" for ${pointsCost} EcoPoints?`)) return;

    try {
      const red = await API.user.redeemReward(rewardId);
      Common.showToast(`Reward redeemed! Your voucher code: ${red.redemptionCode}`, 'success');
      await this.init();
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => UserDashboard.init());
