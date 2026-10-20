/**
 * Ecopoint Platform — Collector Dashboard Logic
 */
const CollectorDashboard = {
  pickups: [],

  async init() {
    const user = await Common.requireAuth(['ROLE_COLLECTOR', 'ROLE_ADMIN']);
    if (!user) return;

    await this.loadPickups();
    this.renderPickups();
  },

  async loadPickups() {
    try {
      this.pickups = await API.collector.getPendingPickups();
    } catch (err) {
      Common.showToast(`Error loading pickups: ${err.message}`, 'error');
    }
  },

  renderPickups() {
    const container = document.getElementById('collector-queue-container');
    const countBadge = document.getElementById('pickup-count-badge');
    if (!container) return;

    if (countBadge) countBadge.textContent = `${this.pickups.length} pending`;

    if (this.pickups.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.4;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <p style="font-size: 1rem; font-weight: 600;">Pickup queue is clear!</p>
          <p style="font-size: 0.82rem;">All registered citizen waste bags have been collected and transferred.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Deposit Code</th>
              <th>Bag Identifier Code</th>
              <th>Citizen Name</th>
              <th>Waste Category</th>
              <th>Estimated Weight</th>
              <th>Submission Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.pickups.map(p => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${p.depositCode}</td>
                <td>
                  <span class="badge" style="background: var(--color-primary-light); color: var(--color-primary); font-family: var(--font-mono); font-size: 0.85rem;">
                    ${p.bagCode}
                  </span>
                </td>
                <td>${p.userFullName}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${p.userEmail}</span></td>
                <td><span style="font-weight: 600;">${p.initialCategoryName}</span></td>
                <td>${p.estimatedWeight} kg</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td>
                  <button class="btn btn-primary btn-sm" onclick="CollectorDashboard.openPickupModal(${p.id}, '${p.depositCode}', '${p.bagCode}')">
                    Confirm Pickup
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openPickupModal(depositId, depositCode, bagCode) {
    const html = `
      <form onsubmit="CollectorDashboard.handlePickupSubmit(event, ${depositId})">
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">
          Confirming custody pickup for deposit <strong style="font-family: var(--font-mono); color: var(--color-primary);">${depositCode}</strong> 
          using reusable bag <strong style="font-family: var(--font-mono);">${bagCode}</strong>.
        </p>

        <div class="form-group">
          <label class="form-label" for="pickup-notes">Collector Notes (Optional)</label>
          <input type="text" id="pickup-notes" class="form-input" placeholder="e.g. Bag seal intact, verified physical bag code" autofocus>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="Common.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Verify & Take Custody</button>
        </div>
      </form>
    `;
    Common.openModal(`Pickup Confirmation — ${depositCode}`, html);
  },

  async handlePickupSubmit(e, depositId) {
    e.preventDefault();
    const notes = document.getElementById('pickup-notes').value.trim();

    try {
      await API.collector.confirmPickup(depositId, notes);
      Common.closeModal();
      Common.showToast('Bag pickup verified and chain-of-custody recorded!', 'success');
      await this.init();
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => CollectorDashboard.init());
