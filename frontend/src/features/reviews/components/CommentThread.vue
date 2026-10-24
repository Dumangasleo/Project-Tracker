<script setup lang="ts">
import { CircleCheck, CircleDot, FileCode, Send, Trash2 } from 'lucide-vue-next';
import { computed, reactive, ref } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useToast } from '@/shared/composables/useToast';
import { fullName } from '@/shared/types/member-ref';
import { relativeTime } from '@/shared/utils/date';
import BaseAvatar from '@/shared/ui/BaseAvatar.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseTextarea from '@/shared/ui/BaseTextarea.vue';
import { reviewsApi } from '../api/reviews.api';
import { CommentKind, type ReviewComment, type ReviewDetail } from '../model/review.types';

const props = defineProps<{ review: ReviewDetail; currentUserId: number | null; canManage: boolean }>();
const emit = defineEmits<{
  posted: [comment: ReviewComment];
  removed: [commentId: number];
  'toggle-resolved': [comment: ReviewComment];
}>();

const toast = useToast();
const draft = reactive({ body: '', filePath: '', line: '' as string | number });
const onLine = ref(false);
const posting = ref(false);
const error = ref<string | null>(null);

const timeline = computed(() =>
  props.review.comments.filter(
    (comment) => comment.kind === CommentKind.Comment || comment.kind === CommentKind.System,
  ),
);
const lineNumber = computed(() => (String(draft.line).trim() !== '' ? Number(draft.line) : undefined));
const canPost = computed(
  () =>
    draft.body.trim() !== '' &&
    (!onLine.value ||
      (draft.filePath.trim() !== '' &&
        (lineNumber.value === undefined || (Number.isInteger(lineNumber.value) && lineNumber.value > 0)))),
);

async function post(): Promise<void> {
  if (!canPost.value) return;
  posting.value = true;
  error.value = null;
  try {
    const comment = await reviewsApi.addComment(props.review.id, {
      body: draft.body.trim(),
      ...(onLine.value && { filePath: draft.filePath.trim(), line: lineNumber.value }),
    });
    emit('posted', comment);
    Object.assign(draft, { body: '', filePath: '', line: '' });
    onLine.value = false;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    posting.value = false;
  }
}

async function remove(comment: ReviewComment): Promise<void> {
  try {
    await reviewsApi.removeComment(props.review.id, comment.id);
    emit('removed', comment.id);
  } catch (failure) {
    toast.error('Could not delete comment', errorMessage(failure));
  }
}

const canResolve = (comment: ReviewComment) => props.canManage || comment.authorId === props.currentUserId;
</script>

<template>
  <BaseCard title="Discussion" description="Ask questions, point out problems, or leave suggestions.">
    <ol class="space-y-4">
      <li v-for="comment in timeline" :key="comment.id">
        <p v-if="comment.kind === CommentKind.System" class="flex items-center gap-2 text-xs text-fg-subtle">
          <CircleDot class="size-3.5 shrink-0" aria-hidden="true" />
          <span>{{ comment.body }}</span>
          <span aria-hidden="true">·</span>
          <time :datetime="comment.createdAt">{{ relativeTime(comment.createdAt) }}</time>
        </p>

        <article v-else class="flex gap-3">
          <BaseAvatar :name="comment.author ? fullName(comment.author) : 'Former member'" size="sm" />
          <div
            :class="[
              'min-w-0 flex-1 rounded-lg border px-4 py-3',
              comment.resolved ? 'border-line bg-surface-muted/60' : 'border-line bg-surface',
            ]"
          >
            <header class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="text-sm font-medium text-fg">{{ comment.author ? fullName(comment.author) : 'Former member' }}</span>
              <time class="text-xs text-fg-subtle" :datetime="comment.createdAt">{{ relativeTime(comment.createdAt) }}</time>
              <span
                v-if="comment.filePath"
                class="inline-flex max-w-full items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-fg-muted"
              >
                <FileCode class="size-3 shrink-0" aria-hidden="true" />
                <span class="truncate">{{ comment.filePath }}<template v-if="comment.line">:{{ comment.line }}</template></span>
              </span>
              <span v-if="comment.resolved" class="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <CircleCheck class="size-3.5" aria-hidden="true" />
                Resolved
              </span>
              <span class="ml-auto flex items-center gap-1">
                <button
                  v-if="canResolve(comment)"
                  type="button"
                  class="rounded px-1.5 py-0.5 text-xs text-fg-muted hover:bg-surface-muted hover:text-fg"
                  @click="emit('toggle-resolved', comment)"
                >
                  {{ comment.resolved ? 'Reopen' : 'Resolve' }}
                </button>
                <button
                  v-if="comment.authorId === currentUserId"
                  type="button"
                  class="rounded p-1 text-fg-subtle hover:bg-surface-muted hover:text-red-600"
                  aria-label="Delete comment"
                  @click="remove(comment)"
                >
                  <Trash2 class="size-3.5" />
                </button>
              </span>
            </header>
            <p class="mt-1.5 text-sm break-words whitespace-pre-wrap text-fg">{{ comment.body }}</p>
          </div>
        </article>
      </li>
      <li v-if="timeline.length === 0" class="text-sm text-fg-muted">No comments yet.</li>
    </ol>

    <form class="mt-6 space-y-3 border-t border-line pt-5" @submit.prevent="post">
      <label for="review-comment" class="sr-only">Write a comment</label>
      <BaseTextarea
        id="review-comment"
        v-model="draft.body"
        :rows="3"
        maxlength="4000"
        placeholder="Write a comment… e.g. “Please handle the empty list case here.”"
      />

      <div v-if="onLine" class="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <BaseInput v-model="draft.filePath" maxlength="500" placeholder="File path, e.g. src/features/tasks/views/TasksView.vue" aria-label="File path" />
        <BaseInput v-model="draft.line" type="number" min="1" placeholder="Line" aria-label="Line number" />
      </div>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <label class="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
          <input v-model="onLine" type="checkbox" class="size-4 rounded border-line text-accent focus:ring-accent/30" />
          Comment on a specific file / line
        </label>
        <BaseButton type="submit" :loading="posting" :disabled="!canPost">
          <Send class="size-4" aria-hidden="true" />
          Comment
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>
