<template>
  <div
    ref="popupRef"
    class="FilterPopup"
    @click.stop
  >
    <UiFilterPanel
      :selected-categories-count="selectedCategoriesCount"
      :hours-filter-label="hoursFilterLabel"
      @close="emit('close')"
    />
  </div>
</template>

<script setup>
defineOptions({ name: 'FilterPopup' })

const props = defineProps({
  triggerElement: {
    type: Object,
    required: true,
  },
  selectedCategoriesCount: {
    type: Number,
    default: 0,
  },
  hoursFilterLabel: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close'])

const popupRef = ref(null)

onClickOutside(
  popupRef,
  () => {
    emit('close')
  },
  {
    ignore: [props.triggerElement],
  }
)
</script>

<style lang="scss">
.FilterPopup {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background-color: var(--light-bg, #f2fbf8);
  border-radius: var(--radius-lg);
  padding: 0;
  box-shadow: var(--shadow-lg);
  min-width: 420px;
  z-index: var(--z-index-modal);
}
</style>
