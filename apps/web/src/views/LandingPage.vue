<template>
  <div>
    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div class="flex flex-wrap gap-2 mb-6 animate-fade-up" style="animation-delay: 0ms">
        <span class="badge">STRIPE + PAYPAL</span>
        <span class="badge">VUE 2 + NODE.JS</span>
        <span class="badge">MONGODB + RABBITMQ</span>
      </div>
      <h1
        class="text-4xl sm:text-6xl font-semibold tracking-tight text-text max-w-3xl leading-[1.05] animate-fade-up"
        style="animation-delay: 60ms"
      >
        A full-stack e-commerce platform, <span class="text-brand-orange">built to show the work.</span>
      </h1>
      <p class="mt-6 text-lg text-text-secondary max-w-2xl animate-fade-up" style="animation-delay: 140ms">
        This is a portfolio project by <strong class="text-text">Saoshyant Mansouri</strong> — a Vue storefront
        backed by Node.js, MongoDB, and a RabbitMQ order pipeline, with real Stripe and PayPal integrations
        wired against their sandbox APIs end to end. Not a mockup — an actual checkout flow.
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-3 animate-fade-up" style="animation-delay: 200ms">
        <router-link to="/register" class="btn-primary">Create an account</router-link>
        <router-link to="/login" class="btn-outline">Log in</router-link>
        <a
          href="https://www.mhdmansouri.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors ml-1"
        >
          More of my work
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
          </svg>
        </a>
      </div>
    </section>

    <!-- Why this exists -->
    <section class="border-y border-border bg-chrome/50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-[1fr_2fr] gap-8">
        <p class="text-xs uppercase tracking-widest text-brand-teal font-medium">Why this exists</p>
        <div class="flex flex-col gap-4 text-text-secondary max-w-2xl">
          <p>
            I built this to demonstrate a production-shaped checkout, not a design exercise: real
            authentication with HttpOnly cookies, a live product catalogue, server-persisted cart and
            order state, and two payment providers integrated against their actual REST APIs.
          </p>
          <p>
            The architecture is modeled after <strong class="text-text">Yakkyofy</strong>, an e-commerce
            sourcing platform — a Vue SPA, an Express/MongoDB API, and an async RabbitMQ job pipeline for
            order settlement. The visual design is my own, carried over from
            <a href="https://www.mhdmansouri.com/" target="_blank" rel="noopener noreferrer" class="text-brand-orange hover:underline">mhdmansouri.com</a>.
          </p>
        </div>
      </div>
    </section>

    <!-- Explore -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p class="text-xs uppercase tracking-widest text-brand-teal font-medium mb-8">Explore</p>
      <div class="flex flex-col divide-y divide-border border-y border-border">
        <component
          :is="item.external ? 'a' : 'router-link'"
          v-for="item in exploreItems"
          :key="item.title"
          v-bind="item.external ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' } : { to: item.href }"
          class="group flex items-center gap-6 py-6 hover:bg-surface-muted transition-colors px-2 -mx-2 rounded-lg"
        >
          <span class="text-sm text-text-muted w-8 shrink-0">{{ item.index }}</span>
          <span class="flex-1">
            <span class="block text-lg font-medium text-text">{{ item.title }}</span>
            <span class="block text-sm text-text-muted">{{ item.description }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            Explore
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </component>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div class="card p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 class="text-2xl font-semibold text-text mb-1">Ready to look around?</h2>
          <p class="text-text-muted">Sign in with the demo account or create your own — mock data, sandbox payments only.</p>
        </div>
        <router-link to="/register" class="btn-primary shrink-0">Create an account</router-link>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'LandingPage',
  data() {
    return {
      exploreItems: [
        {
          index: '01',
          title: 'Browse the storefront',
          description: 'Log in and shop the catalogue, cart, and checkout end to end.',
          href: '/register',
          external: false,
        },
        {
          index: '02',
          title: 'System design & architecture',
          description: 'Database schema, API design, and the RabbitMQ order pipeline — inspired by Yakkyofy.',
          href: '/system-design',
          external: false,
        },
        {
          index: '03',
          title: 'More of my work',
          description: 'Full-stack projects, AI integrations, and more at mhdmansouri.com.',
          href: 'https://www.mhdmansouri.com/',
          external: true,
        },
      ],
    };
  },
};
</script>

<style scoped>
/* @apply needs an explicit reference to the theme when used inside a
   per-component scoped style block under Tailwind v4's Vite plugin. */
@reference "../assets/main.css";

.badge {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-text-secondary bg-surface-muted border border-border;
}
.animate-fade-up {
  animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up {
    animation: none;
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
