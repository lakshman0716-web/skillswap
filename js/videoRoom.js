/* ==========================================================================
   SkillSwap - Micro-Session Video Call Room & Code Scratchpad
   ========================================================================== */

import { store } from './state.js';
import { audio } from './audioService.js';
import { CreditLedger } from './creditLedger.js';

export class VideoRoomController {
  constructor() {
    this.timerInterval = null;
    this.totalSeconds = 20 * 60; // 20 minutes standard strict timebox
    this.secondsRemaining = 20 * 60;
    this.isMuted = false;
    this.isCameraOff = false;
    this.isScreenSharing = false;
    this.localStream = null;
    this.activeLanguage = 'typescript';

    this.codeSnippets = {
      typescript: `// middleware.ts - Next.js 14 Token Validation
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Verify auth header and edge token
  if (!token && request.nextUrl.pathname.startsWith('/api/protected')) {
    return NextResponse.json(
      { error: 'Unauthorized: Session missing' },
      { status: 401 }
    );
  }

  // Inject user identity headers for downstream handlers
  const response = NextResponse.next();
  response.headers.set('x-user-verified', 'true');
  return response;
}`,
      python: `# main.py - FastAPI JWT Authentication
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

app = FastAPI(title="SkillSwap Microservice")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def verify_peer_session(token: str = Depends(oauth2_scheme)):
    if not token or token != "verified_skillswap_token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid time-credit session signature"
        )
    return {"user": "mahendra.cs", "role": "peer_mentor"}

@app.get("/api/sessions/validate")
async def validate_session(user: dict = Depends(verify_peer_session)):
    return {"status": "authorized", "user": user["user"]}`,
      dockerfile: `# Dockerfile - Optimized Multi-Stage Build
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]`,
      sql: `-- transactions.sql - Atomic Time-Credit Transfer
BEGIN;

-- 1. Deduct 1 credit from escrow balance
UPDATE users 
SET escrow_credits = escrow_credits - 1 
WHERE id = 'mahendra' AND escrow_credits >= 1;

-- 2. Award +1 credit to verified mentor
UPDATE users 
SET credits = credits + 1, 
    sessions_completed = sessions_completed + 1 
WHERE id = 'daniel';

-- 3. Log double-blind mutual confirmation
INSERT INTO credit_ledger (sender_id, recipient_id, amount, status) 
VALUES ('mahendra', 'daniel', 1.0, 'SETTLED');

COMMIT;`
    };
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Media buttons
    const micBtn = document.getElementById('btn-toggle-mic');
    if (micBtn) {
      micBtn.addEventListener('click', () => this.toggleMic());
    }

    const camBtn = document.getElementById('btn-toggle-cam');
    if (camBtn) {
      camBtn.addEventListener('click', () => this.toggleCamera());
    }

    const screenBtn = document.getElementById('btn-toggle-screen');
    if (screenBtn) {
      screenBtn.addEventListener('click', () => this.toggleScreenShare());
    }

    const endCallBtn = document.getElementById('btn-end-session');
    if (endCallBtn) {
      endCallBtn.addEventListener('click', () => this.promptSessionWrapUp());
    }

    const extendBtn = document.getElementById('btn-extend-time');
    if (extendBtn) {
      extendBtn.addEventListener('click', () => this.extendTime(5));
    }

    // Code runner
    const runCodeBtn = document.getElementById('btn-run-code');
    if (runCodeBtn) {
      runCodeBtn.addEventListener('click', () => this.runCodeSnippet());
    }

    // Language tabs
    const langTabs = document.querySelectorAll('.scratchpad-lang-tab');
    langTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        this.switchLanguage(lang);
      });
    });

    // Scratchpad vs Notes toggle
    const viewTabs = document.querySelectorAll('.scratchpad-view-tab');
    viewTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchScratchpadView(view);
      });
    });

    // Code input line numbers
    const codeInput = document.getElementById('code-editor-input');
    if (codeInput) {
      codeInput.addEventListener('input', () => this.updateLineNumbers());
      codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = codeInput.selectionStart;
          const end = codeInput.selectionEnd;
          codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
          codeInput.selectionStart = codeInput.selectionEnd = start + 2;
          this.updateLineNumbers();
        }
      });
    }

    // Double-blind rating form
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        const val = parseInt(e.currentTarget.dataset.star, 10);
        this.setRating(val);
      });
    });

    const durationChips = document.querySelectorAll('.btn-set-duration');
    durationChips.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mins = parseInt(e.currentTarget.dataset.mins, 10);
        this.setSessionDuration(mins);
      });
    });
  }

  setSessionDuration(minutes) {
    this.secondsRemaining = minutes * 60;
    this.totalSeconds = minutes * 60;
    this.updateTimerDisplay();
    audio.playPing();
    window.appToast(`⏱️ Micro-session timer set to strict ${minutes}-minute timebox`, 'info');
  }

  startCall(sessionData) {
    const session = sessionData || store.get().upcomingSession;
    this.secondsRemaining = (session.durationMinutes || 20) * 60;
    this.totalSeconds = this.secondsRemaining;

    // Update Room UI labels
    const topicEl = document.getElementById('room-session-topic');
    if (topicEl) topicEl.textContent = session.topic;

    const peerNameEl = document.getElementById('room-peer-name');
    if (peerNameEl) {
      const peer = store.get().users[session.peerId] || { name: 'Daniel P.', role: 'Placement Candidate' };
      peerNameEl.textContent = `with ${peer.name} (${peer.role})`;
    }

    // Attempt Camera Stream
    this.initMediaStream();

    // Set default code editor content
    this.switchLanguage('typescript');

    // Start timer
    this.startCountdownTimer();
  }

  async initMediaStream() {
    const localVideo = document.getElementById('local-video-feed');
    const localPlaceholder = document.getElementById('local-video-placeholder');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.localStream = stream;
        if (localVideo) {
          localVideo.srcObject = stream;
          localVideo.play();
          localVideo.style.display = 'block';
        }
        if (localPlaceholder) {
          localPlaceholder.style.display = 'none';
        }
      } else {
        throw new Error('getUserMedia not available in environment');
      }
    } catch (err) {
      // Graceful fallback to animated peer avatar stream
      if (localVideo) localVideo.style.display = 'none';
      if (localPlaceholder) localPlaceholder.style.display = 'flex';
    }
  }

  startCountdownTimer() {
    clearInterval(this.timerInterval);
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.secondsRemaining--;
      this.updateTimerDisplay();

      // 5-minute warning chime
      if (this.secondsRemaining === 5 * 60) {
        audio.playWarning();
        window.appToast('⏱️ 5 Minutes Remaining in micro-session. Prepare to wrap up and review!', 'warning');
      }

      // Time expired
      if (this.secondsRemaining <= 0) {
        clearInterval(this.timerInterval);
        audio.playWarning();
        this.promptSessionWrapUp();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.secondsRemaining / 60);
    const seconds = this.secondsRemaining % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const digitsEl = document.getElementById('room-timer-digits');
    if (digitsEl) {
      digitsEl.textContent = formatted;
      if (this.secondsRemaining <= 3 * 60) {
        digitsEl.className = 'timer-digits danger';
      } else if (this.secondsRemaining <= 5 * 60) {
        digitsEl.className = 'timer-digits warning';
      } else {
        digitsEl.className = 'timer-digits';
      }
    }

    // Circular progress stroke calculation
    const circle = document.getElementById('timer-progress-ring');
    const wrap = document.getElementById('timer-circular-wrap');
    if (circle) {
      const percentage = (this.secondsRemaining / this.totalSeconds) * 100;
      const offset = 100 - percentage;
      circle.style.strokeDashoffset = offset;

      if (wrap) {
        if (this.secondsRemaining <= 3 * 60) {
          wrap.className = 'timer-circular-wrap danger';
        } else if (this.secondsRemaining <= 5 * 60) {
          wrap.className = 'timer-circular-wrap warning';
        } else {
          wrap.className = 'timer-circular-wrap';
        }
      }
    }
  }

  extendTime(minutesToAdd) {
    this.secondsRemaining += minutesToAdd * 60;
    this.totalSeconds += minutesToAdd * 60;
    this.updateTimerDisplay();
    audio.playPing();
    window.appToast(`Added +${minutesToAdd} minutes to micro-session.`, 'info');
  }

  toggleMic() {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => (t.enabled = !this.isMuted));
    }
    const btn = document.getElementById('btn-toggle-mic');
    if (btn) {
      btn.classList.toggle('muted', this.isMuted);
      btn.innerHTML = this.isMuted
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
    }
    window.appToast(this.isMuted ? 'Microphone muted' : 'Microphone unmuted', 'info');
  }

  toggleCamera() {
    this.isCameraOff = !this.isCameraOff;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => (t.enabled = !this.isCameraOff));
    }
    const btn = document.getElementById('btn-toggle-cam');
    const localVideo = document.getElementById('local-video-feed');
    const localPlaceholder = document.getElementById('local-video-placeholder');

    if (btn) {
      btn.classList.toggle('muted', this.isCameraOff);
      btn.innerHTML = this.isCameraOff
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
    }

    if (this.isCameraOff) {
      if (localVideo) localVideo.style.display = 'none';
      if (localPlaceholder) localPlaceholder.style.display = 'flex';
    } else if (this.localStream) {
      if (localVideo) localVideo.style.display = 'block';
      if (localPlaceholder) localPlaceholder.style.display = 'none';
    }
    window.appToast(this.isCameraOff ? 'Camera turned off' : 'Camera turned on', 'info');
  }

  async toggleScreenShare() {
    const btn = document.getElementById('btn-toggle-screen');
    if (!this.isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const localVideo = document.getElementById('local-video-feed');
          if (localVideo) {
            localVideo.srcObject = screenStream;
            localVideo.style.display = 'block';
          }
          screenStream.getVideoTracks()[0].onended = () => this.toggleScreenShare();
        }
        this.isScreenSharing = true;
        if (btn) btn.classList.add('active');
        window.appToast('Screen sharing activated', 'info');
      } catch (e) {
        // Fallback simulation
        this.isScreenSharing = true;
        if (btn) btn.classList.add('active');
        window.appToast('Screen sharing broadcast active (Workspace Scratchpad view)', 'info');
      }
    } else {
      this.isScreenSharing = false;
      if (btn) btn.classList.remove('active');
      this.initMediaStream();
      window.appToast('Screen sharing stopped', 'info');
    }
  }

  switchLanguage(lang) {
    this.activeLanguage = lang;
    const codeInput = document.getElementById('code-editor-input');
    if (codeInput && this.codeSnippets[lang]) {
      codeInput.value = this.codeSnippets[lang];
      this.updateLineNumbers();
    }

    const tabs = document.querySelectorAll('.scratchpad-lang-tab');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.lang === lang));
  }

  switchScratchpadView(view) {
    const editorPane = document.getElementById('scratchpad-editor-pane');
    const notesPane = document.getElementById('scratchpad-notes-pane');
    const tabs = document.querySelectorAll('.scratchpad-view-tab');

    tabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));

    if (view === 'code') {
      if (editorPane) editorPane.style.display = 'flex';
      if (notesPane) notesPane.style.display = 'none';
    } else {
      if (editorPane) editorPane.style.display = 'none';
      if (notesPane) notesPane.style.display = 'flex';
    }
  }

  updateLineNumbers() {
    const codeInput = document.getElementById('code-editor-input');
    const gutter = document.getElementById('editor-gutter');
    if (!codeInput || !gutter) return;

    const lineCount = codeInput.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= Math.max(lineCount, 12); i++) {
      numbers += `${i}\n`;
    }
    gutter.textContent = numbers;
  }

  runCodeSnippet() {
    const consoleOutput = document.getElementById('console-output-text');
    if (!consoleOutput) return;

    audio.playPing();
    consoleOutput.innerHTML = `<span class="console-line info">[RUNNING] Executing test suite for ${this.activeLanguage.toUpperCase()}...</span>`;

    setTimeout(() => {
      if (this.activeLanguage === 'typescript') {
        consoleOutput.innerHTML = `
<span class="console-line info">[INFO] Next.js edge runtime compiler initiated.</span>
<span class="console-line success">✓ [PASS] middleware.ts syntax validated (Strict TypeScript).</span>
<span class="console-line success">✓ [PASS] Auth token cookie extraction returned HTTP 200 OK.</span>
<span class="console-line success">✓ [PASS] x-user-verified header injected into downstream response.</span>
<span class="console-line success">⚡ [RESULT] 3 passed, 0 failed. Execution time: 142ms.</span>`;
      } else if (this.activeLanguage === 'python') {
        consoleOutput.innerHTML = `
<span class="console-line info">[INFO] FastAPI uvicorn ASGI worker invoked.</span>
<span class="console-line success">✓ [PASS] OAuth2PasswordBearer dependency injection validated.</span>
<span class="console-line success">✓ [PASS] /api/sessions/validate returned {"status": "authorized"}.</span>
<span class="console-line success">⚡ [RESULT] 2 passed in 0.08s.</span>`;
      } else if (this.activeLanguage === 'dockerfile') {
        consoleOutput.innerHTML = `
<span class="console-line info">[INFO] Docker BuildKit multi-stage lint engine running...</span>
<span class="console-line success">✓ [PASS] Stage 1 (deps): npm ci verified without devDependencies.</span>
<span class="console-line success">✓ [PASS] Stage 2 (builder): Next.js build standalone bundle cached.</span>
<span class="console-line success">✓ [PASS] Stage 3 (runner): Minimal Alpine rootless container ready.</span>
<span class="console-line success">⚡ [RESULT] Docker image size reduced by 68% (1.2GB -> 148MB).</span>`;
      } else {
        consoleOutput.innerHTML = `
<span class="console-line info">[INFO] PostgreSQL transaction isolation check (SERIALIZABLE)...</span>
<span class="console-line success">✓ [PASS] Lock acquired for user 'mahendra' escrow.</span>
<span class="console-line success">✓ [PASS] Atomic credit balance transferred to mentor 'daniel'.</span>
<span class="console-line success">⚡ [RESULT] COMMIT successful. 0 deadlocks detected.</span>`;
      }
      audio.playSuccess();
    }, 650);
  }

  promptSessionWrapUp() {
    clearInterval(this.timerInterval);
    const modal = document.getElementById('modal-session-review');
    if (modal) {
      modal.classList.add('active');
    }
  }

  setRating(val) {
    this.selectedRating = val;
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(s => {
      const sVal = parseInt(s.dataset.star, 10);
      s.classList.toggle('active', sVal <= val);
    });
  }

  submitReview() {
    const feedbackInput = document.getElementById('review-feedback-text');
    const checkedTags = Array.from(document.querySelectorAll('.endorse-tag-checkbox:checked')).map(cb => cb.value);

    const rating = this.selectedRating || 5;
    const feedback = feedbackInput ? feedbackInput.value : '';

    // Settle credit transfer from escrow to peer
    const session = store.get().upcomingSession;
    CreditLedger.settleSessionCompletion(session.id, session.peerId, rating, feedback, checkedTags);

    // Stop streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
    }

    // Close review modal
    const modal = document.getElementById('modal-session-review');
    if (modal) modal.classList.remove('active');

    // Switch back to dashboard
    window.switchView('dashboard');
    window.appToast(`🎉 Session completed! 1 Time-Credit released to mentor and endorsement verified!`, 'success');
  }
}

export const videoRoom = new VideoRoomController();
