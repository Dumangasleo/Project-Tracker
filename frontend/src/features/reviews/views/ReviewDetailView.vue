<script setup lang="ts">
import { ArrowLeft, Check, ExternalLink, GitMerge, GitPullRequest, Pencil, RotateCcw, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { errorMessage } from '@/core/http/api-error';
import { useAuthStore } from '@/features/auth';
import { useConfirm } from '@/shared/composables/useConfirm';
import { useToast } from '@/shared/composables/useToast';
import { fullName } from '@/shared/types/member-ref';
import { findOption } from '@/shared/types/tone';
import { formatDate, relativeTime } from '@/shared/utils/date';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BaseBadge from '@/shared/ui/BaseBadge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import BaseEmptyState from '@/shared/ui/BaseEmptyState.vue';
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue';
import PageHeader from '@/shared/ui/PageHeader.vue';
import { reviewsApi } from '../api/reviews.api';
import CommentThread from '../components/CommentThread.vue';
import DecisionModal from '../components/DecisionModal.vue';
import FindingsPanel from '../components/FindingsPanel.vue';
import ResubmitModal from '../components/ResubmitModal.vue';
import ReviewersModal from '../components/ReviewersModal.vue';
import {
  CI_STATE_OPTIONS,
  DECISION_OPTIONS,
  isAnalyzing,
  providerLabel,
  REVIEW_STATUS_OPTIONS,
  ReviewDecision,
  ReviewStatus,
  type ReviewComment,
  type ReviewDetail,
} from '../model/review.types';

const POLL_MS = 3_000;

const route = useRoute();
const auth = useAuthStore();
const toast = useToast();
const { confirm } = useConfirm();

const review = ref<ReviewDetail | null>(null);
const loading = ref(true);
const loadError = ref<string | null>(null);
const rerunning = ref(false);
const closing = ref(false);
const decisionOpen = ref(false);
const decision = ref<ReviewDecision>(ReviewDecision.Approved);
const resubmitOpen = ref(false);
const reviewersOpen = ref(false);
const merging = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const reviewId = computed(() => Number(route.params.id));
const me = computed(() => auth.user?.id ?? null);
const isAuthor = computed(() => review.value?.authorId === me.value);
const myReviewer = computed(() => review.value?.reviewers.find((reviewer) => reviewer.memberId === me.value));
const isOpen = computed(
  () =>
    review.value !== null &&
    review.value.status !== ReviewStatus.Closed &&
    review.value.status !== ReviewStatus.Merged,
);
const canManage = computed(() => isAuthor.value || myReviewer.value !== undefined);
const canResubmit = computed(
  () =>
    isAuthor.value &&
    (review.value?.status === ReviewStatus.ChangesRequested || review.value?.status === ReviewStatus.Open),
);
const canMerge = computed(
  () => canManage.value && review.value?.provider === 'gitea' && review.value.status === ReviewStatus.Approved,
);

const needsPolling = (value: ReviewDetail) => isAnalyzing(value) || value.checks?.state === 'pending';

async function load(showSpinner = false): Promise<void> {
  clearTimeout(pollTimer);
  if (showSpinner) loading.value = true;
  try {
    review.value = await reviewsApi.get(reviewId.value);
    loadError.value = null;
  } catch (failure) {
    loadError.value = errorMessage(failure);
  } finally {
    loading.value = false;
  }
  if (review.value && needsPolling(review.value)) pollTimer = setTimeout(load, POLL_MS);
}

function apply(updated: ReviewDetail): void {
  review.value = updated;
  clearTimeout(pollTimer);
  if (needsPolling(updated)) pollTimer = setTimeout(load, POLL_MS);
}

async function merge(): Promise<void> {
  const confirmed = await confirm({
    title: 'Merge this pull request?',
    message: `It will be merged into ${review.value?.repository} and its branch deleted. The task becomes Done.`,
    confirmLabel: 'Merge',
  });
  if (!confirmed) return;

  merging.value = true;
  try {
    apply(await reviewsApi.merge(reviewId.value));
    toast.success('Pull request merged');
  } catch (failure) {
    toast.error('Could not merge', errorMessage(failure));
  } finally {
    merging.value = false;
  }
}

watch(reviewId, () => load(true), { immediate: true });
onBeforeUnmount(() => clearTimeout(pollTimer));

function openDecision(value: ReviewDecision): void {
  decision.value = value;
  decisionOpen.value = true;
}

async function rerun(): Promise<void> {
  rerunning.value = true;
  try {
    apply(await reviewsApi.analyze(reviewId.value));
  } catch (failure) {
    toast.error('Could not start the checks', errorMessage(failure));
  } finally {
    rerunning.value = false;
  }
}

async function closeReview(): Promise<void> {
  const confirmed = await confirm({
    title: 'Close this review?',
    message: 'Reviewers will no longer be able to approve it. Use this if the pull request was abandoned.',
    confirmLabel: 'Close review',
    danger: true,
  });
  if (!confirmed) return;

  closing.value = true;
  try {
    apply(await reviewsApi.close(reviewId.value));
    toast.success('Review closed');
  } catch (failure) {
    toast.error('Could not close review', errorMessage(failure));
  } finally {
    closing.value = false;
  }
}

function replaceComment(updated: ReviewComment): void {
  if (!review.value) return;
  const exists = review.value.comments.some((comment) => comment.id === updated.id);
  review.value = {
    ...review.value,
    comments: exists
      ? review.value.comments.map((comment) => (comment.id === updated.id ? updated : comment))
      : [...review.value.comments, updated],
  };
}

function removeComment(commentId: number): void {
  if (!review.value) return;
  review.value = { ...review.value, comments: review.value.comments.filter((comment) => comment.id !== commentId) };
}

async function toggleResolved(comment: ReviewComment): Promise<void> {
  try {
    replaceComment(await reviewsApi.setResolved(reviewId.value, comment.id, !comment.resolved));
  } catch (failure) {
    toast.error('Could not update', errorMessage(failure));
  }
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: 'reviews' }"
      class="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Code reviews
    </RouterLink>

    <div v-if="loading" class="space-y-4">
      <BaseSkeleton class="h-8 w-1/2" />
      <BaseSkeleton class="h-40 w-full" />
    </div>

    <BaseEmptyState
      v-else-if="loadError || !review"
      :icon="GitPullRequest"
      title="Could not open this review"
      :description="loadError ?? 'It may have been deleted.'"
    />

    <template v-else>
      <PageHeader
        :title="review.title"
        :description="`${providerLabel(review.provider)} · ${review.repository} #${review.pullRequestNumber}`"
      >
        <template #actions>
          <a
            :href="review.pullRequestUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg shadow-xs transition-colors hover:bg-surface-muted"
          >
            <ExternalLink class="size-4" aria-hidden="true" />
            Open on {{ providerLabel(review.provider) }}
          </a>
          <template v-if="myReviewer && isOpen">
            <BaseButton variant="secondary" @click="openDecision(ReviewDecision.ChangesRequested)">
              <X class="size-4" aria-hidden="true" />
              Request changes
            </BaseButton>
            <BaseButton @click="openDecision(ReviewDecision.Approved)">
              <Check class="size-4" aria-hidden="true" />
              Approve
            </BaseButton>
          </template>
          <BaseButton v-if="canMerge" :loading="merging" @click="merge">
            <GitMerge class="size-4" aria-hidden="true" />
            Merge
          </BaseButton>
          <BaseButton v-if="canResubmit" @click="resubmitOpen = true">
            <RotateCcw class="size-4" aria-hidden="true" />
            Ask for another review
          </BaseButton>
          <BaseButton v-if="canResubmit" variant="ghost" :loading="closing" @click="closeReview">Close</BaseButton>
        </template>
      </PageHeader>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <BaseCard v-if="review.message" :title="`Message from ${review.author ? fullName(review.author) : 'the author'}`">
            <p class="text-sm break-words whitespace-pre-wrap text-fg">{{ review.message }}</p>
          </BaseCard>

          <FindingsPanel
            :review="review"
            :can-manage="canManage"
            :rerunning="rerunning"
            @rerun="rerun"
            @toggle-resolved="toggleResolved"
          />

          <CommentThread
            :review="review"
            :current-user-id="me"
            :can-manage="canManage"
            @posted="replaceComment"
            @removed="removeComment"
            @toggle-resolved="toggleResolved"
          />
        </div>

        <div class="space-y-6">
          <BaseCard title="Status">
            <dl class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <dt class="text-fg-muted">Review</dt>
                <dd>
                  <BaseBadge :tone="findOption(REVIEW_STATUS_OPTIONS, review.status)?.tone" dot>
                    {{ findOption(REVIEW_STATUS_OPTIONS, review.status)?.label }}
                  </BaseBadge>
                </dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-fg-muted">Task</dt>
                <dd class="truncate text-right text-fg">{{ review.task?.name ?? '—' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-fg-muted">Author</dt>
                <dd class="text-fg">{{ review.author ? fullName(review.author) : '—' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-fg-muted">Submitted</dt>
                <dd class="text-fg">{{ formatDate(review.createdAt) }}</dd>
              </div>
              <div v-if="review.filesChanged !== null" class="flex items-center justify-between gap-3">
                <dt class="text-fg-muted">Changes</dt>
                <dd class="font-mono text-xs">
                  {{ review.filesChanged }} files
                  <span class="text-emerald-600 dark:text-emerald-400">+{{ review.additions }}</span>
                  <span class="text-red-600 dark:text-red-400">−{{ review.deletions }}</span>
                </dd>
              </div>
              <div v-if="review.analyzedAt" class="flex items-center justify-between gap-3">
                <dt class="text-fg-muted">Last checked</dt>
                <dd class="text-fg">{{ relativeTime(review.analyzedAt) }}</dd>
              </div>
            </dl>
          </BaseCard>

          <BaseCard v-if="review.checks" title="CI pipeline">
            <template #actions>
              <BaseBadge :tone="findOption(CI_STATE_OPTIONS, review.checks.state)?.tone ?? 'neutral'" dot>
                {{ findOption(CI_STATE_OPTIONS, review.checks.state)?.label ?? review.checks.state }}
              </BaseBadge>
            </template>
            <p v-if="review.checks.statuses.length === 0" class="text-sm text-fg-muted">
              No pipeline has reported for the latest commit yet. Add <code class="font-mono text-xs">.gitea/workflows/ci.yml</code>
              to the repository to run one.
            </p>
            <ul v-else class="space-y-3">
              <li v-for="check in review.checks.statuses" :key="check.context" class="flex items-start gap-3 text-sm">
                <BaseBadge :tone="findOption(CI_STATE_OPTIONS, check.status)?.tone ?? 'neutral'" dot>
                  {{ findOption(CI_STATE_OPTIONS, check.status)?.label ?? check.status }}
                </BaseBadge>
                <a
                  :href="check.targetUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-w-0 flex-1 truncate text-fg hover:text-accent-fg"
                  :title="check.description"
                >
                  {{ check.context }}
                </a>
              </li>
            </ul>
          </BaseCard>

          <BaseCard title="Reviewers">
            <template v-if="isAuthor && isOpen" #actions>
              <BaseButton size="sm" variant="ghost" @click="reviewersOpen = true">
                <Pencil class="size-3.5" aria-hidden="true" />
                Edit
              </BaseButton>
            </template>
            <p v-if="review.reviewers.length === 0" class="text-sm text-fg-muted">
              No reviewer yet.<template v-if="isAuthor"> Click Edit to ask a senior developer.</template>
            </p>
            <ul class="space-y-3">
              <li v-for="reviewer in review.reviewers" :key="reviewer.id" class="flex items-center gap-3">
                <BaseAvatar :name="reviewer.member ? fullName(reviewer.member) : '?'" size="sm" />
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                  {{ reviewer.member ? fullName(reviewer.member) : 'Former member' }}
                  <span v-if="reviewer.memberId === me" class="font-normal text-fg-muted">(you)</span>
                </span>
                <BaseBadge :tone="findOption(DECISION_OPTIONS, reviewer.decision)?.tone">
                  {{ findOption(DECISION_OPTIONS, reviewer.decision)?.label }}
                </BaseBadge>
              </li>
            </ul>
          </BaseCard>
        </div>
      </div>

      <DecisionModal v-model:open="decisionOpen" :review-id="review.id" :decision="decision" @decided="apply" />
      <ResubmitModal v-model:open="resubmitOpen" :review="review" @resubmitted="apply" />
      <ReviewersModal v-model:open="reviewersOpen" :review="review" @saved="apply" />
    </template>
  </div>
</template>
