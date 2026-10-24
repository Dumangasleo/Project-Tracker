import { computed, ref, watch } from 'vue';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'vortex-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

const preference = ref<ThemePreference>(readPreference());
const systemPrefersDark = ref(media.matches);
media.addEventListener('change', (event) => (systemPrefersDark.value = event.matches));

const resolved = computed<'light' | 'dark'>(() =>
  preference.value === 'system' ? (systemPrefersDark.value ? 'dark' : 'light') : preference.value,
);

watch(
  resolved,
  (theme) => {
    document.documentElement.dataset.theme = theme;
  },
  { immediate: true },
);

watch(preference, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable (private mode); the preference just won't persist.
  }
});

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function useTheme() {
  return {
    preference,
    resolved,
    toggle: () => (preference.value = resolved.value === 'dark' ? 'light' : 'dark'),
  };
}
