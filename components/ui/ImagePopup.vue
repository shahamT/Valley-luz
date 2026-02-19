<template>
  <div class="ImagePopup" @click.self="emit('close')">
    <button class="ImagePopup-closeButton" @click="emit('close')" aria-label="Close">
      <UiIcon name="close" size="lg" />
    </button>

    <button
      class="ImagePopup-arrow ImagePopup-arrow--prev"
      :class="{ 'ImagePopup-arrow--disabled': !hasMultiple }"
      :disabled="!hasMultiple"
      aria-label="Previous image"
      @click="goPrev"
    >
      <UiIcon name="chevron_right" size="xl" />
    </button>

    <div class="ImagePopup-container">
      <img :src="images[localIndex]" :alt="altText" class="ImagePopup-image" />
    </div>

    <button
      class="ImagePopup-arrow ImagePopup-arrow--next"
      :class="{ 'ImagePopup-arrow--disabled': !hasMultiple }"
      :disabled="!hasMultiple"
      aria-label="Next image"
      @click="goNext"
    >
      <UiIcon name="chevron_left" size="xl" />
    </button>
  </div>
</template>

<script setup>
defineOptions({ name: 'ImagePopup' })

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
  altText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

// --- Data ---
const localIndex = ref(props.currentIndex)

// --- Computed ---
const hasMultiple = computed(() => props.images.length > 1)

// --- Methods ---
const goPrev = () => {
  localIndex.value = (localIndex.value - 1 + props.images.length) % props.images.length
}

const goNext = () => {
  localIndex.value = (localIndex.value + 1) % props.images.length
}

// --- Watchers ---
watch(() => props.currentIndex, (val) => {
  localIndex.value = val
})
</script>

<style lang="scss">
.ImagePopup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: calc(var(--z-index-modal) + 20);
  padding: var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-lg);
  }

  &-closeButton {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    cursor: pointer;
    color: white;
    padding: var(--spacing-sm);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: background-color 0.2s ease;
    z-index: 10;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  }

  &-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    cursor: pointer;
    color: white;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
    z-index: 10;

    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.3);
    }

    &--prev {
      right: var(--spacing-md);
    }

    &--next {
      left: var(--spacing-md);
    }

    &--disabled {
      opacity: 0.3;
      cursor: default;
    }
  }

  &-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: center;
    border-radius: var(--radius-md);
    display: block;
  }
}
</style>
