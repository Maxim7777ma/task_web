// app.js
window.__lexo = window.__lexo || {};

/* ===================== DEMO DATA ===================== */
const DATA = (() => {
  const cats = ["popular","new","forme","hd","amateur","pro","romance","exotic","trending"];
  const arr = [];
  for (let i = 1; i <= 236; i++) {
    const cat = cats[i % cats.length];
    arr.push({
      id: i,
      title: `Домашнє відео №${i}`,
      author: `SpiriteMoon`,
      views: (90000 + i) + " перегл.",
      thumb: "static/img/placeholder.webp",
      url: "video.html?id=" + i,
      categories: [cat, i % 2 === 0 ? "hd" : "amateur"],
      tags: ["demo", "tag" + (i % 5), "cat-" + cat]
    });
  }
  // «живая» 1-я карточка
  arr[0].videoMp4    = "static/videos/stream1.mp4";
  // arr[0].videoWebm = "static/videos/stream1.webm";
  arr[0].previewFrom = 60;
  arr[0].previewTo   = 65;
  return arr;
})();

/* ===================== UTILS ===================== */
const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
const byId = id => document.getElementById(id);

/* ===================== HOVER PREVIEW IN GRID ===================== */
function attachPreviewLoop(videoEl, start = 5, end = 10) {
  if (!videoEl) return;
  let rafId = null, looping = false;
  const seekToStart = () => { try { videoEl.currentTime = start || 0; } catch(e){} };
  const tick = () => {
    if (!looping) return;
    if (videoEl.currentTime >= end) seekToStart();
    rafId = requestAnimationFrame(tick);
  };
  const onEnter = () => {
    if (videoEl.dataset.playing === "1") return;
    looping = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.loop = false;
    seekToStart();
    videoEl.play().catch(()=>{});
    rafId = requestAnimationFrame(tick);
  };
  const onLeave = () => {
    if (videoEl.dataset.playing === "1") return;
    looping = false;
    if (rafId) cancelAnimationFrame(rafId);
    videoEl.pause();
    seekToStart();
  };
  videoEl.addEventListener('mouseenter', onEnter);
  videoEl.addEventListener('mouseleave', onLeave);
}

/* ===================== GRID + PAGINATION ===================== */
function renderGrid({container, paginationWrap, items, page = 1, perPage = 20, onPageChange}) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  page = Math.min(Math.max(1, page), totalPages);

  container.innerHTML = "";
  const start = (page - 1) * perPage;
  const slice = items.slice(start, start + perPage);

  slice.forEach(v => {
    const art = document.createElement('article');
    art.className = 'card';

    const thumbHTML = (v.videoMp4 || v.videoWebm) ? `
      <a class="thumb" href="${v.url}">
        <video class="thumb-video"
               preload="metadata" muted playsinline
               poster="${v.videoPoster || v.thumb}"
               data-start="${v.previewFrom || 60}" data-end="${v.previewTo || 65}">
          ${v.videoWebm ? `<source src="${v.videoWebm}" type="video/webm">` : ''}
          ${v.videoMp4  ? `<source src="${v.videoMp4}"  type="video/mp4">`  : ''}
        </video>
      </a>
    ` : `
      <a class="thumb" href="${v.url}">
        <img class="thumb-img" src="${v.thumb}" alt="" loading="lazy">
      </a>
    `;

    art.innerHTML = `
      ${thumbHTML}
      <div class="meta">
        <div class="meta-row">
          <span class="author">${v.author}</span>
          <span class="views" title="перегляди">◦ ${v.views}</span>
        </div>
        <h3 class="title">${v.title}</h3>
        <button class="kebab" aria-label="Опції"><span></span><span></span><span></span></button>
      </div>
    `;
    container.appendChild(art);

    const vidThumb = art.querySelector('.thumb-video');
    if (vidThumb) {
      const s = Number(vidThumb.dataset.start || 60);
      const e = Number(vidThumb.dataset.end || 65);
      attachPreviewLoop(vidThumb, s, e);

      const w = Math.round(art.clientWidth || 480);
      ensurePosterFromSecond(vidThumb, {
        id: v.id,
        webm: v.videoWebm,
        mp4:  v.videoMp4
      }, 30, w);
    }
  });

  if (!paginationWrap) return;
  paginationWrap.innerHTML = "";

  const makeBtn = (label, p, disabled = false, active = false) => {
    const b = document.createElement('button');
    b.className = 'p-btn';
    b.textContent = label;
    if (active) b.dataset.active = "1";
    if (disabled) b.disabled = true;
    b.addEventListener('click', () => onPageChange && onPageChange(p));
    return b;
  };
  const addDots = () => {
    const s = document.createElement('span');
    s.className = 'dots';
    s.textContent = '…';
    paginationWrap.appendChild(s);
  };

  paginationWrap.appendChild(makeBtn("перша", 1, page === 1));
  paginationWrap.appendChild(makeBtn("‹", page - 1, page === 1));

  const windowSize = 5;
  let startPage = Math.max(1, page - 2);
  let endPage   = Math.min(totalPages, startPage + windowSize - 1);
  if (endPage - startPage < windowSize - 1) startPage = Math.max(1, endPage - windowSize + 1);

  if (startPage > 1) {
    paginationWrap.appendChild(makeBtn("1", 1, false, page === 1));
    if (startPage > 2) addDots();
  }
  for (let p = startPage; p <= endPage; p++) {
    paginationWrap.appendChild(makeBtn(String(p), p, false, p === page));
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) addDots();
    paginationWrap.appendChild(makeBtn(String(totalPages), totalPages, false, page === totalPages));
  }
  paginationWrap.appendChild(makeBtn("›", page + 1, page === totalPages));
  paginationWrap.appendChild(makeBtn("остання", totalPages, page === totalPages));
}

/* ===================== DRAWER ===================== */
function setupDrawer() {
  const open  = () => document.documentElement.classList.add('drawer-open');
  const close = () => document.documentElement.classList.remove('drawer-open');

  if (window.__lexo?._drawerClickHandler) {
    document.removeEventListener('click', window.__lexo._drawerClickHandler);
  }
  if (window.__lexo?._drawerKeyHandler) {
    document.removeEventListener('keydown', window.__lexo._drawerKeyHandler);
  }

  const onClick = (e) => {
    const t = e.target;
    if (t.closest && t.closest('#burgerBtn')) { open(); }
    else if (t.closest && (t.closest('#drawerClose') || t.closest('#backdrop'))) { close(); }
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  window.__lexo = window.__lexo || {};
  window.__lexo._drawerClickHandler = onClick;
  window.__lexo._drawerKeyHandler   = onKey;
}

/* ===================== PAGE STATE SAVE ===================== */
function pageKey({cat, q, perPage}) {
  const c = (cat || 'all').toLowerCase();
  const s = (q   || '').toLowerCase();
  const p = perPage || 20;
  return `pg:${c}|q=${s}|pp=${p}`;
}
function loadSavedPage({cat, q, perPage, totalPages}) {
  const key = pageKey({cat, q, perPage});
  const n = Number(localStorage.getItem(key));
  const page = Number.isFinite(n) ? n : 1;
  return Math.min(Math.max(1, page), totalPages || 1);
}
function savePage({cat, q, perPage, page}) {
  const key = pageKey({cat, q, perPage});
  localStorage.setItem(key, String(page));
}
function clearSavedPage({cat, q, perPage}) {
  const key = pageKey({cat, q, perPage});
  localStorage.removeItem(key);
}

/* ===================== INDEX/CATEGORY ===================== */
function bootIndexOrCategory() {
  const grid = byId('videoGrid');
  const pag  = byId('pagination');
  if (!grid || !pag) return;

  const url = new URL(location.href);
  const q   = (url.searchParams.get('q')||'').toLowerCase().trim();
  const cat = (url.searchParams.get('cat')||'').toLowerCase().trim();

  let list = DATA;
  if (q)   list = list.filter(i => i.title.toLowerCase().includes(q));
  if (cat) list = list.filter(i => i.categories.includes(cat));

  const state = { page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(list.length / state.perPage));
  state.page = loadSavedPage({cat, q, perPage: state.perPage, totalPages});

  const rerender = () => renderGrid({
    container: grid, paginationWrap: pag, items: list,
    page: state.page, perPage: state.perPage,
    onPageChange: (p) => {
      state.page = p;
      savePage({cat, q, perPage: state.perPage, page: state.page});
      renderGrid({
        container: grid, paginationWrap: pag, items: list,
        page: state.page, perPage: state.perPage,
        onPageChange: arguments.callee
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  rerender();

  // Пошук
  const input = byId('searchInput');
  const btn   = byId('searchBtn');
  const doSearch = () => {
    const val = (input?.value || '').trim();
    const u = new URL(location.href);
    if (val) u.searchParams.set('q', val); else u.searchParams.delete('q');
    history.replaceState({}, '', u.toString());

    let tmp = DATA;
    const qv = val.toLowerCase();
    if (qv) tmp = tmp.filter(i => i.title.toLowerCase().includes(qv));
    if (cat) tmp = tmp.filter(i => i.categories.includes(cat));
    list = tmp;

    clearSavedPage({cat, q, perPage: state.perPage});
    state.page = 1;
    savePage({cat, q: qv, perPage: state.perPage, page: state.page});

    renderGrid({
      container: grid, paginationWrap: pag, items: list,
      page: state.page, perPage: state.perPage,
      onPageChange: (p) => {
        state.page = p;
        savePage({cat, q: qv, perPage: state.perPage, page: state.page});
        renderGrid({
          container: grid, paginationWrap: pag, items: list,
          page: state.page, perPage: state.perPage,
          onPageChange: arguments.callee
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };
  btn?.addEventListener('click', doSearch);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

/* ===================== POSTER FROM SECOND ===================== */
async function ensurePosterFromSecond(videoEl, {id, webm, mp4}, second = 30, width = 480) {
  if (videoEl.getAttribute('data-poster-ready') === '1') return;

  const key = `poster:${id}:s${second}:w${width}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    videoEl.poster = cached;
    videoEl.setAttribute('data-poster-ready', '1');
    return;
  }

  const sources = [];
  if (webm) sources.push({ src: webm, type: 'video/webm' });
  if (mp4)  sources.push({ src: mp4,  type: 'video/mp4'  });
  if (!sources.length) return;

  try {
    const dataUrl = await makePosterFromVideo(sources, second, width);
    if (dataUrl) {
      videoEl.poster = dataUrl;
      videoEl.setAttribute('data-poster-ready', '1');
      localStorage.setItem(key, dataUrl);
    }
  } catch(e) { /* silence */ }
}

async function makePosterFromVideo(sources, second = 40, width = 960) {
  return new Promise((resolve) => {
    const vg = document.createElement('video');
    vg.crossOrigin = 'anonymous';
    vg.muted = true;
    vg.playsInline = true;
    vg.preload = 'auto';

    (sources || []).forEach(s => {
      const src = document.createElement('source');
      src.src = s.src;
      src.type = s.type || '';
      vg.appendChild(src);
    });

    const onError = () => resolve(null);
    vg.addEventListener('error', onError);

    vg.addEventListener('loadedmetadata', () => {
      const target = Math.min(second, Math.max(0, vg.duration - 0.2));
      const onSeeked = () => {
        const ratio = vg.videoHeight ? (vg.videoWidth / vg.videoHeight) : (16/9);
        const w = width, h = Math.round(w / ratio);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(vg, 0, 0, w, h);
        try { resolve(c.toDataURL('image/webp', 0.9)); } catch { resolve(null); }
        vg.removeEventListener('seeked', onSeeked);
      };
      vg.addEventListener('seeked', onSeeked);
      try { vg.currentTime = target; } catch { resolve(null); }
    });

    vg.play().catch(()=>{ /* ignore autoplay restrictions */ });
  });
}

/* ===================== ICONS (SVG) ===================== */
const ICONS = {
  play:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  vol:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3z"/></svg>',
  mute:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3z"/><path d="M19 8l-3 3m0 0l-3 3m3-3l3 3m-3-3l3-3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  pip:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 7H5a2 2 0 0 0-2 2v7h2V9h14v10H9v2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><rect x="9" y="11" width="6" height="4"/></svg>',
  full:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm12 5h-5v-2h3v-3h2v5zM7 5h3V3H5v5h2V5zm12 0v3h-3v2h5V3h-2z"/></svg>',
  back15: `
    <svg viewBox="0 0 26 26" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4v3L7 3l5-4v3a9 9 0 1 1-9 9H1a11 11 0 1 0 11-11z"/>
      <text x="9" y="17" font-size="8" fill="#fff" font-family="system-ui, Arial">15</text>
    </svg>
  `,
  fwd15: `
    <svg viewBox="0 0 26 26" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 4V1l5 4-5 4V6a9 9 0 1 0 9 9h2A11 11 0 1 1 14 4z"/>
      <text x="9" y="17" font-size="8" fill="#fff" font-family="system-ui, Arial">15</text>
    </svg>
  `
};

/* ===================== CUSTOM PLAYER ===================== */
function setupCustomPlayer(player) {
  if (player.dataset.lexoPlayerInit === '1') return;
  player.dataset.lexoPlayerInit = '1';
  const wrap = byId('xplayer');

  // Controls
  const btnPlay = byId('btnPlay');
  const btnMute = byId('btnMute');
  const btnFull = byId('btnFull');
  const btnPiP  = byId('btnPiP');
  const rngVol  = byId('volumeRange');
  const timeCur = byId('timeCurrent');
  const timeDur = byId('timeDuration');

  const progress = byId('progress');
  const bar   = byId('progressBar');
  const buf   = byId('bufferBar');
  const thumb = byId('progressThumb');

  // Overlay controls
  const xo       = byId('xOverlay');
  const xoCenter = byId('xoCenter');
  const xoBack   = byId('xoBack');
  const xoFwd    = byId('xoForward');

  // ===== mobile volume popover =====
  const isSmall = () => window.matchMedia('(max-width: 600px)').matches;

  let volPopover = byId('volPopover');
  if (!volPopover) {
    volPopover = document.createElement('div');
    volPopover.id = 'volPopover';
    volPopover.className = 'vol-popover';
    btnMute?.parentElement?.insertBefore(volPopover, btnMute.nextSibling);
  }

  function arrangeVolumeUI() {
    if (isSmall()) {
      if (rngVol.parentElement !== volPopover) volPopover.appendChild(rngVol);
      volPopover.classList.remove('show');
      btnMute?.setAttribute('aria-expanded', 'false');
    } else {
      const volBox = btnMute?.parentElement;
      if (volBox && rngVol.parentElement !== volBox) volBox.appendChild(rngVol);
      volPopover.classList.remove('show');
      btnMute?.setAttribute('aria-expanded', 'false');
    }
  }
  arrangeVolumeUI();
  window.addEventListener('resize', arrangeVolumeUI, { passive: true });

  document.addEventListener('click', (e) => {
    if (!isSmall()) return;
    const t = e.target;
    if (!t) return;
    const inPopover = volPopover.contains(t);
    const isBtn = btnMute.contains(t);
    if (!inPopover && !isBtn && volPopover.classList.contains('show')) {
      volPopover.classList.remove('show');
      btnMute?.setAttribute('aria-expanded', 'false');
    }
  });

  // readiness / pending seek
  let isReady = false;
  let pendingSeekOp = null;

  if (player.readyState >= 1 && Number.isFinite(player.duration) && player.duration > 0) {
    isReady = true;
  }

  // helpers
  const fmt = (t) => {
    if (!isFinite(t)) return '00:00';
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    const m = Math.floor((t / 60) % 60).toString().padStart(2, '0');
    const h = Math.floor(t / 3600);
    return h ? `${h}:${m}:${s}` : `${m}:${s}`;
  };
  const clamp = (t) => {
    const time = Number.isFinite(t) ? t : 0;
    let max = 0;
    if (player.seekable && player.seekable.length) {
      max = player.seekable.end(player.seekable.length - 1);
    } else if (Number.isFinite(player.duration) && player.duration > 0) {
      max = player.duration;
    }
    return Math.min(Math.max(0, time), Math.max(0, max));
  };

  // icons
  function setPlayIcon(){
    btnPlay.innerHTML = player.paused ? ICONS.play : ICONS.pause;
    xoCenter.innerHTML = player.paused ? ICONS.play : ICONS.pause;
  }
  function setMuteIcon(){
    if (player.muted || player.volume === 0) {
      btnMute.innerHTML = ICONS.mute;
      btnMute.classList.add('muted');
    } else {
      btnMute.innerHTML = ICONS.vol;
      btnMute.classList.remove('muted');
    }
  }
  btnPlay.innerHTML = ICONS.play;
  btnMute.innerHTML = ICONS.vol;
  btnPiP.innerHTML  = ICONS.pip;
  btnFull.innerHTML = ICONS.full;
  xoBack.innerHTML  = ICONS.back15;
  xoFwd.innerHTML   = ICONS.fwd15;
  xoCenter.innerHTML= ICONS.play;

  // time / progress
  function updateTime(){
    timeCur.textContent = fmt(player.currentTime || 0);
    timeDur.textContent = fmt(player.duration || 0);
    const ratio = player.duration ? (player.currentTime / player.duration) : 0;
    bar.style.width = `${ratio * 100}%`;
    thumb.style.left = `${ratio * 100}%`;
  }
  function updateBuffer(){
    if (!player.buffered || player.buffered.length===0 || !player.duration){ buf.style.width = '0%'; return; }
    const end = player.buffered.end(player.buffered.length - 1);
    const ratio = Math.min(1, end / player.duration);
    buf.style.width = `${ratio * 100}%`;
  }

  // volume
  let lastVolume = 1;
  function paintVolume(){
    const val = player.muted ? 0 : (player.volume ?? 1);
    const pct = Math.round(val * 100);
    rngVol.style.background = `linear-gradient(to right, var(--accent-red) ${pct}%, rgba(255,255,255,.25) ${pct}%)`;
  }
  function setVolumeFromRange(){
    const val = Number(rngVol.value);
    player.volume = val;
    if (val === 0) { player.muted = true; } else { player.muted = false; lastVolume = val; }
    setMuteIcon();
    paintVolume();
  }
  rngVol.addEventListener('input', setVolumeFromRange);

  btnMute.addEventListener('click', () => {
    if (isSmall()){
      const willShow = !volPopover.classList.contains('show');
      volPopover.classList.toggle('show', willShow);
      btnMute.setAttribute('aria-expanded', willShow ? 'true' : 'false');
      return; // на мобилке btnMute только раскрывает поповер
    }
    // десктоп — как раньше: mute/unmute
    if (player.muted || player.volume === 0) {
      player.muted = false;
      player.volume = lastVolume || 1;
    } else {
      player.muted = true;
    }
    rngVol.value = player.muted ? 0 : player.volume;
    setMuteIcon(); paintVolume();
  });

  // play/pause + overlay auto-hide
  let overlayTimer = null;
  function showOverlayTemp(){
    xo.classList.add('show');
    if (overlayTimer) clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => xo.classList.remove('show'), 1200);
  }
  async function togglePlay(){
    try {
      if (player.paused) await player.play(); else player.pause();
    } catch {
      try { player.muted = true; await player.play(); setTimeout(()=>{ player.muted = false; }, 100); } catch {}
    }
    setPlayIcon();
    showOverlayTemp();
  }
  btnPlay.addEventListener('click', togglePlay);
  player.addEventListener('click', togglePlay);
  xoCenter.addEventListener('click', togglePlay);
  player.addEventListener('play', setPlayIcon);
  player.addEventListener('pause', setPlayIcon);

  // seek
  function applySeekAbs(t){
    if (!isFinite(t)) t = 0;
    if (!isReady){ pendingSeekOp = { type: 'abs', val: t }; return; }
    player.currentTime = clamp(t);
  }
  function seekBy(delta){
    if (!isReady){ pendingSeekOp = { type: 'delta', val: delta }; return; }
    try {
      player.currentTime = clamp((player.currentTime || 0) + delta);
      updateTime(); showOverlayTemp();
    } catch(e) { /* silence */ }
  }
  xoBack.addEventListener('click', () => seekBy(-15));
  xoFwd .addEventListener('click', () => seekBy(+15));

  // progress drag
  function getTimeOrRatioFromXY(clientX){
    const rect = progress.getBoundingClientRect();
    const width = rect.width || rect.right - rect.left;
    if (width <= 0) return { ratio: 0 };
    const x = Math.min(Math.max(0, clientX - rect.left), width);
    const ratio = x / width;
    if (!Number.isFinite(player.duration) || player.duration <= 0) return { ratio };
    return { time: ratio * player.duration };
  }
  function onSeekStart(e){
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const result = getTimeOrRatioFromXY(clientX);
    if (result.ratio !== undefined) {
      pendingSeekOp = { type: 'ratio', val: result.ratio };
    } else {
      applySeekAbs(result.time);
    }
    const move = (ev)=>{
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const resMove = getTimeOrRatioFromXY(cx);
      if (resMove.ratio !== undefined) pendingSeekOp = { type: 'ratio', val: resMove.ratio };
      else applySeekAbs(resMove.time);
    };
    const stop = ()=>{
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', stop);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', move, {passive:true});
    window.addEventListener('touchend', stop);
  }
  progress.addEventListener('mousedown', onSeekStart);
  progress.addEventListener('touchstart', onSeekStart, {passive:true});

  // hotkeys
  document.addEventListener('keydown', (e)=>{
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.code === 'Space'){ e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight'){ seekBy(+5); }
    if (e.code === 'ArrowLeft'){  seekBy(-5); }
    if (e.key === 'm' || e.key === 'M'){
      if (isSmall()){
        const willShow = !volPopover.classList.contains('show');
        volPopover.classList.toggle('show', willShow);
        btnMute.setAttribute('aria-expanded', willShow ? 'true' : 'false');
      } else {
        btnMute.click();
      }
    }
    if (e.key === 'f' || e.key === 'F'){
      if (!document.fullscreenElement && !document.webkitFullscreenElement){
        if (wrap.requestFullscreen) wrap.requestFullscreen();
        else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    }
  });

  // PiP
  btnPiP.addEventListener('click', async ()=>{
    try{
      if (document.pictureInPictureElement){
        await document.exitPictureInPicture();
      } else if (player.requestPictureInPicture){
        await player.requestPictureInPicture();
      }
    }catch(e){}
  });

  btnFull.addEventListener('click', ()=>{
    if (!document.fullscreenElement && !document.webkitFullscreenElement){
      if (wrap.requestFullscreen) wrap.requestFullscreen();
      else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  });

  // show overlay on move
  const showOnMouseMove = () => showOverlayTemp();
  wrap.addEventListener('mousemove', showOnMouseMove);
  wrap.addEventListener('touchstart', showOnMouseMove, {passive:true});

  // sync from player (без спама в консоль)
  player.addEventListener('timeupdate', updateTime);
  player.addEventListener('durationchange', updateTime);
  player.addEventListener('progress', updateBuffer);
  player.addEventListener('loadedmetadata', ()=>{
    isReady = true;
    updateTime(); updateBuffer();
    if (pendingSeekOp !== null){
      if (pendingSeekOp.type === 'abs'){
        player.currentTime = clamp(pendingSeekOp.val);
      } else if (pendingSeekOp.type === 'delta'){
        player.currentTime = clamp((player.currentTime || 0) + pendingSeekOp.val);
      } else if (pendingSeekOp.type === 'ratio'){
        if (Number.isFinite(player.duration) && player.duration > 0) {
          player.currentTime = clamp(pendingSeekOp.val * player.duration);
        }
      }
      pendingSeekOp = null;
    }
  });

  // init
  rngVol.value = player.volume ?? 1;
  paintVolume();
  setPlayIcon(); setMuteIcon(); updateTime(); updateBuffer();
}

/* ===================== VIDEO PAGE BOOT ===================== */
function bootVideo() {
  const player = byId('player');
  if (!player) return;

  const id = Number(new URL(location.href).searchParams.get('id') || 1);
  const video = DATA.find(v => v.id === id) || DATA[0];

  // Заголовок/теги
  qs('#videoTitle')?.append(document.createTextNode(video.title));
  const tags = qs('#videoTags');
  (video.tags || []).forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tags?.appendChild(span);
  });

  // Источники
  player.innerHTML = "";
  const sources = [];
  if (video.videoWebm){ const s=document.createElement('source'); s.src=video.videoWebm; s.type="video/webm"; player.appendChild(s); sources.push({src:s.src,type:s.type}); }
  if (video.videoMp4){  const s=document.createElement('source'); s.src=video.videoMp4;  s.type="video/mp4";  player.appendChild(s); sources.push({src:s.src,type:s.type}); }

  if (sources.length === 0){
    player.poster = video.videoPoster || video.thumb || "static/img/placeholder.webp";
    setupCustomPlayer(player);
    return;
  }

  player.load();
  player.playsInline = true;

  (async ()=>{
    const poster = await makePosterFromVideo(sources, 40, 960);
    player.poster = poster || video.videoPoster || video.thumb || "static/img/placeholder.webp";
  })();

  setupCustomPlayer(player);

  // related
  const relatedGrid = byId('relatedGrid');
  const relatedPag  = byId('relatedPag');
  if (relatedGrid && relatedPag) {
    const currentCat = video.categories[0];
    const relatedList = DATA.filter(v => v.id !== video.id && v.categories.includes(currentCat));
    const state = { page: 1, perPage: 10 };
    const rerenderRelated = ()=> renderGrid({
      container: relatedGrid,
      paginationWrap: relatedPag,
      items: relatedList,
      page: state.page,
      perPage: state.perPage,
      onPageChange: (p)=>{ state.page = p; rerenderRelated(); relatedGrid.scrollIntoView({ behavior: 'smooth' }); }
    });
    rerenderRelated();
  }
}

/* ===================== FEEDBACK (stub) ===================== */
function bootFeedback(){
  const form = qs('#contactForm');
  if (!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const note = byId('formNote');
    note.textContent = 'Дякуємо! Повідомлення надіслано (демо, без бекенду).';
    form.reset();
  });
}

/* ===================== BOOT ===================== */
function bootAll() {
  if (!window.__lexo.drawerInited) {
    setupDrawer();
    window.__lexo.drawerInited = true;
  }
  bootIndexOrCategory();
  bootVideo();
  bootFeedback();
}
window.siteBoot = bootAll;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAll);
} else {
  bootAll();
}
