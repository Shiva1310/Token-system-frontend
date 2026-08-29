// Typed fetch wrapper + API helper functions for the temple coupon-lottery backend.

export type Role = "admin" | "staff";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  isActive?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardSummary {
  totalCustomers: number;
  totalAgents: number;
  totalToCollect: number;
  totalCollected: number;
}

export interface Agent {
  _id: string;
  name: string;
  phone: string;
  customerCount: number;
  couponNumbers: string[];
  isSystem: boolean;
}

export type PaymentStatus = "paid" | "pending" | "exempt";

export interface Payment {
  monthIndex: number;
  label: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  paidDate?: string | null;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  couponNumber: string;
  agentId: { _id: string; name: string } | null;
  payments: Payment[];
  wonMonth: number | null;
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CouponCheckResponse {
  available: boolean;
}

export interface ManagedUser {
  _id: string;
  name: string;
  phone: string;
  role: Role;
  isActive: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL is not configured. Set it in your environment.",
      500
    );
  }
  return base.replace(/\/$/, "");
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getBaseUrl();
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

// ---- Auth ----

export function login(phone: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export function getMe(): Promise<User> {
  return apiFetch<User>("/api/auth/me");
}

export function register(
  name: string,
  phone: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, phone, password }),
  });
}

// ---- Dashboard ----

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/dashboard/summary");
}

// ---- Agents ----

export function getAgents(): Promise<Agent[]> {
  return apiFetch<Agent[]>("/api/agents");
}

export function createAgent(data: {
  name: string;
  phone: string;
}): Promise<Agent> {
  return apiFetch<Agent>("/api/agents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAgent(
  id: string,
  data: { name: string; phone: string }
): Promise<Agent> {
  return apiFetch<Agent>(`/api/agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAgent(id: string): Promise<void> {
  return apiFetch<void>(`/api/agents/${id}`, { method: "DELETE" });
}

// ---- Customers ----

export function getCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
  agentId?: string;
  monthIndex?: number;
  status?: PaymentStatus;
}): Promise<PaginatedCustomers> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.agentId) search.set("agentId", params.agentId);
  if (params.monthIndex) search.set("monthIndex", String(params.monthIndex));
  if (params.status) search.set("status", params.status);
  const qs = search.toString();
  return apiFetch<PaginatedCustomers>(
    `/api/customers${qs ? `?${qs}` : ""}`
  );
}

export function getCustomer(id: string): Promise<Customer> {
  return apiFetch<Customer>(`/api/customers/${id}`);
}

export interface CustomerInput {
  name: string;
  phone: string;
  address: string;
  couponNumber: string;
  agentId: string;
}

export function createCustomer(data: CustomerInput): Promise<Customer> {
  return apiFetch<Customer>("/api/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCustomer(
  id: string,
  data: CustomerInput
): Promise<Customer> {
  return apiFetch<Customer>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCustomer(id: string): Promise<void> {
  return apiFetch<void>(`/api/customers/${id}`, { method: "DELETE" });
}

export function checkCoupon(
  number: string,
  excludeId?: string
): Promise<CouponCheckResponse> {
  const qs = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : "";
  return apiFetch<CouponCheckResponse>(
    `/api/customers/check-coupon/${encodeURIComponent(number)}${qs}`
  );
}

export function updateCustomerPayment(
  customerId: string,
  monthIndex: number,
  data: { status: PaymentStatus; amountPaid: number; paidDate?: string }
): Promise<Customer> {
  return apiFetch<Customer>(
    `/api/customers/${customerId}/payments/${monthIndex}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export function setCustomerWin(
  customerId: string,
  wonMonth: number | null
): Promise<Customer> {
  return apiFetch<Customer>(`/api/customers/${customerId}/win`, {
    method: "PATCH",
    body: JSON.stringify({ wonMonth }),
  });
}

// ---- Users ----

export function getUsers(): Promise<ManagedUser[]> {
  return apiFetch<ManagedUser[]>("/api/users");
}

export interface UserInput {
  name: string;
  phone: string;
  role: Role;
  password?: string;
  isActive?: boolean;
}

export function createUser(data: UserInput): Promise<ManagedUser> {
  return apiFetch<ManagedUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(
  id: string,
  data: Partial<UserInput>
): Promise<ManagedUser> {
  return apiFetch<ManagedUser>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/api/users/${id}`, { method: "DELETE" });
}
