<script setup lang="ts">
import { ref, watch } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useTeamStore } from '@/features/team';
import { useToast } from '@/shared/composables/useToast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import { reviewsApi } from '../api/reviews.api';
import type { ReviewDetail } from '../model/review.types';
import ReviewerPicker from './ReviewerPicker.vue';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ review: ReviewDetail }>();
const emit = defineEmits<{ saved: [review: ReviewDetail] }>();

const team = useTeamStore();
const toast = useToast();
const selected = ref<number[]>([]);
const saving = ref(false);
const error = ref<string | null>(null);

watch(open, (isOpen) => {
  if (!isOpen) return;
  selected.value = props.review.reviewers.map((reviewer) => reviewer.memberId);
  error.value = null;
  void team.fetchMembers();
});

async function save(): Promise<void> {
  if (selected.value.length === 0) return;
  saving.value = true;
  error.value = null;
  try {
    const review = await reviewsApi.setReviewers(props.review.id, selected.value);
    toast.success('Reviewers updated', 'New reviewers were notified.');
    emit('saved', review);
    open.value = false;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Reviewers" description="Pick the senior developers who should check this.">
    <ReviewerPicker v-model="selected" :exclude-id="review.authorId" />
    <p v-if="error" class="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Cancel</BaseButton>
      <BaseButton :loading="saving" :disabled="selected.length === 0" @click="save">Save reviewers</BaseButton>
    </template>
  </BaseModal>
</template>
