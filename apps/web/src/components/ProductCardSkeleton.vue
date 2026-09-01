<template>
  <div class="card overflow-hidden flex flex-col" aria-hidden="true">
    <div class="w-full aspect-square animate-pulse bg-surface-muted" />
    <div class="p-4 flex flex-col gap-2 flex-1">
      <div class="h-3 w-16 rounded-full animate-pulse bg-surface-muted" />
      <div class="h-4 w-4/5 rounded-full animate-pulse bg-surface-muted" />
      <div class="h-3 w-1/2 rounded-full animate-pulse bg-surface-muted" />
      <div class="mt-auto flex items-center justify-between pt-2">
        <div class="h-5 w-14 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-8 w-24 rounded-full animate-pulse bg-surface-muted" />
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'ProductCardSkeleton' };
</script>
