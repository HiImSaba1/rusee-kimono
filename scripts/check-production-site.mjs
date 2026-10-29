const configuredAppUrl = process.env.APP_URL?.trim();

if (!configuredAppUrl) {
  throw new Error("APP_URL is required for the production site check.");
}

const appUrl = new URL(configuredAppUrl);

if (appUrl.protocol !== "https:") {
  throw new Error("APP_URL must use HTTPS for the production site check.");
}

appUrl.pathname = "/";
appUrl.search = "";
appUrl.hash = "";

const timeoutMs = 15_000;
const checkedAt = new Date().toISOString();

async function request(pathname) {
  const url = new URL(pathname, appUrl);

  try {
    const response = await fetch(url, {
      headers: { "user-agent": "rusee-production-site-check/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });

    return {
      ok: response.ok,
      status: response.status,
      response,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error:
        error instanceof Error && error.name === "TimeoutError"
          ? "timeout"
          : "connection_failed",
    };
  }
}

const live = await request("/api/health/live");
let liveContract = false;

if (live.ok && live.response) {
  try {
    const payload = await live.response.json();
    liveContract = payload?.status === "live";
  } catch {
    liveContract = false;
  }
}

const homepage = await request("/");
const ready = await request("/api/health/ready");

const operational = live.ok && liveContract && homepage.ok;
const result = {
  status: operational ? "operational" : "unavailable",
  checkedAt,
  checks: {
    liveness: {
      ok: live.ok && liveContract,
      httpStatus: live.status,
      ...(live.error ? { error: live.error } : {}),
    },
    homepage: {
      ok: homepage.ok,
      httpStatus: homepage.status,
      ...(homepage.error ? { error: homepage.error } : {}),
    },
    readiness: {
      ok: ready.ok,
      httpStatus: ready.status,
      informational: true,
      ...(ready.error ? { error: ready.error } : {}),
    },
  },
};

const output = JSON.stringify(result);

if (operational) {
  console.log(output);
} else {
  console.error(output);
  process.exitCode = 1;
}
