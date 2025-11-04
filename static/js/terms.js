// terms.js — згортання блоків, копі-лінк, кнопка «наверх», Expand/Collapse all
(function(){
  const grid = document.getElementById('termsGrid');
  if (!grid) return;

  // Перемикачі «згорнути/розгорнути» для кожного блоку
  grid.addEventListener('click', (e)=>{
    const tgl = e.target.closest('[data-toggle]');
    const copy = e.target.closest('[data-copy]');
    if (tgl){
      const sel = tgl.getAttribute('data-toggle');
      const sec = document.querySelector(sel);
      if (sec){
        const collapsed = sec.classList.toggle('is-collapsed');
        tgl.setAttribute('aria-expanded', String(!collapsed));
      }
    }
    if (copy){
      const sel = copy.getAttribute('data-copy');
      const el = document.querySelector(sel);
      if (el && el.id){
        const url = `${location.origin}${location.pathname}#${el.id}`;
        navigator.clipboard.writeText(url).then(()=>{
          copy.classList.add('ok');
          copy.title = 'Скопійовано';
          setTimeout(()=>{ copy.classList.remove('ok'); copy.title='Скопіювати посилання'; }, 1200);
        }).catch(()=>{ /* ignore */ });
      }
    }
  });

  // Тулбар «розгорнути все / згорнути все»
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

  // Кнопка «наверх»
  const toTop = document.getElementById('toTop');
  const onScroll = ()=>{
    if (window.scrollY > 300) toTop.classList.add('show'); else toTop.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  toTop?.addEventListener('click', ()=> window.scrollTo({ top:0, behavior:'smooth' }) );

  // Якщо є хеш у URL — прокрутимо до блоку й підсвітимо його
  if (location.hash){
    const target = document.querySelector(location.hash);
    if (target){
      target.classList.remove('is-collapsed');
      target.scrollIntoView({ behavior:'smooth', block:'start' });
      target.style.outline = '2px solid rgba(255,59,127,.45)';
      target.style.outlineOffset = '2px';
      setTimeout(()=>{ target.style.outline = 'none'; }, 1400);
    }
  }
})();
