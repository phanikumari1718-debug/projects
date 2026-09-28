/* ==========================================================================
   Phani Kumari Boda Portfolio — Main Application JS
   Theme Switcher, Project Filtering, Interactive Modals, & Copy-to-Clipboard
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initProjectFilters();
  initArchTabs();
  initModals();
  initContactForm();
  initCopyToClipboard();
});

/* Theme Toggle (Dark / Light) */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('theme') || 'dark';

  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      showToast(`Switched to ${newTheme.toUpperCase()} theme`);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* Project Category Filter */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category || cardCategory.includes(category)) {
          card.style.display = 'flex';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* Architecture Layer Tabs & Code View Switching */
function initArchTabs() {
  const layerCards = document.querySelectorAll('.arch-layer-card');
  const codeTitle = document.getElementById('codeViewerTitle');
  const codeBody = document.getElementById('codeViewerBody');

  const codeSnippets = {
    app: {
      title: 'wash_cycle_fsm.c — State Dispatcher Loop',
      code: `<span class="code-cmt">/* Application Layer: Finite State Machine Dispatcher */</span>
<span class="code-kw">while</span> (<span class="code-num">1</span>) {
    <span class="code-fn">keypad_scan</span>();
    <span class="code-fn">scheduler_tick</span>();

    <span class="code-kw">switch</span> (current_state) {
        <span class="code-kw">case</span> <span class="code-var">STATE_IDLE</span>:
            <span class="code-fn">lcd_print</span>(<span class="code-str">"READY -- PRESS START"</span>);
            <span class="code-kw">if</span> (<span class="code-fn">key_pressed</span>(<span class="code-var">KEY_START</span>)) {
                <span class="code-fn">timer_load</span>(<span class="code-num">480</span>); <span class="code-cmt">/* 8 min wash */</span>
                <span class="code-fn">pwm_set_duty</span>(<span class="code-num">40</span>); <span class="code-cmt">/* 40% PWM duty */</span>
                current_state = <span class="code-var">STATE_WASH</span>;
            }
            <span class="code-kw">break</span>;

        <span class="code-kw">case</span> <span class="code-var">STATE_WASH</span>:
            <span class="code-fn">lcd_print_format</span>(<span class="code-str">"WASH %02d:%02d"</span>, rem_m, rem_s);
            <span class="code-kw">if</span> (<span class="code-fn">key_pressed</span>(<span class="code-var">KEY_STOP</span>)) { <span class="code-fn">enter_paused</span>(); <span class="code-kw">break</span>; }
            <span class="code-kw">if</span> (<span class="code-fn">timer_expired</span>())      { <span class="code-fn">transition_to</span>(<span class="code-var">STATE_RINSE</span>); }
            <span class="code-kw">break</span>;
    }
}`
    },
    service: {
      title: 'keypad_handler.c — Software Debouncing Service',
      code: `<span class="code-cmt">/* Service Layer: 20ms Software Debouncing & Key Matrix Decoder */</span>
<span class="code-kw">uint8_t</span> <span class="code-fn">keypad_scan_debounced</span>(<span class="code-kw">void</span>) {
    <span class="code-kw">static uint8_t</span> raw_prev = <span class="code-var">KEY_NONE</span>;
    <span class="code-kw">static uint32_t</span> last_debounce_ms = <span class="code-num">0</span>;
    <span class="code-kw">uint8_t</span> raw_current = <span class="code-fn">hardware_scan_matrix</span>();

    <span class="code-kw">if</span> (raw_current != raw_prev) {
        last_debounce_ms = <span class="code-fn">get_system_millis</span>();
        raw_prev = raw_current;
    }

    <span class="code-kw">if</span> ((<span class="code-fn">get_system_millis</span>() - last_debounce_ms) > <span class="code-num">20</span>) {
        <span class="code-kw">return</span> raw_current; <span class="code-cmt">/* Valid debounced key press */</span>
    }
    <span class="code-kw">return</span> <span class="code-var">KEY_NONE</span>;
}`
    },
    driver: {
      title: 'timer_isr.c — ARM Cortex-M Hardware Timer ISR',
      code: `<span class="code-cmt">/* Driver Layer: Non-blocking 10ms Timer ISR */</span>
<span class="code-kw">volatile uint32_t</span> system_10ms_ticks = <span class="code-num">0</span>;
<span class="code-kw">volatile uint32_t</span> remaining_s       = <span class="code-num">0</span>;

<span class="code-kw">void</span> <span class="code-fn">TIM2_IRQHandler</span>(<span class="code-kw">void</span>) {
    <span class="code-kw">if</span> (TIM2->SR & <span class="code-var">TIM_SR_UIF</span>) {
        TIM2->SR &= ~<span class="code-var">TIM_SR_UIF</span>; <span class="code-cmt">/* Clear hardware interrupt flag */</span>
        system_10ms_ticks++;
        
        <span class="code-kw">static uint8_t</span> sub_counter = <span class="code-num">0</span>;
        <span class="code-kw">if</span> (++sub_counter >= <span class="code-num">100</span>) { <span class="code-cmt">/* 100 x 10ms = 1s */</span>
            sub_counter = <span class="code-num">0</span>;
            <span class="code-kw">if</span> (remaining_s > <span class="code-num">0</span>) remaining_s--;
        }
    }
}`
    }
  };

  layerCards.forEach(card => {
    card.addEventListener('click', () => {
      layerCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const layer = card.getAttribute('data-layer');
      if (codeSnippets[layer] && codeTitle && codeBody) {
        codeTitle.textContent = codeSnippets[layer].title;
        codeBody.innerHTML = codeSnippets[layer].code;
      }
    });
  });
}

/* Modals Management (Resume + 5 Project Deep-Dives) */
function initModals() {
  const resumeBtn = document.getElementById('openResumeBtn');
  const resumeModal = document.getElementById('resumeModal');
  const modalCloses = document.querySelectorAll('.modal-close');

  if (resumeBtn && resumeModal) {
    resumeBtn.addEventListener('click', () => {
      resumeModal.classList.add('active');
    });
  }

  // Project Deep-Dive Triggers
  const projectModalBtns = document.querySelectorAll('.open-project-modal');
  projectModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-target');
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        targetModal.classList.add('active');
      }
    });
  });

  // Close Buttons
  modalCloses.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    });
  });

  // Backdrop Click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  });
}

/* Contact Form Handling */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thank you! Your message has been sent to Phani Kumari Boda.');
      form.reset();
    });
  }
}

/* Click to Copy helper */
function initCopyToClipboard() {
  const copyables = document.querySelectorAll('.copyable');
  copyables.forEach(el => {
    el.addEventListener('click', () => {
      const text = el.getAttribute('data-copy') || el.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied to clipboard: ${text}`);
      });
    });
  });
}

/* Toast Message Helper */
function showToast(msg) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
