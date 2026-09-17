<template>
  <div class="card flex items-center justify-between gap-4 px-6 py-5">
    <div class="min-w-0">
      <p class="flex items-baseline gap-1.5 text-brand-orange">
        <span class="text-[28px] font-semibold leading-none tabular-nums">{{ value }}</span>
        <span v-if="unit" class="text-sm">{{ unit }}</span>
      </p>
      <p class="mt-1.5 text-[15px] font-medium leading-snug text-text">{{ label }}</p>
    </div>
    <span class="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-canvas text-text" aria-hidden="true">
      <slot name="icon" />
    </span>
  </div>
</template>

<script>
/** KPI tile: big orange number with its label below, icon in a soft circle on the right. */
export default {
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    unit: { type: String, default: '' },
  },
};
</script>
