import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "https://newsignagewala.vercel.app";
const DURATION = __ENV.DURATION || "2m";
const THINK_TIME = Number(__ENV.THINK_TIME || 0.5);
const REQUEST_TIMEOUT = __ENV.REQUEST_TIMEOUT || "20s";
const FAIL_FAST_AUTH = (__ENV.FAIL_FAST_AUTH || "true") === "true";
const ALLOW_PUBLIC_FALLBACK =
  (__ENV.ALLOW_PUBLIC_FALLBACK || "false") === "true";

// Default exact split: 100 concurrent users = 10 + 40 + 30 + 20
const ADMIN_VUS = Number(__ENV.ADMIN_VUS || 10);
const BRAND_VUS = Number(__ENV.BRAND_VUS || 40);
const VENDOR_VUS = Number(__ENV.VENDOR_VUS || 30);
const MANAGER_VUS = Number(__ENV.MANAGER_VUS || 20);
const PUBLIC_VUS = Number(__ENV.PUBLIC_VUS || 0);

// Strict but practical SLA thresholds (can be overridden via env)
const P95_MS = Number(__ENV.P95_MS || 2000);
const P99_MS = Number(__ENV.P99_MS || 5000);
const ERR_RATE = Number(__ENV.ERR_RATE || 0.03);
const MAX_429 = Number(__ENV.MAX_429 || 25);

const rateLimited = new Counter("rate_limited_requests");
const authFailures = new Counter("auth_failures");

const publicPages = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
];

const roleRoutes = {
  admin: {
    pages: [
      "/admin",
      "/admin/users",
      "/admin/rates",
      "/admin/role-permissions",
      "/admin/user-roles",
    ],
    api: [
      "/api/admin/users/get",
      "/api/admin/users/brands",
      "/api/admin/users/vendors",
      "/api/admin/users/managers",
      "/api/admin/rates/get",
      "/api/admin/role-permissions/get",
      "/api/admin/user-roles/get",
    ],
  },
  brand: {
    pages: [
      "/brand",
      "/brand/stores",
      "/brand/orders",
      "/brand/rates",
      "/brand/role-permissions",
      "/brand/user-roles",
    ],
    api: [
      "/api/brand/stores/get",
      "/api/brand/orders",
      "/api/brand/racee",
      "/api/brand/rates/get",
      "/api/brand/role-permissions/get",
      "/api/brand/user-roles/get",
      "/api/brand/vendors",
      "/api/brand/tenders",
      "/api/brand/store-authority/get",
      "/api/brand/purchase-authority/get",
    ],
  },
  vendor: {
    pages: [
      "/vendor",
      "/vendor/orders",
      "/vendor/rates",
      "/vendor/role-permissions",
      "/vendor/user-roles",
    ],
    api: [
      "/api/vendor/orders",
      "/api/vendor/rates/get",
      "/api/vendor/role-permissions/get",
      "/api/vendor/user-roles/get",
      "/api/vendor/tenders",
    ],
  },
  manager: {
    pages: ["/manager"],
    api: [
      "/api/manager/orders",
      "/api/manager/stores",
      "/api/manager/racee",
      "/api/manager/rates",
      "/api/manager/role-permissions",
      "/api/manager/teams/authorities",
      "/api/manager/teams/members",
    ],
  },
};

const scenarios = {};

if (ADMIN_VUS > 0) {
  scenarios.admin_routes = {
    executor: "constant-vus",
    vus: ADMIN_VUS,
    duration: DURATION,
    exec: "adminScenario",
  };
}

if (BRAND_VUS > 0) {
  scenarios.brand_routes = {
    executor: "constant-vus",
    vus: BRAND_VUS,
    duration: DURATION,
    exec: "brandScenario",
  };
}

if (VENDOR_VUS > 0) {
  scenarios.vendor_routes = {
    executor: "constant-vus",
    vus: VENDOR_VUS,
    duration: DURATION,
    exec: "vendorScenario",
  };
}

if (MANAGER_VUS > 0) {
  scenarios.manager_routes = {
    executor: "constant-vus",
    vus: MANAGER_VUS,
    duration: DURATION,
    exec: "managerScenario",
  };
}

if (PUBLIC_VUS > 0) {
  scenarios.public_smoke = {
    executor: "constant-vus",
    vus: PUBLIC_VUS,
    duration: DURATION,
    exec: "publicScenario",
  };
}

export const options = {
  scenarios,
  thresholds: {
    http_req_failed: [`rate<${ERR_RATE}`],
    http_req_duration: [`p(95)<${P95_MS}`, `p(99)<${P99_MS}`],
    auth_failures: ["count==0"],
    rate_limited_requests: [`count<${MAX_429}`],
    checks: ["rate>0.95"],
  },
};

function jsonHeaders(token) {
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: REQUEST_TIMEOUT,
  };
}

function isPlaceholder(value) {
  if (!value) return true;
  const v = String(value).trim();
  return v.length === 0 || v === "..." || v.toLowerCase() === "changeme";
}

function assertRoleCredentials(roleName, vus, loginEnv, passEnv) {
  if (vus <= 0) return;
  if (!FAIL_FAST_AUTH) return;

  if (isPlaceholder(loginEnv) || isPlaceholder(passEnv)) {
    throw new Error(
      `[k6] Missing or placeholder credentials for role '${roleName}'. ` +
        `Set ${roleName.toUpperCase()}_LOGIN and ${roleName.toUpperCase()}_PASSWORD with real values or set ${roleName.toUpperCase()}_VUS=0.`,
    );
  }
}

function login(roleName, emailOrPhone, password) {
  if (isPlaceholder(emailOrPhone) || isPlaceholder(password)) {
    return null;
  }

  const payload = JSON.stringify({ emailOrPhone, password });
  const res = http.post(`${BASE_URL}/api/auth/login`, payload, jsonHeaders());

  const ok = check(res, {
    [`${roleName} login status`]: (r) => r.status === 200,
  });

  if (!ok) {
    authFailures.add(1);
    return null;
  }

  const body = safeJson(res);
  if (!body || !body.accessToken) {
    authFailures.add(1);
    return null;
  }

  if (roleName === "manager" && body.requiresBrandSelection) {
    authFailures.add(1);
    return null;
  }

  return body.accessToken;
}

function safeJson(res) {
  try {
    return res.json();
  } catch (_e) {
    return null;
  }
}

function hit(path, token, role, type) {
  const params = {
    ...jsonHeaders(token),
    tags: { role, type, path },
  };

  const res = http.get(`${BASE_URL}${path}`, params);

  if (res.status === 429) {
    rateLimited.add(1);
  }

  check(res, {
    [`${role} ${type} ${path} not 5xx`]: (r) => r.status < 500,
    [`${role} ${type} ${path} not 401`]: (r) => r.status !== 401,
  });

  return res;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function setup() {
  assertRoleCredentials(
    "admin",
    ADMIN_VUS,
    __ENV.ADMIN_LOGIN,
    __ENV.ADMIN_PASSWORD,
  );
  assertRoleCredentials(
    "brand",
    BRAND_VUS,
    __ENV.BRAND_LOGIN,
    __ENV.BRAND_PASSWORD,
  );
  assertRoleCredentials(
    "vendor",
    VENDOR_VUS,
    __ENV.VENDOR_LOGIN,
    __ENV.VENDOR_PASSWORD,
  );
  assertRoleCredentials(
    "manager",
    MANAGER_VUS,
    __ENV.MANAGER_LOGIN,
    __ENV.MANAGER_PASSWORD,
  );

  const tokens = {
    admin: login("admin", __ENV.ADMIN_LOGIN, __ENV.ADMIN_PASSWORD),
    brand: login("brand", __ENV.BRAND_LOGIN, __ENV.BRAND_PASSWORD),
    vendor: login("vendor", __ENV.VENDOR_LOGIN, __ENV.VENDOR_PASSWORD),
    manager: login("manager", __ENV.MANAGER_LOGIN, __ENV.MANAGER_PASSWORD),
  };

  return { tokens };
}

export function publicScenario() {
  const page = pick(publicPages);
  const res = http.get(`${BASE_URL}${page}`, {
    tags: { role: "public", type: "page", path: page },
  });

  check(res, {
    "public page reachable": (r) => r.status < 500,
  });

  sleep(THINK_TIME);
}

function runRoleScenario(role, data) {
  const tokens = data.tokens || {};
  const token = tokens[role];
  const config = roleRoutes[role];

  if (!config || !token) {
    if (!ALLOW_PUBLIC_FALLBACK) {
      authFailures.add(1);
      sleep(THINK_TIME);
      return;
    }

    const page = pick(publicPages);
    const res = http.get(`${BASE_URL}${page}`, {
      tags: { role: `${role}-fallback`, type: "page", path: page },
    });
    check(res, {
      [`${role} fallback reachable`]: (r) => r.status < 500,
    });
    sleep(THINK_TIME);
    return;
  }

  const pagePath = pick(config.pages);
  const apiPath = pick(config.api);

  hit(pagePath, token, role, "page");
  sleep(THINK_TIME);
  hit(apiPath, token, role, "api");
  sleep(THINK_TIME);
}

export function adminScenario(data) {
  runRoleScenario("admin", data);
}

export function brandScenario(data) {
  runRoleScenario("brand", data);
}

export function vendorScenario(data) {
  runRoleScenario("vendor", data);
}

export function managerScenario(data) {
  runRoleScenario("manager", data);
}

export default function (data) {
  if (ADMIN_VUS > 0) {
    runRoleScenario("admin", data);
    return;
  }
  if (BRAND_VUS > 0) {
    runRoleScenario("brand", data);
    return;
  }
  if (VENDOR_VUS > 0) {
    runRoleScenario("vendor", data);
    return;
  }
  if (MANAGER_VUS > 0) {
    runRoleScenario("manager", data);
    return;
  }
  publicScenario();
}
