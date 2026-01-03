export function ensureEnv(keys: string[]) {
  const missing = keys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `   Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}
