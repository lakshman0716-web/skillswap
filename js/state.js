/* ==========================================================================
   SkillSwap - Reactive State Store & Mock Data
   ========================================================================== */

const STORAGE_KEY = 'skillswap_platform_state_v1';

const INITIAL_STATE = {
  isAuthenticated: true,
  currentUserId: 'mahendra',
  users: {
    mahendra: {
      id: 'mahendra',
      name: 'Mahendra Pendyala',
      role: 'Master\'s in Software Engineering & CS',
      institution: 'UK Placement Candidate',
      avatar: 'MP',
      avatarBg: 'linear-gradient(135deg, #6366f1, #3b82f6)',
      credits: 3.0,
      escrowCredits: 1.0,
      rating: 4.95,
      sessionsCompleted: 14,
      hoursExchanged: 5.5,
      teachSkills: [
        { name: 'TypeScript', level: 'Advanced' },
        { name: 'Docker', level: 'Intermediate' },
        { name: 'UML Diagrams', level: 'Expert' }
      ],
      learnSkills: [
        { name: 'AWS Cloud', level: 'Beginner' },
        { name: 'Microservices', level: 'Intermediate' }
      ]
    },
    alex: {
      id: 'alex',
      name: 'Alex R.',
      role: 'Final Year CS Student',
      institution: 'University Technical Society',
      avatar: 'AR',
      avatarBg: 'linear-gradient(135deg, #0284c7, #06b6d4)',
      credits: 2.0,
      escrowCredits: 0,
      rating: 5.0,
      sessionsCompleted: 18,
      hoursExchanged: 7.0,
      teachSkills: [
        { name: 'AWS Cloud', level: 'Advanced' },
        { name: 'Docker Setup', level: 'Intermediate' },
        { name: 'Terraform', level: 'Intermediate' }
      ],
      learnSkills: [
        { name: 'TypeScript Patterns', level: 'Beginner' },
        { name: 'React State Management', level: 'Beginner' }
      ],
      availability: 'Available today, 18:00 - 20:00 BST'
    },
    sarah: {
      id: 'sarah',
      name: 'Sarah K.',
      role: 'Junior Backend Engineer',
      institution: 'FinTech Graduate Scheme',
      avatar: 'SK',
      avatarBg: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
      credits: 4.0,
      escrowCredits: 0,
      rating: 4.9,
      sessionsCompleted: 12,
      hoursExchanged: 5.0,
      teachSkills: [
        { name: 'PostgreSQL & Schema Design', level: 'Advanced' },
        { name: 'Redis Caching', level: 'Intermediate' }
      ],
      learnSkills: [
        { name: 'Agile / Scrum Sprint', level: 'Beginner' },
        { name: 'Next.js 14 App Router', level: 'Intermediate' }
      ],
      availability: 'Available tomorrow, 14:00 BST'
    },
    daniel: {
      id: 'daniel',
      name: 'Daniel P.',
      role: 'Placement Candidate & DevOps Peer',
      institution: 'Computer Systems MSc',
      avatar: 'DP',
      avatarBg: 'linear-gradient(135deg, #10b981, #059669)',
      credits: 1.0,
      escrowCredits: 0,
      rating: 4.88,
      sessionsCompleted: 9,
      hoursExchanged: 3.5,
      teachSkills: [
        { name: 'Kubernetes & CI/CD', level: 'Intermediate' },
        { name: 'Linux Bash Scripting', level: 'Advanced' }
      ],
      learnSkills: [
        { name: 'Docker', level: 'Intermediate' },
        { name: 'TypeScript', level: 'Beginner' }
      ],
      availability: 'Confirmed for call @ 18:15 BST'
    }
  },

  upcomingSession: {
    id: 'sess_101',
    topic: 'Debugging Next.js API Middleware & Token Validation',
    peerId: 'daniel',
    timeFormatted: 'Starts Today @ 18:15 BST (20 Mins)',
    status: 'Confirmed (1 Credit Escrowed)',
    durationMinutes: 20,
    codeSnippet: `// middleware.ts - Next.js 14 Token Validation
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Issue: Edge runtime intermittently throws 'Headers already sent'
  if (!token && request.nextUrl.pathname.startsWith('/api/protected')) {
    return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
  }

  return NextResponse.next();
}`,
    notesContent: `### Session Goal: Fix Token Expiry & Edge Cookie Parsing (20-Min Strict Timebox)
1. Inspect middleware execution flow on Next.js 14 edge runtime.
2. Ensure verifyToken() does not invoke Node-specific crypto dependencies.
3. Test cookie renewal header injection and verify test suite pass.

*Action items will be summarized and attached to verified placement portfolios upon call completion.*`
  },

  sosTickets: [
    {
      id: 'sos_1',
      title: 'Need 20 minutes to debug Docker networking error on macOS',
      authorId: 'alex',
      authorName: 'Alex R.',
      authorRole: 'Final Year CS Student',
      timestamp: '6 mins ago',
      urgency: 'high',
      urgencyLabel: 'Urgent < 15m',
      category: 'devops',
      tags: ['Docker', 'Networking', 'macOS', 'Port-Binding'],
      description: 'docker compose up fails with driver failed programming external connectivity on endpoint web. Host port 5432 shows occupied even after killall -9.',
      codeSnippet: `$ docker compose up -d\nError response from daemon: driver failed programming external connectivity on endpoint skillswap_db_1:\nBind for 0.0.0.0:5432 failed: port is already allocated`,
      rewardCredits: 1.0,
      claimed: false
    },
    {
      id: 'sos_2',
      title: 'Next.js 14 server action hydration mismatch in multi-step form',
      authorId: 'sarah',
      authorName: 'Sarah K.',
      authorRole: 'Junior Backend Engineer',
      timestamp: '18 mins ago',
      urgency: 'med',
      urgencyLabel: 'Urgent < 30m',
      category: 'frontend',
      tags: ['Next.js 14', 'React', 'Hydration', 'Server-Actions'],
      description: 'Dynamic date picker in client component renders mismatch between SSR and browser local timezone when wrapped in suspense boundary.',
      codeSnippet: `Warning: Text content did not match. Server: "2026-09-19T09:12:00" Client: "2026-09-19T14:42:00"\n  at span\n  at StepSummaryForm (forms/step2.tsx:44)`,
      rewardCredits: 1.0,
      claimed: false
    },
    {
      id: 'sos_3',
      title: 'Prisma ORM transaction deadlock in PostgreSQL connection pool',
      authorId: 'daniel',
      authorName: 'Daniel P.',
      authorRole: 'Placement Candidate',
      timestamp: '42 mins ago',
      urgency: 'med',
      urgencyLabel: 'Today',
      category: 'backend',
      tags: ['PostgreSQL', 'Prisma', 'Transactions', 'ACID'],
      description: 'Simultaneous credit deductions trigger deadlock detected error in interactive transaction callback on high concurrency load test.',
      codeSnippet: `prisma.$transaction(async (tx) => {\n  const user = await tx.wallet.update({ where: { id }, data: { credits: { decrement: 1 } } });\n  // Deadlock error code: P2034\n})`,
      rewardCredits: 1.0,
      claimed: false
    }
  ],

  transactions: [
    {
      id: 'tx_104',
      date: '19 Sep 2026, 13:45',
      type: 'ESCROW_HOLD',
      typeLabel: 'Escrow Locked',
      amount: -1.0,
      peer: 'Daniel P.',
      description: 'Micro-session booking escrow: Debugging Next.js Middleware',
      status: 'In Escrow'
    },
    {
      id: 'tx_103',
      date: '18 Sep 2026, 17:30',
      type: 'EARNED',
      typeLabel: 'Session Hosted',
      amount: +1.0,
      peer: 'Alex R.',
      description: 'Mentoring session: Docker Containerization Essentials (20 min)',
      status: 'Settled'
    },
    {
      id: 'tx_102',
      date: '17 Sep 2026, 11:15',
      type: 'EARNED',
      typeLabel: 'Session Hosted',
      amount: +1.0,
      peer: 'Sarah K.',
      description: 'Mentoring session: UML Architecture & Class Modeling (25 min)',
      status: 'Settled'
    },
    {
      id: 'tx_101',
      date: '15 Sep 2026, 09:00',
      type: 'BONUS',
      typeLabel: 'Onboarding Bonus',
      amount: +1.0,
      peer: 'System',
      description: 'Welcome complimentary onboarding credit (Section 5.2)',
      status: 'Completed'
    }
  ],

  badges: [
    {
      id: 'b_1',
      title: 'Docker Troubleshooter',
      tier: 'Verified Specialist',
      endorsementsCount: 8,
      icon: '🐳',
      iconClass: 'tech-blue',
      description: 'Endorsed for practical environment isolation, multi-stage builds, and networking debugging.'
    },
    {
      id: 'b_2',
      title: 'TypeScript Debugging Specialist',
      tier: 'Mastery Level',
      endorsementsCount: 12,
      icon: '⚡',
      iconClass: 'tech-purple',
      description: 'Proven ability to resolve generic constraints, async inference, and strict type safety errors.'
    },
    {
      id: 'b_3',
      title: 'UML & System Modeling Architect',
      tier: 'Verified Guide',
      endorsementsCount: 5,
      icon: '📐',
      iconClass: 'tech-emerald',
      description: 'Certified peer support in UML 2.5 Use Case diagrams, sequence timing, and class structures.'
    },
    {
      id: 'b_4',
      title: 'Feynman Technique Mastery',
      tier: 'Community Honor',
      endorsementsCount: 14,
      icon: '🎓',
      iconClass: 'tech-purple',
      description: 'Awarded for explaining complex architectural concepts with exceptional clarity and patience.'
    }
  ],

  endorsements: [
    {
      peerName: 'Alex R.',
      peerRole: 'Final Year CS Student',
      date: '18 Sep 2026',
      quote: 'Mahendra quickly walked me through multi-stage Docker builds in 18 minutes. Saved me hours before my assignment submission!',
      skills: ['Docker', 'Linux']
    },
    {
      peerName: 'Sarah K.',
      peerRole: 'Junior Backend Engineer',
      date: '17 Sep 2026',
      quote: 'Clear, concise explanation of UML class relationships and aggregation vs composition. Highly recommended mentor!',
      skills: ['UML Diagrams', 'Software Architecture']
    }
  ],

  notifications: [
    {
      id: 'n_1',
      title: 'Upcoming Call Ready',
      desc: 'Micro-session with Daniel P. launches in 25 minutes.',
      time: 'Just now',
      unread: true
    },
    {
      id: 'n_2',
      title: 'SOS Match Alert',
      desc: 'Alex R. posted an urgent Docker blocker matching your teaching skills.',
      time: '6m ago',
      unread: true
    },
    {
      id: 'n_3',
      title: 'Time-Credit Settlement',
      desc: '+1.0 Credit awarded for mentoring Alex R. yesterday.',
      time: 'Yesterday',
      unread: false
    }
  ]
};

class StateStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Set();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse local storage state:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state to local storage:', e);
    }
    this.notify();
  }

  resetState() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveState();
  }

  get() {
    return this.state;
  }

  getCurrentUser() {
    return this.state.users[this.state.currentUserId] || this.state.users.mahendra;
  }

  setCurrentUser(userId) {
    if (this.state.users[userId]) {
      this.state.currentUserId = userId;
      this.saveState();
    }
  }

  login(userId = 'mahendra') {
    if (this.state.users[userId]) {
      this.state.currentUserId = userId;
      this.state.isAuthenticated = true;
      this.saveState();
      return this.state.users[userId];
    }
    // Fallback if not found
    this.state.isAuthenticated = true;
    this.saveState();
    return this.getCurrentUser();
  }

  signup(userData) {
    const id = 'user_' + Date.now();
    const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';
    
    const newUser = {
      id: id,
      name: userData.name,
      role: userData.role || 'Placement Candidate',
      institution: userData.institution || 'UK University Computer Science',
      avatar: initials,
      avatarBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
      credits: 1.0, // Complimentary Onboarding Credit (Section 5.2)
      escrowCredits: 0,
      rating: 5.0,
      sessionsCompleted: 0,
      hoursExchanged: 0,
      teachSkills: userData.teachSkills || [{ name: 'JavaScript', level: 'Intermediate' }],
      learnSkills: userData.learnSkills || [{ name: 'Docker', level: 'Beginner' }]
    };

    this.state.users[id] = newUser;
    this.state.currentUserId = id;
    this.state.isAuthenticated = true;

    // Log Welcome Onboarding Credit Transaction
    const welcomeTx = {
      id: 'tx_' + Date.now(),
      date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: 'BONUS',
      typeLabel: 'Onboarding Bonus',
      amount: +1.0,
      peer: 'System Platform',
      description: 'Welcome complimentary onboarding credit (Section 5.2)',
      status: 'Completed'
    };
    this.state.transactions.unshift(welcomeTx);

    this.saveState();
    return newUser;
  }

  logout() {
    this.state.isAuthenticated = false;
    this.saveState();
  }

  isLoggedIn() {
    return this.state.isAuthenticated !== false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const store = new StateStore();
