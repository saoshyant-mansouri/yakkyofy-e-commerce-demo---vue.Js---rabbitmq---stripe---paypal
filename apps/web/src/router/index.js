import Vue from 'vue';
import VueRouter from 'vue-router';
import { store } from '../store';
import { setNavigating } from '../boot/progress';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingPage.vue'),
    meta: { layout: 'public' },
  },
  {
    path: '/system-design',
    name: 'system-design',
    component: () => import('../views/SystemDesignPage.vue'),
    meta: { layout: 'public' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('../views/ProductList.vue'),
    meta: { requiresAuth: true, title: 'Products' },
  },
  {
    path: '/products/:idOrSlug',
    name: 'product-detail',
    component: () => import('../views/ProductDetail.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Product', parent: 'products', hideTitle: true },
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../views/CartView.vue'),
    meta: { requiresAuth: true, title: 'Cart' },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/CheckoutView.vue'),
    meta: { requiresAuth: true, title: 'Checkout', parent: 'cart' },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('../views/OrdersList.vue'),
    meta: { requiresAuth: true, title: 'Orders' },
  },
  {
    path: '/orders/:id',
    name: 'order-status',
    component: () => import('../views/OrderStatus.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Order status', parent: 'orders' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { layout: 'public' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { layout: 'public' },
  },
  {
    // vue-router 3 catch-all syntax (path-to-regexp v1) — not the v4 `:pathMatch(.*)*` form.
    path: '*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
    meta: { title: 'Not found' },
  },
];

export const router = new VueRouter({
  mode: 'history',
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});

/**
 * Downloads a route's lazy chunk ahead of the click (sidebar links call this on hover/focus), so
 * navigating feels instant instead of waiting on a network round-trip for the view's code.
 */
export function prefetchRoute(name) {
  const route = routes.find((r) => r.name === name);
  if (typeof route?.component === 'function') route.component().catch(() => {});
}

/** Warms the chunks a signed-in user is most likely to open next, once the browser is idle. */
export function prefetchDashboardRoutes() {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => ['dashboard', 'products', 'orders', 'cart'].forEach(prefetchRoute));
}

const GUEST_ONLY_ROUTES = ['landing', 'login', 'register'];

router.beforeEach(async (to, from, next) => {
  setNavigating(true);
  // Only signed-in pages wait on the session check. Public pages (landing, system design, login,
  // register, 404) never touch the API, so they render immediately even while it cold-starts.
  if (!store.state.auth.initialized) {
    if (to.meta.requiresAuth) {
      await store.dispatch('auth/fetchMe');
    } else {
      store.dispatch('auth/fetchMe').then(() => {
        const { currentRoute } = router;
        if (store.getters['auth/isAuthenticated'] && GUEST_ONLY_ROUTES.includes(currentRoute.name)) {
          router.replace({ name: 'dashboard' }).catch(() => {});
        }
      });
      return next();
    }
  }
  const isAuthenticated = store.getters['auth/isAuthenticated'];

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  // Signed-in users don't need the marketing/auth pages — send them straight
  // to their dashboard instead.
  if (isAuthenticated && GUEST_ONLY_ROUTES.includes(to.name)) {
    return next({ name: 'dashboard' });
  }
  next();
});

router.afterEach((to) => {
  setNavigating(false);
  document.title = to.meta.title ? `${to.meta.title} · Yakkyofy Demo` : 'Yakkyofy Demo — Saoshyant Mansouri';
});

router.onError(() => setNavigating(false));
