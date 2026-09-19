/* ==========================================================================
   SkillSwap - SOS Help Queue ("Interactive Topic Request Board")
   ========================================================================== */

import { store } from './state.js';
import { audio } from './audioService.js';
import { videoRoom } from './videoRoom.js';

export class SosQueueController {
  constructor() {
    this.activeFilter = 'all';
    this.searchQuery = '';
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Filter pills
    const pills = document.querySelectorAll('.sos-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeFilter = e.currentTarget.dataset.filter;
        this.render();
      });
    });

    // Search input
    const searchInput = document.getElementById('sos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      });
    }

    // Modal triggers
    const openModalBtns = document.querySelectorAll('.btn-open-sos-modal');
    openModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('modal-post-sos');
        if (modal) modal.classList.add('active');
      });
    });

    const submitSosBtn = document.getElementById('btn-submit-sos');
    if (submitSosBtn) {
      submitSosBtn.addEventListener('click', () => this.submitNewTicket());
    }
  }

  render() {
    const grid = document.getElementById('sos-tickets-grid');
    if (!grid) return;

    const state = store.get();
    let tickets = [...state.sosTickets];

    // Filter by Category
    if (this.activeFilter !== 'all') {
      tickets = tickets.filter(t => t.category === this.activeFilter);
    }

    // Filter by Search Query
    if (this.searchQuery.trim()) {
      tickets = tickets.filter(t =>
        t.title.toLowerCase().includes(this.searchQuery) ||
        t.description.toLowerCase().includes(this.searchQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))
      );
    }

    if (tickets.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3>No SOS blocker requests found</h3>
          <p>No active tickets match this filter. Be the first to post an urgent blocker!</p>
        </div>`;
      return;
    }

    grid.innerHTML = tickets.map(ticket => `
      <div class="sos-ticket-card glass-card ${ticket.claimed ? 'claimed' : ''}" data-ticket-id="${ticket.id}">
        <div class="ticket-top-meta">
          <div class="ticket-author">
            <div class="ticket-author-avatar">${ticket.authorName.split(' ').map(n => n[0]).join('')}</div>
            <div class="ticket-author-details">
              <h4>${ticket.authorName}</h4>
              <span class="ticket-timestamp">${ticket.timestamp} • ${ticket.authorRole}</span>
            </div>
          </div>
          <span class="ticket-urgency-badge ${ticket.urgency === 'high' ? 'urgency-high' : 'urgency-med'}">
            ⚡ ${ticket.urgencyLabel}
          </span>
        </div>

        <div class="ticket-body">
          <h3>${ticket.title}</h3>
          <p class="ticket-desc">${ticket.description}</p>
          ${ticket.codeSnippet ? `<pre class="ticket-code-snippet"><code>${this.escapeHtml(ticket.codeSnippet)}</code></pre>` : ''}
          <div class="ticket-tags-cloud">
            ${ticket.tags.map(t => `<span class="ticket-tag">${t}</span>`).join('')}
          </div>
        </div>

        <div class="ticket-footer">
          <div class="ticket-reward-hint">
            <span class="wallet-coin">🪙</span>
            <span>Reward: +${ticket.rewardCredits.toFixed(1)} Credit</span>
          </div>
          ${ticket.claimed ? `
            <span class="badge badge-gray">✓ Claimed</span>
          ` : `
            <button class="btn btn-primary btn-sm btn-claim-sos" data-ticket-id="${ticket.id}">
              Claim & Launch 20m Room
            </button>
          `}
        </div>
      </div>
    `).join('');

    // Bind Claim buttons
    grid.querySelectorAll('.btn-claim-sos').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ticketId = e.currentTarget.dataset.ticketId;
        this.claimTicket(ticketId);
      });
    });
  }

  claimTicket(ticketId) {
    const state = store.get();
    const ticket = state.sosTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    ticket.claimed = true;
    store.saveState();
    audio.playSuccess();

    window.appToast(`⚡ Claimed ticket from ${ticket.authorName}! Launching instant 20-min micro-session...`, 'success');

    // Launch instant video room for this claimed blocker
    setTimeout(() => {
      const instantSession = {
        id: 'sess_' + ticket.id,
        topic: ticket.title,
        peerId: ticket.authorId,
        durationMinutes: 20,
        status: 'Live Micro-Session'
      };
      window.switchView('call-room');
      videoRoom.startCall(instantSession);
    }, 900);
  }

  submitNewTicket() {
    const titleInput = document.getElementById('new-sos-title');
    const categorySelect = document.getElementById('new-sos-category');
    const urgencySelect = document.getElementById('new-sos-urgency');
    const tagsInput = document.getElementById('new-sos-tags');
    const descInput = document.getElementById('new-sos-desc');
    const codeInput = document.getElementById('new-sos-code');

    if (!titleInput || !titleInput.value.trim()) {
      window.appToast('Please enter an urgent blocker title', 'warning');
      return;
    }

    const state = store.get();
    const currentUser = store.getCurrentUser();

    const rawTags = tagsInput ? tagsInput.value : '';
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) tags.push('Debugging', 'Code-Review');

    const newTicket = {
      id: 'sos_' + Date.now(),
      title: titleInput.value.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      timestamp: 'Just now',
      urgency: urgencySelect ? urgencySelect.value : 'high',
      urgencyLabel: urgencySelect && urgencySelect.value === 'high' ? 'Urgent < 15m' : 'Urgent < 30m',
      category: categorySelect ? categorySelect.value : 'devops',
      tags: tags,
      description: descInput ? descInput.value.trim() : '',
      codeSnippet: codeInput ? codeInput.value.trim() : '',
      rewardCredits: 1.0,
      claimed: false
    };

    state.sosTickets.unshift(newTicket);
    store.saveState();
    audio.playPing();

    // Reset inputs & close modal
    titleInput.value = '';
    if (descInput) descInput.value = '';
    if (codeInput) codeInput.value = '';
    if (tagsInput) tagsInput.value = '';

    const modal = document.getElementById('modal-post-sos');
    if (modal) modal.classList.remove('active');

    this.render();
    window.appToast('⚡ Urgent SOS ticket broadcasted to qualified peer mentors!', 'success');
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

export const sosQueue = new SosQueueController();
