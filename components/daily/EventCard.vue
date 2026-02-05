<template>
  <div class="EventCard">
    <div class="EventCard__time">{{ timeText }}</div>
    <div class="EventCard__content">
      <h3 class="EventCard__title">{{ title }}</h3>
      <p class="EventCard__desc">{{ desc }}</p>
      <p class="EventCard__price">{{ price }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  timeText: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss">
.EventCard {
  background-color: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);

  &__time {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    min-width: 5rem;
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
    color: var(--color-text);
  }

  &__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
    margin-bottom: var(--spacing-sm);
    line-height: 1.6;
  }

  &__price {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-weight: 500;
  }
}
</style>
