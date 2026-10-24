<script setup lang="ts">
import { CircleCheck, LoaderCircle, RefreshCw, ShieldAlert, Sparkles, TriangleAlert } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import BaseBadge from '@/shared/ui/BaseBadge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import {
  AnalysisStatus,
  CommentKind,
  isAnalyzing,
  SEVERITY_ORDER,
  SEVERITY_TONES,
  splitFinding,
  type ReviewComment,
  type ReviewDetail,
} from '../model/review.types';

const props = defineProps<{ review: ReviewDetail; canManage: boolean; rerunning?: boolean }>();
const emit = defineEmits<{ rerun: []; 'toggle-resolved': [comment: ReviewComment] }>();

const showResolved = ref(false);

const findings = computed(() =>
  props.review.comments
    .filter((comment) => comment.kind === CommentKind.AiFinding || comment.kind === CommentKind.Warning)
    .sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(a.severity ?? 'LOW') - SEVERITY_ORDER.indexOf(b.severity ?? 'LOW') ||
        a.kind - b.kind,
    ),
);
const resolvedCount = computed(() => findings.value.filter((finding) => finding.resolved).length);
const visible = computed(() => findings.value.filter((finding) => showResolved.value || !finding.resolved));
const analyzing = computed(() => isAnalyzing(props.review));
</script>

<template>
  <BaseCard title="Automated checks" description="Free pattern checks plus an AI reviewer. Treat them as hints; reviewers decide.">
    <template #actions>
      <BaseButton
        v-if="canManage"
        size="sm"
        variant="secondary"
        :loading="rerunning"
        :disabled="analyzing"
        @click="emit('rerun')"
      >
        <RefreshCw class="size-3.5" aria-hidden="true" />
        Run again
      </BaseButton>
    </template>

    <div class="space-y-4">
      <div v-if="analyzing" class="flex items-center gap-3 rounded-lg bg-surface-muted px-4 py-3 text-sm text-fg-muted" role="status">
        <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
        Checking the pull request… this usually takes under a minute.
      </div>

      <div
        v-else-if="review.analysisStatus === AnalysisStatus.Failed"
        class="flex gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
        role="alert"
      >
        <TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ review.analysisError ?? 'The checks could not run.' }}</span>
      </div>

      <template v-else>
        <p v-if="review.analysisError" class="rounded-lg bg-surface-muted px-4 py-3 text-sm text-fg-muted">
          {{ review.analysisError }}
        </p>

        <div v-if="review.aiSummary" class="rounded-lg border border-accent/20 bg-accent-soft/40 px-4 py-3">
          <p class="flex items-center gap-2 text-xs font-semibold tracking-wide text-accent-fg uppercase">
            <Sparkles class="size-3.5" aria-hidden="true" />
            AI summary<span v-if="review.aiModel" class="font-normal normal-case"> · {{ review.aiModel }}</span>
          </p>
          <p class="mt-1.5 text-sm whitespace-pre-line text-fg">{{ review.aiSummary }}</p>
        </div>

        <div
          v-if="review.analysisStatus === AnalysisStatus.Completed && findings.length === 0"
          class="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CircleCheck class="size-4" aria-hidden="true" />
          No problems found.
        </div>

        <ul v-if="visible.length" class="divide-y divide-line rounded-lg border border-line">
          <li v-for="finding in visible" :key="finding.id" :class="['flex gap-3 px-4 py-3', finding.resolved && 'opacity-60']">
            <component
              :is="finding.kind === CommentKind.AiFinding ? Sparkles : ShieldAlert"
              class="mt-0.5 size-4 shrink-0 text-fg-subtle"
              :aria-label="finding.kind === CommentKind.AiFinding ? 'AI finding' : 'Rule check'"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <BaseBadge :tone="finding.severity ? SEVERITY_TONES[finding.severity] : 'neutral'">
                  {{ finding.severity ?? 'INFO' }}
                </BaseBadge>
                <span :class="['text-sm font-medium text-fg', finding.resolved && 'line-through']">
                  {{ splitFinding(finding.body).title }}
                </span>
              </div>
              <p v-if="finding.filePath" class="mt-1 truncate font-mono text-xs text-fg-muted">
                {{ finding.filePath }}<template v-if="finding.line">:{{ finding.line }}</template>
              </p>
              <p v-if="splitFinding(finding.body).details" class="mt-1 text-sm whitespace-pre-line text-fg-muted">
                {{ splitFinding(finding.body).details }}
              </p>
            </div>
            <label v-if="canManage" class="flex shrink-0 cursor-pointer items-start gap-1.5 pt-0.5 text-xs text-fg-muted">
              <input
                type="checkbox"
                class="size-4 rounded border-line text-accent focus:ring-accent/30"
                :checked="finding.resolved"
                @change="emit('toggle-resolved', finding)"
              />
              Handled
            </label>
          </li>
        </ul>

        <button
          v-if="resolvedCount > 0"
          type="button"
          class="text-xs font-medium text-accent-fg hover:underline"
          @click="showResolved = !showResolved"
        >
          {{ showResolved ? 'Hide' : 'Show' }} handled findings ({{ resolvedCount }})
        </button>
      </template>
    </div>
  </BaseCard>
</template>
