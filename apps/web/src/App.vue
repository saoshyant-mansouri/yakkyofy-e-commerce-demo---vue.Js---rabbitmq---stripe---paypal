<template>
  <div>
    <TopProgressBar />
    <component :is="layoutComponent">
      <router-view />
    </component>
  </div>
</template>

<script>
import DashboardLayout from './layouts/DashboardLayout.vue';
import PublicLayout from './layouts/PublicLayout.vue';
import TopProgressBar from './components/TopProgressBar.vue';

export default {
  name: 'App',
  components: { DashboardLayout, PublicLayout, TopProgressBar },
  computed: {
    layoutComponent() {
      return this.$route.meta.layout === 'public' ? 'PublicLayout' : 'DashboardLayout';
    },
  },
};
</script>
