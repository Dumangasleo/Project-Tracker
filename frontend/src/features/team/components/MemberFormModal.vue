<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { errorMessage } from '@/core/http/api-error';
import { useToast } from '@/shared/composables/useToast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseField from '@/shared/ui/BaseField.vue';
import BaseInput from '@/shared/ui/BaseInput.vue';
import BaseModal from '@/shared/ui/BaseModal.vue';
import BaseSelect from '@/shared/ui/BaseSelect.vue';
import BaseTextarea from '@/shared/ui/BaseTextarea.vue';
import {
  emptyMemberForm,
  formToMemberInput,
  memberToForm,
  type TeamMember,
} from '../model/team.types';
import { useTeamStore } from '../store/team.store';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ member: TeamMember | null }>();

const team = useTeamStore();
const toast = useToast();

const form = reactive(emptyMemberForm());
const saving = ref(false);
const error = ref<string | null>(null);

const isEditing = computed(() => props.member !== null);
const canSave = computed(
  () => form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.positionId !== null,
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form, props.member ? memberToForm(props.member) : emptyMemberForm());
  error.value = null;
  void team.fetchPositions();
});

async function save(): Promise<void> {
  if (!canSave.value) return;
  saving.value = true;
  error.value = null;
  try {
    const input = formToMemberInput(form);
    if (props.member) await team.updateMember(props.member.id, input);
    else await team.createMember(input);
    toast.success(isEditing.value ? 'Member updated' : 'Member added', `${input.firstName} ${input.lastName}`);
    open.value = false;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="isEditing ? 'Edit member' : 'Add team member'"
    :description="isEditing ? 'Update this collaborator’s details.' : 'Invite a new collaborator to the workspace.'"
  >
    <form id="member-form" class="space-y-4" novalidate @submit.prevent="save">
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseField v-slot="{ id }" label="First name" required>
          <BaseInput :id="id" v-model="form.firstName" maxlength="50" autocomplete="off" />
        </BaseField>
        <BaseField v-slot="{ id }" label="Last name" required>
          <BaseInput :id="id" v-model="form.lastName" maxlength="50" autocomplete="off" />
        </BaseField>
      </div>

      <BaseField
        v-slot="{ id }"
        label="Email"
        required
        hint="They can sign in with this email using Google or Microsoft."
      >
        <BaseInput :id="id" v-model="form.email" type="email" autocomplete="off" />
      </BaseField>

      <div class="grid gap-4 sm:grid-cols-2">
        <BaseField v-slot="{ id }" label="Position" required>
          <BaseSelect
            :id="id"
            v-model="form.positionId"
            :options="team.positionOptions"
            placeholder="Select a position"
          />
        </BaseField>
        <BaseField v-slot="{ id }" label="Contact number">
          <BaseInput :id="id" v-model="form.contactNumber" type="tel" maxlength="30" />
        </BaseField>
      </div>

      <BaseField v-slot="{ id }" label="Address">
        <BaseTextarea :id="id" v-model="form.address" :rows="2" maxlength="500" />
      </BaseField>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="member-form" :loading="saving" :disabled="!canSave">
        {{ isEditing ? 'Save changes' : 'Add member' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
