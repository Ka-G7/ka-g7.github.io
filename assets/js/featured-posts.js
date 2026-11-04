(() => {
  const carousel = document.querySelector('[data-featured-carousel]');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('[data-featured-slide]'));
  if (slides.length < 2) return;

  const controls = carousel.querySelector('[data-featured-controls]');
  const position = carousel.querySelector('[data-featured-position]');
  let current = 0;

  function move(step) {
    slides[current].hidden = true;
    current = (current + step + slides.length) % slides.length;
    slides[current].hidden = false;
    position.textContent = `${current + 1} / ${slides.length}`;
  }

  carousel.querySelector('[data-featured-prev]').addEventListener('click', () => move(-1));
  carousel.querySelector('[data-featured-next]').addEventListener('click', () => move(1));
  controls.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  controls.hidden = false;
})();
