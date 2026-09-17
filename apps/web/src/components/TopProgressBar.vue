<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden transition-opacity duration-300"
    :class="visible ? 'opacity-100' : 'opacity-0'"
    aria-hidden="true"
  >
    <div class="progress-indeterminate h-full w-2/5 rounded-full bg-brand-orange" />
  </div>
</template>

<script>
import { progress } from '../boot/progress';

// Only show for work that takes longer than this, so fast requests don't flicker the bar.
const SHOW_AFTER_MS = 150;

export default {
  name: 'TopProgressBar',
  data() {
    return { visible: false, timer: null };
  },
  computed: {
    busy() {
      return progress.navigating || progress.requests > 0;
    },
  },
  watch: {
    busy(busy) {
      clearTimeout(this.timer);
      if (busy) this.timer = setTimeout(() => { this.visible = true; }, SHOW_AFTER_MS);
      else this.visible = false;
    },
  },
  beforeDestroy() {
    clearTimeout(this.timer);
  },
};
</script>
