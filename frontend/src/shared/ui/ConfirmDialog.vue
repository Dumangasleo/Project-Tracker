<script setup lang="ts">
import { computed } from 'vue';
import { useConfirm } from '@/shared/composables/useConfirm';
import BaseButton from './BaseButton.vue';
import BaseModal from './BaseModal.vue';

const { pending, settle } = useConfirm();

const open = computed({
  get: () => pending.value !== null,
  set: (value) => {
    if (!value) settle(false);
  },
});
</script>

<template>
  <BaseModal v-model:open="open" :title="pending?.title ?? ''" size="sm">
    <p class="text-sm text-fg-muted">{{ pending?.message }}</p>
    <template #footer>
      <BaseButton variant="secondary" @click="settle(false)">Cancel</BaseButton>
      <BaseButton :variant="pending?.danger ? 'danger' : 'primary'" @click="settle(true)">
        {{ pending?.confirmLabel ?? 'Confirm' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
