// Central typed service layer for the ASP.NET backend (http://localhost:5222).
//
// All calls go through the shared `api` axios client in `@/app/api/api`,
// which attaches the Bearer token and auto-refreshes it, and which is
// forwarded same-origin via the `/api/:path*` rewrite in next.config.js.
//
// Endpoint numbers (#1-68) match the API catalogue:
//   #1-11   auth (v1)            -> authApi
//   #12-18  admin users          -> adminUsersApi
//   #19     admin roles          -> rolesApi
//   #20-28  categories (v1)      -> categoriesApi
//   #29-30  category images (v1) -> categoryImagesApi
//   #31-34  subcategories (v1)   -> subcategoriesApi
//   #35-41  products (v1)        -> productsApi
//   #42     product tree (v1)    -> productTreeApi
//   #43-49  admin brands         -> brandsApi
//   #50-54  admin warehouses     -> warehousesApi
//   #55-60  admin inventory      -> inventoryApi
//   #61-65  cart (v1)            -> cartApi
//   #66-68  wishlist (v1)        -> wishlistApi
// Extended admin catalogue (#69-148):
//   #69-70  dashboard (AdminOrderControllers)   -> dashboardApi
//   #71-74  admin orders (AdminOrderControllers)-> ordersAdminApi
//   #75-99  marketing (AdminMarketingControllers) -> bannersApi, offersApi,
//            couponsApi, combosApi, cartRulesApi
//   #100-121 store/accounts (AdminStoreAccountControllers) -> storesApi,
//            storeOffersApi, businessAccountsApi, agentOnboardingApi
//   #122-138 requests (AdminRequestControllers) -> quotesApi,
//            reviewsApi, enquiriesApi, pricingRequestsApi
//   #139-147 misc (AdminMiscControllers) -> notificationsApi, reportsApi,
//            settingsApi, wholesalePricingApi, wishlistInsightsApi
//   #149-158 content (ContentControllers) -> contentApi, newsletterApi,
//            adminContentApi, adminNewsletterApi
//   #159 customer notifications (CustomerNotificationsController)
//            -> customerNotificationsApi

import { api, type AuthResponse, type AuthUser } from "@/app/api/api";

// ============================================================
// SHARED TYPES
// ============================================================

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface SessionInfo {
  sessionId: string;
  createdAt?: string;
  expiresAtUtc?: string;
  ipAddress?: string;
  userAgent?: string;
  isCurrent?: boolean;
}

// ============================================================
// #1-11 AUTH — src/app/(auth): login, register,
// forgot-password, account/change-password, account/profile
// ============================================================

export const authApi = {
  // #1 POST /api/v1/auth/register — register page
  register(payload: {
    name: string;
    email: string;
    phone: string;
    passphrase: string;
    confirmPassphrase: string;
  }) {
    return api.post<AuthResponse>("/api/v1/auth/register", payload);
  },

  // #2 POST /api/v1/auth/login — login page
  login(payload: { email: string; passphrase: string }) {
    return api.post<AuthResponse>("/api/v1/auth/login", payload);
  },

  // #3 POST /api/v1/auth/refresh — handled automatically by the
  // response interceptor in api.ts; exposed for manual rotation.
  refresh(refreshToken: string) {
    return api.post<AuthResponse>("/api/v1/auth/refresh", { refreshToken });
  },

  // #4 POST /api/v1/auth/password/send-otp — ForgotPasswordForm (step 1 + resend)
  sendPasswordOtp(email: string) {
    return api.post("/api/v1/auth/password/send-otp", { email });
  },

  // #5 POST /api/v1/auth/password/change-with-otp — ForgotPasswordForm (step 3)
  resetPasswordWithOtp(payload: {
    email: string;
    otp: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    return api.post("/api/v1/auth/password/change-with-otp", payload);
  },

  // #6 POST /api/v1/auth/logout — AuthContext.logout, account pages
  logout() {
    return api.post("/api/v1/auth/logout");
  },

  // #7 POST /api/v1/auth/logout-all — security: end all sessions
  logoutAll() {
    return api.post("/api/v1/auth/logout-all");
  },

  // #8 GET /api/v1/auth/me — account/profile page
  me() {
    return api.get<AuthUser>("/api/v1/auth/me");
  },

  // #9 GET /api/v1/auth/sessions — active-sessions UI
  sessions() {
    return api.get<SessionInfo[] | { items: SessionInfo[] }>(
      "/api/v1/auth/sessions"
    );
  },

  // #10 DELETE /api/v1/auth/sessions/{sessionId} — revoke one session
  revokeSession(sessionId: string) {
    return api.delete(`/api/v1/auth/sessions/${sessionId}`);
  },

  // #11 POST /api/v1/auth/change-passphrase — account/change-password page
  changePassphrase(payload: {
    currentPassphrase: string;
    newPassphrase: string;
    confirmPassphrase: string;
  }) {
    return api.post("/api/v1/auth/change-passphrase", payload);
  },

  // PUT /api/v1/auth/me — account/profile page (name, phone, dob, gender)
  updateMe(payload: Record<string, unknown>) {
    return api.put("/api/v1/auth/me", payload);
  },

  // POST /api/v1/auth/me/avatar — multipart file (JPG/PNG/WEBP, max 2 MB)
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/v1/auth/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ============================================================
// #12-18 ADMIN USERS — src/app/admin/users/page.tsx
// ============================================================

export interface AdminUser {
  userId: string;
  name?: string;
  email: string;
  phone?: string;
  roles?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const adminUsersApi = {
  // #12 GET /api/admin/users?Page=&PageSize= — users list (paginated)
  list(page = 1, pageSize = 25) {
    return api.get<PagedResult<AdminUser> | AdminUser[]>(
      `/api/admin/users?Page=${page}&PageSize=${pageSize}`
    );
  },

  // #13 GET /api/admin/users/{userId} — view-user modal (fresh details)
  details(userId: string | number) {
    return api.get<AdminUser>(`/api/admin/users/${userId}`);
  },

  // #14 POST /api/admin/users — add-user modal
  create(payload: Record<string, unknown>) {
    return api.post<AdminUser>("/api/admin/users", payload);
  },

  // #15 PUT /api/admin/users/{userId} — edit-user modal
  update(userId: string | number, payload: Record<string, unknown>) {
    return api.put<AdminUser>(`/api/admin/users/${userId}`, payload);
  },

  // #16 PATCH /api/admin/users/{userId}/status — block/unblock toggle
  setStatus(userId: string | number, status: string) {
    return api.patch(`/api/admin/users/${userId}/status`, { status });
  },

  // #17 PATCH /api/admin/users/{userId}/role — role select
  setRole(userId: string | number, role: string) {
    return api.patch(`/api/admin/users/${userId}/role`, { role });
  },

  // #18 DELETE /api/admin/users/{userId} — delete-user modal
  remove(userId: string | number) {
    return api.delete(`/api/admin/users/${userId}`);
  },
};

// ============================================================
// #19 ADMIN ROLES — src/app/admin/roles/page.tsx (Admin only)
// ============================================================

export const rolesApi = {
  // #19 GET /api/admin/roles
  list() {
    return api.get("/api/admin/roles");
  },

  // A4 GET /api/admin/roles/{roleId} — permissions[], userCount, dates
  details(roleId: string | number) {
    return api.get(`/api/admin/roles/${roleId}`);
  },

  // A4 POST /api/admin/roles {roleName, permissionIds[]} — 201; 409 duplicate
  // (description/status sent as extra props; backend binds what it knows)
  create(payload: {
    roleName: string;
    permissionIds: (string | number)[];
    description?: string;
    status?: string;
  }) {
    return api.post("/api/admin/roles", payload);
  },

  // A4 PUT /api/admin/roles/{roleId} {roleName, permissionIds[]}
  update(
    roleId: string | number,
    payload: {
      roleName: string;
      permissionIds: (string | number)[];
      description?: string;
      status?: string;
    }
  ) {
    return api.put(`/api/admin/roles/${roleId}`, payload);
  },

  // A4 DELETE /api/admin/roles/{roleId} — 204; 409 if Admin/has users
  remove(roleId: string | number) {
    return api.delete(`/api/admin/roles/${roleId}`);
  },
};

// A4 GET /api/admin/permissions — picker source
export const permissionsApi = {
  list() {
    return api.get("/api/admin/permissions");
  },
};

// ============================================================
// #20-28 CATEGORIES — src/app/admin/categories/page.tsx,
// storefront: categories, dashboard ShopByCategory
// ============================================================

export interface Category {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  hasSubCategory: boolean;
  isActive: boolean;
  imageUrl?: string;
  /** Streaming URL for the primary image; null/absent when the category has none. */
  primaryImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const categoriesApi = {
  // #20 GET /api/v1/categories
  list() {
    return api.get<PagedResult<Category> | Category[]>(
      "/api/v1/categories"
    );
  },

  // #21 GET /api/v1/categories/with-subcategories — subcategory admin grouping
  withSubcategories() {
    return api.get("/api/v1/categories/with-subcategories");
  },

  // #22 GET /api/v1/categories/{categoryId}
  details(categoryId: string) {
    return api.get<Category>(`/api/v1/categories/${categoryId}`);
  },

  // #23 POST /api/v1/categories (multipart, with image)
  create(formData: FormData) {
    return api.post<Category>("/api/v1/categories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // #24 PUT /api/v1/categories/{categoryId} (multipart when image changes)
  update(categoryId: string, payload: FormData | Record<string, unknown>) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return api.put<Category>(`/api/v1/categories/${categoryId}`, payload, {
      headers: isForm
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    });
  },

  // #25 DELETE /api/v1/categories/{categoryId}
  remove(categoryId: string) {
    return api.delete(`/api/v1/categories/${categoryId}`);
  },

  // #26 GET /api/v1/categories/{categoryId}/images
  images(categoryId: string) {
    return api.get(`/api/v1/categories/${categoryId}/images`);
  },

  // #27 POST /api/v1/categories/{categoryId}/images — register image metadata
  registerImage(categoryId: string, payload: Record<string, unknown>) {
    return api.post(`/api/v1/categories/${categoryId}/images`, payload);
  },

  // #28 GET /api/v1/categories/{categoryId}/image/file — stream primary image
  primaryImageUrl(categoryId: string) {
    return `/api/v1/categories/${categoryId}/image/file`;
  },
};

// ============================================================
// #29-30 CATEGORY IMAGES — category image manager UI
// ============================================================

export const categoryImagesApi = {
  // GET /api/v1/category-images?categoryId= — list a category's images (display order)
  list(categoryId: string) {
    return api.get(
      `/api/v1/category-images?categoryId=${encodeURIComponent(categoryId)}`
    );
  },

  // #29 POST /api/v1/category-images/{categoryImageId}/primary (Bearer only)
  setPrimary(categoryImageId: string) {
    return api.post(`/api/v1/category-images/${categoryImageId}/primary`);
  },

  // #30 DELETE /api/v1/category-images/{categoryImageId} (Bearer only)
  remove(categoryImageId: string) {
    return api.delete(`/api/v1/category-images/${categoryImageId}`);
  },

  // #32 GET /api/v1/categories/{categoryId}/images — list images for a category
  images(categoryId: string) {
    return api.get(`/api/v1/categories/${categoryId}/images`);
  },

  // GET /api/v1/category-images/{categoryImageId}/file — stream image bytes (anonymous)
  fileUrl(categoryImageId: string) {
    return `/api/v1/category-images/${categoryImageId}/file`;
  },
};

// ============================================================
// #31-34 SUBCATEGORIES — src/app/admin/subcategories/page.tsx
// ============================================================

export const subcategoriesApi = {
  // #31 GET /api/v1/subcategories?categoryId={guid}
  list(categoryId?: string) {
    const query = categoryId
      ? `?categoryId=${encodeURIComponent(categoryId)}`
      : "";
    return api.get(`/api/v1/subcategories${query}`);
  },

  // #32 GET /api/v1/subcategory-images/{subCategoryId} — list images for a sub-category
  images(subCategoryId: string) {
    return api.get(`/api/v1/subcategory-images/${subCategoryId}`);
  },

  // Streaming endpoint for the sub-category's primary image (anonymous);
  // same-origin so it renders through the Next.js /api rewrite.
  primaryImageUrl(subCategoryId: string) {
    return `/api/v1/subcategories/${subCategoryId}/image/file`;
  },

  // #33 POST /api/v1/subcategories
  create(payload: FormData | Record<string, unknown>) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return api.post("/api/v1/subcategories", payload, {
      headers: isForm
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    });
  },

  // #33 PUT /api/v1/subcategories/{subCategoryId}
  update(
    subCategoryId: string,
    payload: FormData | Record<string, unknown>
  ) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return api.put(`/api/v1/subcategories/${subCategoryId}`, payload, {
      headers: isForm
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    });
  },

  // #34 DELETE /api/v1/subcategories/{subCategoryId}
  remove(subCategoryId: string) {
    return api.delete(`/api/v1/subcategories/${subCategoryId}`);
  },
};

// ============================================================
// #35-41 PRODUCTS — src/app/admin/products/page.tsx,
// storefront: dashboard, categories/[slug], new-arrivals
// ============================================================

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export const productsApi = {
  // #35 GET /api/v1/products?page=&pageSize=&search=&categoryId=&subCategoryId=&brandId=&status=&minPrice=&maxPrice=&sortBy=&sortDescending=
  // sortBy: sku | mrp | price | created (unknown falls back to name server-side)
  list(query: ProductQuery = {}) {
    const params = new URLSearchParams();
    params.set("page", String(query.page ?? 1));
    params.set("pageSize", String(query.pageSize ?? 20));
    if (query.search) params.set("search", query.search);
    if (query.categoryId) params.set("categoryId", query.categoryId);
    if (query.subCategoryId) params.set("subCategoryId", query.subCategoryId);
    if (query.brandId) params.set("brandId", query.brandId);
    if (query.status) params.set("status", query.status);
    if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
    if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
    if (query.sortBy) params.set("sortBy", query.sortBy);
    if (query.sortDescending !== undefined)
      params.set("sortDescending", String(query.sortDescending));
    return api.get(`/api/v1/products?${params.toString()}`);
  },

  // #36 GET /api/v1/products/{productId} — product detail / admin view modal
  details(productId: string) {
    return api.get(`/api/v1/products/${productId}`);
  },

  // #37 POST /api/v1/products — add-product modal
  create(payload: Record<string, unknown>) {
    return api.post("/api/v1/products", payload);
  },

  // #38 PUT /api/v1/products/{productId} — edit-product modal + status toggle
  update(productId: string, payload: Record<string, unknown>) {
    return api.put(`/api/v1/products/${productId}`, payload);
  },

  // #39 DELETE /api/v1/products/{productId}
  remove(productId: string) {
    return api.delete(`/api/v1/products/${productId}`);
  },

  // #40 GET /api/v1/products/fresh-arrivals?count= — new-arrivals page
  freshArrivals(count = 10) {
    return api.get(`/api/v1/products/fresh-arrivals?count=${count}`);
  },

  // #41 GET /api/v1/products/popular?count= — dashboard "Best Selling" tab
  popular(count = 8) {
    return api.get(`/api/v1/products/popular?count=${count}`);
  },

  // #41 GET /api/v1/products/low-stock?count= — storefront low-stock section
  lowStock(count = 8) {
    return api.get(`/api/v1/products/low-stock?count=${count}`);
  },

  // #41 GET /api/v1/products/in-stock?count= — storefront in-stock section
  inStock(count = 8) {
    return api.get(`/api/v1/products/in-stock?count=${count}`);
  },

  // #41 GET /api/v1/products/category/{categoryId}?page=&pageSize= — categories/[slug]
  byCategory(categoryId: string, page = 1, pageSize = 20) {
    return api.get(
      `/api/v1/products/category/${categoryId}?page=${page}&pageSize=${pageSize}`
    );
  },

  // B3 GET /api/admin/products/bulk-import/template — download Excel template
  downloadBulkProductTemplate() {
    return api.get("/api/admin/products/bulk-import/template", {
      responseType: "blob",
    });
  },

  // B4 POST /api/admin/products/bulk-import — import products from Excel file
  bulkImportProducts(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/admin/products/bulk-import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // B5 GET /api/admin/products/bulk-import/export — export all products to Excel
  exportBulkProducts() {
    return api.get("/api/admin/products/bulk-import/export", {
      responseType: "blob",
    });
  },
};

// ============================================================
// B1 PRODUCT IMAGES — admin product image manager
// (singular POST alias and plural /images both work server-side)
// ============================================================

export const productImagesApi = {
  // B1 POST /api/v1/products/{productId}/image — multipart file (+isPrimary);
  // first image auto-primary; 201
  upload(productId: string, file: File, isPrimary = false) {
    const formData = new FormData();
    formData.append("file", file);
    if (isPrimary) formData.append("isPrimary", "true");
    return api.post(`/api/v1/products/${productId}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // B1 GET /api/v1/products/{productId}/images — list (display order)
  list(productId: string) {
    return api.get(`/api/v1/products/${productId}/images`);
  },

  // B1 POST /api/v1/products/{productId}/images/{imageId}/primary
  setPrimary(productId: string, imageId: string | number) {
    return api.post(
      `/api/v1/products/${productId}/images/${imageId}/primary`
    );
  },

  // B1 DELETE /api/v1/products/{productId}/images/{imageId} — 204;
  // promotes next image if primary was removed
  remove(productId: string, imageId: string | number) {
    return api.delete(`/api/v1/products/${productId}/images/${imageId}`);
  },

  // GET /api/v1/products/{productId}/images/{imageId}/file — stream bytes (anonymous)
  fileUrl(productId: string, imageId: string | number) {
    return `/api/v1/products/${productId}/images/${imageId}/file`;
  },
};

// ============================================================
// #42 PRODUCT TREE — dashboard navigation / category tree (Bearer)
// ============================================================

export const productTreeApi = {
  // #42 GET /api/v1/product-tree?activeOnly= — full
  // category→subcategory tree (counts only, no product rows).
  // activeOnly=false for the admin view (default true = storefront).
  full(activeOnly = false) {
    return api.get(`/api/v1/product-tree?activeOnly=${activeOnly}`);
  },
};

// ============================================================
// #43-49 ADMIN BRANDS — src/app/admin/brands/page.tsx,
// storefront: brands page
// ============================================================

export const brandsApi = {
  // #43 GET /api/admin/brands?Search=&Status=&Page=&PageSize= — brands admin list
  list(query: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set("Search", query.search);
    if (query.status) params.set("Status", query.status);
    params.set("Page", String(query.page ?? 1));
    params.set("PageSize", String(query.pageSize ?? 25));
    return api.get(`/api/admin/brands?${params.toString()}`);
  },

  // GET /api/admin/brands/{brandId}/image/file — stream logo bytes (anonymous)
  imageFileUrl(brandId: string) {
    return `/api/admin/brands/${brandId}/image/file`;
  },

  // #44 GET /api/admin/brands/{brandId} — view-brand modal
  details(brandId: string) {
    return api.get(`/api/admin/brands/${brandId}`);
  },

  // #45 POST /api/admin/brands — add-brand modal
  create(payload: FormData | Record<string, unknown>) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return api.post("/api/admin/brands", payload, {
      headers: isForm
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    });
  },

  // #46 PUT /api/admin/brands/{brandId} — multipart (logo replace) or JSON
  update(brandId: string, payload: FormData | Record<string, unknown>) {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return api.put(`/api/admin/brands/${brandId}`, payload, {
      headers: isForm
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    });
  },

  // B2 PATCH /api/admin/brands/{brandId}/logo — logo-only replace (multipart)
  setLogo(brandId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.patch(`/api/admin/brands/${brandId}/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // #47 DELETE /api/admin/brands/{brandId}
  remove(brandId: string) {
    return api.delete(`/api/admin/brands/${brandId}`);
  },

  // #48 GET /api/admin/brands/search — binds ?query= (also ?keyword=,
  // legacy ?q=) + ?limit= (default 10, max 50). Always send both.
  search(query: string, limit = 21) {
    const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 50);
    const params = new URLSearchParams({
      query,
      limit: String(safeLimit),
    });
    return api.get(`/api/admin/brands/search?${params.toString()}`);
  },

  // #49 GET /api/admin/brands/{brandId}/products?page=&pageSize= — shelf
  products(brandId: string, page = 1, pageSize = 25) {
    return api.get(
      `/api/admin/brands/${brandId}/products?page=${page}&pageSize=${pageSize}`
    );
  },
};

// ============================================================
// #50-54 ADMIN WAREHOUSES — src/app/admin/warehouse/*
// (Uses the shared adminResource factory defined below, which
// adds paginated list() plus setStatus.)
// ============================================================

export const warehousesApi = adminResource("/api/admin/warehouses");

// ============================================================
// #55-60 ADMIN INVENTORY — src/app/admin/inventory/page.tsx
// ============================================================

export const inventoryApi = {
  // #55 GET /api/admin/inventory — stock list
  list() {
    return api.get("/api/admin/inventory");
  },

  // #56 GET /api/admin/inventory/low-stock — low-stock alert banner/section
  lowStock() {
    return api.get("/api/admin/inventory/low-stock");
  },

  // #57 GET /api/admin/inventory/{productId}?warehouseId= — per-product stock card
  byProduct(productId: string, warehouseId?: string) {
    const query = warehouseId
      ? `?warehouseId=${encodeURIComponent(warehouseId)}`
      : "";
    return api.get(`/api/admin/inventory/${productId}${query}`);
  },

    // #58 POST /api/admin/inventory/{productId}/stock — receive stock
    // Body: { warehouseId, quantity (>=1), type?, reason? }
    receiveStock(
      productId: string,
      payload: {
        warehouseId: string;
        quantity: number;
        type?: string;
        reason?: string;
      }
    ) {
      return api.post(
        `/api/admin/inventory/${productId}/stock`,
        payload
      );
    },

    // #59 POST /api/admin/inventory/{productId}/adjust — ± adjust modal
    // Body: { warehouseId, quantity (nonzero, negative removes), reason? }
    adjust(
      productId: string,
      payload: {
        warehouseId: string;
        quantity: number;
        reason?: string;
      }
    ) {
      return api.post(
        `/api/admin/inventory/${productId}/adjust`,
        payload
      );
    },

  // #60 GET /api/admin/inventory/{productId}/movements?warehouseId=&from=&to=&page=&pageSize=
  movements(
    productId: string,
    query: {
      warehouseId?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    const params = new URLSearchParams();
    if (query.warehouseId) params.set("warehouseId", query.warehouseId);
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    params.set("page", String(query.page ?? 1));
    params.set("pageSize", String(query.pageSize ?? 25));
    return api.get(
      `/api/admin/inventory/${productId}/movements?${params.toString()}`
    );
  },
};

// ============================================================
// #61-65 CART — context/cartcontext.tsx + cart page
// ============================================================

export interface CartSummaryResponse {
  itemCount: number;
  subtotal: number;
  taxTotal: number;
  deliveryCharge: number;
  handlingFee: number;
  discountTotal: number;
  total: number;
  appliedCouponCode?: string | null;
}

export interface CartItemResponse {
  cartItemId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
  gstPercentage: number;
  gstAmount: number;
  itemTotal: number;
  availableQuantity: number;
  inStock: boolean;
}

export interface CartResponse {
  cartId?: string | null;
  items: CartItemResponse[];
  summary: CartSummaryResponse;
}

export const cartApi = {
  // #61 GET /api/v1/cart
  get() {
    return api.get<CartResponse>("/api/v1/cart");
  },

  // #62 POST /api/v1/cart/items
  addItem(productId: string, quantity: number) {
    return api.post("/api/v1/cart/items", { productId, quantity });
  },

  // #63 PATCH /api/v1/cart/items/{cartItemId}
  updateItem(cartItemId: string, quantity: number) {
    return api.patch(`/api/v1/cart/items/${cartItemId}`, { quantity });
  },

  // #64 DELETE /api/v1/cart/items/{cartItemId}
  removeItem(cartItemId: string) {
    return api.delete(`/api/v1/cart/items/${cartItemId}`);
  },

  // #65 DELETE /api/v1/cart/clear
  clear() {
    return api.delete("/api/v1/cart/clear");
  },
};

// ============================================================
// #66-68 WISHLIST — context/wishlistcontext.tsx + wishlist pages
// ============================================================

export interface WishlistItemResponse {
  wishlistItemId: string;
  productId: string;
  productName: string;
  sku: string;
  price: number;
  mrp: number;
  status: string;
}

export const wishlistApi = {
  // #66 GET /api/v1/wishlist — wishlist (with CGST/SGST breakdown)
  get() {
    return api.get<WishlistItemResponse[]>("/api/v1/wishlist");
  },

  // #67 POST /api/v1/wishlist/{productId}
  add(productId: string) {
    return api.post(`/api/v1/wishlist/${productId}`);
  },

  // #68 DELETE /api/v1/wishlist/{productId}
  remove(productId: string) {
    return api.delete(`/api/v1/wishlist/${productId}`);
  },
};

// ============================================================
// SHARED ADMIN RESOURCE FACTORY (#75-138)
// Standard 5-endpoint shape used by the Admin*Controllers:
// list (paginated) / details / create / update / remove.
// ============================================================

function adminResource(base: string) {
  return {
    list(page = 1, pageSize = 25, extra?: Record<string, string>) {
      const params = new URLSearchParams({
        Page: String(page),
        PageSize: String(pageSize),
        ...(extra ?? {}),
      });
      return api.get(`${base}?${params.toString()}`);
    },
    details(id: string | number) {
      return api.get(`${base}/${id}`);
    },
    create(payload: FormData | Record<string, unknown>) {
      const isForm =
        typeof FormData !== "undefined" && payload instanceof FormData;
      return api.post(base, payload, {
        headers: isForm
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
      });
    },
    update(id: string | number, payload: FormData | Record<string, unknown>) {
      const isForm =
        typeof FormData !== "undefined" && payload instanceof FormData;
      return api.put(`${base}/${id}`, payload, {
        headers: isForm
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
      });
    },
    remove(id: string | number) {
      return api.delete(`${base}/${id}`);
    },
    setStatus(id: string | number, status: string) {
      return api.patch(`${base}/${id}/status`, { status });
    },
  };
}

// ============================================================
// #69-70 DASHBOARD — src/app/admin/page.tsx (AdminOrderControllers)
// ============================================================

export const dashboardApi = {
  // #69 GET /api/admin/dashboard/stats — stat cards + sales chart
  stats() {
    return api.get("/api/admin/dashboard/stats");
  },

  // #70 GET /api/admin/orders/recent?count=5 — recent-orders widget
  // (low-stock widget reuses #56 inventoryApi.lowStock())
  recentOrders(count = 5) {
    return api.get(`/api/admin/orders/recent?count=${count}`);
  },
};

// ============================================================
// #71-74 ADMIN ORDERS — src/app/admin/orders/page.tsx
// (AdminOrderControllers)
// ============================================================

export const ordersAdminApi = {
  // #71 GET /api/admin/orders?Page=&PageSize=&status=&search=
  list(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  } = {}) {
    const params = new URLSearchParams({
      Page: String(query.page ?? 1),
      PageSize: String(query.pageSize ?? 25),
    });
    if (query.status) params.set("status", query.status);
    if (query.search) params.set("search", query.search);
    return api.get(`/api/admin/orders?${params.toString()}`);
  },

  // #72 GET /api/admin/orders/{orderId} — view modal
  details(orderId: string | number) {
    return api.get(`/api/admin/orders/${orderId}`);
  },

  // #73 PATCH /api/admin/orders/{orderId}/status
  setStatus(orderId: string | number, status: string) {
    return api.patch(`/api/admin/orders/${orderId}/status`, { status });
  },

  // #74 DELETE /api/admin/orders/{orderId}
  remove(orderId: string | number) {
    return api.delete(`/api/admin/orders/${orderId}`);
  },
};

// ============================================================
// ============================================================
// STOREFRONT DEALS — StorefrontDealsController (public, active only)
// Best Deals shelf, combo shelf, coupon list. No auth required.
// ============================================================

export const dealsApi = {
  // GET /api/v1/deals/offers?count= — active offers, newest first
  offers(count = 8) {
    return api.get(`/api/v1/deals/offers?count=${count}`);
  },

  // GET /api/v1/deals/combos?count= — active combos, newest first
  combos(count = 8) {
    return api.get(`/api/v1/deals/combos?count=${count}`);
  },

  // GET /api/v1/deals/coupons?count= — active coupon codes
  coupons(count = 8) {
    return api.get(`/api/v1/deals/coupons?count=${count}`);
  },

  // GET /api/v1/deals/cart-rules?count= — active cart rules for bulk pricing
  cartRules(count = 25) {
    return api.get(`/api/v1/deals/cart-rules?count=${count}`);
  },

  // GET /api/v1/deals/bulk-tiers?count= — wholesale price tiers
  bulkTiers(count = 25) {
    return api.get(`/api/v1/deals/bulk-tiers?count=${count}`);
  },

  // GET /api/v1/deals/banners?count= — active banners for promo tiles
  banners(count = 25) {
    return api.get(`/api/v1/deals/banners?count=${count}`);
  },
};

// ============================================================
// STOREFRONT BRANDS — StorefrontBrandsController (public, active only)
// Brand shelves, filters and the customer brands page. No auth required.
// The admin brand console keeps using brandsApi above.
// ============================================================

export const storefrontBrandsApi = {
  // GET /api/v1/brands?search=&count= — active brands, newest first
  list(query: { search?: string; count?: number } = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    params.set("count", String(query.count ?? 50));
    return api.get(`/api/v1/brands?${params.toString()}`);
  },
};

// ============================================================
// #75-99 MARKETING — AdminMarketingControllers
// banners/offers/coupons/combos/cart-rules admin pages
// ============================================================

// #75 GET list · #76 details · #77 create · #78 update · #79 delete
// + PATCH status + GET /{id}/image/file (stream stored bytes)
export const bannersApi = {
  ...adminResource("/api/admin/banners"),
  // Streams the stored image bytes (PhysicalFile, range processing);
  // 200 with file, 404 if banner/image/file missing.
  imageFileUrl(id: string | number) {
    return `/api/admin/banners/${id}/image/file`;
  },
};
// #80 · #81 · #82 · #83 · #84
export const offersApi = adminResource("/api/admin/offers");
// #85 · #86 · #87 · #88 · #89
export const couponsApi = adminResource("/api/admin/coupons");
// #90 · #91 · #92 · #93 · #94
export const combosApi = adminResource("/api/admin/combos");
// #95 · #96 · #97 · #98 · #99
export const cartRulesApi = adminResource("/api/admin/cart-rules");

// ============================================================
// #100-121 STORE / ACCOUNTS — AdminStoreAccountControllers
// stores / store-offers / business-accounts / agent-onboarding
// ============================================================

// #100 · #101 · #102 · #103 · #104
export const storesApi = adminResource("/api/admin/stores");
// #105 · #106 · #107 · #108 · #109
export const storeOffersApi = adminResource("/api/admin/store-offers");
// #110 list · #111 details · #112 create · #113 update · #114 delete
// #115 PATCH /api/admin/business-accounts/{id}/status (approve/block)
export const businessAccountsApi = adminResource(
  "/api/admin/business-accounts"
);
// #116 · #117 · #118 · #119 · #120
// #121 PATCH /api/admin/agent-onboarding/{id}/status (approve/reject)
export const agentOnboardingApi = adminResource(
  "/api/admin/agent-onboarding"
);

// ============================================================
// #150-161 AGENTS & DEALERS — AdminDealerControllers
// src/app/admin/agents/** (agents list, agent dealers,
// dealer details, dealer products)
// ============================================================

// #156 GET /api/admin/agents?Page=&PageSize=&search=&status=
// #157 GET /api/admin/agents/{id}
// #158 POST /api/admin/agents {name, email, phone, passphrase, employeeCode, status}
// #159 PUT /api/admin/agents/{id} {name, email, phone, employeeCode, status}
// #160 DELETE /api/admin/agents/{id}
// #161 PATCH /api/admin/agents/{id}/status {status}
export const agentsApi = {
  list(query: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  } = {}) {
    const params = new URLSearchParams({
      Page: String(query.page ?? 1),
      PageSize: String(query.pageSize ?? 25),
    });
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    return api.get(`/api/admin/agents?${params.toString()}`);
  },

  details(agentId: string | number) {
    return api.get(`/api/admin/agents/${agentId}`);
  },

  create(payload: Record<string, unknown>) {
    return api.post("/api/admin/agents", payload);
  },

  update(agentId: string | number, payload: Record<string, unknown>) {
    return api.put(`/api/admin/agents/${agentId}`, payload);
  },

  remove(agentId: string | number) {
    return api.delete(`/api/admin/agents/${agentId}`);
  },

  setStatus(agentId: string | number, status: string) {
    return api.patch(`/api/admin/agents/${agentId}/status`, { status });
  },

  // Dealers of one agent — same shape as dealersApi.list with agentId preset.
  dealers(
    agentId: string | number,
    query: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
    } = {}
  ) {
    const params = new URLSearchParams({
      Page: String(query.page ?? 1),
      PageSize: String(query.pageSize ?? 25),
    });
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    return api.get(
      `/api/admin/agents/${agentId}/dealers?${params.toString()}`
    );
  },
};

// #150 list · #151 details · #152 create · #153 update · #154 remove
// #155 PATCH /api/admin/dealers/{id}/status (activate/deactivate)
// #158 dealer products list · #159 create · #160 update · #161 remove
export const dealersApi = {
  ...adminResource("/api/admin/dealers"),

  products(
    dealerId: string | number,
    query: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
    } = {}
  ) {
    const params = new URLSearchParams({
      Page: String(query.page ?? 1),
      PageSize: String(query.pageSize ?? 25),
    });
    if (query.search) params.set("Search", query.search);
    if (query.status) params.set("Status", query.status);
    return api.get(
      `/api/admin/dealers/${dealerId}/products?${params.toString()}`
    );
  },

  productDetails(dealerId: string | number, productId: string | number) {
    return api.get(
      `/api/admin/dealers/${dealerId}/products/${productId}`
    );
  },

  createProduct(
    dealerId: string | number,
    payload: Record<string, unknown>
  ) {
    return api.post(
      `/api/admin/dealers/${dealerId}/products`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
  },

  updateProduct(
    dealerId: string | number,
    productId: string | number,
    payload: Record<string, unknown>
  ) {
    return api.put(
      `/api/admin/dealers/${dealerId}/products/${productId}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
  },

  removeProduct(dealerId: string | number, productId: string | number) {
    return api.delete(
      `/api/admin/dealers/${dealerId}/products/${productId}`
    );
  },
};

// ============================================================
// #122-138 + #148 REQUESTS — AdminRequestControllers
// quotes / reviews / enquiries / pricing-requests admin pages
// ============================================================

// #122 list · #123 details · #124 create · #125 update · #126 remove
// + PATCH /api/admin/quotes/{id}/status (extra per spec, unnumbered)
export const quotesApi = {
  ...adminResource("/api/admin/quotes"),
  setStatus(id: string | number, status: string) {
    return api.patch(`/api/admin/quotes/${id}/status`, { status });
  },
};

// Storefront public reviews + admin CRUD
export const storefrontReviewsApi = {
  // GET /api/v1/reviews?productName=&count= — approved only, public
  list(productName?: string, count = 25) {
    const params = new URLSearchParams();
    if (productName) params.set("productName", productName);
    params.set("count", String(count));
    return api.get(`/api/v1/reviews?${params.toString()}`);
  },
  create(payload: Record<string, unknown>) {
    return api.post("/api/v1/reviews", payload);
  },
};

// Reviews admin — #127 list · #128 details · POST create · PUT update · #129 status · #130 delete
export const reviewsApi = {
  list: (page = 1, pageSize = 25) =>
    adminResource("/api/admin/reviews").list(page, pageSize),
  details: (id: string | number) =>
    adminResource("/api/admin/reviews").details(id),
  create: (payload: Record<string, unknown>) =>
    adminResource("/api/admin/reviews").create(payload),
  update: (id: string | number, payload: Record<string, unknown>) =>
    adminResource("/api/admin/reviews").update(id, payload),
  setStatus: (id: string | number, status: string) =>
    api.patch(`/api/admin/reviews/${id}/status`, { status }),
  remove: (id: string | number) =>
    adminResource("/api/admin/reviews").remove(id),
};

// #131 list · #132 details · POST create · PUT update · #133 status · #134 delete
export const enquiriesApi = {
  list: (page = 1, pageSize = 25) =>
    adminResource("/api/admin/enquiries").list(page, pageSize),
  details: (id: string | number) =>
    adminResource("/api/admin/enquiries").details(id),
  create: (payload: Record<string, unknown>) =>
    adminResource("/api/admin/enquiries").create(payload),
  update: (id: string | number, payload: Record<string, unknown>) =>
    adminResource("/api/admin/enquiries").update(id, payload),
  setStatus: (id: string | number, status: string) =>
    api.patch(`/api/admin/enquiries/${id}/status`, { status }),
  remove: (id: string | number) =>
    adminResource("/api/admin/enquiries").remove(id),
};

// #135 list · #136 details · POST create · PUT update · #137 status · #138 delete
export const pricingRequestsApi = {
  list: (page = 1, pageSize = 25) =>
    adminResource("/api/admin/pricing-requests").list(page, pageSize),
  details: (id: string | number) =>
    adminResource("/api/admin/pricing-requests").details(id),
  create: (payload: Record<string, unknown>) =>
    adminResource("/api/admin/pricing-requests").create(payload),
  update: (id: string | number, payload: Record<string, unknown>) =>
    adminResource("/api/admin/pricing-requests").update(id, payload),
  setStatus: (id: string | number, status: string) =>
    api.patch(`/api/admin/pricing-requests/${id}/status`, { status }),
  remove: (id: string | number) =>
    adminResource("/api/admin/pricing-requests").remove(id),
};

// ============================================================
// #139-147 MISC — AdminMiscControllers
// notifications / reports / settings / wholesale-pricing /
// wishlist-insights admin pages
// ============================================================

export const notificationsApi = {
  // #139 GET /api/admin/notifications?search=&unreadOnly=&Page=&PageSize=
  // Unread badge count = list({ unreadOnly: true, pageSize: 1 }).totalCount
  list(query: {
    search?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) {
    const params = new URLSearchParams({
      Page: String(query.page ?? 1),
      PageSize: String(query.pageSize ?? 25),
    });
    if (query.search) params.set("search", query.search);
    if (query.unreadOnly !== undefined)
      params.set("unreadOnly", String(query.unreadOnly));
    return api.get(`/api/admin/notifications?${params.toString()}`);
  },

  // #140 PATCH /api/admin/notifications/{id}/read {isRead} (defaults true)
  markRead(id: string | number, isRead = true) {
    return api.patch(`/api/admin/notifications/${id}/read`, { isRead });
  },

  // #141 DELETE /api/admin/notifications/{id}
  remove(id: string | number) {
    return api.delete(`/api/admin/notifications/${id}`);
  },
};

export const reportsApi = {
  // #142 GET /api/admin/reports?period=7d&from=&to= — summary + chart +
  // top products in one call
  summary(period = "7d", from?: string, to?: string) {
    const params = new URLSearchParams({ period });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return api.get(`/api/admin/reports?${params.toString()}`);
  },
};

export const settingsApi = {
  // #143 GET /api/admin/settings
  get() {
    return api.get("/api/admin/settings");
  },

  // #144 PUT /api/admin/settings
  save(payload: Record<string, unknown>) {
    return api.put("/api/admin/settings", payload);
  },
};

export const wholesalePricingApi = {
  // #145 GET /api/admin/wholesale-pricing
  list() {
    return api.get("/api/admin/wholesale-pricing");
  },

  // #146 PUT /api/admin/wholesale-pricing — bulk price update
  saveBulk(payload: Record<string, unknown>) {
    return api.put("/api/admin/wholesale-pricing", payload);
  },
};

export const wishlistInsightsApi = {
  // #147 GET /api/admin/wishlist-insights — read-only analytics
  get() {
    return api.get("/api/admin/wishlist-insights");
  },
};

// ============================================================
// CUSTOMER ADDRESSES — Controllers/AddressesController (v1)
// account/addresses page + checkout DeliveryAddressSection
// ============================================================

export interface AddressResponse {
  addressId: string;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export interface AddressPayload {
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export const addressesApi = {
  // GET /api/v1/addresses — current user's saved addresses
  list() {
    return api.get<AddressResponse[]>("/api/v1/addresses");
  },

  // POST /api/v1/addresses
  create(payload: AddressPayload) {
    return api.post<AddressResponse>("/api/v1/addresses", payload);
  },

  // PUT /api/v1/addresses/{addressId}
  update(addressId: string, payload: AddressPayload) {
    return api.put<AddressResponse>(`/api/v1/addresses/${addressId}`, payload);
  },

  // DELETE /api/v1/addresses/{addressId}
  remove(addressId: string) {
    return api.delete(`/api/v1/addresses/${addressId}`);
  },
};

// ============================================================
// CUSTOMER CHECKOUT — Controllers/CheckoutController (v1)
// CheckoutOrderSummary "Continue to Payment"
// ============================================================

export interface PlaceOrderResponse {
  orderId: string;
  orderNo: string;
  status: string;
  grandTotal: number;
  paymentId: string;
  paymentStatus: string;
  paymentMethod: string;
}

export type CheckoutPaymentMethod =
  | "COD"
  | "UPI"
  | "Card"
  | "NetBanking"
  | "Wallet"
  | "BankTransfer";

export const checkoutApi = {
  // POST /api/v1/checkout/place-order {addressId, paymentMethod}
  // Totals are recomputed server-side from the user's cart.
  placeOrder(addressId: string, paymentMethod: CheckoutPaymentMethod = "COD") {
    return api.post<PlaceOrderResponse>("/api/v1/checkout/place-order", {
      addressId,
      paymentMethod,
    });
  },
};

// ============================================================
// CUSTOMER ORDERS — Controllers/OrdersController (v1)
// orders page, account/orders, payment confirm, order-confirmation
// ============================================================

export interface OrderSummaryResponse {
  orderId: string;
  orderNo: string;
  status: string;
  grandTotal: number;
  itemCount: number;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  createdAt: string;
}

export interface OrderAddressResponse {
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItemResponse {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PaymentInfoResponse {
  paymentId: string;
  method: string;
  status: string;
  amount: number;
  transactionReference?: string | null;
  paidAt?: string | null;
}

export interface OrderStatusEventResponse {
  status: string;
  remarks?: string | null;
  changedAt: string;
}

export interface OrderDetailResponse {
  orderId: string;
  orderNo: string;
  status: string;
  itemsTotal: number;
  discount: number;
  gstAmount: number;
  deliveryCharge: number;
  handlingFee: number;
  grandTotal: number;
  appliedCouponCode?: string | null;
  shippingAddress?: OrderAddressResponse | null;
  items: OrderItemResponse[];
  payment?: PaymentInfoResponse | null;
  statusHistory: OrderStatusEventResponse[];
  createdAt: string;
}

export const ordersApi = {
  // GET /api/v1/orders?page=&pageSize= — current user's orders (newest first)
  list(page = 1, pageSize = 10) {
    return api.get<OrderSummaryResponse[] | PagedResult<OrderSummaryResponse>>(
      `/api/v1/orders?page=${page}&pageSize=${pageSize}`
    );
  },

  // GET /api/v1/orders/{orderId} — full detail incl. items/payment/history
  details(orderId: string) {
    return api.get<OrderDetailResponse>(`/api/v1/orders/${orderId}`);
  },

  // POST /api/v1/orders/{orderId}/confirm-payment {transactionReference}
  confirmPayment(orderId: string, transactionReference?: string) {
    return api.post(`/api/v1/orders/${orderId}/confirm-payment`, {
      transactionReference,
    });
  },

  // POST /api/v1/orders/{orderId}/cancel {reason}
  cancel(orderId: string, reason?: string) {
    return api.post(`/api/v1/orders/${orderId}/cancel`, { reason });
  },
};

// ============================================================
// #149-158 CONTENT + NEWSLETTER � ContentControllers
// site copy (testimonials, FAQs, trust badges, ...) + newsletter
// ============================================================

export interface ContentItem {
  id: string;
  section: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  extra?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export const contentApi = {
  // #149 GET /api/v1/content?section=&search= � active items, sort order
  list(section?: string, search?: string) {
    const params = new URLSearchParams();
    if (section) params.set("section", section);
    if (search) params.set("search", search);
    const query = params.toString();
    return api.get<ContentItem[]>(
      query ? `/api/v1/content?${query}` : "/api/v1/content"
    );
  },
};

export const newsletterApi = {
  // #150 POST /api/v1/newsletter/subscribe {email, source} � idempotent
  subscribe(email: string, source?: string) {
    return api.post("/api/v1/newsletter/subscribe", { email, source });
  },
};

// #151 list � #152 details � #153 create � #154 update � #155 status � #156 delete
export const adminContentApi = {
  ...adminResource("/api/admin/content"),
  setStatus(id: string | number, isActive: boolean) {
    return api.patch(`/api/admin/content/${id}/status`, { isActive });
  },
};

// #157 list � #158 delete
export const adminNewsletterApi = {
  list(page = 1, pageSize = 25, search?: string) {
    const params = new URLSearchParams({
      Page: String(page),
      PageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    return api.get(
      `/api/admin/newsletter?${params.toString()}`
    );
  },
  remove(id: string | number) {
    return api.delete(`/api/admin/newsletter/${id}`);
  },
};

// ============================================================
// #159 CUSTOMER NOTIFICATIONS — CustomerNotificationsController
// Order-event feed for the signed-in caller (read-only).
// ============================================================

export interface CustomerNotification {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  createdAt: string;
  isRead: boolean;
  link?: string | null;
}

export const customerNotificationsApi = {
  // #159 GET /api/v1/notifications?count= — caller's order events
  list(count = 20) {
    return api.get<CustomerNotification[]>(
      `/api/v1/notifications?count=${count}`
    );
  },
};

