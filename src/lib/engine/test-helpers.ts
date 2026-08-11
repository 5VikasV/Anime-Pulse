export function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: Expected ${expected}, got ${actual}. ${message ?? ""}`);
  }
}

export function assertStrict(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message ?? "Condition is false"}`);
  }
}

export async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✔ [PASS] ${name}`);
  } catch (err) {
    console.error(`✖ [FAIL] ${name}:`, err);
    throw err;
  }
}
