import { computed, ref, shallowRef, type Ref } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import type { Paginated } from '@/shared/types/pagination';

export function useInfiniteList<T>(fetchPage: (page: number) => Promise<Paginated<T>>) {
  const items = shallowRef<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const hasMore = ref(true);
  const loaded = ref(false);
  const error = ref<string | null>(null);

  let page = 0;
  let generation = 0;

  async function loadMore(): Promise<void> {
    if (loading.value || !hasMore.value) return;

    const requestGeneration = generation;
    loading.value = true;
    error.value = null;
    try {
      const result = await fetchPage(page + 1);
      if (requestGeneration !== generation) return;
      page = result.page;
      items.value = [...items.value, ...result.items];
      hasMore.value = result.hasMore;
    } catch (failure) {
      if (requestGeneration === generation) error.value = errorMessage(failure);
    } finally {
      if (requestGeneration === generation) {
        loading.value = false;
        loaded.value = true;
      }
    }
  }

  function reload(): Promise<void> {
    generation += 1;
    page = 0;
    items.value = [];
    hasMore.value = true;
    loading.value = false;
    loaded.value = false;
    return loadMore();
  }

  const isInitialLoading = computed(() => loading.value && items.value.length === 0);

  return { items, loading, hasMore, loaded, error, isInitialLoading, loadMore, reload };
}
