// dmca.js — згортання, copy-link, copy шаблону, «наверх», Expand/Collapse all
(function(){
  const grid = document.getElementById('dmcaGrid');
  if (!grid) return;

  // Перемикачі секцій + копі-лінк + копі-код
  grid.addEventListener('click', (e)=>{
    const tgl = e.target.closest('[data-toggle]');
    const link = e.target.closest('[data-copy]');
    const copyCode = e.target.closest('[data-copy-code]');

    if (tgl){
      const sel = tgl.getAttribute('data-toggle');
      const sec = document.querySelector(sel);
      if (sec){
        const collapsed = sec.classList.toggle('is-collapsed');
        tgl.setAttribute('aria-expanded', String(!collapsed));
      }
    }

    if (link){
      const sel = link.getAttribute('data-copy');
      const el = document.querySelector(sel);
      if (el && el.id){
        const url = `${location.origin}${location.pathname}#${el.id}`;
        navigator.clipboard.writeText(url).then(()=>{
          link.classList.add('ok'); link.title = 'Скопійовано';
          setTimeout(()=>{ link.classList.remove('ok'); link.title='Скопіювати посилання'; }, 1200);
        });
      }
    }

    if (copyCode){
      const sel = copyCode.getAttribute('data-copy-code');
      const codeEl = document.querySelector(sel);
      if (codeEl){
        const text = codeEl.innerText;
        navigator.clipboard.writeText(text).then(()=>{
          copyCode.classList.add('ok'); copyCode.title = 'Шаблон скопійовано';
          setTimeout(()=>{ copyCode.classList.remove('ok'); copyCode.title='Скопіювати текст шаблону'; }, 1200);
        });
      }
    }
  });

  // Expand/Collapse all
  document.querySelector('[data-act="expand-all"]')?.addEventListener('click', ()=>{
    document.querySelectorAll('.prose_block').forEach(sec=>{
      sec.classList.remove('is-collapsed');
      sec.querySelector('.icon-btn.chevron')?.setAttribute('aria-expanded','true');
    });
  });
  document.querySelector('[data-act="collapse-all"]')?.addEventListener('click', ()=>{
    document.querySelectorAll('.prose_block').forEach(sec=>{
      sec.classList.add('is-collapsed');
      sec.querySelector('.icon-btn.chevron')?.setAttribute('aria-expanded','false');
    });
  });

  // «На верх»
  const toTop = document.getElementById('toTop');
  const onScroll = ()=>{
    if (window.scrollY > 300) toTop.classList.add('show'); else toTop.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  toTop?.addEventListener('click', ()=> window.scrollTo({ top:0, behavior:'smooth' }) );

  // Якщо є хеш — підсвічуємо блок
  if (location.hash){
    const target = document.querySelector(location.hash);
    if (target){
      target.classList.remove('is-collapsed');
      target.scrollIntoView({ behavior:'smooth', block:'start' });
      target.style.outline = '2px solid rgba(0,224,255,.45)';
      target.style.outlineOffset = '2px';
      setTimeout(()=>{ target.style.outline = 'none'; }, 1400);
    }
  }
})();
