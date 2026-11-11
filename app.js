/**
 * LÝ LUẬN & PHƯƠNG PHÁP GDTC - QUIZ APPLICATION
 * Tự động đồng bộ LocalStorage, tương thích hoàn hảo Mobile & Desktop
 */

(function () {
  'use strict';

  // Constants
  const STORAGE_KEY = 'LLTDTT_QUIZ_DATA_V2';
  const MOCK_TIME_SECONDS = 20 * 60; // 20 phút

  // App State
  const state = {
    mode: 'exam', // 'exam' | 'all' | 'wrong' | 'flagged' | 'mock'
    currentExam: 1, // 1 to 6
    searchQuery: '',
    currentIndex: 0,
    filteredQuestions: [],
    sessionWrongIds: null, // Freeze wrong list during active review session
    
    // User progress (saved in LocalStorage)
    userAnswers: {}, // { [id]: { selected: 'B', isCorrect: true, timestamp: Date.now() } }
    flags: {}, // { [id]: true }
    
    // Mock exam state
    mockState: {
      isActive: false,
      isSubmitted: false,
      timeRemaining: MOCK_TIME_SECONDS,
      timerId: null,
      examId: 1,
      answers: {} // { [id]: 'B' }
    },
    
    // Settings
    settings: {
      instantFeedback: true,
      autoNext: false,
      sound: true,
      theme: 'light' // 'light' | 'dark'
    }
  };

  // Web Audio Context for subtle sounds
  let audioCtx = null;
  function playSound(type) {
    if (!state.settings.sound) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;
      if (type === 'correct') {
        // High soft chime
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'wrong') {
        // Low gentle blip
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(170, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }

  // DOM Elements
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    settingsModalBtn: document.getElementById('settingsModalBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    
    // Stats
    statTotal: document.getElementById('statTotal'),
    statCorrect: document.getElementById('statCorrect'),
    statWrong: document.getElementById('statWrong'),
    statFlagged: document.getElementById('statFlagged'),
    statTotalPill: document.getElementById('statTotalPill'),
    statCorrectPill: document.getElementById('statCorrectPill'),
    statWrongPill: document.getElementById('statWrongPill'),
    statFlaggedPill: document.getElementById('statFlaggedPill'),
    
    badgeWrongCount: document.getElementById('badgeWrongCount'),
    badgeFlaggedCount: document.getElementById('badgeFlaggedCount'),
    
    // Navigation / Tabs
    navTabs: document.querySelectorAll('.nav-tabs .tab-btn'),
    examPillsContainer: document.getElementById('examPillsContainer'),
    examPills: document.querySelectorAll('.exam-pill'),
    searchInput: document.getElementById('searchInput'),
    progressBarFill: document.getElementById('progressBarFill'),
    
    // Timer
    mockTimerDisplay: document.getElementById('mockTimerDisplay'),
    timerText: document.getElementById('timerText'),
    submitMockBtn: document.getElementById('submitMockBtn'),
    
    // Quiz Card
    quizCard: document.getElementById('quizCard'),
    qBadgeExam: document.getElementById('qBadgeExam'),
    qBadgeNum: document.getElementById('qBadgeNum'),
    qBadgeStatus: document.getElementById('qBadgeStatus'),
    flagBtn: document.getElementById('flagBtn'),
    questionPrompt: document.getElementById('questionPrompt'),
    fillBlankSection: document.getElementById('fillBlankSection'),
    fillTextInput: document.getElementById('fillTextInput'),
    fillCheckBtn: document.getElementById('fillCheckBtn'),
    optionsList: document.getElementById('optionsList'),
    feedbackBanner: document.getElementById('feedbackBanner'),
    feedbackIcon: document.getElementById('feedbackIcon'),
    feedbackText: document.getElementById('feedbackText'),
    
    // Card Navigation
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    toggleAnswerBtn: document.getElementById('toggleAnswerBtn'),
    resetQuestionBtn: document.getElementById('resetQuestionBtn'),
    
    // Matrix
    matrixGrid: document.getElementById('matrixGrid'),
    matrixProgressCount: document.getElementById('matrixProgressCount'),
    clearWrongInModeBtn: document.getElementById('clearWrongInModeBtn'),
    
    // Mobile Bottom Bar & Sheet
    mobilePrevBtn: document.getElementById('mobilePrevBtn'),
    mobileNextBtn: document.getElementById('mobileNextBtn'),
    mobileFlagBtn: document.getElementById('mobileFlagBtn'),
    mobileMatrixToggleBtn: document.getElementById('mobileMatrixToggleBtn'),
    mobileProgressIndicator: document.getElementById('mobileProgressIndicator'),
    mobileSheetOverlay: document.getElementById('mobileSheetOverlay'),
    mobileSheet: document.getElementById('mobileSheet'),
    mobileMatrixGrid: document.getElementById('mobileMatrixGrid'),
    closeSheetBtn: document.getElementById('closeSheetBtn'),
    
    // Settings inputs
    settingInstantFeedback: document.getElementById('settingInstantFeedback'),
    settingAutoNext: document.getElementById('settingAutoNext'),
    settingSound: document.getElementById('settingSound'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    importFileInput: document.getElementById('importFileInput'),
    resetAllDataBtn: document.getElementById('resetAllDataBtn'),
    
    // Mock Result Modal
    mockResultModal: document.getElementById('mockResultModal'),
    closeMockResultBtn: document.getElementById('closeMockResultBtn'),
    mockScoreVal: document.getElementById('mockScoreVal'),
    mockScoreGrade: document.getElementById('mockScoreGrade'),
    mockCorrectCount: document.getElementById('mockCorrectCount'),
    mockWrongCount: document.getElementById('mockWrongCount'),
    mockUnansweredCount: document.getElementById('mockUnansweredCount'),
    mockFeedbackText: document.getElementById('mockFeedbackText'),
    mockReviewBtn: document.getElementById('mockReviewBtn'),
    mockPracticeWrongBtn: document.getElementById('mockPracticeWrongBtn'),
    mockRetestBtn: document.getElementById('mockRetestBtn'),
    
    toastContainer: document.getElementById('toastContainer')
  };

  // Toast notifications
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2500);
  }

  // Load from LocalStorage
  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.userAnswers) state.userAnswers = data.userAnswers;
        if (data.flags) state.flags = data.flags;
        if (data.settings) state.settings = { ...state.settings, ...data.settings };
      }
    } catch (e) {
      console.error('Error loading storage', e);
    }
    
    // Apply theme
    applyTheme(state.settings.theme);
    
    // Apply settings checkboxes
    elements.settingInstantFeedback.checked = state.settings.instantFeedback;
    elements.settingAutoNext.checked = state.settings.autoNext;
    elements.settingSound.checked = state.settings.sound;
  }

  // Save to LocalStorage
  function saveStorage() {
    try {
      const data = {
        userAnswers: state.userAnswers,
        flags: state.flags,
        settings: state.settings,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving storage', e);
    }
  }

  // Theme Management
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    state.settings.theme = theme;
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    applyTheme(target);
    saveStorage();
    showToast(`Đã chuyển sang giao diện ${target === 'dark' ? 'Tối' : 'Sáng'}`);
  }

  // Text normalization for Vietnamese diacritics
  function normalizeStr(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Filter questions based on current mode, exam, and search query
  function updateFilteredQuestions() {
    let list = QUIZ_QUESTIONS;

    if (state.mode === 'exam') {
      list = list.filter(q => q.exam === state.currentExam);
    } else if (state.mode === 'wrong') {
      if (state.sessionWrongIds) {
        list = list.filter(q => state.sessionWrongIds.includes(q.id));
      } else {
        list = list.filter(q => state.userAnswers[q.id] && !state.userAnswers[q.id].isCorrect);
      }
    } else if (state.mode === 'flagged') {
      list = list.filter(q => state.flags[q.id]);
    } else if (state.mode === 'mock') {
      list = list.filter(q => q.exam === state.mockState.examId);
    }

    // Apply search filter if query exists
    if (state.searchQuery.trim()) {
      const qNorm = normalizeStr(state.searchQuery);
      list = list.filter(q => {
        const pNorm = normalizeStr(q.question);
        if (pNorm.includes(qNorm)) return true;
        return q.options.some(o => normalizeStr(o.text).includes(qNorm));
      });
    }

    state.filteredQuestions = list;
    if (state.currentIndex >= list.length) {
      state.currentIndex = Math.max(0, list.length - 1);
    }
  }

  // Update Stats and UI Badges
  function updateStats() {
    let correctCount = 0;
    let wrongCount = 0;
    let flaggedCount = 0;

    QUIZ_QUESTIONS.forEach(q => {
      const ans = state.userAnswers[q.id];
      if (ans) {
        if (ans.isCorrect) correctCount++;
        else wrongCount++;
      }
      if (state.flags[q.id]) flaggedCount++;
    });

    elements.statTotal.textContent = QUIZ_QUESTIONS.length;
    elements.statCorrect.textContent = correctCount;
    elements.statWrong.textContent = wrongCount;
    elements.statFlagged.textContent = flaggedCount;

    elements.badgeWrongCount.textContent = wrongCount;
    elements.badgeFlaggedCount.textContent = flaggedCount;

    // Show/hide clear wrong button if in wrong mode
    if (state.mode === 'wrong' && wrongCount > 0) {
      elements.clearWrongInModeBtn.style.display = 'block';
    } else {
      elements.clearWrongInModeBtn.style.display = 'none';
    }
  }

  // Render Current Question
  function renderQuestion() {
    updateFilteredQuestions();
    updateStats();

    const totalInList = state.filteredQuestions.length;

    // Handle Empty State
    if (totalInList === 0) {
      renderEmptyState();
      renderMatrix();
      return;
    }

    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    // Update Progress bar
    const progressPercent = ((state.currentIndex + 1) / totalInList) * 100;
    elements.progressBarFill.style.width = `${progressPercent}%`;

    // Header Badges
    elements.qBadgeExam.textContent = `Đề ${q.exam}`;
    elements.qBadgeNum.textContent = `Câu ${state.currentIndex + 1}/${totalInList}`;

    // Status Badge
    const answer = (state.mode === 'mock' && !state.mockState.isSubmitted)
      ? (state.mockState.answers[q.id] ? { selected: state.mockState.answers[q.id] } : null)
      : state.userAnswers[q.id];

    if (state.mode === 'mock' && !state.mockState.isSubmitted) {
      if (answer) {
        elements.qBadgeStatus.innerHTML = `<span class="badge badge-qnum" style="background: var(--primary-light); color: var(--primary); border-color: var(--primary);">Đã chọn: ${answer.selected}</span>`;
      } else {
        elements.qBadgeStatus.innerHTML = `<span class="badge badge-qnum">Chưa làm</span>`;
      }
    } else if (answer) {
      if (answer.isCorrect) {
        elements.qBadgeStatus.innerHTML = `<span class="badge badge-status correct">✓ Đúng</span>`;
      } else {
        elements.qBadgeStatus.innerHTML = `<span class="badge badge-status wrong">✕ Sai</span>`;
      }
    } else {
      elements.qBadgeStatus.innerHTML = `<span class="badge badge-qnum">Chưa làm</span>`;
    }

    // Flag button state
    const isFlagged = !!state.flags[q.id];
    elements.flagBtn.classList.toggle('active', isFlagged);
    elements.mobileFlagBtn.classList.toggle('active', isFlagged);
    elements.flagBtn.querySelector('span').textContent = isFlagged ? 'Đã đánh dấu' : 'Đánh dấu';

    // Question Prompt
    let promptHtml = q.question;
    if (promptHtml.includes('[ ... ]')) {
      promptHtml = promptHtml.replace('[ ... ]', '<span class="blank-slot">[ ... ]</span>');
    }
    elements.questionPrompt.innerHTML = promptHtml;

    // Fill Blank Section
    if (q.type === 'fill_blank') {
      elements.fillBlankSection.style.display = 'flex';
      elements.fillTextInput.value = '';
      if (answer && answer.inputText) {
        elements.fillTextInput.value = answer.inputText;
      }
    } else {
      elements.fillBlankSection.style.display = 'none';
    }

    // Render Options List
    elements.optionsList.innerHTML = '';
    const isAnswered = !!answer;
    const isMockRunning = (state.mode === 'mock' && !state.mockState.isSubmitted);

    if (isAnswered && !isMockRunning) {
      elements.optionsList.classList.add('is-answered');
    } else {
      elements.optionsList.classList.remove('is-answered');
    }

    q.options.forEach(opt => {
      const optItem = document.createElement('div');
      optItem.className = 'option-item';
      optItem.setAttribute('data-key', opt.key);

      const isSelected = answer && answer.selected === opt.key;
      const isCorrect = opt.key === q.correct;

      if (isMockRunning) {
        if (isSelected) {
          optItem.classList.add('selected');
        }
      } else if (isAnswered) {
        if (isCorrect) {
          optItem.classList.add('state-correct');
        } else if (isSelected && !answer.isCorrect) {
          optItem.classList.add('state-wrong');
        }
      }

      optItem.innerHTML = `
        <div class="option-key">${opt.key}</div>
        <div class="option-text">${opt.text}</div>
      `;

      optItem.addEventListener('click', () => {
        handleOptionSelect(q, opt.key);
      });

      elements.optionsList.appendChild(optItem);
    });

    // Feedback Banner
    if (isAnswered && !isMockRunning) {
      elements.feedbackBanner.style.display = 'flex';
      if (answer.isCorrect) {
        elements.feedbackBanner.className = 'feedback-banner correct';
        elements.feedbackIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        elements.feedbackText.innerHTML = `<strong>Chính xác!</strong> Đáp án đúng là <strong>${q.correct}</strong>.`;
      } else {
        elements.feedbackBanner.className = 'feedback-banner wrong';
        elements.feedbackIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        const correctOptObj = q.options.find(o => o.key === q.correct);
        const correctText = correctOptObj ? correctOptObj.text : '';
        elements.feedbackText.innerHTML = `<strong>Chưa chính xác!</strong> Bạn chọn <strong>${answer.selected}</strong>. Đáp án đúng là <strong style="color: var(--success);">${q.correct}: ${correctText}</strong>.`;
      }
    } else {
      elements.feedbackBanner.style.display = 'none';
    }

    // Toggle navigation buttons
    elements.prevBtn.disabled = state.currentIndex === 0;
    elements.mobilePrevBtn.disabled = state.currentIndex === 0;
    elements.nextBtn.disabled = state.currentIndex === totalInList - 1;
    elements.mobileNextBtn.disabled = state.currentIndex === totalInList - 1;

    // Mobile progress indicator
    elements.mobileProgressIndicator.textContent = `${state.currentIndex + 1}/${totalInList}`;

    renderMatrix();
  }

  // Empty State Rendering
  function renderEmptyState() {
    let title = 'Không tìm thấy câu hỏi';
    let desc = 'Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.';
    let icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

    if (state.mode === 'wrong') {
      title = 'Không có câu làm sai!';
      desc = 'Rất tuyệt vời! Bạn chưa có câu làm sai nào hoặc đã sửa đúng tất cả các câu đã thử.';
      icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (state.mode === 'flagged') {
      title = 'Chưa có câu hỏi gắn cờ';
      desc = 'Nhấn nút "Đánh dấu" hoặc phím F trên bất kỳ câu hỏi nào để lưu vào đây ôn tập.';
      icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`;
    }

    elements.quizCard.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-title">${title}</div>
        <div class="empty-desc">${desc}</div>
        <button id="emptyActionBtn" class="btn btn-primary" style="margin-top: 0.5rem;">
          Quay lại Luyện theo Đề
        </button>
      </div>
    `;

    document.getElementById('emptyActionBtn').addEventListener('click', () => {
      setMode('exam');
    });

    elements.progressBarFill.style.width = '0%';
  }

  // Option Click Handler
  function handleOptionSelect(question, selectedKey) {
    if (state.mode === 'mock' && !state.mockState.isSubmitted) {
      // Mock Exam Mode: Record answer without immediate evaluation
      state.mockState.answers[question.id] = selectedKey;
      renderQuestion();
      return;
    }

    const isCorrect = (selectedKey === question.correct);

    // Save user answer
    state.userAnswers[question.id] = {
      selected: selectedKey,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };
    saveStorage();

    // Play feedback tone
    if (isCorrect) {
      playSound('correct');
    } else {
      playSound('wrong');
    }

    // Render updated state
    renderQuestion();

    // Auto next question if enabled and correct
    if (isCorrect && state.settings.autoNext && state.currentIndex < state.filteredQuestions.length - 1) {
      setTimeout(() => {
        state.currentIndex++;
        renderQuestion();
      }, 700);
    }
  }

  // Handle Fill in the Blank Input Check
  function handleFillCheck() {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q || q.type !== 'fill_blank') return;

    const val = elements.fillTextInput.value.trim();
    if (!val) {
      showToast('Vui lòng nhập từ để kiểm tra!');
      return;
    }

    const normInput = normalizeStr(val);
    const normAns = normalizeStr(q.fill_answer);

    // Check exact or contains
    const isCorrect = (normInput === normAns || normInput.includes(normAns) || normAns.includes(normInput));

    state.userAnswers[q.id] = {
      selected: isCorrect ? q.correct : 'X',
      inputText: val,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };
    saveStorage();

    if (isCorrect) playSound('correct');
    else playSound('wrong');

    renderQuestion();
  }

  // Question Matrix Rendering
  function renderMatrix() {
    const total = state.filteredQuestions.length;
    elements.matrixProgressCount.textContent = `${total > 0 ? state.currentIndex + 1 : 0}/${total}`;

    const renderGridTo = (container) => {
      container.innerHTML = '';
      if (total === 0) return;

      state.filteredQuestions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.className = 'matrix-btn';
        btn.textContent = idx + 1;

        if (idx === state.currentIndex) {
          btn.classList.add('current');
        }

        const ans = (state.mode === 'mock' && !state.mockState.isSubmitted)
          ? (state.mockState.answers[q.id] ? { selected: state.mockState.answers[q.id] } : null)
          : state.userAnswers[q.id];

        if (state.mode === 'mock' && !state.mockState.isSubmitted) {
          if (ans) {
            btn.style.background = 'var(--primary)';
            btn.style.color = '#fff';
            btn.style.borderColor = 'var(--primary)';
          }
        } else if (ans) {
          if (ans.isCorrect) {
            btn.classList.add('correct');
          } else {
            btn.classList.add('wrong');
          }
        }

        if (state.flags[q.id]) {
          btn.classList.add('flagged');
        }

        btn.addEventListener('click', () => {
          state.currentIndex = idx;
          renderQuestion();
          closeMobileSheet();
        });

        container.appendChild(btn);
      });
    };

    renderGridTo(elements.matrixGrid);
    renderGridTo(elements.mobileMatrixGrid);
  }

  // Toggle Flag for Current Question
  function toggleCurrentFlag() {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    if (state.flags[q.id]) {
      delete state.flags[q.id];
      showToast(`Đã bỏ đánh dấu câu ${state.currentIndex + 1}`);
    } else {
      state.flags[q.id] = true;
      showToast(`Đã đánh dấu câu ${state.currentIndex + 1} ⭐`);
    }

    saveStorage();
    renderQuestion();
  }

  // Clear answer of Current Question
  function resetCurrentQuestion() {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    if (state.mode === 'mock' && !state.mockState.isSubmitted) {
      delete state.mockState.answers[q.id];
    } else {
      delete state.userAnswers[q.id];
      saveStorage();
    }

    showToast(`Đã làm mới câu ${state.currentIndex + 1}`);
    renderQuestion();
  }

  // Show Answer Directly (Reveal Answer)
  function toggleAnswerDirectly() {
    const q = state.filteredQuestions[state.currentIndex];
    if (!q) return;

    state.userAnswers[q.id] = {
      selected: q.correct,
      isCorrect: true,
      revealed: true,
      timestamp: Date.now()
    };
    saveStorage();
    renderQuestion();
  }

  // Mode Switcher
  function setMode(newMode) {
    state.mode = newMode;
    state.currentIndex = 0;

    // In 'wrong' mode, snapshot the wrong question ids for this session
    if (newMode === 'wrong') {
      state.sessionWrongIds = QUIZ_QUESTIONS.filter(q => state.userAnswers[q.id] && !state.userAnswers[q.id].isCorrect).map(q => q.id);
    } else {
      state.sessionWrongIds = null;
    }

    // Update active tab buttons
    elements.navTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    // Sub-controls visibility
    if (newMode === 'exam') {
      elements.examPillsContainer.style.display = 'flex';
      elements.mockTimerDisplay.style.display = 'none';
      elements.submitMockBtn.style.display = 'none';
    } else if (newMode === 'mock') {
      elements.examPillsContainer.style.display = 'flex';
      elements.mockTimerDisplay.style.display = 'flex';
      elements.submitMockBtn.style.display = 'inline-flex';
      initMockExam(state.currentExam);
    } else {
      elements.examPillsContainer.style.display = 'none';
      elements.mockTimerDisplay.style.display = 'none';
      elements.submitMockBtn.style.display = 'none';
    }

    renderQuestion();
  }

  // Mock Exam Logic
  function initMockExam(examId) {
    if (state.mockState.timerId) {
      clearInterval(state.mockState.timerId);
    }

    state.mockState = {
      isActive: true,
      isSubmitted: false,
      timeRemaining: MOCK_TIME_SECONDS,
      examId: examId,
      answers: {},
      timerId: null
    };

    updateTimerDisplay();

    state.mockState.timerId = setInterval(() => {
      state.mockState.timeRemaining--;
      updateTimerDisplay();
      if (state.mockState.timeRemaining <= 0) {
        clearInterval(state.mockState.timerId);
        submitMockExam(true);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const total = state.mockState.timeRemaining;
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    elements.timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function submitMockExam(auto = false) {
    if (state.mockState.timerId) {
      clearInterval(state.mockState.timerId);
    }
    state.mockState.isSubmitted = true;

    // Calculate score
    const examQuestions = QUIZ_QUESTIONS.filter(q => q.exam === state.mockState.examId);
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    examQuestions.forEach(q => {
      const userChoice = state.mockState.answers[q.id];
      if (!userChoice) {
        unanswered++;
      } else if (userChoice === q.correct) {
        correct++;
        state.userAnswers[q.id] = { selected: userChoice, isCorrect: true, timestamp: Date.now() };
      } else {
        wrong++;
        state.userAnswers[q.id] = { selected: userChoice, isCorrect: false, timestamp: Date.now() };
      }
    });

    saveStorage();

    const score = ((correct / examQuestions.length) * 10).toFixed(1);
    elements.mockScoreVal.textContent = score;
    elements.mockCorrectCount.textContent = correct;
    elements.mockWrongCount.textContent = wrong;
    elements.mockUnansweredCount.textContent = unanswered;

    let grade = 'Trung Bình';
    let feedback = 'Bạn cần tiếp tục ôn tập kỹ các lý thuyết cơ bản.';
    if (score >= 9.0) {
      grade = 'Xuất Sắc! 🌟';
      feedback = 'Kiến thức lý luận GDTC của bạn rất vững vàng!';
    } else if (score >= 8.0) {
      grade = 'Giỏi 🎉';
      feedback = 'Kết quả rất tốt, hãy làm lại một vài câu chưa đúng.';
    } else if (score >= 6.5) {
      grade = 'Khá 👍';
      feedback = 'Đã nắm được phần lớn kiến thức, cần rèn luyện thêm.';
    } else if (score >= 5.0) {
      grade = 'Đạt Yêu Cầu ⚠️';
      feedback = 'Vừa đủ điểm qua môn, cần cố gắng hơn nữa.';
    } else {
      grade = 'Chưa Đạt ❌';
      feedback = 'Hãy sử dụng chế độ "Làm lại câu sai" để ôn lại toàn bộ.';
    }

    elements.mockScoreGrade.textContent = grade;
    elements.mockFeedbackText.textContent = feedback;

    if (wrong > 0) {
      elements.mockPracticeWrongBtn.style.display = 'inline-flex';
    } else {
      elements.mockPracticeWrongBtn.style.display = 'none';
    }

    elements.mockResultModal.classList.add('active');
  }

  // Mobile Bottom Sheet
  function openMobileSheet() {
    elements.mobileSheetOverlay.classList.add('active');
    elements.mobileSheet.classList.add('active');
  }

  function closeMobileSheet() {
    elements.mobileSheetOverlay.classList.remove('active');
    elements.mobileSheet.classList.remove('active');
  }

  // Export / Import Data
  function exportData() {
    const data = {
      appName: 'LyLuanTDTT_Quiz',
      version: 2,
      exportDate: new Date().toISOString(),
      userAnswers: state.userAnswers,
      flags: state.flags,
      settings: state.settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lltdtt_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file lưu trữ dữ liệu!');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.userAnswers) state.userAnswers = data.userAnswers;
        if (data.flags) state.flags = data.flags;
        if (data.settings) state.settings = { ...state.settings, ...data.settings };
        saveStorage();
        applyTheme(state.settings.theme);
        renderQuestion();
        showToast('Nhập dữ liệu thành công!');
        elements.settingsModal.classList.remove('active');
      } catch (err) {
        alert('File không hợp lệ hoặc bị lỗi!');
      }
    };
    reader.readAsText(file);
  }

  function resetAllData() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử câu đúng, câu sai và các câu gắn cờ không? Hành động này không thể hoàn tác!')) {
      state.userAnswers = {};
      state.flags = {};
      saveStorage();
      renderQuestion();
      showToast('Đã xóa toàn bộ dữ liệu làm bài!');
      elements.settingsModal.classList.remove('active');
    }
  }

  // Setup Event Listeners
  function initEvents() {
    // Theme toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Settings Modal
    elements.settingsModalBtn.addEventListener('click', () => {
      elements.settingsModal.classList.add('active');
    });
    elements.closeSettingsBtn.addEventListener('click', () => {
      elements.settingsModal.classList.remove('active');
    });
    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) {
        elements.settingsModal.classList.remove('active');
      }
    });

    // Settings checkboxes
    elements.settingInstantFeedback.addEventListener('change', (e) => {
      state.settings.instantFeedback = e.target.checked;
      saveStorage();
    });
    elements.settingAutoNext.addEventListener('change', (e) => {
      state.settings.autoNext = e.target.checked;
      saveStorage();
    });
    elements.settingSound.addEventListener('change', (e) => {
      state.settings.sound = e.target.checked;
      saveStorage();
    });

    // Export / Import
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataBtn.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importData(e.target.files[0]);
      }
    });
    elements.resetAllDataBtn.addEventListener('click', resetAllData);

    // Quick Stats Pill Click -> Switch Mode
    elements.statTotalPill.addEventListener('click', () => setMode('all'));
    elements.statWrongPill.addEventListener('click', () => setMode('wrong'));
    elements.statFlaggedPill.addEventListener('click', () => setMode('flagged'));

    // Mode Tabs
    elements.navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        setMode(btn.dataset.mode);
      });
    });

    // Exam selector pills (Đề 1 to Đề 6)
    elements.examPills.forEach(pill => {
      pill.addEventListener('click', () => {
        elements.examPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const examNum = parseInt(pill.dataset.exam, 10);
        state.currentExam = examNum;
        if (state.mode === 'mock') {
          initMockExam(examNum);
        }
        state.currentIndex = 0;
        renderQuestion();
      });
    });

    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentIndex = 0;
      renderQuestion();
    });

    // Flag buttons
    elements.flagBtn.addEventListener('click', toggleCurrentFlag);
    elements.mobileFlagBtn.addEventListener('click', toggleCurrentFlag);

    // Fill blank check
    elements.fillCheckBtn.addEventListener('click', handleFillCheck);
    elements.fillTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleFillCheck();
    });

    // Nav buttons
    const goPrev = () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        renderQuestion();
      }
    };
    const goNext = () => {
      if (state.currentIndex < state.filteredQuestions.length - 1) {
        state.currentIndex++;
        renderQuestion();
      }
    };

    elements.prevBtn.addEventListener('click', goPrev);
    elements.mobilePrevBtn.addEventListener('click', goPrev);
    elements.nextBtn.addEventListener('click', goNext);
    elements.mobileNextBtn.addEventListener('click', goNext);

    elements.toggleAnswerBtn.addEventListener('click', toggleAnswerDirectly);
    elements.resetQuestionBtn.addEventListener('click', resetCurrentQuestion);

    // Submit mock exam
    elements.submitMockBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn nộp bài thi thử không?')) {
        submitMockExam(false);
      }
    });

    // Mock Result Modal actions
    elements.closeMockResultBtn.addEventListener('click', () => {
      elements.mockResultModal.classList.remove('active');
    });
    elements.mockReviewBtn.addEventListener('click', () => {
      elements.mockResultModal.classList.remove('active');
      renderQuestion();
    });
    elements.mockPracticeWrongBtn.addEventListener('click', () => {
      elements.mockResultModal.classList.remove('active');
      setMode('wrong');
    });
    elements.mockRetestBtn.addEventListener('click', () => {
      elements.mockResultModal.classList.remove('active');
      initMockExam(state.mockState.examId);
      renderQuestion();
    });

    // Clear wrong button in wrong mode
    elements.clearWrongInModeBtn.addEventListener('click', () => {
      if (confirm('Xóa tất cả các câu trong danh sách sai này?')) {
        QUIZ_QUESTIONS.forEach(q => {
          if (state.userAnswers[q.id] && !state.userAnswers[q.id].isCorrect) {
            delete state.userAnswers[q.id];
          }
        });
        state.sessionWrongIds = null;
        saveStorage();
        renderQuestion();
        showToast('Đã xóa danh sách câu sai!');
      }
    });

    // Mobile Sheet Toggle
    elements.mobileMatrixToggleBtn.addEventListener('click', openMobileSheet);
    elements.mobileSheetOverlay.addEventListener('click', closeMobileSheet);
    elements.closeSheetBtn.addEventListener('click', closeMobileSheet);

    // Keyboard Shortcuts (Desktop)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (elements.settingsModal.classList.contains('active') || elements.mockResultModal.classList.contains('active')) return;

      const q = state.filteredQuestions[state.currentIndex];
      if (!q) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        const opt = q.options.find(o => o.key === key);
        if (opt) {
          handleOptionSelect(q, key);
        }
      } else if (['1', '2', '3', '4', '5'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        if (idx < q.options.length) {
          handleOptionSelect(q, q.options[idx].key);
        }
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (key === 'F') {
        toggleCurrentFlag();
      } else if (key === 'R') {
        resetCurrentQuestion();
      }
    });

    // Swipe detection on mobile
    let touchStartX = 0;
    let touchStartY = 0;
    elements.quizCard.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    elements.quizCard.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
        if (dx < 0) {
          goNext();
        } else {
          goPrev();
        }
      }
    }, { passive: true });
  }

  // Initialization
  function init() {
    loadStorage();
    initEvents();
    renderQuestion();
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
