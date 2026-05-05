<template>
  <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto h-full custom-scrollbar">
    <table class="w-full text-left border-collapse">

      <thead class="bg-slate-800 text-slate-400 text-sm uppercase sticky top-0 z-10 shadow-md">
      <tr>
        <th v-for="col in columns" :key="col.key" class="px-6 py-4 font-medium">
          {{ col.label }}
        </th>
      </tr>
      </thead>

      <tbody class="divide-y divide-slate-800">
      <tr v-for="(item, index) in data" :key="item.id || index" class="hover:bg-slate-800/30 transition-colors">
        <td v-for="col in columns" :key="col.key" class="px-6 py-4">
          <slot :name="`cell-${col.key}`" :item="item">
            <span class="text-slate-300">{{ item[col.key] }}</span>
          </slot>
        </td>
      </tr>

      <tr ref="loadTrigger">
        <td :colspan="columns.length" class="p-0">
          <div v-if="loading" class="py-8 flex justify-center items-center gap-2 text-slate-500">
            <span class="animate-spin">⏳</span> Loading more...
          </div>
          <div v-else-if="!hasMore && data.length > 0" class="py-8 text-center text-slate-600 text-sm">
            End of list.
          </div>
          <div class="h-10"></div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: true }
});

const emit = defineEmits(['load-more']);
const loadTrigger = ref(null);

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    // Kung nakita na sa screen ang bottom row, ug naay pa'y data, i-trigger ang load-more
    if (entries[0].isIntersecting && props.hasMore && !props.loading) {
      emit('load-more');
    }
  }, { threshold: 0.1 });

  // I-observe lang nato kung naa na gyud ang element
  if (loadTrigger.value) {
    observer.observe(loadTrigger.value);
  }
});
</script>