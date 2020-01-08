const { defaults } = require('jest-config');

module.exports = {
    globals: {
        'ts-jest': {
            // No need to run babel in our tests, so turn it off.
            babelConfig: false
        }
    },
    preset: 'ts-jest',
    moduleDirectories: [ 'node_modules', 'src' ],
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx', 'js', 'jsx'],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
        "^.+\\.jsx?$": "babel-jest"
    },
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
};