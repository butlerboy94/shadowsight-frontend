import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export { API_BASE };

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post("/api/auth/token/", { username, password });

export const getMe = () => api.get("/api/auth/me/");

// ── Account / Profile ─────────────────────────────────────────────────────────
export const getProfile = () => api.get("/api/accounts/profile/");
export const updateProfile = (data: object) => api.patch("/api/accounts/profile/", data);
export const changePassword = (data: { current_password: string; new_password: string }) =>
  api.post("/api/accounts/password/change/", data);
export const getActivityLog = () => api.get("/api/accounts/activity/");

// ── Team Management ───────────────────────────────────────────────────────────
export const getTeamMembers = () => api.get("/api/accounts/team/");
export const inviteTeamMember = (data: object) => api.post("/api/accounts/team/", data);
export const updateTeamMemberRole = (id: number, role: string) =>
  api.patch(`/api/accounts/team/${id}/`, { role });
export const removeTeamMember = (id: number) => api.delete(`/api/accounts/team/${id}/`);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardSummary = () => api.get("/api/dashboard/summary/");

// ── Watchlist ─────────────────────────────────────────────────────────────────
export const getWatchlist = () => api.get("/api/dashboard/watchlist/");
export const createWatchlistItem = (data: object) => api.post("/api/dashboard/watchlist/", data);
export const updateWatchlistItem = (id: number, data: object) =>
  api.patch(`/api/dashboard/watchlist/${id}/`, data);
export const deleteWatchlistItem = (id: number) => api.delete(`/api/dashboard/watchlist/${id}/`);

// ── Cases ─────────────────────────────────────────────────────────────────────
export const getCases = () => api.get("/api/cases/");
export const getCase = (id: number) => api.get(`/api/cases/${id}/`);
export const createCase = (data: object) => api.post("/api/cases/", data);
export const updateCase = (id: number, data: object) => api.patch(`/api/cases/${id}/`, data);
export const deleteCase = (id: number) => api.delete(`/api/cases/${id}/`);

// ── Case Activity Timeline ────────────────────────────────────────────────────
export const getCaseActivity = (caseId: number) =>
  api.get(`/api/cases/${caseId}/activity/`);
export const logCaseActivity = (caseId: number, data: { action: string; detail?: string }) =>
  api.post(`/api/cases/${caseId}/activity/`, data);

// ── People ────────────────────────────────────────────────────────────────────
export const getPeople = () => api.get("/api/people/");
export const createPerson = (data: object) => api.post("/api/people/", data);
export const updatePerson = (id: number, data: object) => api.patch(`/api/people/${id}/`, data);
export const deletePerson = (id: number) => api.delete(`/api/people/${id}/`);

// ── Evidence ──────────────────────────────────────────────────────────────────
export const getEvidence = (caseId?: number) =>
  api.get("/api/evidence/", { params: caseId ? { case_id: caseId } : {} });
export const uploadEvidence = (data: FormData) =>
  api.post("/api/evidence/", data, { headers: { "Content-Type": undefined } });

// ── OSINT ─────────────────────────────────────────────────────────────────────
export const getOsintProviders = () => api.get("/api/osint/providers/");
export const runOsintQuery = (data: object) => api.post("/api/osint/query/", data);
export const getOsintResults = (caseId?: number) =>
  api.get("/api/osint/", { params: caseId ? { case_id: caseId } : {} });

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReports = () => api.get("/api/reports/");
export const createReport = (data: object) => api.post("/api/reports/", data);
export const updateReport = (id: number, data: object) => api.patch(`/api/reports/${id}/`, data);
export const deleteReport = (id: number) => api.delete(`/api/reports/${id}/`);
export const generatePdf = (id: number) => api.post(`/api/reports/${id}/generate_pdf/`);

// ── Search ────────────────────────────────────────────────────────────────────
export const globalSearch = (q: string) => api.get("/api/search/", { params: { q } });

// ── Billing ───────────────────────────────────────────────────────────────────
export const getBillingStatus = () => api.get("/api/billing/status/");
export const createCheckoutSession = (priceId: string) =>
  api.post("/api/billing/checkout/", { price_id: priceId });
export const createPortalSession = () => api.post("/api/billing/portal/");
