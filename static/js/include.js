async function inject(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;
  const res = await fetch(url, { credentials: 'omit' });
  const html = await res.text();
  host.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Подставляем partials (пути относительные к корню сайта — поправь если нужно)
  await Promise.all([
    inject('#__header', 'partials/header.html'),
    inject('#__footer', 'partials/footer.html')
  ]);

  // После вставки — реинициализируем поведение (бургер, поиск и т.д.)
  if (typeof window.siteBoot === 'function') {
    window.siteBoot({ afterIncludes: true });
  }

  // Хук для кастомной логики страниц, если понадобится
  document.dispatchEvent(new CustomEvent('partials:ready'));
});
