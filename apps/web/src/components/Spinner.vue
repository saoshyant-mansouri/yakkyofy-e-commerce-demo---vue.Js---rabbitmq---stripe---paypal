<template>
  <svg
    class="animate-spin"
    :class="sizeClass"
    viewBox="0 0 24 24"
    fill="none"
    role="status"
    :aria-label="label"
  >
    <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
    <path
      d="M22 12a10 10 0 00-10-10"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>
</template>

<script>
export default {
  name: 'Spinner',
  props: {
    size: { type: String, default: 'md' }, // sm | md | lg
    label: { type: String, default: 'Loading' },
  },
  computed: {
    sizeClass() {
      return { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[this.size] || 'w-6 h-6';
    },
  },
};
</script>
