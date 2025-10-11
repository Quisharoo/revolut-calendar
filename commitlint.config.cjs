module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Set all rules to warning level (1) instead of error (2)
    'type-enum': [
      1,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'build',
        'ci',
        'revert',
      ],
    ],
    'type-case': [1, 'always', 'lower-case'],
    'type-empty': [1, 'never'],
    'scope-case': [1, 'always', 'lower-case'],
    'subject-empty': [1, 'never'],
    'subject-full-stop': [1, 'never', '.'],
    'header-max-length': [1, 'always', 100],
    'body-leading-blank': [1, 'always'],
    // Disabled to allow longer lines
    'body-max-line-length': [0, 'always', 100],
    'footer-leading-blank': [1, 'always'],
  },
};


