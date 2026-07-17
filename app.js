/* ============================================
   LA INDONESIAN – app.js
   Integrations: Google Sheets, GA4, Meta Pixel,
   Google Ads, Smooth Scroll, Sticky CTA Mobile
   ============================================ */
'use strict';

/* ─────────────────────────────────────────────
   CONFIG — ganti nilai di bawah sesuai akun Anda
   ───────────────────────────────────────────── */
const CONFIG = {
  // Google Sheets Web App URL (dari Apps Script > Deploy)
  SHEETS_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  // GA4 Measurement ID
  GA4_ID: 'G-XXXXXXXXXX',

  // Meta Pixel ID
  PIXEL_ID: 'YOUR_PIXEL_ID',

  // Google Ads Conversion ID & Label
  GADS_ID:    'AW-XXXXXXXXX',
  GADS_LABEL: 'XXXXXXXXXXXXXXXXXXXX',
};

/* ─────────────────────────────────────────────
   HELPERS: TRACKING
   ───────────────────────────────────────────── */

/** Kirim event ke GA4 */
function trackGA4(eventName, params) {
  if (typeof gtag !== 'function') return;
  gtag('event', eventName, params || {});
}

/** Kirim event ke Meta Pixel */
function trackPixel(eventName, params) {
  if (typeof fbq !== 'function') return;
  fbq('track', eventName, params || {});
}

/** Kirim Google Ads conversion */
function trackGAdsConversion(value) {
  if (typeof gtag !== 'function') return;
  gtag('event', 'conversion', {
    send_to: CONFIG.GADS_ID + '/' + CONFIG.GADS_LABEL,
    value: value || 0,
    currency: 'IDR',
  });
}

/* ─────────────────────────────────────────────
   ANNOUNCEMENT BAR
   ───────────────────────────────────────────── */
const announceBar = document.getElementById('announceBar');
const navbar      = document.querySelector('.navbar');

function syncNavbarTop() {
  if (!navbar) return;
  const barH = (announceBar && announceBar.style.display !== 'none')
    ? announceBar.offsetHeight : 0;
  navbar.style.top = barH + 'px';
}

const announceClose = document.querySelector('.announce-bar__close');
if (announceClose) {
  announceClose.addEventListener('click', () => {
    if (announceBar) announceBar.style.display = 'none';
    syncNavbarTop();
  });
}

window.addEventListener('resize', syncNavbarTop, { passive: true });
syncNavbarTop();

/* ─────────────────────────────────────────────
   NAVBAR — scroll shadow & hamburger
   ───────────────────────────────────────────── */
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(63,27,8,.12)' : '';
  }, { passive: true });
}

const hamburger  = document.querySelector('.navbar__hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });
}

/* ─────────────────────────────────────────────
   SMOOTH SCROLL
   ───────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href').slice(1);
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (target) {
      e.preventDefault();
      const navbarH = navbar ? navbar.offsetHeight : 76;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarH - 12;
      window.scrollTo({ top, behavior: 'smooth' });

      // Track navigation click
      trackGA4('nav_click', { link_id: targetId });
    }
  });
});

/* ─────────────────────────────────────────────
   ACTIVE NAV HIGHLIGHT ON SCROLL
   ───────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.navbar__links a[href^="#"]');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 120) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.style.color = link.getAttribute('href') === '#' + current
      ? 'var(--brown)' : '';
  });
}, { passive: true });

/* ─────────────────────────────────────────────
   STICKY CTA MOBILE
   Muncul setelah scroll melewati hero form
   ───────────────────────────────────────────── */
const stickyCta   = document.getElementById('stickyCta');
const heroForm    = document.getElementById('waitlist');

if (stickyCta && heroForm) {
  const showStickyCta = () => {
    const formBottom = heroForm.getBoundingClientRect().bottom;
    const shouldShow = formBottom < 0; // form sudah terscroll keluar viewport atas
    stickyCta.classList.toggle('sticky-cta--visible', shouldShow);
    stickyCta.setAttribute('aria-hidden', String(!shouldShow));
  };

  window.addEventListener('scroll', showStickyCta, { passive: true });
  showStickyCta(); // initial check

  // Track sticky CTA click
  stickyCta.querySelector('a')?.addEventListener('click', () => {
    trackGA4('sticky_cta_click', { location: 'bottom_bar' });
    trackPixel('Lead', { content_name: 'sticky_cta' });
  });
}

/* ─────────────────────────────────────────────
   FORM VALIDATION
   ───────────────────────────────────────────── */
function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add('error');
  const wrap = inputEl.closest('.input-prefix-wrap');
  if (wrap) wrap.classList.add('error');
  errorEl.textContent = message;
}

function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove('error');
  const wrap = inputEl.closest('.input-prefix-wrap');
  if (wrap) wrap.classList.remove('error');
  errorEl.textContent = '';
}

function validateForm() {
  const nameInput = document.getElementById('fullName');
  const igInput   = document.getElementById('igUsername');
  const nameError = document.getElementById('nameError');
  const igError   = document.getElementById('igError');
  let valid = true;

  if (!nameInput.value.trim() || nameInput.value.trim().length < 3) {
    showFieldError(nameInput, nameError, 'Masukkan nama lengkap minimal 3 karakter.');
    valid = false;
  } else {
    clearFieldError(nameInput, nameError);
  }

  const igVal = igInput.value.trim().replace(/^@/, '');
  if (!igVal) {
    showFieldError(igInput, igError, 'Masukkan username Instagram kamu.');
    valid = false;
  } else if (!/^[a-zA-Z0-9._]{1,30}$/.test(igVal)) {
    showFieldError(igInput, igError, 'Username Instagram tidak valid.');
    valid = false;
  } else {
    clearFieldError(igInput, igError);
  }

  return valid;
}

// Live validation on blur & input
['fullName', 'igUsername'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', validateForm);
  el.addEventListener('input', () => {
    if (el.classList.contains('error')) validateForm();
  });
});

/* ─────────────────────────────────────────────
   GOOGLE SHEETS SUBMIT
   ───────────────────────────────────────────── */
async function submitToSheets(data) {
  const params = new URLSearchParams({
    name:      data.name,
    instagram: data.instagram,
    timestamp: data.timestamp,
    source:    data.source,
  });

  const res = await fetch(CONFIG.SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) throw new Error('Sheets response ' + res.status);
  return res;
}

/* ─────────────────────────────────────────────
   FORM SUBMIT HANDLER
   ───────────────────────────────────────────── */
const leadForm      = document.getElementById('leadForm');
const submitBtn     = document.getElementById('submitBtn');
const successOverlay = document.getElementById('successOverlay');

if (leadForm) {
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const btnText   = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // UI: loading state
    submitBtn.disabled  = true;
    btnText.hidden      = true;
    btnLoader.hidden    = false;
    submitBtn.style.opacity = '.7';

    const formData = {
      name:      document.getElementById('fullName').value.trim(),
      instagram: document.getElementById('igUsername').value.trim().replace(/^@/, ''),
      timestamp: new Date().toISOString(),
      source:    document.referrer || 'direct',
    };

    try {
      // 1. Kirim ke Google Sheets
      await submitToSheets(formData);
    } catch (err) {
      // Jika Sheets gagal, tetap lanjut (fail-silently) — data tersimpan di localStorage
      console.warn('Sheets submit failed:', err.message);
    }

    // 2. Simpan ke localStorage sebagai backup
    try {
      const existing = JSON.parse(localStorage.getItem('la_waitlist') || '[]');
      existing.push(formData);
      localStorage.setItem('la_waitlist', JSON.stringify(existing));
    } catch (_) {}

    // 3. Tracking — GA4
    trackGA4('generate_lead', {
      form_name:    'waitlist_hero',
      method:       'instagram',
    });

    // 4. Tracking — Meta Pixel
    trackPixel('Lead', {
      content_name:     'Waitlist Signup',
      content_category: 'Katering',
    });

    // 5. Tracking — Google Ads Conversion
    trackGAdsConversion(0);

    // UI: reset
    submitBtn.disabled      = false;
    btnText.hidden          = false;
    btnLoader.hidden        = true;
    submitBtn.style.opacity = '';

    // Tampilkan success popup
    successOverlay.hidden = false;
    leadForm.reset();
  });
}

/* ─────────────────────────────────────────────
   SUCCESS OVERLAY — tutup klik backdrop
   ───────────────────────────────────────────── */
if (successOverlay) {
  successOverlay.addEventListener('click', e => {
    if (e.target === successOverlay) successOverlay.hidden = true;
  });
}

/* ─────────────────────────────────────────────
   SCROLL REVEAL
   ───────────────────────────────────────────── */
const revealEls = document.querySelectorAll(
  '.layanan-card, .badge-item, .menu-card, .sub-card, .faq__item, .section-header, .sp-item'
);

revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  const mod = i % 3;
  if (mod === 1) el.classList.add('reveal-delay-1');
  if (mod === 2) el.classList.add('reveal-delay-2');
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ─────────────────────────────────────────────
   PROGRESS BAR ANIMATE ON SCROLL
   ───────────────────────────────────────────── */
const progressFill = document.querySelector('.progress-bar__fill');
if (progressFill) {
  const target = progressFill.style.width;
  progressFill.style.width = '0';

  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        progressFill.style.width = target;
      }
    });
  }, { threshold: 0.4 }).observe(progressFill.parentElement);
}

/* ─────────────────────────────────────────────
   TRACK SECTION VIEWS (GA4 engagement)
   ───────────────────────────────────────────── */
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const sectionId = entry.target.getAttribute('id');
      if (sectionId) {
        trackGA4('section_view', { section_id: sectionId });
      }
      sectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

/* ─────────────────────────────────────────────
   TRACK OUTBOUND CLICKS (WA, IG)
   ───────────────────────────────────────────── */
document.querySelectorAll('a[target="_blank"]').forEach(link => {
  link.addEventListener('click', () => {
    const href = link.getAttribute('href') || '';
    if (href.includes('wa.me')) {
      trackGA4('whatsapp_click', { link_url: href });
      trackPixel('Contact', { content_name: 'whatsapp' });
    } else if (href.includes('instagram.com')) {
      trackGA4('instagram_click', { link_url: href });
    }
  });
});
