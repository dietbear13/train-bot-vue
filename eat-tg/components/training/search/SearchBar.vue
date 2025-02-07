<template>
  <div>
    <v-text-field
        v-model="localSearch"
        label="Вводи упражнение"
        clearable
        class="my-0 dark-background pa-1"
        variant="outlined"
        hide-details="auto"
    ></v-text-field>
    <div v-if="isAdmin" class="admin-actions">
      <v-btn color="primary" @click="$emit('open-add-exercise-dialog')">
        <v-icon left>mdi-plus</v-icon>
        Добавить упражнение
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
export default defineComponent({
  name: 'SearchBar',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'open-add-exercise-dialog'],
  setup(props, { emit }) {
    const localSearch = ref(props.modelValue);
    watch(() => props.modelValue, (newVal) => {
      localSearch.value = newVal;
    });
    watch(localSearch, (newVal) => {
      emit('update:modelValue', newVal);
    });
    return { localSearch };
  },
});
</script>

<style scoped>
.admin-actions {
  margin: 16px 0;
}
.dark-background {
  background-color: #f5f5f5;
}
</style>
