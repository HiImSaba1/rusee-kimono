export const AUTOMATION_MAX_ATTEMPTS = 5;
export const AUTOMATION_STALE_LOCK_MINUTES = 15;

export function automationBackoffSeconds(attempt: number) {
  return Math.min(3600, 30 * (2 ** Math.max(0, Math.min(attempt - 1, 7))));
}

export function sanitizeAutomationError(error: unknown) {
  const source = error instanceof Error ? error.message : "Automation failed";
  return source
    .replace(/(authorization|password|secret|token|cookie|api[-_ ]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/mysql:\/\/[^\s]+/gi, "mysql://[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300) || "Automation failed";
}
