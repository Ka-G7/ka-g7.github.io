(() => {
  const filter = document.querySelector('[data-post-filter]');
  if (!filter) return;

  const categorySelect = filter.querySelector('[data-post-filter-category]');
  const tagInputs = Array.from(filter.querySelectorAll('[data-post-filter-tag]'));
  const resetButton = filter.querySelector('[data-post-filter-reset]');
  const count = document.querySelector('[data-post-filter-count]');
  const status = filter.querySelector('[data-post-filter-status]');
  const empty = document.querySelector('[data-post-filter-empty]');
  const posts = Array.from(document.querySelectorAll('[data-filterable-post]'));

  const splitValues = (value) => (value ? value.split('||').filter(Boolean) : []);

  function selectedTags() {
    return tagInputs.filter((input) => input.checked).map((input) => input.value);
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || '';
    const tags = (params.get('tags') || '').split(',').filter(Boolean);

    categorySelect.value = Array.from(categorySelect.options).some((option) => option.value === category)
      ? category
      : '';
    tagInputs.forEach((input) => {
      input.checked = tags.includes(input.value);
    });
  }

  function writeUrl(category, tags) {
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    url.searchParams.delete('tags');
    if (category) url.searchParams.set('category', category);
    if (tags.length) url.searchParams.set('tags', tags.join(','));
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function applyFilters(updateUrl = true) {
    const category = categorySelect.value;
    const tags = selectedTags();
    let visible = 0;

    posts.forEach((post) => {
      const categories = splitValues(post.dataset.postCategories);
      const postTags = splitValues(post.dataset.postTags);
      const matchesCategory = !category || categories.includes(category);
      const matchesTags = tags.every((tag) => postTags.includes(tag));
      const matches = matchesCategory && matchesTags;
      post.hidden = !matches;
      if (matches) visible += 1;
    });

    if (updateUrl) writeUrl(category, tags);
    count.textContent = `전체 ${visible}개의 글 · 최신순`;
    status.textContent = category || tags.length
      ? `필터 결과 ${visible}개`
      : '모든 글을 표시하고 있습니다.';
    empty.hidden = visible !== 0;
    resetButton.disabled = !category && tags.length === 0;
  }

  readUrl();
  applyFilters(false);
  categorySelect.addEventListener('change', () => applyFilters());
  tagInputs.forEach((input) => input.addEventListener('change', () => applyFilters()));
  resetButton.addEventListener('click', () => {
    categorySelect.value = '';
    tagInputs.forEach((input) => {
      input.checked = false;
    });
    applyFilters();
    categorySelect.focus();
  });
})();
