<template>
  <div class="min-h-screen flex flex-col bg-bg text-text">
    <header class="sticky top-0 z-20 border-b border-border bg-chrome/90 backdrop-blur">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <router-link to="/" class="font-semibold text-lg tracking-tight text-text shrink-0">
          yakkyofy<span class="text-brand-orange">.demo</span>
        </router-link>

        <nav class="hidden sm:flex items-center gap-1 ml-2" aria-label="Primary">
          <router-link to="/system-design" class="px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text transition-colors">
            System design
          </router-link>
        </nav>

        <div class="flex-1" />

        <ApiStatusPill compact />

        <button
          type="button"
          class="icon-btn"
          :aria-label="theme === 'dark' ? $t('nav.lightMode') : $t('nav.darkMode')"
          @click="toggleTheme"
        >
          <svg v-if="theme === 'dark'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path stroke-linecap="round" d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
          </svg>
        </button>

        <template v-if="isAuthenticated">
          <router-link to="/products" class="btn-primary !px-4 !py-1.5 text-sm">
            Dashboard
          </router-link>
        </template>
        <template v-else>
          <router-link
            v-if="$route.name !== 'login'"
            to="/login"
            class="btn-outline !px-4 !py-1.5"
            :class="$route.name !== 'register' && 'hidden sm:inline-flex'"
          >
            {{ $t('nav.login') }}
          </router-link>
          <router-link v-if="$route.name !== 'register'" to="/register" class="btn-primary !px-4 !py-1.5 text-sm">
            {{ $t('nav.register') }}
          </router-link>
        </template>
      </div>
    </header>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>

    <footer class="border-t border-border">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-muted">
        <p>
          A portfolio project by
          <a
            href="https://www.mhdmansouri.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-brand-orange hover:underline"
          >Saoshyant Mansouri ↗</a>
        </p>
        <router-link to="/system-design" class="hover:text-text transition-colors">
          System design &amp; architecture →
        </router-link>
      </div>
    </footer>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import ApiStatusPill from '../components/ApiStatusPill.vue';

export default {
  name: 'PublicLayout',
  components: { ApiStatusPill },
  computed: {
    ...mapState('ui', ['theme']),
    ...mapGetters('auth', ['isAuthenticated']),
  },
  methods: {
    ...mapActions('ui', ['toggleTheme']),
  },
};
</script>
