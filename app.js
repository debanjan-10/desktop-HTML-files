/* ============================================================
   HABIT TRACKER — APPLICATION LOGIC
   ============================================================ */

(() => {
  "use strict";

  // ── Storage Keys ──
  const STORAGE_KEYS = {
    habits:      "ht_habits",
    days:        "ht_total_days",
    tracker:     "ht_tracker_data",
    bgPrimary:   "ht_bg_primary",
    accent:      "ht_accent",
    lastActivity: "ht_last_activity_timestamp", // New: Key to store last interaction timestamp
    streakResetDay: "ht_streak_reset_day",
  };

  const DEFAULT_BG_PRIMARY = "#0d0f14";
  const DEFAULT_ACCENT    = "#6c63ff";

  // ── Defaults ──
  const DEFAULT_HABITS = [
    "Improve Studies",
    "Give more time in Study",
    "Fix Sleep Cycle and body",
    "Create and develop new things",
    "Repeat all things",
  ];
  const DEFAULT_DAYS = 30;

  // ── State ──
  let habits      = [];
  let totalDays   = DEFAULT_DAYS;
  let tracker     = {}; // { "Day 1": { "Habit": " " | "O" | "X" } }
  let bgPrimary   = DEFAULT_BG_PRIMARY;
  let accentColor = DEFAULT_ACCENT;
  let currentTheme = localStorage.getItem("ht_theme") || "dark";
  let lastActivityTimestamp = 0; // New: Stores the timestamp of the last user interaction
  let streakResetDay = 0;
  document.documentElement.setAttribute("data-theme", currentTheme);

  const DAILY_QUOTES = [
    "Small daily improvements lead to big results.",
    "Consistency beats motivation every time.",
    "One habit at a time, one step closer.",
    "Today’s effort builds tomorrow’s momentum.",
    "Success is the sum of tiny habits repeated.",
    "Do it for the future version of you.",
    "A little progress each day adds up to big change.",
  ];

  // ── DOM References ──
  const $table          = document.getElementById("tracker-table");
  const $progressFill   = document.getElementById("progress-fill");
  const $progressText   = document.getElementById("progress-text");
  const $progressPct    = document.getElementById("progress-pct");
  const $doneCount      = document.getElementById("done-count");
  const $streakCount    = document.getElementById("streak-count");
  const $streakBadge    = document.getElementById("streak-badge");
  const $streakState    = document.getElementById("streak-state");
  const $longestStreak  = document.getElementById("longest-streak");
  const $bestHabit      = document.getElementById("best-habit");
  const $consistencyScore = document.getElementById("consistency-score");
  const $perfectDays    = document.getElementById("perfect-days");
  const $btnResetStreak = document.getElementById("btn-reset-streak");
  const $quoteText      = document.getElementById("quote-text");
  const $inputBgPrimary = document.getElementById("input-bg-primary");
  const $inputAccent    = document.getElementById("input-accent");
  const $btnTheme       = document.getElementById("btn-theme");
  const $themeIcon      = document.getElementById("theme-icon");
  const $btnViewGrid    = document.getElementById("btn-view-grid");
  const $btnViewHeatmap = document.getElementById("btn-view-heatmap");
  const $gridView       = document.getElementById("grid-view");
  const $heatmapView    = document.getElementById("heatmap-view");
  const $heatmapContent = document.getElementById("heatmap-content");
  const $settingsBtn    = document.getElementById("btn-settings");
  const $settingsClose  = document.getElementById("btn-close-settings");
  const $overlay        = document.getElementById("settings-overlay");
  const $habitsEditor   = document.getElementById("habits-editor");
  const $inputDays      = document.getElementById("input-total-days");
  const $btnAddHabit    = document.getElementById("btn-add-habit");
  const $btnSave        = document.getElementById("btn-save-settings");
  const $btnExport      = document.getElementById("btn-export");
  const $fileImport     = document.getElementById("file-import");
  const $btnReset       = document.getElementById("btn-reset");
  const $toast          = document.getElementById("toast");
  const $toastMsg       = document.getElementById("toast-msg");
  const $toastIcon      = document.getElementById("toast-icon");

  // ============================================================
  //  INIT
  // ============================================================
  function init() {
    loadSettings();
    applyThemeColors(bgPrimary, accentColor);
    loadTracker();
    renderTable();
    renderHeatmap();
    updateStats();
    bindEvents();
    loadDailyQuote();
    initTheme();
  }

  function initTheme() {
    if (!$btnTheme) return;
    $themeIcon.textContent = currentTheme === "dark" ? "🌙" : "☀️";
    $btnTheme.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", currentTheme);
      localStorage.setItem("ht_theme", currentTheme);
      $themeIcon.textContent = currentTheme === "dark" ? "🌙" : "☀️";
    });
  }

  function loadDailyQuote() {
    if (!$quoteText) return;
    const index = Math.floor(Math.random() * DAILY_QUOTES.length);
    $quoteText.textContent = DAILY_QUOTES[index];
  }

  function applyThemeColors(bg, accent) {
    document.documentElement.style.setProperty("--bg-primary", bg);
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-hover", accent);
    document.documentElement.style.setProperty("--accent-glow", hexToRgba(accent, 0.28));
  }

  function hexToRgba(hex, alpha) {
    const sanitized = hex.replace('#', '').trim();
    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ============================================================
  //  PERSISTENCE (localStorage)
  // ============================================================
  function loadSettings() {
    const storedHabits = localStorage.getItem(STORAGE_KEYS.habits);
    const storedDays   = localStorage.getItem(STORAGE_KEYS.days);
    const storedBg     = localStorage.getItem(STORAGE_KEYS.bgPrimary);
    const storedAccent = localStorage.getItem(STORAGE_KEYS.accent);
    const storedLastActivity = localStorage.getItem(STORAGE_KEYS.lastActivity); // New: Load last activity timestamp
    const storedStreakReset = localStorage.getItem(STORAGE_KEYS.streakResetDay);

    habits      = storedHabits ? JSON.parse(storedHabits) : [...DEFAULT_HABITS];
    totalDays   = storedDays   ? parseInt(storedDays, 10) : DEFAULT_DAYS;
    bgPrimary   = storedBg     || DEFAULT_BG_PRIMARY;
    accentColor = storedAccent || DEFAULT_ACCENT;
    lastActivityTimestamp = storedLastActivity ? parseInt(storedLastActivity, 10) : 0; // New: Parse timestamp
    streakResetDay = storedStreakReset ? parseInt(storedStreakReset, 10) : 0;
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.habits,     JSON.stringify(habits));
    localStorage.setItem(STORAGE_KEYS.days,       String(totalDays));
    localStorage.setItem(STORAGE_KEYS.bgPrimary,  bgPrimary);
    localStorage.setItem(STORAGE_KEYS.accent,     accentColor);
  }

  function loadTracker() {
    const stored = localStorage.getItem(STORAGE_KEYS.tracker);
    const parsed = stored ? JSON.parse(stored) : {};

    // Ensure every day/habit combo exists
    tracker = {};
    for (let d = 1; d <= totalDays; d++) {
      const key = `Day ${d}`;
      tracker[key] = {};
      for (const h of habits) {
        tracker[key][h] = (parsed[key] && parsed[key][h]) || " ";
      }
    }
  }

  function saveTracker() {
    localStorage.setItem(STORAGE_KEYS.tracker, JSON.stringify(tracker));
  }

  // ============================================================
  //  RENDER TABLE
  // ============================================================
  function renderTable() {
    $table.innerHTML = "";

    // ── THEAD ──
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    const thCorner = document.createElement("th");
    thCorner.textContent = "Habits / Days";
    headRow.appendChild(thCorner);

    for (let d = 1; d <= totalDays; d++) {
      const th = document.createElement("th");
      th.textContent = String(d).padStart(2, "0");
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    $table.appendChild(thead);

    // ── TBODY ──
    const tbody = document.createElement("tbody");

    habits.forEach((habit, hIdx) => {
      const row = document.createElement("tr");

      // Habit name cell
      const tdName = document.createElement("td");
      tdName.textContent = habit;
      row.appendChild(tdName);

      // Day cells
      for (let d = 1; d <= totalDays; d++) {
        const dayKey = `Day ${d}`;
        const state  = tracker[dayKey][habit];
        const td     = document.createElement("td");

        const cell = document.createElement("div");
        cell.className = "day-cell " + stateClass(state);
        cell.textContent = stateSymbol(state);
        cell.dataset.day   = dayKey;
        cell.dataset.habit = habit;
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");
        cell.setAttribute("aria-label", `${habit}, Day ${d}: ${stateLabel(state)}`);
        cell.id = `cell-${hIdx}-${d}`;

        cell.addEventListener("click", () => cycleCell(cell));
        cell.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cycleCell(cell);
          }
        });

        td.appendChild(cell);
        row.appendChild(td);
      }

      tbody.appendChild(row);
    });

    requestAnimationFrame(() => {
      $table.innerHTML = "";
      $table.appendChild(thead);
      $table.appendChild(tbody);
    });
  }

  // ============================================================
  //  CELL STATE LOGIC
  // ============================================================
  function cycleCell(cell) {
    const day   = cell.dataset.day;
    const habit = cell.dataset.habit;
    const cur   = tracker[day][habit];

    let next;
    if (cur === " ") next = "O";
    else if (cur === "O") next = "X";
    else next = " ";

    tracker[day][habit] = next;
    
    // New: Update last activity timestamp on any cell interaction
    lastActivityTimestamp = Date.now();
    localStorage.setItem(STORAGE_KEYS.lastActivity, String(lastActivityTimestamp));

    // Animate
    cell.classList.add("ripple");
    setTimeout(() => cell.classList.remove("ripple"), 400);

    cell.className = "day-cell " + stateClass(next);
    cell.textContent = stateSymbol(next);
    cell.setAttribute("aria-label",
      `${habit}, ${day}: ${stateLabel(next)}`);

    saveTracker();
    updateStats();
    renderHeatmap();
    checkDayComplete(day);
  }

  function stateClass(s) {
    if (s === "O") return "day-cell--done";
    if (s === "X") return "day-cell--missed";
    return "day-cell--blank";
  }
  function stateSymbol(s) {
    if (s === "O") return "✓";
    if (s === "X") return "✗";
    return "";
  }
  function stateLabel(s) {
    if (s === "O") return "Done";
    if (s === "X") return "Missed";
    return "Not tracked";
  }

  // ============================================================
  //  STATS: progress + streak
  // ============================================================
  function updateStats() {
    const totalCells = habits.length * totalDays;
    let doneCells = 0;
    let daysWithAnyDone = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let perfectDaysCount = 0;
    const habitDoneCounts = {};

    habits.forEach((h) => {
      habitDoneCounts[h] = 0;
    });

    // Find the last day the user interacted with to calculate the *current* streak up to that point
    let lastActiveDay = 0;
    for (let d = 1; d <= totalDays; d++) {
      const key = `Day ${d}`;
      for (const h of habits) {
        if (tracker[key][h] !== " ") {
          lastActiveDay = d;
        }
      }
    }

    let runningStreak = 0;
    for (let d = 1; d <= totalDays; d++) {
      const key = `Day ${d}`;
      let dayDone = false;
      let allDone = habits.length > 0;
      let anyMissed = false;

      for (const h of habits) {
        if (tracker[key][h] === "O") {
          doneCells++;
          habitDoneCounts[h]++;
          dayDone = true;
        }
        if (tracker[key][h] !== "O") {
          allDone = false;
        }
        if (tracker[key][h] === "X") {
          anyMissed = true;
        }
      }

      if (dayDone) daysWithAnyDone++;
      if (allDone && habits.length > 0) perfectDaysCount++;

      const previousRunningStreak = runningStreak;

      if (allDone && habits.length > 0) {
        runningStreak++;
        longestStreak = Math.max(longestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }

      if (d === streakResetDay) {
        runningStreak = 0;
      }

      // Snapshot the current streak at the last active day
      if (d === lastActiveDay) {
        if (allDone && habits.length > 0) {
          currentStreak = runningStreak;
        } else if (anyMissed || (!allDone && previousRunningStreak === 0)) {
          currentStreak = 0;
        } else {
          currentStreak = previousRunningStreak;
        }
      }
    }

    // New: Inactivity check for current streak "freeze"
    let forceCurrentStreakToZero = false;
    if (lastActivityTimestamp > 0) {
      const now = Date.now();
      const daysSinceLastActivity = (now - lastActivityTimestamp) / (1000 * 60 * 60 * 24);
      // If inactive for 2 or more real-world days, reset current streak
      if (daysSinceLastActivity >= 2) {
        forceCurrentStreakToZero = true;
      }
    }

    const pct = totalCells ? Math.round((doneCells / totalCells) * 100) : 0;
    $progressFill.style.width = pct + "%";
    $progressText.textContent = `${pct}% complete`;
    if ($progressPct) $progressPct.textContent = `${pct}%`;
    if ($doneCount) $doneCount.textContent = doneCells;
    if ($perfectDays) $perfectDays.textContent = perfectDaysCount;

    if (forceCurrentStreakToZero) {
      currentStreak = 0;
    }

    if ($streakCount) $streakCount.textContent = currentStreak;
    if ($streakState) {
      $streakState.textContent = forceCurrentStreakToZero ? "Frozen after 2 days inactive" : "";
      $streakState.classList.toggle("streak-state--frozen", forceCurrentStreakToZero);
    }
    if ($streakBadge) {
      const flame = $streakBadge.querySelector(".streak-flame");
      if (flame) {
        flame.textContent = forceCurrentStreakToZero ? "❄️" : "🔥";
      }
      $streakBadge.setAttribute("aria-label", forceCurrentStreakToZero ? "Streak frozen" : "Streak active");
      
      // Milestone Pulse Animation
      if (currentStreak > 0 && currentStreak % 7 === 0) {
        $streakBadge.classList.add("streak-milestone");
        setTimeout(() => $streakBadge.classList.remove("streak-milestone"), 3000);
      } else {
        $streakBadge.classList.remove("streak-milestone");
      }
    }
    if ($longestStreak) {
        $longestStreak.textContent = longestStreak;
    }

    if ($bestHabit) {
      if (habits.length > 0) {
        const topHabit = habits.reduce((best, habit) => {
          return habitDoneCounts[habit] > habitDoneCounts[best] ? habit : best;
        }, habits[0]);
        const topCount = habitDoneCounts[topHabit];

        if (topCount > 0) {
          const topPct = totalDays ? Math.round((topCount / totalDays) * 100) : 0;
          $bestHabit.textContent = `${topHabit} (${topPct}%)`;
        } else {
          $bestHabit.textContent = "—";
        }
      } else {
        $bestHabit.textContent = "—";
      }
    }

    if ($consistencyScore) {
      const consistency = totalDays ? Math.round((daysWithAnyDone / totalDays) * 100) : 0;
      $consistencyScore.textContent = `${consistency}%`;
    }
  }

  // ============================================================
  //  HEATMAP RENDER & VIEW SWITCH
  // ============================================================
  function switchView(view) {
    if (view === "grid") {
      $btnViewGrid.classList.add("active");
      $btnViewHeatmap.classList.remove("active");
      $gridView.style.display = "";
      $heatmapView.style.display = "none";
    } else {
      $btnViewHeatmap.classList.add("active");
      $btnViewGrid.classList.remove("active");
      $heatmapView.style.display = "";
      $gridView.style.display = "none";
      renderHeatmap();
    }
  }

  function renderHeatmap() {
    if (!$heatmapContent) return;
    $heatmapContent.innerHTML = "";
    
    const container = document.createElement("div");
    container.className = "heatmap-grid";
    
    for (let d = 1; d <= totalDays; d++) {
      const dayKey = `Day ${d}`;
      let doneCount = 0;
      for (const h of habits) {
        if (tracker[dayKey][h] === "O") doneCount++;
      }
      
      const pct = habits.length > 0 ? doneCount / habits.length : 0;
      let level = 0;
      if (pct > 0) level = 1;
      if (pct >= 0.4) level = 2;
      if (pct >= 0.7) level = 3;
      if (pct === 1) level = 4;
      
      const cell = document.createElement("div");
      cell.className = `heatmap-cell heatmap-cell--level-${level}`;
      cell.title = `Day ${d}: ${doneCount}/${habits.length} habits done`;
      container.appendChild(cell);
    }
    
    requestAnimationFrame(() => {
      $heatmapContent.innerHTML = "";
      $heatmapContent.appendChild(container);
    });
  }

  // ============================================================
  //  CONFETTI
  // ============================================================
  function checkDayComplete(dayKey) {
    if (habits.length === 0) return;
    const allDone = habits.every(h => tracker[dayKey][h] === "O");
    if (allDone) launchConfetti();
  }

  function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ["#6c63ff", "#22c55e", "#f59e0b", "#ef4444", "#a78bfa"];
    
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: Math.random() * 6 + 2,
        dx: Math.random() * 10 - 5,
        dy: Math.random() * -10 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 100
      });
    }
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      particles.forEach(p => {
        if (p.life > 0) {
          active = true;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          p.x += p.dx;
          p.y += p.dy;
          p.dy += 0.2; // gravity
          p.life--;
        }
      });
      if (active) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
  }

  // ============================================================
  //  SETTINGS MODAL
  // ============================================================
  function openSettings() {
    populateHabitsEditor();
    $inputDays.value = totalDays;
    if ($inputBgPrimary) $inputBgPrimary.value = bgPrimary;
    if ($inputAccent) $inputAccent.value = accentColor;
    $overlay.classList.add("open");
  }

  function closeSettings() {
    $overlay.classList.remove("open");
  }

  function populateHabitsEditor() {
    $habitsEditor.innerHTML = "";
    habits.forEach((h, i) => {
      $habitsEditor.appendChild(createHabitRow(h, i));
    });
  }

  function createHabitRow(value, index) {
    const row = document.createElement("div");
    row.className = "habit-row";

    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = `Habit ${index + 1}`;
    input.dataset.index = index;

    const btnRemove = document.createElement("button");
    btnRemove.className = "btn-remove";
    btnRemove.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    btnRemove.title = "Remove habit";
    btnRemove.setAttribute("aria-label", "Remove habit");
    btnRemove.addEventListener("click", () => row.remove());

    row.appendChild(input);
    row.appendChild(btnRemove);
    return row;
  }

  function addHabitRow() {
    const idx = $habitsEditor.children.length;
    $habitsEditor.appendChild(createHabitRow("", idx));
    // Focus the new input
    $habitsEditor.lastElementChild.querySelector("input").focus();
  }

  function applySettings() {
    // Collect habits from editor
    const inputs = $habitsEditor.querySelectorAll("input[type='text']");
    const newHabits = [];
    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) newHabits.push(val);
    });

    if (newHabits.length === 0) {
      showToast("⚠️", "Add at least one habit!");
      return;
    }

    const newDays = Math.min(90, Math.max(7, parseInt($inputDays.value, 10) || 30));

    habits    = newHabits;
    totalDays = newDays;

    saveSettings();
    loadTracker();   // Rebuild tracker data for new habits/days
    saveTracker();
    renderTable();
    updateStats();
    closeSettings();
    showToast("✅", "Settings saved!");
  }

  // ============================================================
  //  IMPORT / EXPORT / RESET
  // ============================================================
  function exportData() {
    const payload = {
      habits,
      totalDays,
      tracker,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `habit_tracker_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📦", "Data exported!");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.habits && data.tracker) {
          habits    = data.habits;
          totalDays = data.totalDays || DEFAULT_DAYS;
          tracker   = data.tracker;
          saveSettings();
          saveTracker();
          renderTable();
          updateStats();
          closeSettings();
          showToast("✅", "Data imported successfully!");
        } else {
          showToast("❌", "Invalid file format.");
        }
      } catch {
        showToast("❌", "Failed to parse file.");
      }
    };
    reader.readAsText(file);
  }

  function resetStreak() {
    if (!confirm("This will reset your current streak to 0. Are you sure?")) return;
    let lastActiveDay = 0;
    for (let d = 1; d <= totalDays; d++) {
      const key = `Day ${d}`;
      for (const h of habits) {
        if (tracker[key][h] !== " ") {
          lastActiveDay = d;
        }
      }
    }
    streakResetDay = lastActiveDay;
    localStorage.setItem(STORAGE_KEYS.streakResetDay, String(streakResetDay));
    updateStats();
    closeSettings();
    showToast("🔄", "Streak reset!");
  }

  function resetAll() {
    if (!confirm("This will erase ALL your data. Are you sure?")) return;

    localStorage.removeItem(STORAGE_KEYS.habits);
    localStorage.removeItem(STORAGE_KEYS.days);
    localStorage.removeItem(STORAGE_KEYS.tracker);
    localStorage.removeItem(STORAGE_KEYS.bgPrimary);
    localStorage.removeItem(STORAGE_KEYS.accent);
    localStorage.removeItem(STORAGE_KEYS.lastActivity); // New: Remove last activity timestamp
    localStorage.removeItem(STORAGE_KEYS.streakResetDay);

    habits      = [...DEFAULT_HABITS];
    totalDays   = DEFAULT_DAYS;
    bgPrimary   = DEFAULT_BG_PRIMARY;
    accentColor = DEFAULT_ACCENT;
    streakResetDay = 0;
    applyThemeColors(bgPrimary, accentColor);

    loadTracker();
    renderTable();
    updateStats();
    closeSettings();
    showToast("🗑️", "All data has been reset.");
  }

  // ============================================================
  //  TOAST
  // ============================================================
  let toastTimer;
  function showToast(icon, message) {
    clearTimeout(toastTimer);
    $toastIcon.textContent = icon;
    $toastMsg.textContent  = message;
    $toast.classList.add("show");
    toastTimer = setTimeout(() => $toast.classList.remove("show"), 2800);
  }

  // ============================================================
  //  EVENT BINDINGS
  // ============================================================
  function bindEvents() {
    $settingsBtn.addEventListener("click",   openSettings);
    $settingsClose.addEventListener("click", closeSettings);
    $overlay.addEventListener("click", (e) => {
      if (e.target === $overlay) closeSettings();
    });

    $btnAddHabit.addEventListener("click", addHabitRow);
    $btnSave.addEventListener("click",     applySettings);
    $btnExport.addEventListener("click",   exportData);
    $btnReset.addEventListener("click",    resetAll);
    if ($btnResetStreak) $btnResetStreak.addEventListener("click", resetStreak);

    if ($inputBgPrimary) {
      $inputBgPrimary.addEventListener("input", (e) => {
        bgPrimary = e.target.value;
        applyThemeColors(bgPrimary, accentColor);
      });
    }
    if ($inputAccent) {
      $inputAccent.addEventListener("input", (e) => {
        accentColor = e.target.value;
        applyThemeColors(bgPrimary, accentColor);
      });
    }

    if ($btnViewGrid && $btnViewHeatmap) {
      $btnViewGrid.addEventListener("click", () => switchView("grid"));
      $btnViewHeatmap.addEventListener("click", () => switchView("heatmap"));
    }

    $fileImport.addEventListener("change", (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = ""; // allow re-import
    });

    // Keyboard: Escape closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $overlay.classList.contains("open")) {
        closeSettings();
      }
    });
  }

  // ── GO ──
  init();
})();
