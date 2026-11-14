/* Noolam — interactions */
(() => {
  'use strict';
  const D = window.NOOLAM;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const img = (src, alt = '', { eager = false, pos = '', cls = '' } = {}) =>
    `<img src="${src}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${pos ? ` style="object-position:${pos}"` : ''}${cls ? ` class="${cls}"` : ''}>`;

  // Retry a failed remote photo once, then show a silk-toned panel instead of a broken icon.
  document.addEventListener('error', e => {
    const t = e.target;
    if (t.tagName !== 'IMG') return;
    if (!t.dataset.retried) { t.dataset.retried = 1; const u = t.src; t.src = ''; t.src = u + (u.includes('?') ? '&' : '?') + 'r=1'; return; }
    t.parentElement && t.parentElement.classList.add('img-failed');
  }, true);

  /* ---------------- Store (bag + wishlist) ---------------- */
  const store = {
    bag: [], wish: [],
    load() { try { const s = JSON.parse(localStorage.getItem('noolam') || '{}'); this.bag = s.bag || []; this.wish = s.wish || []; } catch (_) {} },
    save() { try { localStorage.setItem('noolam', JSON.stringify({ bag: this.bag, wish: this.wish })); } catch (_) {} },
    add(item) {
      const f = this.bag.find(b => b.name === item.name);
      f ? f.qty++ : this.bag.push({ ...item, qty: 1 });
      this.save(); renderCounts(true); toast(`<b>Added</b> · ${esc(item.name)}`);
    },
    toggleWish(item) {
      const i = this.wish.findIndex(w => w.name === item.name);
      i > -1 ? this.wish.splice(i, 1) : this.wish.push(item);
      this.save(); renderCounts(true);
      toast(i > -1 ? `Removed from wishlist` : `<b>Saved</b> · ${esc(item.name)}`);
      return i === -1;
    },
    has(name) { return this.wish.some(w => w.name === name); },
  };

  function renderCounts(bump) {
    const b = $('#bagCount'), w = $('#wishCount');
    b.textContent = store.bag.reduce((a, x) => a + x.qty, 0);
    w.textContent = store.wish.length;
    if (bump) [b, w].forEach(c => { c.classList.add('bump'); setTimeout(() => c.classList.remove('bump'), 300); });
  }

  let toastT;
  function toast(html) {
    const t = $('#toast'); t.innerHTML = html; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2400);
  }

  /* ---------------- Split headings + reveals ---------------- */
  function splitHeading(h) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.append(inner); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && (n.classList.contains('accent') || n.tagName === 'EM')) {
          // keep gradient on each word of an accent span
          const cls = n.className, tag = n.tagName.toLowerCase();
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement(tag); if (cls) inner.className = cls; inner.textContent = part; inner.style.setProperty('--i', i++);
            inner.style.display = 'inline-block';
            w.append(inner); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(h);
    // transitions on accent/em inner elements
    $$('.w > *', h).forEach(s => { s.style.transform = 'translateY(105%)'; s.style.transition = `transform 1s cubic-bezier(.16,1,.3,1) ${s.style.getPropertyValue('--i') * 70}ms`; });
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      if (en.target.matches('[data-split]')) $$('.w > *', en.target).forEach(s => (s.style.transform = 'none'));
      io.unobserve(en.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });

  function observeReveals(root = document) {
    $$('.reveal:not(.is-in)', root).forEach(el => (reduce ? el.classList.add('is-in') : io.observe(el)));
  }

  /* ---------------- Nav ---------------- */
  function initNav() {
    const nav = $('#nav'), burger = $('#burger'), mm = $('#mmenu');
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * .9 && !mm.classList.contains('is-open'));
      lastY = y;
    }, { passive: true });

    const setMenu = open => {
      mm.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open);
      mm.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setMenu(!mm.classList.contains('is-open')));
    $$('a, [data-open-store]', mm).forEach(a => a.addEventListener('click', () => setMenu(false)));

    // scroll spy
    const links = $$('.nav__links a');
    const map = { home: 'home', moods: 'home', look: 'look', pick: 'pick', rack: 'rack', muse: 'muse', reels: 'muse', bridal: 'bridal', weave: 'weave', atelier: 'weave', faq: 'weave' };
    const spy = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const id = map[e.target.id];
        links.forEach(l => l.classList.toggle('is-active', l.dataset.spy === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(id => { const s = document.getElementById(id); s && spy.observe(s); });
  }

  /* ---------------- Hero ---------------- */
  function initHero() {
    const wrap = $('#heroSlides'), dots = $('#heroDots');
    wrap.innerHTML = D.hero.map((h, i) => `<div class="hero__slide${i ? '' : ' is-on'}">${img(h.src, h.alt, { eager: i === 0, pos: h.pos })}</div>`).join('');
    dots.innerHTML = D.hero.map((_, i) => `<button role="tab" aria-label="Image ${i + 1}" class="${i ? '' : 'is-on'}"></button>`).join('');
    const slides = $$('.hero__slide', wrap), ds = $$('button', dots);
    let cur = 0, t;
    const go = n => {
      slides[cur].classList.remove('is-on'); ds[cur].classList.remove('is-on');
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('is-on');
      void ds[cur].offsetWidth; ds[cur].classList.add('is-on');
      clearTimeout(t); if (!reduce) t = setTimeout(() => go(cur + 1), 7000);
    };
    ds.forEach((d, i) => d.addEventListener('click', () => go(i)));
    if (!reduce) t = setTimeout(() => go(1), 7000);
  }

  /* ---------------- Ribbon + Moods ---------------- */
  function initMoods() {
    const words = D.ribbon.map(w => `<span>${w}</span>`).join('');
    $('#ribbon').innerHTML = words + words;
    $('#moodsRow').innerHTML = D.moods.map((m, i) => `
      <a class="mood reveal" href="#rack" style="--d:${i * 90}ms" data-mood="${i}">
        <div class="mood__finial"></div>
        <div class="mood__frame">${img(m.src, m.alt)}</div>
        <h3>${m.name}</h3><p>${m.note}</p>
      </a>`).join('');
  }

  /* ---------------- Try the Look ---------------- */
  function initLooks() {
    const lineup = $('#lookLineup'), detail = $('#lookDetail'), back = $('#lookBack');
    lineup.innerHTML = D.looks.map((l, i) => `
      <button class="look-card reveal" style="--d:${i * 80}ms" data-i="${i}" aria-label="Open look ${i + 1}: ${esc(l.name)}">
        <div class="look-card__img">${img(l.src, l.alt, { pos: '50% 30%' })}</div>
        <div class="look-card__lab">${l.name}<span>${String(i + 1).padStart(2, '0')}</span></div>
        <span class="look-card__tap">See the pieces</span>
      </button>`).join('');

    let cur = 0;
    const pieces = l => [
      { n: 'Jewellery', ...D.jewels[l.jewels[0]], y: 22 },
      { n: 'Jewellery', ...D.jewels[l.jewels[1]], y: 36 },
      { n: 'Blouse', name: l.blouse, price: Math.round(l.price * .09 / 100) * 100, src: l.src, pos: '50% 38%', y: 50 },
      { n: 'Saree', name: l.saree, price: l.price, src: l.src, pos: '50% 78%', y: 74 },
    ];
    const show = i => {
      cur = (i + D.looks.length) % D.looks.length;
      const l = D.looks[cur], ps = pieces(l);
      $('#lookNo').textContent = `Look ${String(cur + 1).padStart(2, '0')} of ${String(D.looks.length).padStart(2, '0')}`;
      $('#lookName').textContent = l.name;
      $('#lookSaree').textContent = l.saree;
      $('#lookFigure').innerHTML = img(l.src, l.alt, { pos: '50% 30%' }) +
        ps.map((p, k) => `<button class="pin" style="top:${p.y}%" data-k="${k}" aria-label="${p.n}: ${esc(p.name)}">${k + 1}</button>`).join('');
      $('#lookPieces').innerHTML = ps.map((p, k) => `
        <li class="piece" data-k="${k}">${img(p.src, p.name, { pos: p.pos || '' })}
          <div><div class="piece__n">${k + 1} · ${p.n}</div><div class="piece__t">${esc(p.name)}</div></div>
          <div class="piece__p">${inr(p.price)}</div></li>`).join('');
      const total = ps.reduce((a, p) => a + p.price, 0);
      $('#lookTotal').textContent = inr(total);
      $('#lookAdd').onclick = () => store.add({ name: `${l.name} — full look`, price: total, src: l.src, sub: '4 pieces' });
      const hl = k => { $$('.pin', detail).forEach(p => p.classList.toggle('is-on', p.dataset.k == k)); $$('.piece', detail).forEach(p => p.classList.toggle('is-on', p.dataset.k == k)); };
      $$('.pin, .piece', detail).forEach(el => { el.addEventListener('mouseenter', () => hl(el.dataset.k)); el.addEventListener('click', () => hl(el.dataset.k)); });
      detail.style.animation = 'none'; void detail.offsetWidth; detail.style.animation = '';
    };
    const open = i => { lineup.hidden = true; detail.hidden = false; back.hidden = false; show(i); detail.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); };
    lineup.addEventListener('click', e => { const c = e.target.closest('.look-card'); c && open(+c.dataset.i); });
    back.addEventListener('click', () => { lineup.hidden = false; detail.hidden = true; back.hidden = true; observeReveals(lineup); });
    $('#lookPrev').addEventListener('click', () => show(cur - 1));
    $('#lookNext').addEventListener('click', () => show(cur + 1));
  }

  /* ---------------- Pick a Silk ---------------- */
  function initPick() {
    const row = $('#pickRow');
    row.innerHTML = D.picks.map((p, i) => `
      <article class="silk reveal" style="--c:${p.color};--d:${i * 70}ms" data-i="${i}" tabindex="0" aria-label="${esc(p.name)}, ${inr(p.price)}">
        <h3 class="silk__name" style="color:${p.ink}">${p.name.split(' ').join('<br>')}</h3>
        <div class="silk__photo">${img(p.src, p.alt, { pos: '50% 25%' })}</div>
        <div class="silk__shine"></div>
        <button class="silk__heart${store.has(p.name) ? ' is-on' : ''}" aria-label="Save ${esc(p.name)} to wishlist" aria-pressed="${store.has(p.name)}">♥</button>
        <div class="silk__meta"><div><div class="muted">${p.weave}</div><strong>${inr(p.price)}</strong></div><button data-add>Add</button></div>
      </article>`).join('');

    $$('.silk', row).forEach(card => {
      const p = D.picks[card.dataset.i];
      card.addEventListener('pointermove', e => {
        if (reduce || e.pointerType === 'touch') return;
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', `${(x - .5) * 16}deg`); card.style.setProperty('--rx', `${(.5 - y) * 14}deg`);
        card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => { card.classList.remove('is-tilting'); ['--rx', '--ry'].forEach(v => card.style.setProperty(v, '0deg')); card.style.setProperty('--s', 1); });
      card.addEventListener('pointerdown', e => { if (!e.target.closest('button')) card.style.setProperty('--s', .96); });
      card.addEventListener('pointerup', e => {
        card.style.setProperty('--s', 1);
        if (e.target.closest('button')) return;
        // poke the silk: ripple from the touch point
        const r = card.getBoundingClientRect(), rip = document.createElement('span');
        rip.className = 'ripple'; rip.style.left = `${e.clientX - r.left}px`; rip.style.top = `${e.clientY - r.top}px`;
        card.append(rip); setTimeout(() => rip.remove(), 900);
        card.classList.add('is-poked'); setTimeout(() => card.classList.remove('is-poked'), 3200);
      });
      card.addEventListener('keydown', e => { if (e.key === 'Enter') card.classList.toggle('is-poked'); });
      $('.silk__heart', card).addEventListener('click', e => {
        const on = store.toggleWish({ name: p.name, price: p.price, src: p.src, sub: p.weave });
        e.currentTarget.classList.toggle('is-on', on); e.currentTarget.setAttribute('aria-pressed', on);
      });
      $('[data-add]', card).addEventListener('click', () => store.add({ name: p.name, price: p.price, src: p.src, sub: p.weave }));
    });
  }

  /* ---------------- The Rack ---------------- */
  function initRack() {
    const chips = $('#rackChips'), items = $('#rackItems'), info = $('#rackInfo');
    const cats = ['All pieces', ...D.rackCats];
    const count = c => c === 'All pieces' ? D.rack.length : D.rack.filter(r => r.cat === c).length;
    chips.innerHTML = cats.map((c, i) => `<button class="chip${i ? '' : ' is-on'}" role="tab" aria-selected="${!i}" data-c="${c}">${c} <b>${count(c)}</b></button>`).join('');

    let list = D.rack, active = 0;
    const hook = `<svg class="hanger__hook" viewBox="0 0 120 48" aria-hidden="true"><path d="M60 22 C60 14 68 12 68 6 C68 1 62 -1 58 2"/><path d="M60 22 L8 44 L112 44 Z" stroke-linejoin="round"/></svg>`;
    const render = () => {
      items.innerHTML = list.map((r, i) => `
        <div class="hanger" data-i="${i}" role="button" tabindex="0" aria-label="${esc(r.name)}, ${inr(r.price)}">
          ${hook}
          <div class="hanger__cloth" style="--bd:${r.border}">${img(r.src, r.name + ' silk', { pos: r.pos || '' })}</div>
        </div>`).join('');
      active = Math.min(Math.floor(list.length / 2), list.length - 1);
      layout();
    };
    const layout = () => {
      const sp = innerWidth < 720 ? 92 : innerWidth < 1060 ? 120 : 150;
      $$('.hanger', items).forEach((h, i) => {
        const d = i - active, a = Math.abs(d);
        h.style.setProperty('--x', `${d * sp + (d ? Math.sign(d) * sp * .45 : 0)}px`);
        h.style.setProperty('--sc', d ? Math.max(.78 - a * .04, .6) : 1.3);
        h.style.setProperty('--bl', d ? `${Math.min(a * 1.6, 6)}px` : '0px');
        h.style.setProperty('--op', a > 5 ? 0 : d ? 1 - a * .1 : 1);
        h.style.setProperty('--z', 100 - a);
        h.classList.toggle('is-on', !d);
        h.setAttribute('aria-current', !d);
      });
      const r = list[active];
      info.innerHTML = r ? `<h3>${esc(r.name)}</h3><p>${r.cat} · handwoven · ${inr(r.price)}</p>
        <div class="row"><button class="btn btn--crimson btn--sm" id="rackAdd">Add to bag</button>
        <button class="round-btn" id="rackWish" aria-label="Save to wishlist" style="color:var(--crimson)">${store.has(r.name) ? '♥' : '♡'}</button></div>` : '';
      if (r) {
        $('#rackAdd').onclick = () => store.add({ name: r.name, price: r.price, src: r.src, sub: r.cat });
        $('#rackWish').onclick = e => { e.currentTarget.textContent = store.toggleWish({ name: r.name, price: r.price, src: r.src, sub: r.cat }) ? '♥' : '♡'; };
      }
    };
    const go = n => { active = Math.max(0, Math.min(list.length - 1, n)); layout(); };
    items.addEventListener('click', e => { const h = e.target.closest('.hanger'); h && go(+h.dataset.i); });
    items.addEventListener('keydown', e => { if (e.key === 'Enter') { const h = e.target.closest('.hanger'); h && go(+h.dataset.i); } });
    $('#rackPrev').addEventListener('click', () => go(active - 1));
    $('#rackNext').addEventListener('click', () => go(active + 1));
    chips.addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      $$('.chip', chips).forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-selected', x === c); });
      list = c.dataset.c === 'All pieces' ? D.rack : D.rack.filter(r => r.cat === c.dataset.c);
      render();
    });
    // swipe
    let sx = null;
    items.addEventListener('pointerdown', e => (sx = e.clientX));
    items.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1)); sx = null; });
    // moods jump to rack
    $$('[data-mood]').forEach(m => m.addEventListener('click', () => go(+m.dataset.mood * 2 % D.rack.length)));
    addEventListener('resize', layout);
    render();
  }

  /* ---------------- Muse ---------------- */
  function initMuse() {
    const fig = (m, i) => `<figure class="reveal" style="--d:${i * 100}ms">${img(m.src, m.alt)}</figure>`;
    $('#museL').innerHTML = D.muse.left.map(fig).join('');
    $('#museR').innerHTML = D.muse.right.map(fig).join('');
    $('#museC').insertAdjacentHTML('afterbegin', img(D.muse.center.src, D.muse.center.alt));
    $('#museNotes').innerHTML = D.muse.notes.map((n, i) => `<p class="reveal" style="--d:${i * 100}ms"><strong>${n.k}</strong>${n.v}</p>`).join('');

    if (reduce) { $('#museC').style.setProperty('--ms', 1); return; }
    const sec = $('#muse'), c = $('#museC'), L = $('#museL'), R = $('#museR');
    let raf;
    const tick = () => {
      raf = null;
      const r = sec.getBoundingClientRect(), p = Math.min(1, Math.max(0, 1 - (r.top + r.height * .35) / innerHeight));
      if (innerWidth > 720) {
        c.style.setProperty('--ms', (.86 + p * .14).toFixed(3));
        L.style.transform = `translateY(${(1 - p) * 60}px)`; R.style.transform = `translateY(${(p - 1) * 60}px)`;
      } else { c.style.setProperty('--ms', 1); L.style.transform = R.style.transform = ''; }
    };
    addEventListener('scroll', () => raf || (raf = requestAnimationFrame(tick)), { passive: true });
    tick();
  }

  /* ---------------- Bridal arcs ---------------- */
  function initBridal() {
    const arcs = $('#arcs');
    arcs.innerHTML = D.bridal.map((b, i) => `<div class="arc" data-i="${i}" role="button" tabindex="-1" aria-label="${esc(b.name)}">${img(b.src, b.alt, { pos: '50% 25%' })}</div>`).join('');
    let cur = Math.floor(D.bridal.length / 2);
    const els = $$('.arc', arcs);
    const layout = () => {
      const w = els[0].offsetWidth, step = w * (innerWidth < 720 ? .62 : .8);
      els.forEach((el, i) => {
        const d = i - cur, a = Math.abs(d);
        el.style.setProperty('--tx', `${d * step}px`);
        el.style.setProperty('--ty', `${a * a * 10 + a * 8}px`);
        el.style.setProperty('--rot', `${d * 6}deg`);
        el.style.setProperty('--sc', d ? 1 - a * .08 : 1.1);
        el.style.setProperty('--z', 50 - a);
        el.style.setProperty('--op', a > 4 ? 0 : 1);
        el.style.setProperty('--sat', d ? .75 : 1.05);
        el.style.setProperty('--br', d ? .92 : 1);
        el.classList.toggle('is-on', !d);
      });
      const b = D.bridal[cur];
      $('#arcName').textContent = b.name;
      $('#arcPrice').textContent = `Pure zari bridal silk · ${inr(b.price)}`;
    };
    const go = n => { cur = (n + els.length) % els.length; layout(); };
    arcs.addEventListener('click', e => { const a = e.target.closest('.arc'); a && go(+a.dataset.i); });
    arcs.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); });
    $('#arcPrev').addEventListener('click', () => go(cur - 1));
    $('#arcNext').addEventListener('click', () => go(cur + 1));
    $('#arcAdd').addEventListener('click', () => { const b = D.bridal[cur]; store.add({ name: b.name, price: b.price, src: b.src, sub: 'Bridal · pure zari' }); });
    let sx = null;
    arcs.addEventListener('pointerdown', e => (sx = e.clientX));
    arcs.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
    addEventListener('resize', layout);
    layout();
  }

  /* ---------------- Reels + story viewer ---------------- */
  function initReels() {
    $('#reelsRow').innerHTML = D.reels.map((r, i) => `
      <button class="reel reveal" style="--d:${i * 70}ms" data-open-reel="${i}" aria-label="Play reel: ${esc(r.title)}">
        ${img(r.src, r.alt, { pos: '50% 30%' })}
        <div class="reel__top"><span>REEL ${String(i + 1).padStart(2, '0')}</span><span>${r.dur}</span></div>
        <span class="reel__play" aria-hidden="true"></span>
        <div class="reel__title">${r.title}</div>
      </button>`).join('');

    const story = $('#story'), stage = $('#storyStage');
    let cur = 0, t, lastFocus;
    const N = D.reels.length;
    const render = () => {
      const r = D.reels[cur], prev = D.reels[(cur - 1 + N) % N], next = D.reels[(cur + 1) % N];
      stage.innerHTML = `
        <button class="story__side story__side--l" data-go="-1" aria-label="Previous reel">${img(prev.src, prev.alt)}</button>
        <div class="story__card">
          ${img(r.src, r.alt, { eager: true, pos: '50% 30%' })}
          <div class="story__bars">${D.reels.map((_, i) => `<i style="--p:${i < cur ? 1 : 0}" class="${i === cur ? 'is-now' : ''}"></i>`).join('')}</div>
          <div class="story__who"><span class="story__av">N</span><div><b>noolam</b><small>${r.title}</small></div></div>
          <div class="story__cap"><h3>${esc(r.cap)}</h3><a href="#rack" class="btn btn--light btn--sm" data-close>Shop this drape</a></div>
          <button class="story__tap story__tap--l" data-go="-1" aria-label="Previous"></button>
          <button class="story__tap story__tap--r" data-go="1" aria-label="Next"></button>
        </div>
        <button class="story__side story__side--r" data-go="1" aria-label="Next reel">${img(next.src, next.alt)}</button>`;
      clearTimeout(t); if (!reduce) t = setTimeout(() => go(1), 6000);
    };
    const go = d => { cur = (cur + d + N) % N; render(); };
    const open = i => { lastFocus = document.activeElement; cur = i; story.hidden = false; document.body.style.overflow = 'hidden'; render(); $('.story__x').focus(); };
    const close = () => { story.hidden = true; clearTimeout(t); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
    document.addEventListener('click', e => {
      const o = e.target.closest('[data-open-reel]'); if (o) { open(+o.dataset.openReel); return; }
      if (story.hidden) return;
      const g = e.target.closest('[data-go]'); if (g) go(+g.dataset.go);
      if (e.target.closest('#story [data-close]')) close();
    });
    document.addEventListener('keydown', e => {
      if (story.hidden) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1);
    });
  }

  /* ---------------- The Weave (canvas ribbons) ---------------- */
  function initWeave() {
    const sw = $('#weaveSwatches'), cv = $('#weaveCanvas'), ctx = cv.getContext('2d');
    let picked = [0, 1, 3];
    const imgs = D.weave.map(w => { const im = new Image(); im.decoding = 'async'; im.src = w.src; return im; });
    sw.innerHTML = D.weave.map((w, i) => `<button class="swatch" data-i="${i}" aria-pressed="false" aria-label="${esc(w.name)}, ${inr(w.price)}" title="${esc(w.name)}">${img(w.src, '')}</button>`).join('');

    const ui = () => {
      $$('.swatch', sw).forEach(b => {
        const k = picked.indexOf(+b.dataset.i);
        b.classList.toggle('is-on', k > -1); b.setAttribute('aria-pressed', k > -1);
        b.innerHTML = img(D.weave[b.dataset.i].src, '') + (k > -1 ? `<b>${k + 1}</b>` : '');
      });
      $('#weavePicked').innerHTML = picked.length
        ? picked.map(i => `<span><i style="background:${D.weave[i].color}"></i>${D.weave[i].name} · ${inr(D.weave[i].price)}</span>`).join('')
        : '<span class="muted">Choose three silks below</span>';
      const sum = picked.reduce((a, i) => a + D.weave[i].price, 0);
      $('#weaveWas').textContent = picked.length === 3 ? inr(sum) : '';
      $('#weaveNow').textContent = inr(picked.length === 3 ? sum * .9 : sum);
      $('#weaveAdd').disabled = picked.length !== 3;
      $('#weaveAdd').textContent = picked.length === 3 ? 'Add trio to bag' : `Pick ${3 - picked.length} more`;
      if (reduce) draw(0);
    };
    sw.addEventListener('click', e => {
      const b = e.target.closest('.swatch'); if (!b) return;
      const i = +b.dataset.i, k = picked.indexOf(i);
      if (k > -1) picked.splice(k, 1); else { if (picked.length === 3) picked.shift(); picked.push(i); }
      ui();
    });
    $('#weaveAdd').addEventListener('click', () => {
      const sum = picked.reduce((a, i) => a + D.weave[i].price, 0) * .9;
      store.add({ name: `Seer Varisai trio: ${picked.map(i => D.weave[i].name).join(', ')}`, price: sum, src: D.weave[picked[0]].src, sub: 'Three silks, 10% off' });
    });

    let W = 0, H = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = t => {
      ctx.clearRect(0, 0, W, H);
      const cy = H * .52, amp = H * .2, T = H * .3, f = (Math.PI * 2) / Math.max(W * .5, 300), step = 3;
      const rib = picked.length ? picked : [];
      if (!rib.length) {
        ctx.strokeStyle = 'rgba(30,26,29,.25)'; ctx.lineWidth = 1;
        [0, 1, 2].forEach(k => { ctx.beginPath(); for (let x = 0; x <= W; x += 6) { const y = cy + amp * Math.sin(x * f + t + k * 2.09); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); });
        return;
      }
      for (let x = -step; x < W + step; x += step) {
        const cols = rib.map((wi, k) => {
          const ph = k * (Math.PI * 2 / 3);
          const a = x * f + t + ph;
          return { wi, k, y: cy + amp * Math.sin(a), z: Math.cos(a), tw: Math.cos(x * f * .5 + t * .7 + ph) };
        }).sort((a, b) => a.z - b.z);
        cols.forEach(c => {
          const h = T * (.22 + .78 * Math.abs(c.tw)), im = imgs[c.wi], top = c.y - h / 2;
          if (im.complete && im.naturalWidth) {
            const iw = im.naturalWidth, ih = im.naturalHeight;
            let sx = ((x + c.k * 260 + t * 30) * (iw / (W * 1.4))) % iw; if (sx < 0) sx += iw;
            ctx.drawImage(im, sx, ih * .2, Math.max(2, iw / (W * 1.4) * step), ih * .6, x, top, step + .7, h);
          } else { ctx.fillStyle = D.weave[c.wi].color; ctx.fillRect(x, top, step + .7, h); }
          const shade = (c.tw < 0 ? .28 : 0) + (1 - Math.abs(c.tw)) * .25 + (1 - (c.z + 1) / 2) * .12;
          ctx.fillStyle = `rgba(20,6,10,${shade.toFixed(3)})`; ctx.fillRect(x, top, step + .7, h);
          // zari edges
          ctx.fillStyle = 'rgba(214,170,70,.9)';
          ctx.fillRect(x, top, step + .7, Math.max(1, h * .045)); ctx.fillRect(x, top + h - Math.max(1, h * .045), step + .7, Math.max(1, h * .045));
          // sheen
          if (c.tw > .75) { ctx.fillStyle = `rgba(255,255,255,${((c.tw - .75) * .9).toFixed(3)})`; ctx.fillRect(x, top + h * .25, step + .7, h * .18); }
        });
      }
    };
    let running = false, raf, t0 = performance.now();
    const loop = now => { draw((now - t0) / 1600); raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => {
      if (reduce) { draw(0); return; }
      if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(loop); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(cv);
    imgs.forEach(im => im.addEventListener('load', () => reduce && draw(0)));
    addEventListener('resize', () => { size(); if (reduce || !running) draw(0); });
    size(); ui(); draw(0);
  }

  /* ---------------- Atelier, notes, FAQ ---------------- */
  function initStory() {
    $('#atelierA').innerHTML = img(D.atelier[0].src, D.atelier[0].alt);
    $('#atelierB').innerHTML = img(D.atelier[1].src, D.atelier[1].alt, { pos: '50% 25%' });
    $('#atelierA').classList.add('reveal'); $('#atelierB').classList.add('reveal'); $('#atelierB').style.setProperty('--d', '150ms');
    $('#notes').innerHTML = D.notes.map((n, i) => `<figure class="note reveal" style="--d:${i * 90}ms"><blockquote>${n.q}</blockquote><figcaption>${n.who}</figcaption></figure>`).join('');
    $('#faqList').innerHTML = D.faq.map((f, i) => `
      <div class="qa${i ? '' : ' is-open'}">
        <button aria-expanded="${!i}" aria-controls="qa${i}" id="qb${i}">${f.q}<i aria-hidden="true"></i></button>
        <div class="qa__a" id="qa${i}" role="region" aria-labelledby="qb${i}"><div><p>${f.a}</p></div></div>
      </div>`).join('');
    $('#faqList').addEventListener('click', e => {
      const b = e.target.closest('.qa > button'); if (!b) return;
      const q = b.parentElement, open = !q.classList.contains('is-open');
      q.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open);
    });
  }

  /* ---------------- Drawer / modal / forms ---------------- */
  function initOverlays() {
    const drawer = $('#drawer'), scrim = $('#scrim'), modal = $('#storeModal');
    let tab = 'bag', lastFocus;
    const renderDrawer = () => {
      const list = tab === 'bag' ? store.bag : store.wish;
      $$('.drawer__tabs button').forEach(b => b.classList.toggle('is-on', b.dataset.tab === tab));
      $('.drawer__head h2').textContent = tab === 'bag' ? 'Your bag' : 'Wishlist';
      $('#drawerFoot').hidden = tab !== 'bag' || !store.bag.length;
      $('#drawerList').innerHTML = list.length ? list.map((it, i) => `
        <li class="line">${img(it.src, it.name)}
          <div><div class="line__t">${esc(it.name)}</div><div class="line__s">${esc(it.sub || '')}</div>
          ${tab === 'bag' ? `<div class="qty"><button data-q="-1" data-i="${i}" aria-label="Decrease quantity">−</button>${it.qty}<button data-q="1" data-i="${i}" aria-label="Increase quantity">+</button></div>` : `<button class="link-btn" data-move="${i}">Move to bag</button>`}</div>
          <div class="line__r">${inr(it.price * (it.qty || 1))}<button data-rm="${i}">Remove</button></div></li>`).join('')
        : `<li class="drawer__empty">${tab === 'bag' ? 'Your bag is empty. The rack is waiting.' : 'Tap ♥ on any silk to save it here.'}</li>`;
      $('#bagTotal').textContent = inr(store.bag.reduce((a, x) => a + x.price * x.qty, 0));
    };
    const openDrawer = t => { lastFocus = document.activeElement; tab = t; renderDrawer(); drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', false); scrim.hidden = false; $('[data-close]', drawer).focus(); };
    const closeAll = () => {
      drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', true); modal.hidden = true; scrim.hidden = true;
      document.body.style.overflow = ''; lastFocus && lastFocus.focus && lastFocus.focus();
    };
    $('#bagBtn').addEventListener('click', () => openDrawer('bag'));
    $('#wishBtn').addEventListener('click', () => openDrawer('wish'));
    $$('.drawer__tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; renderDrawer(); }));
    $('#drawerList').addEventListener('click', e => {
      const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]'), mv = e.target.closest('[data-move]');
      if (q) { const it = store.bag[q.dataset.i]; it.qty += +q.dataset.q; if (it.qty < 1) store.bag.splice(q.dataset.i, 1); }
      if (rm) (tab === 'bag' ? store.bag : store.wish).splice(rm.dataset.rm, 1);
      if (mv) { const it = store.wish.splice(mv.dataset.move, 1)[0]; store.add(it); }
      store.save(); renderCounts(); renderDrawer();
    });
    $('#checkoutBtn').addEventListener('click', () => { closeAll(); openStore('Confirm your order', 'Leave your number and a stylist will call to confirm colours, blouse stitching and delivery before any payment is taken.'); });

    const openStore = (title, lede) => {
      lastFocus = document.activeElement;
      if (title) { $('#storeTitle').textContent = title; $('#storeTitle').nextElementSibling.textContent = lede; }
      $('#storeImg').innerHTML = img(D.hero[1].src, D.hero[1].alt);
      modal.hidden = false; scrim.hidden = false; document.body.style.overflow = 'hidden';
      $('#apptMsg').textContent = '';
      $('input[name=name]', modal).focus();
    };
    $('#storeBtn').addEventListener('click', () => openStore('Sit with the silks.', 'Book a quiet hour in our Kanchipuram showroom, or a 20-minute video appointment from anywhere.'));
    $$('[data-open-store]').forEach(b => b.addEventListener('click', () => openStore('Sit with the silks.', 'Book a quiet hour in our Kanchipuram showroom, or a 20-minute video appointment from anywhere.')));
    scrim.addEventListener('click', closeAll);
    $$('[data-close]', drawer).concat($$('[data-close]', modal)).forEach(b => b.addEventListener('click', closeAll));
    modal.addEventListener('click', e => { if (e.target === modal) closeAll(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && (!modal.hidden || drawer.classList.contains('is-open'))) closeAll(); });

    const dateIn = $('input[name=date]', modal);
    dateIn.min = new Date().toISOString().slice(0, 10);
    $('#apptForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.currentTarget; let ok = true;
      $$('input[required]', f).forEach(i => { const bad = !i.value.trim() || (i.name === 'phone' && i.value.replace(/\D/g, '').length < 8); i.classList.toggle('is-bad', bad); if (bad) ok = false; });
      if (!ok) { $('#apptMsg').style.color = 'var(--crimson)'; $('#apptMsg').textContent = 'Please fill in your name, a valid phone number and a date.'; return; }
      const mode = $('input[name=mode]:checked', f).value;
      $('#apptMsg').style.color = ''; $('#apptMsg').textContent = `Thank you, ${f.name.value.trim().split(' ')[0]}. Your ${mode.toLowerCase()} request is noted — we’ll call to confirm.`;
      f.reset();
    });
    $('#newsForm').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#newsEmail').value.trim();
      $('#newsMsg').textContent = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? 'You’re on the list. The next letter leaves the loom soon.' : 'Please enter a valid email address.';
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) e.currentTarget.reset();
    });
  }

  /* ---------------- Boot ---------------- */
  store.load();
  initNav(); initHero(); initMoods(); initLooks(); initPick(); initRack(); initMuse(); initBridal(); initReels(); initWeave(); initStory(); initOverlays();
  renderCounts();
  $('#year').textContent = new Date().getFullYear();
  $$('[data-split]').forEach(h => { splitHeading(h); reduce ? (h.classList.add('is-in'), $$('.w > *', h).forEach(s => (s.style.transform = 'none'))) : io.observe(h); });
  $$('.hero__lede, .hero__ctas, .eyebrow, .sec-head__aside, .sub').forEach(el => el.classList.add('reveal'));
  observeReveals();
})();
