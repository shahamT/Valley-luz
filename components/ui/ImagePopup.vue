<template>
  <div class="ImagePopup" @click.self="emit('close')">
    <button class="ImagePopup-closeButton" @click="emit('close')" aria-label="Close">
      <UiIcon name="close" size="lg" />
    </button>
    <div class="ImagePopup-container">
      <img :src="imageUrl" :alt="altText" class="ImagePopup-image" />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'ImagePopup' })

defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  altText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])
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
