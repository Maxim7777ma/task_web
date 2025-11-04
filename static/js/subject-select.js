// subject-select.js
(function () {
  const root = document.getElementById('subjectControl');
  if (!root) return;

  const options = JSON.parse(root.getAttribute('data-options') || '[]');
  const hidden = root.querySelector('#subject');
  const toggle = root.querySelector('.subject-toggle');
  const list = root.querySelector('.subject-list');
  const label = root.querySelector('#subjectLabel');
  const customWrap = document.getElementById('subjectCustomWrap');
  const customInput = document.getElementById('subjectCustom');

  // Build options
  list.innerHTML = options.map((opt, i) =>
    `<button type="button" class="subject-option" role="option" data-value="${opt}" aria-selected="false">${opt}</button>`
  ).join('');

  let open = false;
  let selected = null;

  function setOpen(v){
    open = v;
    list.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  function selectValue(val, fromCustom=false){
    selected = val;
    hidden.value = val;
    label.textContent = val || 'Оберіть тему';

    // «Інше» включает кастомное поле
    const isOther = val === 'Інше';
    customWrap.style.display = isOther ? 'block' : 'none';
    if (isOther && !fromCustom){
      customInput.focus();
      customInput.select();
    }

    // отметим выбранный
    list.querySelectorAll('.subject-option').forEach(btn=>{
      btn.setAttribute('aria-selected', btn.dataset.value === val ? 'true' : 'false');
    });
  }

  // init default
  selectValue('');

  // toggle open
  toggle.addEventListener('click', ()=> setOpen(!open));

  // click outside
  document.addEventListener('click', (e)=>{
    if (!root.contains(e.target)) setOpen(false);
  });

  // keyboard on toggle
  toggle.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' '){
      e.preventDefault(); setOpen(true);
      const first = list.querySelector('.subject-option');
      if (first) first.focus();
    }
  });

  // options handlers
  list.querySelectorAll('.subject-option').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      selectValue(btn.dataset.value);
      setOpen(false);
      toggle.focus();
    });
    btn.addEventListener('keydown', (e)=>{
      const items = Array.from(list.querySelectorAll('.subject-option'));
      const idx = items.indexOf(btn);
      if (e.key === 'ArrowDown'){ e.preventDefault(); (items[idx+1]||items[0]).focus(); }
      if (e.key === 'ArrowUp'){ e.preventDefault(); (items[idx-1]||items.at(-1)).focus(); }
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); btn.click(); }
      if (e.key === 'Escape'){ e.preventDefault(); setOpen(false); toggle.focus(); }
    });
  });

  // custom subject input mirrors to hidden
  customInput.addEventListener('input', ()=>{
    if (hidden.value === 'Інше') {
      hidden.value = `Інше: ${customInput.value.trim()}`;
    }
  });

  // Public API (на случай если добавишь динамично новые темы)
  window.subjectSelect = {
    addOption(labelText){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'subject-option';
      btn.setAttribute('role', 'option');
      btn.dataset.value = labelText;
      btn.textContent = labelText;
      btn.addEventListener('click', ()=>{
        selectValue(btn.dataset.value);
        setOpen(false);
        toggle.focus();
      });
      list.appendChild(btn);
    },
    selectValue
  };
})();
