/**
 * ================================================================
 * JOTHAM KAGAH PORTFOLIO — script.js
 * Vanilla JavaScript — No Frameworks
 * WCAG 2.1 Accessible | Performance-First
 * ================================================================
 */

'use strict';

/* ================================================================
   UTILITY FUNCTIONS
================================================================ */

/**
 * Wait for DOM to be fully ready before running any logic.
 * @param {Function} fn - Callback to run after DOM load
 */
const onDOMReady = (fn) => {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
};

/**
 * Throttle a function to limit how often it fires.
 * @param {Function} fn
 * @param {number} delay - Milliseconds
 */
const throttle = (fn, delay) => {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastRun >= delay) {
      lastRun = now;
      fn.apply(this, args);
    }
  };
};

/**
 * Safely query a single DOM element. Returns null if not found.
 * @param {string} selector
 * @param {Element} [parent=document]
 */
const qs = (selector, parent = document) => parent.querySelector(selector);

/**
 * Safely query all matching DOM elements.
 * @param {string} selector
 * @param {Element} [parent=document]
 */
const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ================================================================
   01. THEME TOGGLE (Dark / Light Mode)
================================================================ */

const initThemeToggle = () => {
  const toggle = qs('#themeToggle');
  const htmlEl = document.documentElement;

  if (!toggle) return;

  // Load saved preference or default to dark
  const saved = localStorage.getItem('jk-theme') || 'dark';
  applyTheme(saved);

  toggle.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('jk-theme', next);
  });

  /**
   * Apply theme and update ARIA state.
   * @param {string} theme - 'dark' or 'light'
   */
  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    const isLight = theme === 'light';
    toggle.setAttribute('aria-pressed', String(isLight));
    toggle.setAttribute('aria-label', isLight ? 'Toggle dark mode' : 'Toggle light mode');
  }
};

/* ================================================================
   02. NAVIGATION — Scroll Detection & Mobile Menu
================================================================ */

const initNavigation = () => {
  const header       = qs('.site-header');
  const mobileBtn    = qs('#mobileMenuBtn');
  const mobileMenu   = qs('#mobileMenu');
  const mobileLinks  = qsa('.mobile-nav-link');
  const navLinks     = qsa('.nav-link');

  if (!header) return;

  // --- Scroll shadow on nav ---
  const handleNavScroll = throttle(() => {
    const scrolled = window.scrollY > 20;
    header.classList.toggle('scrolled', scrolled);
  }, 50);

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // run once on load

  // --- Active nav link tracking ---
  const sections = qsa('section[id]');

  const updateActiveLink = throttle(() => {
    const scrollPos = window.scrollY + 100;

    sections.forEach((section) => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          const matches = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', matches);
        });
      }
    });
  }, 100);

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // --- Mobile menu toggle ---
  if (!mobileBtn || !mobileMenu) return;

  const openMobileMenu = () => {
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileBtn.setAttribute('aria-expanded', 'true');
    mobileBtn.setAttribute('aria-label', 'Close navigation menu');
    // Trap focus to menu items
    mobileLinks[0]?.focus();
  };

  const closeMobileMenu = () => {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileBtn.setAttribute('aria-expanded', 'false');
    mobileBtn.setAttribute('aria-label', 'Open navigation menu');
    mobileBtn.focus();
  };

  mobileBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  // Close menu on link click
  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const isInsideMenu = mobileMenu.contains(e.target);
    const isInsideBtn  = mobileBtn.contains(e.target);
    if (!isInsideMenu && !isInsideBtn && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
    }
  });
};

/* ================================================================
   03. HERO CANVAS ANIMATION
================================================================ */

const initHeroCanvas = () => {
  const canvas = qs('#heroCanvas');
  if (!canvas) return;

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let width, height, particles;
  let animationId;

  /** Set canvas dimensions to match viewport */
  const resize = () => {
    width  = canvas.width  = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    initParticles();
  };

  /** Particle factory */
  const createParticle = () => ({
    x:       Math.random() * width,
    y:       Math.random() * height,
    vx:      (Math.random() - 0.5) * 0.4,
    vy:      (Math.random() - 0.5) * 0.4,
    size:    Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.4 + 0.1,
    color:   Math.random() > 0.6 ? '#60a5fa' : Math.random() > 0.5 ? '#14b8a6' : '#a78bfa',
  });

  /** Initialize particle array */
  const initParticles = () => {
    const count = Math.min(Math.floor((width * height) / 12000), 80);
    particles = Array.from({ length: count }, createParticle);
  };

  /** Draw connection lines between close particles */
  const drawConnections = () => {
    const maxDist = 120;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx   = p1.x - p2.x;
        const dy   = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  };

  /** Main animation loop */
  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    drawConnections();

    particles.forEach((p) => {
      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0)      p.x = width;
      if (p.x > width)  p.x = 0;
      if (p.y < 0)      p.y = height;
      if (p.y > height) p.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    animationId = requestAnimationFrame(animate);
  };

  // Initialize
  resize();
  animate();

  // Handle resize with debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  // Pause animation when tab not visible (performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });
};

/* ================================================================
   04. SCROLL REVEAL ANIMATIONS
================================================================ */

const initScrollReveal = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Add reveal class to elements we want to animate
  const elementsToReveal = qsa(`
    .expertise-card,
    .project-card,
    .impact-card,
    .testimonial-card,
    .timeline-item,
    .about-content,
    .about-image-wrapper,
    .contact-form-wrapper,
    .contact-info
  `);

  elementsToReveal.forEach((el, i) => {
    el.classList.add('reveal');
    // Stagger children of grid containers
    const parent = el.parentElement;
    if (parent) {
      const siblings = qsa('.reveal', parent);
      const index = siblings.indexOf(el);
      if (index > 0 && index < 4) {
        el.style.transitionDelay = `${index * 0.08}s`;
      }
    }
  });

  if (prefersReducedMotion) {
    // Show all immediately if user prefers reduced motion
    elementsToReveal.forEach((el) => el.classList.add('visible'));
    return;
  }

  // IntersectionObserver for efficient scroll detection
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elementsToReveal.forEach((el) => observer.observe(el));
};

/* ================================================================
   05. COUNT-UP ANIMATION (Impact Section)
================================================================ */

const initCountUp = () => {
  const counters = qsa('.impact-number[data-target]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Animate a number from 0 to target.
   * @param {Element} el - The element containing the number
   */
  const animateCount = (el) => {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const suffix   = el.getAttribute('data-suffix') || '';
    const duration = 1800; // ms
    const start    = performance.now();

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix;
      }
    };

    requestAnimationFrame(tick);
  };

  // Use IntersectionObserver to trigger only when visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
};

/* ================================================================
   06. PROJECT FILTER
================================================================ */

const initProjectFilter = () => {
  const filterBtns = qsa('.filter-btn');
  const projectCards = qsa('.project-card');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update button states
      filterBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('filter-btn--active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });

      // Filter cards with animation
      projectCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const show     = filter === 'all' || category === filter;

        if (show) {
          card.style.display = '';
          // Trigger reflow for animation
          void card.offsetWidth;
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px)';
          setTimeout(() => {
            if (card.style.opacity === '0') {
              card.style.display = 'none';
            }
          }, 250);
        }
      });

      // Announce to screen readers
      const count = filter === 'all'
        ? projectCards.length
        : projectCards.filter((c) => c.getAttribute('data-category') === filter).length;

      announceToScreenReader(`Showing ${count} ${filter === 'all' ? '' : filter} project${count !== 1 ? 's' : ''}`);
    });
  });
};

/* ================================================================
   07. CONTACT FORM VALIDATION
================================================================ */

const initContactForm = () => {
  const form       = qs('#contactForm');
  const submitBtn  = qs('#submitBtn');
  const successMsg = qs('#formSuccess');

  if (!form) return;

  /**
   * Validate a single field.
   * @param {HTMLInputElement|HTMLTextAreaElement} field
   * @returns {boolean}
   */
  const validateField = (field) => {
    const value    = field.value.trim();
    const name     = field.getAttribute('name');
    const errorEl  = qs(`#${field.getAttribute('aria-describedby')}`);
    let error = '';

    if (field.required && !value) {
      error = `${getFieldLabel(name)} is required.`;
    } else if (name === 'email' && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        error = 'Please enter a valid email address.';
      }
    } else if (name === 'name' && value && value.length < 2) {
      error = 'Name must be at least 2 characters.';
    } else if (name === 'message' && value && value.length < 10) {
      error = 'Message must be at least 10 characters.';
    }

    if (errorEl) {
      errorEl.textContent = error;
    }

    field.classList.toggle('invalid', !!error);
    field.setAttribute('aria-invalid', String(!!error));

    return !error;
  };

  /**
   * Get human-readable label from field name.
   * @param {string} name
   */
  const getFieldLabel = (name) => {
    const labels = { name: 'Full Name', email: 'Email Address', message: 'Message' };
    return labels[name] || name;
  };

  // Live validation on blur (not on every keystroke — less jarring)
  const validatedFields = qsa('[required]', form);
  validatedFields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      // Clear error once user starts correcting
      if (field.classList.contains('invalid')) {
        validateField(field);
      }
    });
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all required fields
    const fields   = qsa('[required]', form);
    const allValid = fields.map((f) => validateField(f)).every(Boolean);

    if (!allValid) {
      // Focus first invalid field
      const firstInvalid = qs('.invalid', form);
      firstInvalid?.focus();
      return;
    }

    // Simulate submission (replace with actual backend call)
    submitBtn.disabled = true;
    const btnText = qs('.btn-text', submitBtn);
    if (btnText) btnText.textContent = 'Sending…';

    // Simulate network delay
    setTimeout(() => {
      form.reset();
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Send Message';

      if (successMsg) {
        successMsg.removeAttribute('hidden');
        successMsg.focus();

        // Hide success message after 6s
        setTimeout(() => {
          successMsg.setAttribute('hidden', '');
        }, 6000);
      }
    }, 1500);
  });
};

/* ================================================================
   08. SMOOTH SCROLL FOR ANCHOR LINKS
================================================================ */

const initSmoothScroll = () => {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navHeight = qs('.site-header')?.offsetHeight || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({
      top:      targetTop,
      behavior: 'smooth',
    });

    // Update focus to target section for keyboard/screen reader users
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });

    // Clean up tabindex after focus
    target.addEventListener('blur', () => {
      target.removeAttribute('tabindex');
    }, { once: true });
  });
};

/* ================================================================
   09. BACK TO TOP BUTTON
================================================================ */

const initBackToTop = () => {
  const btn = qs('#backToTop');
  if (!btn) return;

  const handleScroll = throttle(() => {
    const show = window.scrollY > 400;
    if (show) {
      btn.removeAttribute('hidden');
    } else {
      btn.setAttribute('hidden', '');
    }
  }, 100);

  window.addEventListener('scroll', handleScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Return focus to top of page for accessibility
    qs('body').setAttribute('tabindex', '-1');
    qs('body').focus();
    qs('body').removeAttribute('tabindex');
  });
};

/* ================================================================
   10. FOOTER — CURRENT YEAR
================================================================ */

const initFooterYear = () => {
  const yearEl = qs('#currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
};

/* ================================================================
   11. SCREEN READER ANNOUNCER
================================================================ */

/**
 * Announce a message to screen readers via a live region.
 * @param {string} message
 */
const announceToScreenReader = (message) => {
  let announcer = qs('#sr-announcer');

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
  }

  // Clear then set to trigger announcement
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
};

/* ================================================================
   12. TIMELINE — Interactive Hover States
================================================================ */

const initTimeline = () => {
  const timelineItems = qsa('.timeline-item');

  timelineItems.forEach((item) => {
    const dot = qs('.timeline-dot', item);

    item.addEventListener('mouseenter', () => {
      if (dot) {
        dot.style.transform = 'scale(1.4)';
        dot.style.background = 'var(--color-accent-blue)';
      }
    });

    item.addEventListener('mouseleave', () => {
      if (dot && !dot.classList.contains('timeline-dot--current')) {
        dot.style.transform = '';
        dot.style.background = '';
      }
    });
  });
};

/* ================================================================
   13. KEYBOARD NAVIGATION ENHANCEMENTS
================================================================ */

const initKeyboardNav = () => {
  // Add visible focus ring indicator for keyboard users
  let isKeyboardUser = false;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isKeyboardUser = true;
      document.body.classList.add('keyboard-user');
    }
  });

  document.addEventListener('mousedown', () => {
    isKeyboardUser = false;
    document.body.classList.remove('keyboard-user');
  });

  // Enable filter buttons keyboard navigation with arrow keys
  const filterBtns = qsa('.filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach((btn, index) => {
    btn.addEventListener('keydown', (e) => {
      let targetIndex = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        targetIndex = (index + 1) % filterBtns.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        targetIndex = (index - 1 + filterBtns.length) % filterBtns.length;
      } else if (e.key === 'Home') {
        targetIndex = 0;
      } else if (e.key === 'End') {
        targetIndex = filterBtns.length - 1;
      }

      if (targetIndex !== null) {
        e.preventDefault();
        filterBtns[targetIndex].focus();
        filterBtns[targetIndex].click();
      }
    });
  });
};

/* ================================================================
   14. IMAGE LAZY LOADING FALLBACK
================================================================ */

const initImageFallbacks = () => {
  const images = qsa('img[loading="lazy"]');

  images.forEach((img) => {
    img.addEventListener('error', () => {
      // Create a styled placeholder if image fails to load
      const wrapper = img.parentElement;
      const altText = img.getAttribute('alt') || 'Image';

      img.style.display = 'none';

      const placeholder = document.createElement('div');
      placeholder.setAttribute('role', 'img');
      placeholder.setAttribute('aria-label', altText);
      placeholder.style.cssText = `
        width: 100%;
        height: 100%;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: rgba(59, 130, 246, 0.06);
        border: 2px dashed rgba(59, 130, 246, 0.2);
        color: var(--color-text-muted);
        font-size: 0.75rem;
        text-align: center;
        padding: 1rem;
        border-radius: 8px;
      `;

      placeholder.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>${altText}</span>
      `;

      if (wrapper) {
        wrapper.appendChild(placeholder);
      }
    });
  });
};

/* ================================================================
   15. HERO PARALLAX EFFECT (subtle, performance-safe)
================================================================ */

const initHeroParallax = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const orbs   = qsa('.orb');
  const shapes = qsa('.shape');

  const handleScroll = throttle(() => {
    const scrollY = window.scrollY;
    const factor  = scrollY * 0.001;

    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 0.3;
      orb.style.transform = `translateY(${scrollY * speed * 0.05}px)`;
    });

    shapes.forEach((shape, i) => {
      const speed = (i % 3 + 1) * 0.2;
      shape.style.transform = `translateY(${scrollY * speed * 0.08}px) rotate(${scrollY * 0.02}deg)`;
    });
  }, 30);

  window.addEventListener('scroll', handleScroll, { passive: true });
};

/* ================================================================
   16. EXPERTISE CARDS — Tilt Effect on Mouse Move
================================================================ */

const initCardTilt = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Only on non-touch devices
  if ('ontouchstart' in window) return;

  const cards = qsa('.expertise-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect    = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX  = e.clientX - centerX;
      const mouseY  = e.clientY - centerY;

      const rotateX = -(mouseY / (rect.height / 2)) * 4;
      const rotateY =  (mouseX / (rect.width  / 2)) * 4;

      card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
};

/* ================================================================
   MAIN INITIALIZATION — Run all modules
================================================================ */

onDOMReady(() => {
  // Core UI
  initThemeToggle();
  initNavigation();
  initFooterYear();
  initSmoothScroll();
  initBackToTop();

  // Visual / Animations
  initHeroCanvas();
  initScrollReveal();
  initHeroParallax();
  initCardTilt();
  initTimeline();

  // Interactive Features
  initCountUp();
  initProjectFilter();
  initContactForm();
  initImageFallbacks();

  // Accessibility
  initKeyboardNav();

  // Log readiness (development only — remove in production)
  if (typeof console !== 'undefined') {
    console.log(
      '%c Jotham Kagah Portfolio — Loaded ✓',
      'color: #60a5fa; font-weight: bold; font-size: 13px;'
    );
  }
});
