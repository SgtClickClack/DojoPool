import type { Config } from '@jest/types';

// Example usage of the Config type
const jestConfig: Config.InitialOptions = {
    globals: {},
    moduleFileExtensions: ['js', 'ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
    testPathIgnorePatterns: ['/node_modules/']
};

console.log('Jest types are available at compile time.');
console.log('Example config:', jestConfig); 