<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useAuthStore } from '@/features/auth';
import { useTeamStore } from '@/features/team';
import { useToast } from '@/shared/composables/useToast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import BaseTextarea from '@/shared/ui/BaseTextarea.vue';
import { reviewsApi } from '../api/reviews.api';
import { isPullRequestUrl, type ReviewDetail } from '../model/review.types';
import ReviewerPicker from './ReviewerPicker.vue';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ task: { id: number; name: string } | null }>();
const emit = defineEmits<{ submitted: [review: ReviewDetail] }>();

const URL_EXAMPLE = 'http://host.docker.internal:3002/vortex/web/pulls/12';

const auth = useAuthStore();
const team = useTeamStore();
const toast = useToast();

const form = reactive({ pullRequestUrl: '', title: '', message: '', reviewerIds: [] as number[] });
const saving = ref(false);
const error = ref<string | null>(null);
const touchedUrl = ref(false);

const urlError = computed<string | null>(() =>
  touchedUrl.value && form.pullRequestUrl !== '' && !isPullRequestUrl(form.pullRequestUrl)
    ? 'Paste a pull request link from the Git server (…/pulls/12), GitHub (…/pull/12) or Bitbucket (…/pull-requests/12).'
    : null,
);
const taskLabel = computed(() => (props.task ? `Task: ${props.task.name}` : undefined));
const canSubmit = computed(
  () => props.task !== null && isPullRequestUrl(form.pullRequestUrl) && form.reviewerIds.length > 0,
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, { pullRequestUrl: '', title: '', message: '', reviewerIds: [] });
  error.value = null;
  touchedUrl.value = false;
  void team.fetchMembers();
});

async function submit(): Promise<void> {
  touchedUrl.value = true;
  if (!canSubmit.value || !props.task) return;
  saving.value = true;
  error.value = null;
  try {
    const review = await reviewsApi.create({
      taskId: props.task.id,
      pullRequestUrl: form.pullRequestUrl.trim(),
      title: form.title.trim() || undefined,
      message: form.message.trim() || undefined,
      reviewerIds: form.reviewerIds,
    });
    toast.success('Sent for review', 'Your reviewers were notified. Automated checks are running.');
    emit('submitted', review);
    open.value = false;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Submit for code review" :description="taskLabel" size="lg">
    <form id="submit-review-form" class="space-y-4" novalidate @submit.prevent="submit">
      <BaseField v-slot="{ id, invalid }" label="Pull request link" :error="urlError" required>
        <BaseInput
          :id="id"
          v-model="form.pullRequestUrl"
          type="url"
          inputmode="url"
          :placeholder="URL_EXAMPLE"
          autocomplete="off"
          :invalid="invalid"
          @blur="touchedUrl = true"
        />
      </BaseField>

      <BaseField v-slot="{ id }" label="Title" hint="Leave empty to use the pull request's title.">
        <BaseInput :id="id" v-model="form.title" maxlength="200" placeholder="e.g. Add checkout page" />
      </BaseField>

      <BaseField v-slot="{ id }" label="Message for reviewers">
        <BaseTextarea
          :id="id"
          v-model="form.message"
          :rows="4"
          maxlength="4000"
          placeholder="What did you change? How did you test it? What should reviewers look at closely?"
        />
      </BaseField>

      <BaseField v-slot="{ id }" label="Reviewers" hint="Pick the senior developers who should check this." required>
        <ReviewerPicker :id="id" v-model="form.reviewerIds" :exclude-id="auth.user?.id" />
      </BaseField>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="submit-review-form" :loading="saving" :disabled="!canSubmit">
        Submit for review
      </BaseButton>
    </template>
  </BaseModal>
</template>
