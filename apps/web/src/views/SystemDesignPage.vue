<template>
  <div ref="page">
    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24">
      <p class="reveal text-xs uppercase tracking-widest text-brand-teal font-medium mb-4">
        Technical deep dive
      </p>
      <h1 class="reveal text-4xl sm:text-5xl font-semibold tracking-tight text-text max-w-3xl leading-[1.1]">
        System design &amp; architecture
      </h1>
      <p class="reveal mt-6 text-lg text-text-secondary max-w-2xl">
        A walkthrough of how this store is actually built — the request path, the database schema, the
        API surface, and the async order pipeline. The architecture is modeled after
        <strong class="text-text">Yakkyofy</strong>, an e-commerce sourcing platform, reverse-engineered
        as a research exercise and rebuilt from scratch for this portfolio piece.
      </p>
    </section>

    <!-- Functionality -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 class="reveal text-xs uppercase tracking-widest text-brand-teal font-medium mb-8">Functionality</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="f in features" :key="f.title" class="reveal card p-5">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3" :style="{ background: f.tint }">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <g v-html="f.icon" />
            </svg>
          </div>
          <h3 class="font-medium text-text mb-1">{{ f.title }}</h3>
          <p class="text-sm text-text-muted">{{ f.description }}</p>
        </div>
      </div>
    </section>

    <!-- Architecture diagram -->
    <section class="border-y border-border bg-chrome/50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 class="reveal text-xs uppercase tracking-widest text-brand-teal font-medium mb-2">System architecture</h2>
        <p class="reveal text-text-secondary max-w-2xl mb-8">
          The browser only ever talks to the Express API over HTTPS with HttpOnly cookies. Payment
          provider calls happen server-side; the worker settles orders asynchronously off a RabbitMQ
          queue so checkout responses stay fast.
        </p>
        <div class="card p-4 sm:p-8 overflow-x-auto">
          <svg
            ref="archSvg"
            viewBox="0 0 860 420"
            class="w-full min-w-[640px]"
            role="img"
            aria-label="Architecture diagram: browser talks to the Express API, which reads and writes MongoDB, publishes to RabbitMQ for the worker, and calls Stripe and PayPal."
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="var(--color-text-muted)" />
              </marker>
            </defs>

            <!-- connectors (drawn first, animated via stroke-dashoffset) -->
            <g fill="none" stroke="var(--color-text-muted)" stroke-width="1.75" marker-end="url(#arrow)" class="arch-edge">
              <path d="M430,90 L430,140" />
              <path d="M400,180 C300,210 220,230 180,260" />
              <path d="M430,180 L430,260" />
              <path d="M460,180 C560,210 640,230 680,260" />
              <path d="M180,320 C180,350 300,370 420,378" />
              <path d="M430,320 L430,360" />
            </g>

            <!-- nodes -->
            <g class="arch-node" font-family="Inter, sans-serif">
              <g transform="translate(330,30)">
                <rect width="200" height="60" rx="12" fill="var(--color-brand-orange)" />
                <text x="100" y="26" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-ink)">Vue 2 SPA</text>
                <text x="100" y="44" text-anchor="middle" font-size="11" fill="var(--color-ink)" opacity="0.8">Browser · HttpOnly cookies</text>
              </g>

              <g transform="translate(330,140)">
                <rect width="200" height="40" rx="10" fill="var(--color-surface-muted)" stroke="var(--color-border-strong)" />
                <text x="100" y="25" text-anchor="middle" font-size="12" font-weight="600" fill="var(--color-text)">Express API (Node.js)</text>
              </g>

              <g transform="translate(80,260)">
                <rect width="200" height="60" rx="12" fill="var(--color-brand-teal)" />
                <text x="100" y="26" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-ink)">MongoDB</text>
                <text x="100" y="44" text-anchor="middle" font-size="11" fill="var(--color-ink)" opacity="0.8">users · products · orders</text>
              </g>

              <g transform="translate(330,260)">
                <rect width="200" height="60" rx="12" fill="var(--color-brand-purple)" />
                <text x="100" y="26" text-anchor="middle" font-size="13" font-weight="600" fill="white">RabbitMQ</text>
                <text x="100" y="44" text-anchor="middle" font-size="11" fill="white" opacity="0.85">order.process · order.fulfill</text>
              </g>

              <g transform="translate(580,260)">
                <rect width="200" height="60" rx="12" fill="var(--color-brand-blue)" />
                <text x="100" y="26" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-ink)">Stripe · PayPal</text>
                <text x="100" y="44" text-anchor="middle" font-size="11" fill="var(--color-ink)" opacity="0.8">Sandbox REST APIs</text>
              </g>

              <g transform="translate(330,360)">
                <rect width="200" height="40" rx="10" fill="var(--color-surface-muted)" stroke="var(--color-border-strong)" />
                <text x="100" y="25" text-anchor="middle" font-size="12" font-weight="600" fill="var(--color-text)">Worker (RabbitMQ consumer)</text>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>

    <!-- Database design -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="reveal text-xs uppercase tracking-widest text-brand-teal font-medium mb-2">Database design</h2>
      <p class="reveal text-text-secondary max-w-2xl mb-8">
        Four core MongoDB collections. <code class="text-brand-orange">passwordHash</code> uses Mongoose's
        <code class="text-brand-orange">select: false</code> so it's never returned by a default query —
        the API has to explicitly opt in to fetch it, only inside the auth service.
      </p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="c in collections" :key="c.name" class="reveal card overflow-hidden">
          <div class="px-4 py-3 border-b border-border" :style="{ background: c.tint }">
            <p class="font-semibold text-sm" style="color: var(--color-ink)">{{ c.name }}</p>
          </div>
          <ul class="p-4 flex flex-col gap-1.5 text-xs font-mono">
            <li v-for="field in c.fields" :key="field.name" class="flex items-baseline justify-between gap-2">
              <span :class="field.key ? 'text-brand-orange' : 'text-text-secondary'">{{ field.name }}</span>
              <span class="text-text-muted text-right">{{ field.type }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- API design -->
    <section class="border-y border-border bg-chrome/50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 class="reveal text-xs uppercase tracking-widest text-brand-teal font-medium mb-2">API design</h2>
        <p class="reveal text-text-secondary max-w-2xl mb-8">
          A REST API under <code class="text-brand-orange">/api</code>, grouped by resource. Every route
          below <code class="text-brand-orange">/products</code>, <code class="text-brand-orange">/cart</code>,
          and <code class="text-brand-orange">/checkout</code> requires an authenticated session.
        </p>
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-left text-text-muted text-xs uppercase tracking-wide">
                  <th class="px-4 py-3 font-medium">Method</th>
                  <th class="px-4 py-3 font-medium">Endpoint</th>
                  <th class="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ep in endpoints" :key="ep.method + ep.path" class="reveal border-b border-border last:border-0">
                  <td class="px-4 py-3">
                    <span class="method-badge" :class="`method-${ep.method.toLowerCase()}`">{{ ep.method }}</span>
                  </td>
                  <td class="px-4 py-3 font-mono text-text">{{ ep.path }}</td>
                  <td class="px-4 py-3 text-text-muted">{{ ep.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Tech stack -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="reveal text-xs uppercase tracking-widest text-brand-teal font-medium mb-8">Stack</h2>
      <div class="flex flex-wrap gap-2">
        <span v-for="t in stack" :key="t" class="reveal badge">{{ t }}</span>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div class="reveal card p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 class="text-2xl font-semibold text-text mb-1">See it running</h2>
          <p class="text-text-muted">Log in with the demo account and walk through the actual checkout flow.</p>
        </div>
        <router-link to="/login" class="btn-primary shrink-0">Log in</router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default {
  name: 'SystemDesignPage',
  data() {
    return {
      features: [
        {
          title: 'Authentication',
          description: 'Register/login with bcrypt-hashed passwords, JWT access + refresh tokens in HttpOnly cookies.',
          tint: 'linear-gradient(135deg, #ff9f1c, #f15bb5)',
          icon: '<path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19 15a7 7 0 10-14 0"/><path d="M12 15v4"/>',
        },
        {
          title: 'Catalogue browsing',
          description: 'Paginated, searchable, filterable product grid — gated behind login, priced in your currency.',
          tint: 'linear-gradient(135deg, #00bbf9, #9b5de5)',
          icon: '<path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13z"/><path d="M4 9h16M9 20V9"/>',
        },
        {
          title: 'Cart & checkout',
          description: 'Server-persisted cart, live currency conversion, and a provider-agnostic checkout session.',
          tint: 'linear-gradient(135deg, #2ec4b6, #00bbf9)',
          icon: '<path d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.5 6h11.6M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/>',
        },
        {
          title: 'Multi-provider payments',
          description: 'Stripe PaymentIntents and PayPal Orders v2, both against real sandbox REST APIs — not mocked.',
          tint: 'linear-gradient(135deg, #ff9f1c, #ffbf69)',
          icon: '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
        },
        {
          title: 'Async order settlement',
          description: 'A RabbitMQ pipeline decouples payment confirmation from stock reservation and fulfillment.',
          tint: 'linear-gradient(135deg, #9b5de5, #f15bb5)',
          icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
        },
        {
          title: 'Light & dark themes',
          description: 'Runtime CSS-variable theming with no rebuild, persisted per-browser, no flash on load.',
          tint: 'linear-gradient(135deg, #2ec4b6, #ffbf69)',
          icon: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
        },
      ],
      collections: [
        {
          name: 'users',
          tint: 'linear-gradient(135deg, #ff9f1c, #f15bb5)',
          fields: [
            { name: '_id', type: 'ObjectId', key: true },
            { name: 'email', type: 'String, unique' },
            { name: 'passwordHash', type: 'String, select:false' },
            { name: 'name', type: 'String' },
            { name: 'defaultCurrency', type: 'String' },
          ],
        },
        {
          name: 'products',
          tint: 'linear-gradient(135deg, #00bbf9, #9b5de5)',
          fields: [
            { name: '_id', type: 'ObjectId', key: true },
            { name: 'title, slug', type: 'String' },
            { name: 'icon, category', type: 'String' },
            { name: 'basePriceMinor', type: 'Number' },
            { name: 'stock', type: 'Number' },
          ],
        },
        {
          name: 'carts',
          tint: 'linear-gradient(135deg, #2ec4b6, #00bbf9)',
          fields: [
            { name: '_id', type: 'ObjectId', key: true },
            { name: 'user', type: '→ users' },
            { name: 'items[].product', type: '→ products' },
            { name: 'items[].qty', type: 'Number' },
          ],
        },
        {
          name: 'orders',
          tint: 'linear-gradient(135deg, #9b5de5, #f15bb5)',
          fields: [
            { name: '_id', type: 'ObjectId', key: true },
            { name: 'user', type: '→ users' },
            { name: 'items[].product', type: '→ products' },
            { name: 'provider, status', type: 'String' },
            { name: 'events[]', type: '{status,message,at}' },
          ],
        },
      ],
      endpoints: [
        { method: 'POST', path: '/api/auth/register', description: 'Create an account, set auth cookies.' },
        { method: 'POST', path: '/api/auth/login', description: 'Verify credentials, set auth cookies.' },
        { method: 'POST', path: '/api/auth/refresh', description: 'Rotate the access token from the refresh cookie.' },
        { method: 'GET', path: '/api/auth/me', description: 'Return the current session user.' },
        { method: 'GET', path: '/api/products', description: 'Paginated, filterable, currency-converted catalogue.' },
        { method: 'GET', path: '/api/products/:idOrSlug', description: 'Single product detail.' },
        { method: 'GET', path: '/api/cart', description: 'Current user’s server-persisted cart.' },
        { method: 'POST', path: '/api/cart/items', description: 'Add an item to the cart.' },
        { method: 'PATCH', path: '/api/cart/items/:id', description: 'Update a line item’s quantity.' },
        { method: 'DELETE', path: '/api/cart/items/:id', description: 'Remove a line item.' },
        { method: 'POST', path: '/api/checkout/start', description: 'Create an order + provider-specific payment session.' },
        { method: 'POST', path: '/api/checkout/stripe/confirm', description: 'Confirm a settled Stripe PaymentIntent.' },
        { method: 'POST', path: '/api/checkout/paypal/capture', description: 'Capture an approved PayPal order.' },
        { method: 'GET', path: '/api/orders/:id', description: 'Order status + settlement timeline, polled by the client.' },
      ],
      stack: [
        'Vue 2.7', 'Vuex', 'Vue Router', 'Vite', 'Tailwind CSS v4', 'GSAP',
        'Node.js', 'Express 5', 'MongoDB', 'Mongoose', 'RabbitMQ', 'amqplib',
        'Stripe', 'PayPal REST API', 'JWT', 'bcrypt', 'Docker',
      ],
    };
  },
  mounted() {
    this.setupAnimations();
  },
  beforeDestroy() {
    if (this.ctx) this.ctx.revert();
  },
  methods: {
    setupAnimations() {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.ctx = gsap.context(() => {
        const reveals = this.$refs.page.querySelectorAll('.reveal');
        if (reduceMotion) {
          gsap.set(reveals, { opacity: 1, y: 0 });
        } else {
          reveals.forEach((el) => {
            gsap.fromTo(
              el,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
              }
            );
          });
        }

        const svg = this.$refs.archSvg;
        if (svg) {
          const edges = svg.querySelectorAll('.arch-edge path');
          const nodes = svg.querySelectorAll('.arch-node > g');
          if (reduceMotion) {
            gsap.set(edges, { strokeDashoffset: 0 });
            gsap.set(nodes, { opacity: 1, scale: 1 });
          } else {
            edges.forEach((path) => {
              const length = path.getTotalLength();
              gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
            });
            gsap.set(nodes, { opacity: 0, scale: 0.9, transformOrigin: 'center' });

            const tl = gsap.timeline({
              scrollTrigger: { trigger: svg, start: 'top 75%', once: true },
            });
            tl.to(nodes, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)', stagger: 0.08 }).to(
              edges,
              { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut', stagger: 0.08 },
              '-=0.2'
            );
          }
        }
      }, this.$refs.page);
    },
  },
};
</script>

<style scoped>
@reference "../assets/main.css";

.badge {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-text-secondary bg-surface-muted border border-border;
}
.method-badge {
  @apply inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-mono;
}
.method-get {
  @apply bg-brand-teal/15 text-brand-teal;
}
.method-post {
  @apply bg-brand-orange/15 text-brand-orange;
}
.method-patch {
  @apply bg-brand-blue/15 text-brand-blue;
}
.method-delete {
  @apply bg-brand-pink/15 text-brand-pink;
}
</style>
