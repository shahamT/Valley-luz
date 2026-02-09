<template>
  <UiMonthYearPicker
    :key="`picker-${instanceKey}`"
    :year="currentDate.year"
    :month="currentDate.month"
    @select="handleSelect"
    @year-change="handleYearChange"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  currentDate: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select', 'year-change'])

const instanceKey = ref(0)

const handleSelect = (year, month) => {
  emit('select', { year, month })
}

const handleYearChange = (year) => {
  emit('year-change', { year })
}

onMounted(() => {
  instanceKey.value++
})
</script>
