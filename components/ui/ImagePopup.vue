<template>
  <div class="ImagePopup" @click.self="emit('close')">
    <button class="ImagePopup-closeButton" @click="emit('close')" aria-label="Close">
      <UiIcon name="close" size="lg" />
    </button>

    <button
      class="ImagePopup-arrow ImagePopup-arrow--prev"
      :class="{ 'ImagePopup-arrow--disabled': !hasMultiple }"
      :disabled="!hasMultiple"
      aria-label="Previous media"
      @click="goPrev"
    >
      <UiIcon name="chevron_right" size="xl" />
    </button>

    <div class="ImagePopup-container">
      <img
        v-if="currentItem && !currentItem.isVideo"
        :src="currentItem.url"
        :alt="altText"
        class="ImagePopup-image"
      />
      <video
        v-else-if="currentItem && currentItem.isVideo"
        :src="currentItem.url"
        controls
        playsinline
        class="ImagePopup-video"
      />
    </div>

    <button
      class="ImagePopup-arrow ImagePopup-arrow--next"
      :class="{ 'ImagePopup-arrow--disabled': !hasMultiple }"
      :disabled="!hasMultiple"
      aria-label="Next media"
      @click="goNext"
    >
      <UiIcon name="chevron_left" size="xl" />
    </button>
  </div>
</template>

<script setup>
defineOptions({ name: 'ImagePopup' })

const props = defineProps({
  /** Array of { url, isVideo } (or { url, isVideo, displayUrl }) for image/video popup */
  items: {
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
const hasMultiple = computed(() => props.items.length > 1)

const currentItem = computed(() => {
  if (!props.items.length || localIndex.value < 0 || localIndex.value >= props.items.length) return null
  return props.items[localIndex.value]
})

// --- Methods ---
const goPrev = () => {
  localIndex.value = (localIndex.value - 1 + props.items.length) % props.items.length
}

const goNext = () => {
  localIndex.value = (localIndex.value + 1) % props.items.length
}

// --- Watchers ---
watch(() => props.currentIndex, (val) => {
  localIndex.value = val
})
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.ImagePopup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-dark-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: calc(var(--z-index-modal) + 20);
  padding: var(--spacing-xl);
  
  @include mobile {
    padding: var(--spacing-lg);
  }

  &-closeButton {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    background: var(--overlay-light-mid);
    border: none;
    cursor: pointer;
    color: white;
    padding: var(--spacing-sm);
    width: var(--control-height-mobile);
    height: var(--control-height-mobile);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: background-color 0.2s ease;
    z-index: 10;
    
    &:hover {
      background-color: var(--overlay-light-strong);
    }
  }

  &-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: var(--overlay-light-mid);
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
      background-color: var(--overlay-light-strong);
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

  &-video {
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
