const ALWAYS_AVAILABLE_PREFIXES = ["/admin", "/api", "/order", "/payment"] as const;

export function maintenanceModeEnabled(value = process.env.MAINTENANCE_MODE) {
  return value?.trim().toLowerCase() === "true";
}

export function isMaintenanceBypassPath(pathname: string) {
  if (pathname === "/maintenance") return true;
  return ALWAYS_AVAILABLE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function shouldShowMaintenance(pathname: string, enabled = maintenanceModeEnabled()) {
  return enabled && !isMaintenanceBypassPath(pathname);
}
