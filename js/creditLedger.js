/* ==========================================================================
   SkillSwap - Time-Credit Ledger & Escrow Settlement Engine
   ========================================================================== */

import { store } from './state.js';
import { audio } from './audioService.js';

export class CreditLedger {
  /**
   * Holds 1 Time-Credit in Escrow when booking a micro-session
   */
  static holdBookingEscrow(topic, peerName) {
    const state = store.get();
    const currentUser = store.getCurrentUser();

    if (currentUser.credits < 1.0) {
      throw new Error('Insufficient Time-Credits. Host a 20-minute mentoring session to earn credits!');
    }

    // Deduct from available credits, lock in escrow
    currentUser.credits -= 1.0;
    currentUser.escrowCredits = (currentUser.escrowCredits || 0) + 1.0;

    const tx = {
      id: 'tx_' + Date.now(),
      date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: 'ESCROW_HOLD',
      typeLabel: 'Escrow Locked',
      amount: -1.0,
      peer: peerName,
      description: `Micro-session booking escrow: ${topic}`,
      status: 'In Escrow'
    };

    state.transactions.unshift(tx);
    state.users[currentUser.id] = currentUser;
    store.saveState();

    return tx;
  }

  /**
   * Releases escrowed credit upon mutual session completion confirmation
   * and double-blind rating review
   */
  static settleSessionCompletion(sessionId, mentorId, rating, feedbackText, endorsedSkills = []) {
    const state = store.get();
    const currentUser = store.getCurrentUser();
    const mentor = state.users[mentorId];

    // Release escrow from current user
    if (currentUser.escrowCredits >= 1.0) {
      currentUser.escrowCredits -= 1.0;
    }

    // Award +1.0 Time-Credit to the mentor
    if (mentor) {
      mentor.credits = (mentor.credits || 0) + 1.0;
      mentor.sessionsCompleted = (mentor.sessionsCompleted || 0) + 1;
      mentor.hoursExchanged = ((mentor.hoursExchanged || 0) + 0.35);
      state.users[mentorId] = mentor;
    }

    currentUser.sessionsCompleted = (currentUser.sessionsCompleted || 0) + 1;
    currentUser.hoursExchanged = ((currentUser.hoursExchanged || 0) + 0.35);
    state.users[currentUser.id] = currentUser;

    // Record settlement transaction
    const tx = {
      id: 'tx_' + Date.now(),
      date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: 'SETTLED',
      typeLabel: 'Session Settled',
      amount: 0.0,
      peer: mentor ? mentor.name : 'Peer Mentor',
      description: `Escrow released upon 5-star mutual completion confirmation (${rating}★)`,
      status: 'Settled'
    };

    state.transactions.unshift(tx);

    // Record endorsement if provided
    if (endorsedSkills.length > 0 && mentor) {
      state.endorsements.unshift({
        peerName: currentUser.name,
        peerRole: currentUser.role,
        date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        quote: feedbackText || 'Great peer mentoring session! Very insightful and solved the blocker efficiently.',
        skills: endorsedSkills
      });

      // Update badge counts for mentor
      endorsedSkills.forEach(skill => {
        const badge = state.badges.find(b => b.title.toLowerCase().includes(skill.toLowerCase()));
        if (badge) {
          badge.endorsementsCount += 1;
        }
      });
    }

    // Mark upcoming session as completed
    if (state.upcomingSession && state.upcomingSession.id === sessionId) {
      state.upcomingSession.status = 'Completed & Settled';
    }

    store.saveState();
    audio.playSuccess();

    return tx;
  }

  /**
   * Awards onboarding credit or mentor bonus
   */
  static awardBonus(amount, reason) {
    const state = store.get();
    const currentUser = store.getCurrentUser();

    currentUser.credits += amount;
    const tx = {
      id: 'tx_' + Date.now(),
      date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: 'BONUS',
      typeLabel: 'Credit Bonus',
      amount: amount,
      peer: 'System Economy',
      description: reason,
      status: 'Completed'
    };

    state.transactions.unshift(tx);
    state.users[currentUser.id] = currentUser;
    store.saveState();
    audio.playSuccess();
  }
}
