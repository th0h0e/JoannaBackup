import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  rules: {
    'react/no-array-index-key': 'off',
  },
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  markdown: false,
  formatters: {
    css: true,
    html: true,
  },
})
