# frozen_string_literal: true

module Jekyll
  # Run before jekyll-archives so it also creates pages for empty categories.
  class EmptyCategories < Generator
    safe true
    priority :high

    def generate(site)
      names = site.data.fetch('categories', [])
      unless names.is_a?(Array) && names.all? { |name| name.is_a?(String) && !name.strip.empty? }
        raise Jekyll::Errors::FatalException, '_data/categories.yml must be a list of non-empty category names'
      end

      names.each { |name| site.categories[name] ||= [] }
    end
  end
end
