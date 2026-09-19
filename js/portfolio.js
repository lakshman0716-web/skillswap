/* ==========================================================================
   SkillSwap - Skill Verification & Badge Portfolio & Ledger Controller
   ========================================================================== */

import { store } from './state.js';
import { audio } from './audioService.js';

export class PortfolioController {
  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const printCvBtn = document.getElementById('btn-print-cv');
    if (printCvBtn) {
      printCvBtn.addEventListener('click', () => {
        window.print();
      });
    }

    const shareLinkedinBtn = document.getElementById('btn-share-linkedin');
    if (shareLinkedinBtn) {
      shareLinkedinBtn.addEventListener('click', () => {
        const dummyUrl = 'https://skillswap.internal/p/mahendra-pendyala-msc';
        navigator.clipboard?.writeText(dummyUrl);
        audio.playPing();
        window.appToast('📋 Public placement portfolio link copied to clipboard!', 'success');
      });
    }

    // Ledger filter tabs
    const ledgerPills = document.querySelectorAll('.ledger-filter-pill');
    ledgerPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        ledgerPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.renderLedgerTable(e.currentTarget.dataset.type);
      });
    });
  }

  render() {
    this.renderProfileHeader();
    this.renderBadges();
    this.renderEndorsements();
    this.renderLedgerMetrics();
    this.renderLedgerTable('all');
  }

  renderProfileHeader() {
    const user = store.getCurrentUser();
    const avatarEl = document.getElementById('portfolio-user-avatar');
    if (avatarEl) avatarEl.textContent = user.avatar;

    const nameEl = document.getElementById('portfolio-user-name');
    if (nameEl) nameEl.innerHTML = `${user.name} <span class="verified-icon-badge" title="Verified UK Placement Candidate">✓</span>`;

    const degreeEl = document.getElementById('portfolio-degree');
    if (degreeEl) degreeEl.textContent = `${user.role} • ${user.institution}`;

    const sessionsCountEl = document.getElementById('portfolio-sessions-count');
    if (sessionsCountEl) sessionsCountEl.textContent = `${user.sessionsCompleted || 14} Verified Sessions`;

    const hoursCountEl = document.getElementById('portfolio-hours-count');
    if (hoursCountEl) hoursCountEl.textContent = `${(user.hoursExchanged || 5.5).toFixed(1)} Hours Peer Exchange`;

    const ratingEl = document.getElementById('portfolio-rating');
    if (ratingEl) ratingEl.textContent = `${(user.rating || 4.95).toFixed(2)} / 5.0 Peer Rating`;
  }

  renderBadges() {
    const badgesContainer = document.getElementById('portfolio-badges-grid');
    if (!badgesContainer) return;

    const state = store.get();
    badgesContainer.innerHTML = state.badges.map(b => `
      <div class="badge-card">
        <div class="badge-card-top">
          <div class="badge-visual-icon ${b.iconClass}">${b.icon}</div>
          <div class="badge-card-info">
            <h4>${b.title}</h4>
            <span class="badge-endorse-count">★ ${b.endorsementsCount} Peer Endorsements</span>
          </div>
        </div>
        <p>${b.description}</p>
        <span class="badge badge-primary" style="align-self: flex-start;">${b.tier}</span>
      </div>
    `).join('');
  }

  renderEndorsements() {
    const list = document.getElementById('portfolio-endorsements-list');
    if (!list) return;

    const state = store.get();
    list.innerHTML = state.endorsements.map(e => `
      <div class="endorsement-item">
        <div class="endorsement-header">
          <div class="endorsement-peer">
            <strong>${e.peerName}</strong>
            <span class="badge badge-gray">${e.peerRole}</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${e.date}</span>
        </div>
        <div class="endorsement-quote">"${e.quote}"</div>
        <div style="display: flex; gap: 0.35rem; margin-top: 0.25rem;">
          ${e.skills.map(s => `<span class="badge badge-emerald">✓ ${s}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  renderLedgerMetrics() {
    const user = store.getCurrentUser();
    const state = store.get();

    const availEl = document.getElementById('wallet-metric-available');
    if (availEl) availEl.textContent = `${user.credits.toFixed(1)}`;

    const escrowEl = document.getElementById('wallet-metric-escrow');
    if (escrowEl) escrowEl.textContent = `${(user.escrowCredits || 0).toFixed(1)}`;

    const totalEarned = state.transactions
      .filter(t => t.type === 'EARNED' || t.type === 'BONUS')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const earnedEl = document.getElementById('wallet-metric-earned');
    if (earnedEl) earnedEl.textContent = `+${totalEarned.toFixed(1)}`;

    const sessionsEl = document.getElementById('wallet-metric-sessions');
    if (sessionsEl) sessionsEl.textContent = `${user.sessionsCompleted || 14}`;
  }

  renderLedgerTable(filterType = 'all') {
    const tbody = document.getElementById('ledger-transactions-tbody');
    if (!tbody) return;

    const state = store.get();
    let txs = [...state.transactions];

    if (filterType === 'earned') {
      txs = txs.filter(t => t.type === 'EARNED' || t.type === 'BONUS');
    } else if (filterType === 'escrow') {
      txs = txs.filter(t => t.type === 'ESCROW_HOLD' || t.status === 'In Escrow');
    }

    tbody.innerHTML = txs.map(t => {
      let changeClass = 'plus';
      let changeSign = '+';
      if (t.amount < 0) {
        changeClass = t.type === 'ESCROW_HOLD' ? 'hold' : 'minus';
        changeSign = '';
      } else if (t.amount === 0) {
        changeClass = 'plus';
        changeSign = '';
      }

      return `
        <tr>
          <td style="font-size: 0.8125rem; color: var(--text-muted);">${t.date}</td>
          <td>
            <span class="badge ${t.type === 'EARNED' ? 'badge-emerald' : t.type === 'ESCROW_HOLD' ? 'badge-amber' : t.type === 'BONUS' ? 'badge-primary' : 'badge-cyan'}">
              ${t.typeLabel}
            </span>
          </td>
          <td>
            <div><strong>${t.description}</strong></div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Counterparty: ${t.peer}</div>
          </td>
          <td class="credit-change ${changeClass}">
            ${changeSign}${t.amount.toFixed(1)} Credit
          </td>
          <td>
            <span class="badge ${t.status === 'In Escrow' ? 'badge-amber' : 'badge-emerald'}">${t.status}</span>
          </td>
        </tr>
      `;
    }).join('');
  }
}

export const portfolio = new PortfolioController();
