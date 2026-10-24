import type { Component } from 'vue';

export interface MenuItem {
  label: string;
  icon?: Component;
  danger?: boolean;
  onSelect: () => void;
}

export interface TableColumn {
  key: string;
  label: string;
  class?: string;
}
