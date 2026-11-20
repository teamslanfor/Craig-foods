/* Craig Foods / Slemish Bakery – site interactions (no dependencies).
   Trade enquiries and messages are emailed through FormSubmit. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = window.SITE || {};
  const params = new URLSearchParams(location.search);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Header + mobile menu */
  const hdr = $('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 10);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const burger = $('.burger'), nav = $('.nav');
  if (burger && nav) {
    const close = () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); document.body.style.overflow = ''; };
    burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); document.body.style.overflow = o ? 'hidden' : ''; });
    $$('a', nav).forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* Reveal on scroll – never leaves content hidden */
  const rv = $$('.rv, .rv-img'); const show = (el) => el.classList.add('in');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    rv.forEach((el) => io.observe(el));
    let tk = false;
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(() => { tk = false; rv.forEach((el) => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight) show(el); }); }); } }, { passive: true });
  } else rv.forEach(show);
  setTimeout(() => rv.forEach(show), 2500);

  /* Tabs with sliding underline + arrow keys */
  $$('[role=tablist]').forEach((list) => {
    const tabs = $$('[role=tab]', list), ind = $('.ind', list);
    const cur = () => tabs.find((x) => x.getAttribute('aria-selected') === 'true');
    const move = (tb) => { if (ind && tb) { ind.style.width = tb.offsetWidth + 'px'; ind.style.height = tb.offsetHeight + 'px'; ind.style.transform = `translate(${tb.offsetLeft}px, ${tb.offsetTop}px)`; } };
    const select = (tb, focus) => {
      tabs.forEach((x) => { const on = x === tb; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      move(tb); if (focus) tb.focus();
    };
    tabs.forEach((tb, i) => {
      tb.addEventListener('click', () => select(tb));
      tb.addEventListener('keydown', (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); } });
    });
    select(tabs.find((x) => x.dataset.id === params.get('tab') || '#' + x.dataset.id === location.hash) || cur() || tabs[0]);
    addEventListener('resize', () => move(cur())); addEventListener('load', () => move(cur()));
    if (document.fonts) document.fonts.ready.then(() => move(cur()));
  });

  /* Pre-fill from links (?type=forecourt&range=traybakes) */
  const type = params.get('type'); if (type) { const r = $(`input[name="business_type"][value="${type}"]`); if (r) r.checked = true; }
  const rng = params.get('range'); if (rng) { const c = $(`input[name="interested_in"][value="${rng}"]`); if (c) c.checked = true; }

  /* Forms */
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name.',
    business: (v) => v.trim().length >= 2 || 'Please enter your business name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    phone: (v) => { const d = v.replace(/\D/g, ''); return (d.length >= 10 && d.length <= 13) || 'Please enter a valid phone number, e.g. 028 9447 1950.'; },
    postcode: (v) => /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(v.trim()) || 'Please enter a valid postcode, e.g. BT41 2PT.',
    message: (v) => v.trim().length >= 5 || 'Please tell us a little more.',
  };
  $$('form[data-send]').forEach((form) => {
    const fields = $$('input, textarea, select', form).filter((el) => rules[el.name] && el.required);
    const check = (el) => { const r = rules[el.name](el.value), box = el.closest('.f'), err = box && $('.err', box), ok = r === true; if (box) box.classList.toggle('bad', !ok); if (err) err.textContent = ok ? '' : r; el.setAttribute('aria-invalid', String(!ok)); return ok; };
    fields.forEach((el) => {
      el.addEventListener('blur', (e) => { if (e.relatedTarget && e.relatedTarget.closest('.form-foot')) return; const bx = el.closest('.f'); if (!el.value.trim() && !(bx && bx.classList.contains('bad'))) return; check(el); });
      el.addEventListener('input', () => { const bx = el.closest('.f'); if (bx && bx.classList.contains('bad')) check(el); });
      el.addEventListener('change', () => { const bx = el.closest('.f'); if (bx && bx.classList.contains('bad')) check(el); });
    });
    const file = $('input[type=file]', form);
    if (file) file.addEventListener('change', () => { const f = file.files[0], hint = $('.hint', file.closest('.f')); if (f && f.size > 5 * 1024 * 1024) { file.value = ''; if (hint) hint.textContent = 'That photo is over 5 MB. Please choose a smaller one.'; } else if (hint && f) hint.textContent = `Attached: ${f.name}`; });
    const status = $('.status', form), btn = $('button[type=submit]', form);
    const valid = () => { if (form.elements._honey && form.elements._honey.value) return false; if (fields.map(check).includes(false)) { status.className = 'status bad'; status.textContent = 'Please fix the highlighted fields and try again.'; const f = $('.f.bad input, .f.bad textarea, .f.bad select', form); if (f) f.focus(); return false; } return true; };
    const summary = () => {
      const map = new Map();
      new FormData(form).forEach((v, k) => {
        if (k.startsWith('_') || typeof v !== 'string' || !v.trim()) return;
        const el = form.querySelector(`[name="${k}"]`); let lab = (el && el.closest('.f') && el.closest('.f').querySelector('label, legend') || {}).textContent || k;
        lab = lab.replace(/\*|\(optional\)/g, '').trim();
        map.set(lab, map.has(lab) ? `${map.get(lab)}, ${v}` : v);
      });
      return [...map].map(([k, v]) => `${k}: ${v}`);
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!valid()) return;
      const fd = new FormData(form); fd.delete('_honey');
      $$('fieldset[data-multi]', form).forEach((fs) => { const n = fs.dataset.multi, vals = fd.getAll(n); fd.delete(n); if (vals.length) fd.append(n, vals.join(', ')); });
      fd.append('_subject', `${form.dataset.send} from ${fd.get('business') || fd.get('name')} – website`); fd.append('_template', 'table'); fd.append('_captcha', 'false');
      if (fd.get('email')) fd.append('_replyto', fd.get('email'));
      const first = String(fd.get('name')).trim().split(' ')[0];
      btn.disabled = true; form.classList.add('loading');
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${S.email}`, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || String(j.success) === 'false') throw new Error('send');
        form.reset(); $$('.f.bad', form).forEach((b) => b.classList.remove('bad'));
        $$('.hint[data-default]', form).forEach((h) => { h.textContent = h.dataset.default; });
        status.className = 'status ok';
        status.innerHTML = `<strong>Thank you, ${esc(first)}!</strong> Your ${esc(form.dataset.send.toLowerCase())} has been sent. The Craig Foods team will be in touch soon.`;
        status.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      } catch (err) {
        const text = `${form.dataset.send}\n\n${summary().join('\n')}`;
        status.className = 'status bad';
        status.innerHTML = `Sorry, that didn’t send automatically. Please <a href="mailto:${S.email}?subject=${encodeURIComponent(form.dataset.send)}&body=${encodeURIComponent(text)}">email it</a> (filled in for you) or call <a href="${S.phoneHref}">${S.phone}</a>.`;
      } finally { btn.disabled = false; form.classList.remove('loading'); }
    });
  });

  /* Cookie notice + year */
  const ck = $('.cookie');
  if (ck) {
    let seen = false; try { seen = localStorage.getItem('cf-cookie-ok') === '1'; } catch (e) {}
    if (!seen) ck.hidden = false;
    $('button', ck).addEventListener('click', () => { ck.hidden = true; try { localStorage.setItem('cf-cookie-ok', '1'); } catch (e) {} });
  }
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
