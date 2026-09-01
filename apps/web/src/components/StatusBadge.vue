<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
    :class="classes"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClasses" aria-hidden="true" />
    {{ status }}
  </span>
</template>

<script>
const MAP = {
  pending: { classes: 'bg-surface-muted text-text-secondary', dot: 'bg-text-muted' },
  processing: { classes: 'bg-brand-blue/15 text-brand-blue', dot: 'bg-brand-blue' },
  paid: { classes: 'bg-brand-teal/15 text-brand-teal', dot: 'bg-brand-teal' },
  failed: { classes: 'bg-brand-pink/15 text-brand-pink', dot: 'bg-brand-pink' },
};

export default {
  name: 'StatusBadge',
  props: {
    status: { type: String, required: true },
  },
  computed: {
    classes() {
      return (MAP[this.status] || MAP.pending).classes;
    },
    dotClasses() {
      return (MAP[this.status] || MAP.pending).dot;
    },
  },
};
</script>
