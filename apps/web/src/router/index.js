import Vue from 'vue';
import VueRouter from 'vue-router';
import { store } from '../store';

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
    path: '/products',
    name: 'products',
    component: () => import('../views/ProductList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/products/:idOrSlug',
    name: 'product-detail',
    component: () => import('../views/ProductDetail.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../views/CartView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/CheckoutView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('../views/OrdersList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/:id',
    name: 'order-status',
    component: () => import('../views/OrderStatus.vue'),
    props: true,
    meta: { requiresAuth: true },
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
  },
];

export const router = new VueRouter({
  mode: 'history',
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});

const GUEST_ONLY_ROUTES = ['landing', 'login', 'register'];

router.beforeEach(async (to, from, next) => {
  if (!store.state.auth.initialized) {
    await store.dispatch('auth/fetchMe');
  }
  const isAuthenticated = store.getters['auth/isAuthenticated'];

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  // Signed-in users don't need the marketing/auth pages — send them straight
  // to their dashboard instead.
  if (isAuthenticated && GUEST_ONLY_ROUTES.includes(to.name)) {
    return next({ name: 'products' });
  }
  next();
});
