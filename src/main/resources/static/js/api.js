/**
 * Ecopoint Platform — Centralized Fetch API Client
 */
const API = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    const config = {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(endpoint, config);
      
      // Handle empty body / no content
      if (response.status === 204) {
        return null;
      }

      // Handle non-JSON responses (e.g. CSV file downloads)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return await response.blob();
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMsg = data.message || data.error || 'Server request failed';
        if (data.fieldErrors) {
          const details = Object.entries(data.fieldErrors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('; ');
          errorMsg += ` (${details})`;
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Authentication
  auth: {
    login: (credentials) => API.request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => API.request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    switchDemo: (email) => API.request('/api/auth/switch-demo', { method: 'POST', body: JSON.stringify({ email }) }),
    me: () => API.request('/api/auth/me'),
    logout: () => API.request('/api/auth/logout', { method: 'POST' })
  },

  // Citizen User Endpoints
  user: {
    getDeposits: () => API.request('/api/user/deposits'),
    createDeposit: (depositData) => API.request('/api/user/deposits', { method: 'POST', body: JSON.stringify(depositData) }),
    getDepositTimeline: (code) => API.request(`/api/user/deposits/${code}`),
    getWallet: () => API.request('/api/user/wallet'),
    getTransactions: () => API.request('/api/user/wallet/transactions'),
    redeemReward: (rewardId) => API.request('/api/user/rewards/redeem', { method: 'POST', body: JSON.stringify({ rewardId }) }),
    getMyRedemptions: () => API.request('/api/user/rewards/my-redemptions')
  },

  // Collector Endpoints
  collector: {
    getPendingPickups: () => API.request('/api/collector/pending-pickups'),
    confirmPickup: (depositId, notes) => API.request(`/api/collector/deposits/${depositId}/pickup`, { method: 'POST', body: JSON.stringify({ collectorNotes: notes }) })
  },

  // Facility Operator Endpoints
  facility: {
    getQueue: () => API.request('/api/facility/queue'),
    receiveAtFacility: (depositId, notes) => API.request(`/api/facility/deposits/${depositId}/receive`, { method: 'POST', body: JSON.stringify({ notes }) }),
    verifyDeposit: (depositId, payload) => API.request(`/api/facility/deposits/${depositId}/verify`, { method: 'POST', body: JSON.stringify(payload) })
  },

  // Admin Endpoints
  admin: {
    getStats: () => API.request('/api/admin/stats'),
    getDeposits: () => API.request('/api/admin/deposits'),
    getUsers: () => API.request('/api/admin/users'),
    createUser: (userData) => API.request('/api/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
    getBags: () => API.request('/api/admin/bags'),
    registerBag: (bagCode) => API.request('/api/admin/bags', { method: 'POST', body: JSON.stringify({ bagCode }) }),
    getCategories: () => API.request('/api/admin/categories'),
    updateCategoryRate: (id, pointsPerKg) => API.request(`/api/admin/categories/${id}/rate`, { method: 'PUT', body: JSON.stringify({ pointsPerKg }) }),
    getRewards: () => API.request('/api/admin/rewards'),
    saveReward: (reward) => API.request('/api/admin/rewards', { method: 'POST', body: JSON.stringify(reward) }),
    getLedger: () => API.request('/api/admin/ledger'),
    downloadDepositsCsv: () => fetch('/api/admin/reports/deposits/csv', { credentials: 'same-origin' }),
    downloadLedgerCsv: () => fetch('/api/admin/reports/ledger/csv', { credentials: 'same-origin' })
  },

  // Common Metadata
  common: {
    getCategories: () => API.request('/api/common/categories'),
    getRewards: () => API.request('/api/common/rewards'),
    getOutcomes: () => API.request('/api/common/outcomes'),
    getDemoUsers: () => API.request('/api/common/demo-users')
  }
};
