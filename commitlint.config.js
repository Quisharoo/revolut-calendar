module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Set all rules to warning level (1) instead of error (2)
    'type-enum': [
      1,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that don't affect code meaning (white-space, formatting, etc)
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvements
        'test',     // Adding or correcting tests
        'chore',    // Changes to build process or auxiliary tools
        'build',    // Changes that affect the build system or external dependencies
        'ci',       // Changes to CI configuration files and scripts
        'revert',   // Reverts a previous commit
      ],
    ],
    'type-case': [1, 'always', 'lower-case'],
    'type-empty': [1, 'never'],
    'scope-case': [1, 'always', 'lower-case'],
    'subject-empty': [1, 'never'],
    'subject-full-stop': [1, 'never', '.'],
    'header-max-length': [1, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [0, 'always', 100], // Disabled to allow longer lines
    'footer-leading-blank': [1, 'always'],
  },
};

