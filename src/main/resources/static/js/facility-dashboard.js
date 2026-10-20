/**
 * Ecopoint Platform — Facility Operator Dashboard Logic
 */
const FacilityDashboard = {
  queue: [],
  categories: [],

  async init() {
    const user = await Common.requireAuth(['ROLE_OPERATOR', 'ROLE_ADMIN']);
    if (!user) return;

    await this.loadData();
    this.renderQueue();
  },

  async loadData() {
    try {
      const [queue, categories] = await Promise.all([
        API.facility.getQueue(),
        API.common.getCategories()
      ]);
      this.queue = queue;
      this.categories = categories;
    } catch (err) {
      Common.showToast(`Error loading facility queue: ${err.message}`, 'error');
    }
  },

  renderQueue() {
    const container = document.getElementById('facility-queue-container');
    const badge = document.getElementById('queue-count-badge');
    if (!container) return;

    if (badge) badge.textContent = `${this.queue.length} incoming`;

    if (this.queue.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.4;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p style="font-size: 1rem; font-weight: 600;">Recovery facility queue is clear!</p>
          <p style="font-size: 0.82rem;">No incoming waste bags waiting for grading or verification.</p>
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
              <th>Bag Code</th>
              <th>Citizen User</th>
              <th>Declared Category</th>
              <th>Est. Weight</th>
              <th>Collector</th>
              <th>Current Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.queue.map(q => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">${q.depositCode}</td>
                <td><span class="badge" style="background: var(--color-primary-light); color: var(--color-primary); font-family: var(--font-mono); font-size: 0.85rem;">${q.bagCode}</span></td>
                <td>${q.userFullName}</td>
                <td><span style="font-weight: 600;">${q.initialCategoryName}</span></td>
                <td>${q.estimatedWeight} kg</td>
                <td>${q.collectorName || 'Assigned Collector'}</td>
                <td><span class="badge badge-${q.status.toLowerCase()}">${q.status}</span></td>
                <td>
                  <button class="btn btn-primary btn-sm" onclick="FacilityDashboard.openVerifyModal(${q.id}, '${q.depositCode}', ${q.initialCategoryId}, ${q.estimatedWeight})">
                    Inspect & Grade
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openVerifyModal(depositId, depositCode, currentCategoryId, estimatedWeight) {
    const categoriesHtml = this.categories.map(c => 
      `<option value="${c.id}" ${c.id === currentCategoryId ? 'selected' : ''}>${c.name} (${c.pointsPerKg} pts/kg)</option>`
    ).join('');

    const outcomesHtml = ['RECYCLED', 'COMPOSTED', 'ENERGY_RECOVERY', 'HAZARDOUS_DISPOSAL', 'LANDFILL_REJECTED'].map(o =>
      `<option value="${o}">${o}</option>`
    ).join('');

    const html = `
      <form onsubmit="FacilityDashboard.handleVerifySubmit(event, ${depositId})">
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Deposit Code: <strong style="color: var(--color-primary); font-family: var(--font-mono);">${depositCode}</strong> | Declared Est. Weight: ${estimatedWeight} kg
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-category-id">Accepted Waste Category</label>
          <select id="vf-category-id" class="form-select" onchange="FacilityDashboard.calculatePointsPreview()" required>
            ${categoriesHtml}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-weight">Actual Measured Scale Weight (kg)</label>
          <input type="number" id="vf-weight" class="form-input" min="0.05" step="0.05" value="${estimatedWeight}" oninput="FacilityDashboard.calculatePointsPreview()" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-outcome">Processing Outcome</label>
          <select id="vf-outcome" class="form-select" required>
            ${outcomesHtml}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-operator-notes">Inspection Notes (Optional)</label>
          <input type="text" id="vf-operator-notes" class="form-input" placeholder="e.g. Clean segregated material, weight verified">
        </div>

        <div style="padding: 12px 16px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 0.88rem;">Calculated EcoPoints Credit:</span>
            <span id="vf-points-preview" style="font-weight: 800; font-size: 1.25rem; color: var(--color-success);">— pts</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
          <button type="button" class="btn btn-danger btn-sm" onclick="FacilityDashboard.handleRejectSubmit(${depositId})">Reject Deposit</button>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary" onclick="Common.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Approve & Credit Points</button>
          </div>
        </div>
      </form>
    `;
    Common.openModal(`Facility Inspection — ${depositCode}`, html);
    setTimeout(() => this.calculatePointsPreview(), 50);
  },

  calculatePointsPreview() {
    const weightEl = document.getElementById('vf-weight');
    const catEl = document.getElementById('vf-category-id');
    const previewEl = document.getElementById('vf-points-preview');

    if (!weightEl || !catEl || !previewEl) return;

    const weight = parseFloat(weightEl.value) || 0;
    const catId = parseInt(catEl.value);

    const category = this.categories.find(c => c.id === catId);
    const rate = category ? category.pointsPerKg : 10;

    const finalPoints = Math.round(weight * rate);
    previewEl.textContent = `+${finalPoints} pts`;
  },

  async handleVerifySubmit(e, depositId) {
    e.preventDefault();
    const actualCategoryId = parseInt(document.getElementById('vf-category-id').value);
    const actualWeight = parseFloat(document.getElementById('vf-weight').value);
    const operatorNotes = document.getElementById('vf-operator-notes') ? document.getElementById('vf-operator-notes').value.trim() : '';
    const processingOutcome = document.getElementById('vf-outcome').value;

    try {
      await API.facility.verifyDeposit(depositId, {
        actualCategoryId,
        actualWeight,
        operatorNotes,
        processingOutcome,
        reject: false
      });
      Common.closeModal();
      Common.showToast('Deposit verified and EcoPoints credited to user wallet!', 'success');
      await this.init();
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  },

  async handleRejectSubmit(depositId) {
    if (!confirm('Are you sure you want to REJECT this deposit? Zero points will be credited.')) return;
    const operatorNotes = document.getElementById('vf-operator-notes') ? document.getElementById('vf-operator-notes').value.trim() : 'Material does not meet recycling standards';
    try {
      await API.facility.verifyDeposit(depositId, {
        actualCategoryId: parseInt(document.getElementById('vf-category-id').value),
        actualWeight: parseFloat(document.getElementById('vf-weight').value) || 1.0,
        operatorNotes,
        processingOutcome: 'LANDFILL_REJECTED',
        reject: true
      });
      Common.closeModal();
      Common.showToast('Deposit rejected and marked LANDFILL_REJECTED.', 'info');
      await this.init();
    } catch (err) {
      Common.showToast(err.message, 'error');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => FacilityDashboard.init());
