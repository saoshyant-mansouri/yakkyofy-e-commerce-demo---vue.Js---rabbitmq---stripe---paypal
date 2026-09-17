<template>
  <nav class="flex items-center justify-center gap-1.5 py-8 flex-wrap" aria-label="Pagination">
    <button
      type="button"
      class="icon-btn"
      :disabled="page <= 1"
      :aria-label="$t('common.previous')"
      @click="$emit('change', page - 1)"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <template v-for="(p, i) in pages">
      <span v-if="p === ELLIPSIS" :key="`e-${i}`" class="px-2 text-text-muted select-none" aria-hidden="true">
        &hellip;
      </span>
      <button
        v-else
        :key="p"
        type="button"
        class="min-w-10 h-10 px-2 rounded-lg text-sm font-medium transition-colors"
        :class="
          p === page
            ? 'bg-brand-orange text-ink'
            : 'text-text hover:bg-surface border border-transparent'
        "
        :aria-current="p === page ? 'page' : null"
        :aria-label="$t('common.page', { page: p, total: totalPages })"
        @click="p !== page && $emit('change', p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      class="icon-btn"
      :disabled="page >= totalPages"
      :aria-label="$t('common.next')"
      @click="$emit('change', page + 1)"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </nav>
</template>

<script>
const ELLIPSIS = '…';

export default {
  name: 'PaginationBar',
  props: {
    page: { type: Number, required: true },
    totalPages: { type: Number, required: true },
  },
  data() {
    return { ELLIPSIS };
  },
  computed: {
    // Always shows first/last page, the current page +/-1 neighbour, and
    // collapses everything else behind an ellipsis once the range is large.
    pages() {
      const total = this.totalPages;
      const current = this.page;
      const neighbours = [];
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        neighbours.push(i);
      }

      const result = [1];
      if (neighbours[0] > 2) result.push(ELLIPSIS);
      result.push(...neighbours);
      if (neighbours[neighbours.length - 1] < total - 1) result.push(ELLIPSIS);
      if (total > 1) result.push(total);
      return result;
    },
  },
};
</script>
