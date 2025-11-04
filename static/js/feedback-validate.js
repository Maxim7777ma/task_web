// feedback-validate.js
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const note = document.getElementById('formNote');
  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');
  const subjectHidden = document.getElementById('subject');
  const messageField = document.getElementById('message');

  function setError(inputEl, msg){
    const field = inputEl.closest('.field') || inputEl.closest('.subject-control') || inputEl;
    const errEl = field.querySelector('.field-error') || document.getElementById(inputEl.id + '-error');
    field.classList.add('error');
    inputEl.setAttribute('aria-invalid', 'true');
    if (errEl) errEl.textContent = msg || '';
  }

  function clearError(inputEl){
    const field = inputEl.closest('.field') || inputEl.closest('.subject-control') || inputEl;
    const errEl = field.querySelector('.field-error') || document.getElementById(inputEl.id + '-error');
    field.classList.remove('error');
    inputEl.removeAttribute('aria-invalid');
    if (errEl) errEl.textContent = '';
  }

  const NAME_RE = /^[\p{L}\p{M}'\-.\s]{2,}$/u;

  function validate(){
    let ok = true;

    // honeypot
    if (form.website && form.website.value.trim() !== ''){
      return false; // бот
    }

    // name
    clearError(nameField);
    const nameVal = nameField.value.trim();
    if (!NAME_RE.test(nameVal)){
      setError(nameField, 'Вкажіть коректне ім’я (мінімум 2 символи).');
      ok = false;
    }

    // email — доверяем HTML5, но дадим своё сообщение
    clearError(emailField);
    if (!emailField.checkValidity()){
      setError(emailField, 'Вкажіть дійсний email.');
      ok = false;
    }

    // subject
    clearError(subjectHidden);
    if (!subjectHidden.value || subjectHidden.value.trim() === ''){
      const toggle = document.querySelector('.subject-toggle');
      toggle.classList.add('error');
      const err = document.getElementById('subject-error');
      if (err) err.textContent = 'Оберіть тему звернення.';
      ok = false;
    } else {
      document.querySelector('.subject-toggle')?.classList.remove('error');
      const err = document.getElementById('subject-error'); if (err) err.textContent = '';
    }

    // message
    clearError(messageField);
    const msg = messageField.value.trim();
    if (msg.length < 20){
      setError(messageField, 'Опишіть питання детальніше (мін. 20 символів).');
      ok = false;
    } else if (msg.length > 2000){
      setError(messageField, 'Повідомлення надто довге (макс. 2000).');
      ok = false;
    }

    // reCAPTCHA v2
    const captchaErr = document.getElementById('captcha-error');
    if (typeof grecaptcha !== 'undefined'){
      const resp = grecaptcha.getResponse();
      if (!resp || resp.length === 0){
        if (captchaErr) captchaErr.textContent = 'Підтвердіть, що ви не робот.';
        ok = false;
      } else {
        if (captchaErr) captchaErr.textContent = '';
      }
    } else {
      // если скрипт капчи не грузится — не блочим форму на демо
      console.warn('reCAPTCHA не підключено: додайте SITE_KEY у feedback.html');
    }

    return ok;
  }

  // Live очистка ошибок
  [nameField, emailField, messageField].forEach(el=>{
    el.addEventListener('input', ()=> clearError(el));
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if (!validate()){
      form.reportValidity?.();
      return;
    }

    // DEMO: без бекенда просто показываем ноту.
    note.textContent = 'Дякуємо! Повідомлення надіслано (демо).';
    form.reset();
    // сбрасываем тему вручную
    if (window.subjectSelect) window.subjectSelect.selectValue('');
    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
  });
})();
