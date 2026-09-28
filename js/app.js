/* ==========================================================================
   Phani Kumari Boda Portfolio — Main Application JS
   Theme Switcher, Project Filtering, Interactive Modals, & Copy-to-Clipboard
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initNavActiveUnderline();
  initProjectFilters();
  initArchTabs();
  initModals();
  initContactForm();
  initCopyToClipboard();
});

/* Theme Toggle (Light / Dark) */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('theme') || 'light';

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

/* Mobile Navigation Menu Toggle */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      } else {
        drawer.classList.add('open');
        menuBtn.classList.add('active');
        menuBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Close menu when clicking on any link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close when tapping outside
    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && !menuBtn.contains(e.target)) {
        drawer.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/* Navbar Active Underline & Scroll-Spy */
function initNavActiveUnderline() {
  const allNavLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
  const sections = document.querySelectorAll('section[id]');
  let isManualClick = false;
  let manualScrollTimeout = null;

  function setActiveLink(targetId) {
    if (!targetId) return;
    const cleanId = targetId.replace(/^#/, '');
    allNavLinks.forEach(link => {
      const linkHref = link.getAttribute('href');
      if (linkHref === `#${cleanId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Click handler to immediately update the active underline
  allNavLinks.forEach(link => {
    link.addEventListener('click', function() {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        setActiveLink(href);
        // Lock scroll spy briefly while smooth scrolling to target
        isManualClick = true;
        clearTimeout(manualScrollTimeout);
        manualScrollTimeout = setTimeout(() => {
          isManualClick = false;
        }, 850);
      }
    });
  });

  // Scroll spy to update the active underline as user scrolls through sections
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (isManualClick) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, {
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
  }

  // Detect bottom of page so Contact link activates even on short displays
  window.addEventListener('scroll', () => {
    if (isManualClick) return;
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60)) {
      setActiveLink('contact');
    }
  }, { passive: true });
}

/* Project Category Filter */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-compact-card, .project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter') || 'all';

      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category') || '';
        const categories = cardCategory.trim().split(/\s+/);
        if (filter === 'all' || categories.includes(filter)) {
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
  const mobileResumeBtn = document.getElementById('mobileOpenResumeBtn');
  const resumeModal = document.getElementById('resumeModal');
  const modalCloses = document.querySelectorAll('.modal-close');

  if (resumeModal) {
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        resumeModal.classList.add('active');
      });
    }
    if (mobileResumeBtn) {
      mobileResumeBtn.addEventListener('click', () => {
        resumeModal.classList.add('active');
        const drawer = document.getElementById('mobileNavDrawer');
        const menuBtn = document.getElementById('mobileMenuBtn');
        if (drawer) drawer.classList.remove('open');
        if (menuBtn) menuBtn.classList.remove('active');
      });
    }
  }

  // Project Deep-Dive & Simulator Triggers
  const projectModalBtns = document.querySelectorAll('.open-project-modal');
  projectModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-target');
      const tabTarget = btn.getAttribute('data-tab'); // e.g. "sim" or "code"
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        targetModal.classList.add('active');
        if (tabTarget) {
          const tabBtn = targetModal.querySelector(`.modal-tab-btn[data-tab="${tabTarget}"]`);
          if (tabBtn) tabBtn.click();
        }
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 50);
      }
    });
  });

  // Modal Tab Switching
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.modal-content');
      if (!parent) return;
      const tabName = btn.getAttribute('data-tab');
      
      parent.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetPane = parent.querySelector(`.modal-tab-pane[data-pane="${tabName}"]`);
      if (targetPane) targetPane.classList.add('active');
      
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
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


