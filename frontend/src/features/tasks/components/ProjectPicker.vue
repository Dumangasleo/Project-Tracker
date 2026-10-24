<script setup lang="ts">
import { computed, ref } from 'vue';
import { projectsApi } from '@/features/projects';
import { useInfiniteList } from '@/shared/composables/useInfiniteList';
import BaseComboBox from '@/shared/ui/BaseComboBox.vue';

defineOptions({ inheritAttrs: false });

const model = defineModel<number | null>({ required: true });
defineProps<{ selectedLabel?: string; invalid?: boolean }>();

const search = ref('');
const { items, loading, hasMore, loadMore, reload } = useInfiniteList((page) =>
  projectsApi.list({ page, search: search.value }),
);

const options = computed(() => items.value.map((project) => ({ value: project.id, label: project.name })));

function onSearch(query: string): void {
  search.value = query;
  void reload();
}
</script>

<template>
  <BaseComboBox
    v-model="model"
    v-bind="$attrs"
    :options="options"
    :selected-label="selectedLabel"
    :loading="loading"
    :has-more="hasMore"
    :invalid="invalid"
    placeholder="Search projects…"
    @search="onSearch"
    @load-more="loadMore"
  />
</template>
