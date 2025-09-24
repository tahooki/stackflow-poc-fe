declare module "node:test" {
  type TestContext = unknown;
  type TestFunction = (context: TestContext) => void | Promise<void>;
  type NamedTestFunction = (name: string, fn: TestFunction) => void;

  export const describe: NamedTestFunction;
  export const it: NamedTestFunction;
  export const beforeEach: (fn: TestFunction) => void;
  export const afterEach: (fn: TestFunction) => void;
}

declare module "node:assert/strict" {
  interface Assert {
    (value: unknown, message?: string): asserts value;
    strictEqual<T>(actual: T, expected: T, message?: string): void;
    notStrictEqual<T>(actual: T, expected: T, message?: string): void;
    deepStrictEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): asserts value;
  }

  const assert: Assert;
  export default assert;
}
