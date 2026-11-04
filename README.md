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

## 테마 라이선스

Chirpy는 MIT 라이선스로 수정·사용·배포가 허용됩니다. 복사본 또는 중요한
부분에는 저작권 및 허가 문구를 포함해야 합니다.
수정한 템플릿의 원본은 Chirpy v7.3.1이며 원본 라이선스는
`LICENSE-CHIRPY`에 보존합니다. Starter의 `LICENSE`도 유지합니다.

푸터는 `_includes/footer.html`에서 재정의하며, “Powered by Jekyll ·
Customized from Chirpy”로 수정된 테마를 사용한다는 사실을 표시합니다.

- https://github.com/cotes2020/jekyll-theme-chirpy/blob/v7.3.1/LICENSE
