declare module '@jest/types' {
    namespace Config {
        interface InitialOptions {
            globals: any;
            moduleFileExtensions: string[];
            transform: Record<string, string | [string, any]>;
            testRegex: string | string[];
            testPathIgnorePatterns: string[];
            // Add other Config properties as needed
        }
    }

    export { Config };
}

// Additional Jest-related type declarations
declare namespace Jest {
    interface Context {
        only: boolean;
        skip: boolean;
        todo: boolean;
        concurrent: boolean;
        each: boolean;
    }

    interface TestContext extends Context {
        failing: boolean;
    }

    interface DescribeContext extends Context {
        failing: boolean;
    }
}

declare global {
    namespace jest {
        interface Mock<T = any, Y extends any[] = any> {
            new (...args: Y): T;
            (...args: Y): T;
        }
    }
} 