<template>
  <div class="text-center py-24">
    <p class="text-6xl font-semibold text-brand-orange mb-4">404</p>
    <p class="text-text-muted mb-6">Page not found.</p>
    <router-link to="/dashboard" class="text-brand-orange hover:underline">Back to dashboard</router-link>
  </div>
</template>

<script>
export default { name: 'NotFound' };
</script>
