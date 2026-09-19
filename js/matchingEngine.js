/* ==========================================================================
   SkillSwap - Dual-Inventory Reciprocal Matching Engine
   ========================================================================== */

import { store } from './state.js';

export class MatchingEngine {
  /**
   * Evaluates reciprocal matches between current user and other registered peers.
   * Compares Teach(A) ∩ Learn(B) AND Teach(B) ∩ Learn(A).
   * Also computes Asynchronous Time-Credit bank match opportunities.
   */
  static getPeerMatches(filterType = 'all', searchQuery = '') {
    const state = store.get();
    const currentUser = store.getCurrentUser();
    const otherUsers = Object.values(state.users).filter(u => u.id !== currentUser.id);

    const matches = otherUsers.map(peer => {
      // 1. Direct Reciprocal check
      // Peer teaches something current user wants to learn
      const peerCanTeachMe = peer.teachSkills.filter(ts =>
        currentUser.learnSkills.some(ls =>
          ls.name.toLowerCase().includes(ts.name.toLowerCase()) ||
          ts.name.toLowerCase().includes(ls.name.toLowerCase())
        )
      );

      // Current user teaches something peer wants to learn
      const iCanTeachPeer = currentUser.teachSkills.filter(ts =>
        peer.learnSkills.some(ls =>
          ls.name.toLowerCase().includes(ts.name.toLowerCase()) ||
          ts.name.toLowerCase().includes(ls.name.toLowerCase())
        )
      );

      const isReciprocal = peerCanTeachMe.length > 0 && iCanTeachPeer.length > 0;
      const isCreditBank = peerCanTeachMe.length > 0 && !isReciprocal;

      // Calculate matching score
      let score = 70;
      if (isReciprocal) {
        score = 92 + Math.min(peerCanTeachMe.length * 3 + iCanTeachPeer.length * 3, 7);
      } else if (isCreditBank) {
        score = 80 + Math.min(peerCanTeachMe.length * 5, 10);
      }

      return {
        peer,
        isReciprocal,
        isCreditBank,
        matchScore: score,
        peerCanTeachMe,
        iCanTeachPeer,
        teachSummary: peer.teachSkills.map(s => s.name).join(', '),
        learnSummary: peer.learnSkills.map(s => s.name).join(', ')
      };
    });

    // Apply Filter
    let filtered = matches;
    if (filterType === 'reciprocal') {
      filtered = filtered.filter(m => m.isReciprocal);
    } else if (filterType === 'credit') {
      filtered = filtered.filter(m => m.isCreditBank || !m.isReciprocal);
    }

    // Apply Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.peer.name.toLowerCase().includes(q) ||
        m.peer.teachSkills.some(s => s.name.toLowerCase().includes(q)) ||
        m.peer.learnSkills.some(s => s.name.toLowerCase().includes(q))
      );
    }

    // Sort by match score descending
    return filtered.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Adds a skill to either Teach or Learn inventory
   */
  static addSkill(type, name, level) {
    if (!name || !name.trim()) return false;
    const state = store.get();
    const currentUser = store.getCurrentUser();
    const cleanName = name.trim();

    if (type === 'teach') {
      if (!currentUser.teachSkills.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
        currentUser.teachSkills.push({ name: cleanName, level: level || 'Intermediate' });
      }
    } else if (type === 'learn') {
      if (!currentUser.learnSkills.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
        currentUser.learnSkills.push({ name: cleanName, level: level || 'Beginner' });
      }
    }

    state.users[currentUser.id] = currentUser;
    store.saveState();
    return true;
  }

  /**
   * Removes a skill tag from inventory
   */
  static removeSkill(type, skillName) {
    const state = store.get();
    const currentUser = store.getCurrentUser();

    if (type === 'teach') {
      currentUser.teachSkills = currentUser.teachSkills.filter(s => s.name !== skillName);
    } else if (type === 'learn') {
      currentUser.learnSkills = currentUser.learnSkills.filter(s => s.name !== skillName);
    }

    state.users[currentUser.id] = currentUser;
    store.saveState();
  }
}
