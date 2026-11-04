# 블로그

## 카테고리 관리

`_data/categories.yml`에 이름을 추가하면 게시글 없이도 최상위 카테고리와
카테고리 페이지가 생성됩니다. 빈 카테고리는 글 수가 0으로 표시되며,
페이지에는 “아직 게시글이 없습니다.”가 표시됩니다.

```yaml
- 개발
- Bug Bounty
- 새 카테고리
```

게시글에는 같은 이름을 사용하세요. 글이 생기면 기존 카테고리에 자동으로 합쳐집니다.

```yaml
categories: [개발]
```

글에서만 사용한 카테고리와 Chirpy의 기존 2단계 카테고리도 계속 표시됩니다.
설정 파일은 최상위 카테고리 목록이며, 하위 카테고리는 기존처럼 글의
`categories: [개발, Ruby]`로 지정합니다. 목록에서 이름을 삭제해도 해당
카테고리의 게시글이 있으면 카테고리는 유지됩니다.

`_plugins/empty-categories.rb`가 빈 카테고리를 등록하고, 로컬
`_layouts/categories.html`과 `_layouts/category.html`이 표시를 담당합니다.
현재 GitHub Actions의 Jekyll 빌드에서 플러그인이 실행됩니다.
테마를 업데이트할 때는 로컬 템플릿과 새 버전의 차이도 확인하세요.

## 홈 카테고리 배지

홈의 게시글 카드에는 카테고리가 색상 배지로 표시됩니다.
`_data/category_colors.yml`에서 카테고리별 색상을 지정할 수 있습니다.
사용 가능한 색상은 `blue`, `purple`, `amber`, `red`, `green`, `cyan`이며,
지정하지 않은 카테고리는 회색입니다. 표시 방식은 `_layouts/home.html`과
`assets/css/jekyll-theme-chirpy.scss`에서 수정할 수 있습니다.

## 추천글과 전체 글

홈 상단에는 `_tabs/about.md`의 소개가 화면 높이의 약 절반으로 표시됩니다.
현재 홈은 About 본문을 그대로 렌더링하되 `링크` 제목부터 잘라서
이름·소개 문장·주 분야·소속까지만 표시합니다. 링크를 포함한 전체 내용은
About 페이지에서 볼 수 있습니다.
하단에는 대표글 한 장을 표시하며, 여러 장이면 좌우 버튼 또는 버튼에
포커스를 둔 상태에서 방향키로 전환할 수 있습니다. 자동 전환은 없습니다.

게시글 상단의 YAML에 `recommended: true`를 추가하면 홈의 대표글로 표시되고
카드에 “추천글”이 표시됩니다. 기존 `pin: true`도 추천글로 취급합니다.
추천글끼리는 최신순입니다. 추천글이 없으면 최신 글 목록을 사용합니다.
추천을 해제하려면 해당 설정을 삭제하거나 `false`로 바꾸세요.

```yaml
---
title: 글 제목
recommended: true
categories: [개발]
---
```

사이드바의 “전체 글”(`/all-posts/`)에서는 추천 여부에 관계없이 모든 글을
최신순으로 한 페이지에 표시합니다. `hidden: true`인 글은 두 목록에서 제외됩니다.
두 화면의 카드는 `_includes/post-cards.html`을 공유합니다.

전체 글 페이지에서는 카테고리 하나와 태그 여러 개를 함께 선택할 수 있습니다.
선택한 조건은 URL에 저장되며, 카테고리와 모든 태그를 동시에 만족하는 글만
표시됩니다. 글의 분류는 각 게시글 front matter에서 직접 수정합니다.

```yaml
categories: [개발]
tags: [glibc, heap, pwn]
```

필터 화면의 동작은 `assets/js/all-posts-filter.js`, 표시 방식은
`assets/css/jekyll-theme-chirpy.scss`에서 수정할 수 있습니다.

소셜 미리보기 이미지는 `_config.yml`의 `social_preview_image`에서 바꿀 수 있습니다.

## 사이드바 프로필 이미지

`_includes/sidebar.html`에서 `assets/img/koshka_m200.jpg`를 사이드바 상단에
표시합니다. 원형 아바타 대신 그림을 크게 보여주며 아래쪽을 배경색으로
연결합니다. 이미지의 높이와 위치는 `assets/css/jekyll-theme-chirpy.scss`의
`.sidebar-portrait`에서 조절할 수 있습니다. 이미지 하단의
`Illustration: @Koshka`를 클릭하면 작가의 [X 프로필](https://x.com/Koshka_Pic)로
이동합니다.

## 테마 라이선스

Chirpy는 MIT 라이선스로 수정·사용·배포가 허용됩니다. 복사본 또는 중요한
부분에는 저작권 및 허가 문구를 포함해야 합니다.
수정한 템플릿의 원본은 Chirpy v7.3.1이며 원본 라이선스는
`LICENSE-CHIRPY`에 보존합니다. Starter의 `LICENSE`도 유지합니다.

푸터는 `_includes/footer.html`에서 재정의하며, “Powered by Jekyll ·
Customized from Chirpy”로 수정된 테마를 사용한다는 사실을 표시합니다.

- https://github.com/cotes2020/jekyll-theme-chirpy/blob/v7.3.1/LICENSE
