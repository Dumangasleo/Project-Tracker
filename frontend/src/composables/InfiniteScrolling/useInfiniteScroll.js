import { ref, onUnmounted } from 'vue';

// HIGHLIGHT: Added <T> (Generic) to tell the IDE what is inside the 'items' array
export function useInfiniteScroll(fetchCallback, options = { threshold: 0.1 }) {
    const items = ref([]); // HIGHLIGHT: This will now be typed as T[]
    const loading = ref(false);
    const error = ref(null);
    const page = ref(1);
    const hasMore = ref(true);
    const observer = ref(null);

    const loadMore = async () => {
        if (loading.value || !hasMore.value) return;

        loading.value = true;
        try {
            const result = await fetchCallback(page.value);

            const dataArray = Array.isArray(result) ? result : result?.data;

            if (!dataArray || dataArray.length === 0) {
                hasMore.value = false;
            } else {
                items.value.push(...dataArray);
                page.value++;
            }
        } catch (err) {
            error.value = err.message || 'Failed to fetch data';
        } finally {
            loading.value = false;
        }
    };

    const setupObserver = (element) => {
        if (!element) return;

        observer.value = new IntersectionObserver((entries) => {
            // HIGHLIGHT: Simplified the async call here
            if (entries[0].isIntersecting) {
                void loadMore();
            }
        }, options);

        observer.value.observe(element);
    };

    const reset = () => {
        items.value = [];
        page.value = 1;
        hasMore.value = true;
    };

    onUnmounted(() => {
        if (observer.value) observer.value.disconnect();
    });

    return { items, loading, error, hasMore, setupObserver, reset, loadMore };
}