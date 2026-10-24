<script setup lang="ts">
import { RouterView } from 'vue-router';
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue';
import ToastContainer from '@/shared/ui/ToastContainer.vue';
</script>

<template>
  <RouterView />
  <ToastContainer />
  <ConfirmDialog />
</template>
