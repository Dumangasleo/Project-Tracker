<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useToast } from '@/shared/composables/useToast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import BaseTextarea from '@/shared/ui/BaseTextarea.vue';
import { reviewsApi } from '../api/reviews.api';
import { isPullRequestUrl, type ReviewDetail } from '../model/review.types';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ review: ReviewDetail }>();
const emit = defineEmits<{ resubmitted: [review: ReviewDetail] }>();

const toast = useToast();
const form = reactive({ pullRequestUrl: '', message: '' });
const saving = ref(false);
const error = ref<string | null>(null);

const urlChanged = computed(() => form.pullRequestUrl.trim() !== props.review.pullRequestUrl);
const urlValid = computed(() => isPullRequestUrl(form.pullRequestUrl));

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, { pullRequestUrl: props.review.pullRequestUrl, message: '' });
  error.value = null;
});

async function submit(): Promise<void> {
  if (!urlValid.value) return;
  saving.value = true;
  error.value = null;
  try {
    const review = await reviewsApi.resubmit(props.review.id, {
      pullRequestUrl: urlChanged.value ? form.pullRequestUrl.trim() : undefined,
      message: form.message.trim() || undefined,
    });
    toast.success('Sent for another review', 'Reviewers were notified and the checks are running again.');
    emit('resubmitted', review);
    open.value = false;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Ask for another review" description="Push your fixes first, then tell reviewers what changed.">
    <form id="resubmit-form" class="space-y-4" novalidate @submit.prevent="submit">
      <BaseField
        v-slot="{ id, invalid }"
        label="Pull request link"
        :error="urlValid ? null : 'Use a GitHub or Bitbucket pull request link.'"
        hint="Change it only if you opened a new pull request."
      >
        <BaseInput :id="id" v-model="form.pullRequestUrl" type="url" :invalid="invalid" />
      </BaseField>
      <BaseField v-slot="{ id }" label="What did you change?">
        <BaseTextarea :id="id" v-model="form.message" :rows="4" maxlength="4000" placeholder="e.g. Added the null check and a unit test." />
      </BaseField>
      <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="resubmit-form" :loading="saving" :disabled="!urlValid">Request review</BaseButton>
    </template>
  </BaseModal>
</template>
