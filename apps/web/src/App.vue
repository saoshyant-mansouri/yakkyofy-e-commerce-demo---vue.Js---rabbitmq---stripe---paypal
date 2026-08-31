<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script>
import DashboardLayout from './layouts/DashboardLayout.vue';
import PublicLayout from './layouts/PublicLayout.vue';

export default {
  name: 'App',
  components: { DashboardLayout, PublicLayout },
  computed: {
    layoutComponent() {
      return this.$route.meta.layout === 'public' ? 'PublicLayout' : 'DashboardLayout';
    },
  },
};
</script>
