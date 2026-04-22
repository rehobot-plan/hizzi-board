const PORTS = [3000, 3001, 3002];
const TIMEOUT_MS = 2000;

export async function findDevServerPort(): Promise<number> {
  for (const port of PORTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`http://localhost:${port}`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status === 307 || res.status === 302) return port;
    } catch {
      // port not responding, try next
    }
  }
  throw new Error(`dev server not found on port ${PORTS.join(', ')}`);
}
