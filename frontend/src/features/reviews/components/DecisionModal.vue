<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useToast } from '@/shared/composables/useToast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import BaseTextarea from '@/shared/ui/BaseTextarea.vue';
import { reviewsApi } from '../api/reviews.api';
import { ReviewDecision, type ReviewDetail } from '../model/review.types';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ reviewId: number; decision: ReviewDecision }>();
const emit = defineEmits<{ decided: [review: ReviewDetail] }>();

const toast = useToast();
const comment = ref('');
const saving = ref(false);
const error = ref<string | null>(null);

const approving = computed(() => props.decision === ReviewDecision.Approved);
const canSubmit = computed(() => approving.value || comment.value.trim() !== '');

watch(open, (isOpen) => {
  if (!isOpen) return;
  comment.value = '';
  error.value = null;
});

async function submit(): Promise<void> {
  if (!canSubmit.value) return;
  saving.value = true;
  error.value = null;
  try {
    const review = await reviewsApi.decide(props.reviewId, props.decision, comment.value.trim() || undefined);
    toast.success(approving.value ? 'Pull request approved' : 'Changes requested', 'The author was notified.');
    emit('decided', review);
    open.value = false;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="approving ? 'Approve pull request' : 'Request changes'"
    :description="approving ? 'Let the author know it is good to merge.' : 'Tell the author what to fix before you approve.'"
  >
    <form id="decision-form" novalidate @submit.prevent="submit">
      <BaseField v-slot="{ id }" :label="approving ? 'Comment (optional)' : 'What needs to change?'" :required="!approving">
        <BaseTextarea
          :id="id"
          v-model="comment"
          :rows="4"
          maxlength="4000"
          :placeholder="approving ? 'Nice work!' : 'e.g. The amount is not validated before saving.'"
        />
      </BaseField>
      <p v-if="error" class="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Cancel</BaseButton>
      <BaseButton
        type="submit"
        form="decision-form"
        :variant="approving ? 'primary' : 'danger'"
        :loading="saving"
        :disabled="!canSubmit"
      >
        {{ approving ? 'Approve' : 'Request changes' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
