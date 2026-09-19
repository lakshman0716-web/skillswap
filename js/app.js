/* ==========================================================================
   SkillSwap - Main Application Orchestrator & View Controller
   ========================================================================== */

import { store } from './state.js';
import { MatchingEngine } from './matchingEngine.js';
import { CreditLedger } from './creditLedger.js';
import { videoRoom } from './videoRoom.js';
import { sosQueue } from './sosQueue.js';
import { portfolio } from './portfolio.js';
import { audio } from './audioService.js';

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.selectedMatchFilter = 'all';
  }

  init() {
    this.bindGlobalNavigation();
    this.bindUserSwitcher();
    this.bindThemeToggle();
    this.bindModals();
    this.bindNotifications();
    this.bindDashboardActions();

    // Initialize submodules
    this.bindAuth();
    this.bindEditorTracker();
    this.bindAuditCsvExport();

    videoRoom.init();
    sosQueue.init();
    portfolio.init();

    // Subscribe to state updates
    store.subscribe(() => {
      this.updateNavbarHeader();
      if (store.isLoggedIn()) {
        this.renderDashboard();
        portfolio.render();
        sosQueue.render();
      }
    });

    // Initial render & Auth check
    this.updateNavbarHeader();
    if (!store.isLoggedIn()) {
      this.switchView('auth');
    } else {
      this.renderDashboard();
    }
  }

  /* ---------------- Navigation & Routing ---------------- */
  bindGlobalNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Brand logo returns to dashboard
    const brand = document.querySelector('.brand');
    if (brand) {
      brand.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView('dashboard');
      });
    }

    // Direct wallet pill click opens ledger view
    const walletPill = document.getElementById('navbar-wallet-pill');
    if (walletPill) {
      walletPill.addEventListener('click', () => {
        this.switchView('ledger');
      });
    }

    // Expose switchView globally
    window.switchView = (view) => this.switchView(view);
  }

  switchView(viewName) {
    // Auth guard: if not logged in, force to auth view
    if (!store.isLoggedIn() && viewName !== 'auth') {
      viewName = 'auth';
    }

    this.currentView = viewName;

    // Update nav links active state
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
      link.classList.toggle('active', link.dataset.view === viewName);
    });

    // Toggle view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Specific view activations
    if (viewName === 'sos') {
      sosQueue.render();
    } else if (viewName === 'portfolio' || viewName === 'ledger') {
      portfolio.render();
    } else if (viewName === 'dashboard') {
      this.renderDashboard();
    }
  }

  /* ---------------- Navbar & User Context ---------------- */
  updateNavbarHeader() {
    const isLoggedIn = store.isLoggedIn();
    const navMenu = document.querySelector('.nav-menu');
    const walletPill = document.getElementById('navbar-wallet-pill');
    const notifWrap = document.querySelector('.notification-wrapper');
    const userSwitcher = document.querySelector('.user-switcher');
    const authCta = document.getElementById('nav-auth-cta');

    if (!isLoggedIn) {
      if (navMenu) navMenu.style.display = 'none';
      if (walletPill) walletPill.style.display = 'none';
      if (notifWrap) notifWrap.style.display = 'none';
      if (userSwitcher) userSwitcher.style.display = 'none';
      if (authCta) authCta.style.display = 'flex';
      return;
    } else {
      if (navMenu) navMenu.style.display = 'flex';
      if (walletPill) walletPill.style.display = 'flex';
      if (notifWrap) notifWrap.style.display = 'block';
      if (userSwitcher) userSwitcher.style.display = 'block';
      if (authCta) authCta.style.display = 'none';
    }

    const user = store.getCurrentUser();
    const state = store.get();

    // Wallet balance pill
    const balanceEl = document.getElementById('nav-balance-counter');
    if (balanceEl) {
      balanceEl.textContent = `${user.credits.toFixed(0)} Credits`;
    }

    // Current user avatar & name
    const avatarEl = document.getElementById('nav-user-avatar');
    if (avatarEl) avatarEl.textContent = user.avatar;

    const nameEl = document.getElementById('nav-user-name');
    if (nameEl) nameEl.textContent = user.name;

    // Notification counter
    const unreadCount = state.notifications.filter(n => n.unread).length;
    const notifBadge = document.getElementById('nav-notif-dot');
    if (notifBadge) {
      notifBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    const notifCountBadge = document.getElementById('notif-count-badge');
    if (notifCountBadge) {
      notifCountBadge.textContent = `${unreadCount} unread`;
    }
  }

  /* ---------------- Authentication & Session System ---------------- */
  bindAuth() {
    // Auth Tab Switcher (Sign In vs Register)
    const tabSignIn = document.getElementById('auth-tab-btn-signin');
    const tabRegister = document.getElementById('auth-tab-btn-register');
    const paneSignIn = document.getElementById('auth-pane-signin');
    const paneRegister = document.getElementById('auth-pane-register');

    if (tabSignIn && tabRegister) {
      tabSignIn.addEventListener('click', () => {
        tabSignIn.classList.add('active');
        tabRegister.classList.remove('active');
        if (paneSignIn) paneSignIn.style.display = 'block';
        if (paneRegister) paneRegister.style.display = 'none';
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabSignIn.classList.remove('active');
        if (paneSignIn) paneSignIn.style.display = 'none';
        if (paneRegister) paneRegister.style.display = 'block';
      });
    }

    // Sign In Form Submission
    const formSignIn = document.getElementById('form-signin');
    if (formSignIn) {
      formSignIn.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('signin-email');
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        
        let targetUserId = 'mahendra';
        if (email.includes('alex')) targetUserId = 'alex';
        else if (email.includes('sarah')) targetUserId = 'sarah';
        else if (email.includes('daniel')) targetUserId = 'daniel';

        store.login(targetUserId);
        audio.playSuccess();
        window.appToast(`✓ Welcome back, ${store.getCurrentUser().name}!`, 'success');
        this.switchView('dashboard');
      });
    }

    // Register Form Submission
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('register-name');
        const roleInput = document.getElementById('register-role');
        const teachInput = document.getElementById('register-teach');
        const learnInput = document.getElementById('register-learn');

        const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Peer Learner';
        const role = roleInput && roleInput.value.trim() ? roleInput.value.trim() : 'Master\'s Student';
        
        const teachSkills = (teachInput ? teachInput.value : 'Python, SQL')
          .split(',').map(s => ({ name: s.trim(), level: 'Intermediate' })).filter(s => s.name);
        
        const learnSkills = (learnInput ? learnInput.value : 'Docker, AWS')
          .split(',').map(s => ({ name: s.trim(), level: 'Beginner' })).filter(s => s.name);

        const newUser = store.signup({
          name: name,
          role: role,
          teachSkills: teachSkills.length ? teachSkills : [{ name: 'Python', level: 'Intermediate' }],
          learnSkills: learnSkills.length ? learnSkills : [{ name: 'Docker', level: 'Beginner' }]
        });

        audio.playSuccess();
        window.appToast(`🎉 Welcome to SkillSwap, ${newUser.name}! +1.0 Complimentary Onboarding Credit granted.`, 'success');
        this.switchView('dashboard');
      });
    }

    // 1-Click Quick Demo Profiles
    document.querySelectorAll('.btn-demo-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.demoUser;
        store.login(userId);
        audio.playSuccess();
        window.appToast(`✓ Signed in as ${store.getCurrentUser().name} (${store.getCurrentUser().role})`, 'success');
        this.switchView('dashboard');
      });
    });

    // Social OAuth 2.0 (GitHub & Google) Simulation
    document.querySelectorAll('.btn-oauth-github').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playPing();
        window.appToast('Authenticating via GitHub OAuth 2.0...', 'info');
        setTimeout(() => {
          store.login('mahendra');
          audio.playSuccess();
          window.appToast('✓ Verified via GitHub Developer OAuth! Logged in as Mahendra Pendyala.', 'success');
          this.switchView('dashboard');
        }, 600);
      });
    });

    document.querySelectorAll('.btn-oauth-google').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playPing();
        window.appToast('Connecting to University Google SSO (.ac.uk)...', 'info');
        setTimeout(() => {
          store.login('mahendra');
          audio.playSuccess();
          window.appToast('✓ University SSO verified! Logged in as Mahendra Pendyala.', 'success');
          this.switchView('dashboard');
        }, 600);
      });
    });

    // Sign Out Button
    const signOutBtn = document.getElementById('btn-sign-out');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        store.logout();
        audio.playPing();
        this.switchView('auth');
        window.appToast('Signed out of SkillSwap session.', 'info');
      });
    }

    // Nav Auth CTA (Sign In button when logged out)
    const navAuthCta = document.getElementById('nav-auth-cta');
    if (navAuthCta) {
      navAuthCta.addEventListener('click', () => {
        this.switchView('auth');
      });
    }
  }

  /* ---------------- Monaco Editor Cursor Tracker ---------------- */
  bindEditorTracker() {
    const codeInput = document.getElementById('code-editor-input');
    const posEl = document.getElementById('editor-cursor-pos');
    if (codeInput && posEl) {
      const updateCursor = () => {
        const text = codeInput.value.substr(0, codeInput.selectionStart);
        const lines = text.split('\n');
        const row = lines.length;
        const col = lines[lines.length - 1].length + 1;
        posEl.textContent = `Ln ${row}, Col ${col}`;
      };
      codeInput.addEventListener('keyup', updateCursor);
      codeInput.addEventListener('click', updateCursor);
      codeInput.addEventListener('input', updateCursor);
    }
  }

  /* ---------------- Real CSV Ledger Audit Export ---------------- */
  bindAuditCsvExport() {
    const btn = document.getElementById('btn-download-audit-csv');
    if (btn) {
      btn.addEventListener('click', () => {
        const txs = store.get().transactions;
        const headers = ['Date', 'Type', 'Description', 'Counterparty', 'Credit_Change', 'Status'];
        const rows = txs.map(t => [
          `"${t.date}"`,
          `"${t.typeLabel}"`,
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.peer}"`,
          t.amount,
          `"${t.status}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `SkillSwap_Ledger_Audit_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        audio.playSuccess();
        window.appToast('📊 Ledger audit statement (CSV) generated and downloaded!', 'success');
      });
    }
  }

  bindUserSwitcher() {
    const trigger = document.getElementById('user-profile-trigger');
    const dropdown = document.getElementById('user-switcher-dropdown');

    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('active');
      });

      dropdown.querySelectorAll('.user-option').forEach(option => {
        option.addEventListener('click', (e) => {
          const userId = e.currentTarget.dataset.userId;
          store.setCurrentUser(userId);
          dropdown.classList.remove('active');
          audio.playPing();
          window.appToast(`Switched active profile to ${store.getCurrentUser().name}`, 'info');
        });
      });
    }
  }

  bindThemeToggle() {
    const btn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('skillswap_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const updateIcon = (theme) => {
      if (!btn) return;
      btn.innerHTML = theme === 'light'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    };

    updateIcon(savedTheme);

    if (btn) {
      btn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('skillswap_theme', newTheme);
        updateIcon(newTheme);
        audio.playPing();
        window.appToast(`Switched to ${newTheme.toUpperCase()} theme`, 'info');
      });
    }
  }

  bindNotifications() {
    const trigger = document.getElementById('notification-trigger');
    const drawer = document.getElementById('notification-drawer');

    if (trigger && drawer) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.toggle('active');
        // mark as read
        store.get().notifications.forEach(n => (n.unread = false));
        this.updateNavbarHeader();
      });

      document.addEventListener('click', () => {
        drawer.classList.remove('active');
      });
    }

    const list = document.getElementById('notification-list');
    if (list) {
      const notifs = store.get().notifications;
      list.innerHTML = notifs.map(n => `
        <div class="notification-item ${n.unread ? 'unread' : ''}">
          <div style="color: var(--primary); font-size: 1.1rem;">🔔</div>
          <div>
            <strong style="color: var(--text-primary); font-size: 0.8125rem;">${n.title}</strong>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0.15rem 0;">${n.desc}</p>
            <span style="font-size: 0.65rem; color: var(--text-muted);">${n.time}</span>
          </div>
        </div>
      `).join('');
    }
  }

  /* ---------------- Dashboard Rendering (Figure 1) ---------------- */
  renderDashboard() {
    const user = store.getCurrentUser();
    const state = store.get();

    // Welcome title
    const welcomeTitle = document.getElementById('welcome-user-name');
    if (welcomeTitle) welcomeTitle.textContent = user.name.split(' ')[0];

    // Stats
    const availVal = document.getElementById('dashboard-stat-credits');
    if (availVal) availVal.textContent = `${user.credits.toFixed(0)}`;

    const escrowVal = document.getElementById('dashboard-stat-escrow');
    if (escrowVal) escrowVal.textContent = `${(user.escrowCredits || 0).toFixed(0)}`;

    const sessionsVal = document.getElementById('dashboard-stat-sessions');
    if (sessionsVal) sessionsVal.textContent = `${user.sessionsCompleted || 14}`;

    // Upcoming Micro-Session Banner
    this.renderUpcomingSessionBanner();

    // Skill Inventories
    this.renderSkillInventories();

    // Peer Matches Feed
    this.renderPeerMatches();
  }

  renderUpcomingSessionBanner() {
    const banner = document.getElementById('upcoming-session-banner');
    if (!banner) return;

    const state = store.get();
    const session = state.upcomingSession;

    if (!session || session.status === 'Completed & Settled') {
      banner.style.display = 'none';
      return;
    }

    banner.style.display = 'flex';
    const topicEl = document.getElementById('upcoming-topic');
    if (topicEl) topicEl.textContent = session.topic;

    const peer = state.users[session.peerId] || { name: 'Daniel P.' };
    const metaEl = document.getElementById('upcoming-peer-info');
    if (metaEl) {
      metaEl.innerHTML = `With: <strong>${peer.name}</strong> • Status: <span class="badge badge-emerald">${session.status}</span>`;
    }

    const joinBtn = document.getElementById('btn-join-call-room');
    if (joinBtn) {
      joinBtn.onclick = () => {
        this.switchView('call-room');
        videoRoom.startCall(session);
      };
    }
  }

  renderSkillInventories() {
    const user = store.getCurrentUser();

    // Teaching Skills
    const teachContainer = document.getElementById('dashboard-teach-skills');
    if (teachContainer) {
      teachContainer.innerHTML = user.teachSkills.map(s => `
        <span class="skill-tag-item teach">
          <span>${s.name}</span>
          <span class="skill-level-indicator">(${s.level})</span>
          <span class="skill-tag-remove" data-skill="${s.name}" data-type="teach" title="Remove">×</span>
        </span>
      `).join('');
    }

    // Learning Skills
    const learnContainer = document.getElementById('dashboard-learn-skills');
    if (learnContainer) {
      learnContainer.innerHTML = user.learnSkills.map(s => `
        <span class="skill-tag-item learn">
          <span>${s.name}</span>
          <span class="skill-level-indicator">(${s.level})</span>
          <span class="skill-tag-remove" data-skill="${s.name}" data-type="learn" title="Remove">×</span>
        </span>
      `).join('');
    }

    // Bind remove buttons
    document.querySelectorAll('.skill-tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const skill = e.currentTarget.dataset.skill;
        const type = e.currentTarget.dataset.type;
        MatchingEngine.removeSkill(type, skill);
        this.renderDashboard();
        window.appToast(`Removed ${skill} from ${type} inventory`, 'info');
      });
    });
  }

  renderPeerMatches() {
    const container = document.getElementById('peer-matches-feed');
    if (!container) return;

    const matches = MatchingEngine.getPeerMatches(this.selectedMatchFilter);

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
          <p>No matching peers found for current filter.</p>
        </div>`;
      return;
    }

    container.innerHTML = matches.map(m => `
      <div class="peer-card glass-card">
        <div class="peer-card-top">
          <div class="peer-profile-info">
            <div class="peer-avatar" style="background: ${m.peer.avatarBg};">${m.peer.avatar}</div>
            <div class="peer-details">
              <h4>
                ${m.peer.name}
                <span class="badge ${m.isReciprocal ? 'badge-emerald' : 'badge-primary'}">
                  ${m.isReciprocal ? '⚡ Reciprocal Swap' : '🪙 Time-Credit Bank'}
                </span>
              </h4>
              <div class="peer-headline">
                <span>${m.peer.role} • ${m.peer.institution}</span>
                <span class="peer-rating">★ ${m.peer.rating.toFixed(1)} (${m.peer.sessionsCompleted} sessions)</span>
              </div>
            </div>
          </div>
          <div class="match-score-badge">
            <span class="match-score-pill">${m.matchScore}% Match</span>
          </div>
        </div>

        <div class="peer-card-body">
          <div class="skill-flow-box teaches">
            <span class="flow-label">Teaches (You Learn)</span>
            <div class="skill-flow-tags">
              ${m.peer.teachSkills.map(s => `<span class="badge badge-emerald">${s.name}</span>`).join('')}
            </div>
          </div>
          <div class="skill-flow-box learns">
            <span class="flow-label">Wants to Learn (You Teach)</span>
            <div class="skill-flow-tags">
              ${m.peer.learnSkills.map(s => `<span class="badge badge-cyan">${s.name}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="peer-card-footer">
          <div class="peer-availability">
            <span class="status-dot online"></span>
            <span>${m.peer.availability || 'Available for 20-min swap'}</span>
          </div>
          <div class="peer-actions">
            <button class="btn btn-outline btn-sm btn-view-profile" data-peer-id="${m.peer.id}">Profile</button>
            <button class="btn btn-primary btn-sm btn-request-swap" data-peer-id="${m.peer.id}" data-peer-name="${m.peer.name}">
              Request 20-Min Swap
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Bind Swap Request Buttons
    container.querySelectorAll('.btn-request-swap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const peerId = e.currentTarget.dataset.peerId;
        const peerName = e.currentTarget.dataset.peerName;
        this.openBookingModal(peerId, peerName);
      });
    });

    // Bind View Profile Buttons
    container.querySelectorAll('.btn-view-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const peerId = e.currentTarget.dataset.peerId;
        store.setCurrentUser(peerId);
        this.switchView('portfolio');
        window.appToast(`Viewing public portfolio for ${store.getCurrentUser().name}`, 'info');
      });
    });
  }

  bindDashboardActions() {
    // Match filter tabs
    const tabs = document.querySelectorAll('.match-filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedMatchFilter = e.currentTarget.dataset.filter;
        this.renderPeerMatches();
      });
    });
  }

  /* ---------------- Modals Handling ---------------- */
  bindModals() {
    // Generic modal close
    document.querySelectorAll('.btn-close-modal, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          el.closest('.modal-backdrop').classList.remove('active');
        }
      });
    });

    // Add Skill Modal
    const openAddSkillBtns = document.querySelectorAll('.btn-open-add-skill');
    openAddSkillBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.skillType || 'teach';
        const modal = document.getElementById('modal-add-skill');
        const typeSelect = document.getElementById('add-skill-type');
        if (typeSelect) typeSelect.value = type;
        if (modal) modal.classList.add('active');
      });
    });

    const submitAddSkillBtn = document.getElementById('btn-submit-add-skill');
    if (submitAddSkillBtn) {
      submitAddSkillBtn.addEventListener('click', () => {
        const type = document.getElementById('add-skill-type').value;
        const name = document.getElementById('add-skill-name').value;
        const level = document.getElementById('add-skill-level').value;

        if (!name.trim()) {
          window.appToast('Please enter a skill name', 'warning');
          return;
        }

        MatchingEngine.addSkill(type, name, level);
        document.getElementById('add-skill-name').value = '';
        document.getElementById('modal-add-skill').classList.remove('active');
        this.renderDashboard();
        audio.playSuccess();
        window.appToast(`Added ${name} (${level}) to your ${type} inventory!`, 'success');
      });
    }

    // Booking Confirmation Modal
    const confirmBookingBtn = document.getElementById('btn-confirm-booking');
    if (confirmBookingBtn) {
      confirmBookingBtn.addEventListener('click', () => {
        this.confirmBooking();
      });
    }
  }

  openBookingModal(peerId, peerName) {
    this.bookingPeerId = peerId;
    this.bookingPeerName = peerName;

    const modal = document.getElementById('modal-book-session');
    const peerNameEl = document.getElementById('booking-peer-name');
    if (peerNameEl) peerNameEl.textContent = peerName;

    if (modal) modal.classList.add('active');
  }

  confirmBooking() {
    const topicInput = document.getElementById('booking-session-topic');
    const durationSelect = document.getElementById('booking-duration');
    const topic = topicInput ? topicInput.value.trim() : 'Reciprocal Technical Mentorship';
    const duration = durationSelect ? parseInt(durationSelect.value, 10) : 20;

    try {
      // Lock credit in escrow
      CreditLedger.holdBookingEscrow(topic, this.bookingPeerName);

      // Create new upcoming session
      const state = store.get();
      state.upcomingSession = {
        id: 'sess_' + Date.now(),
        topic: topic,
        peerId: this.bookingPeerId,
        timeFormatted: `Today in 15 mins (${duration} Mins)`,
        status: 'Confirmed (1 Credit Escrowed)',
        durationMinutes: duration
      };

      store.saveState();
      audio.playSuccess();

      // Close modal
      const modal = document.getElementById('modal-book-session');
      if (modal) modal.classList.remove('active');

      this.renderDashboard();
      window.appToast(`🎉 Micro-session confirmed with ${this.bookingPeerName}! 1 Credit held in Escrow.`, 'success');
    } catch (err) {
      window.appToast(err.message, 'warning');
    }
  }
}

// Global App Toast notification utility
window.appToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3800);
};

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
