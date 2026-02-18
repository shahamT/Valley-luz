<template>
  <header class="AppHeader">
    <div class="AppHeader-container">
      <div class="AppHeader-side AppHeader-side--menu">
        <button class="AppHeader-menuButton" type="button" aria-label="תפריט">
          <UiIcon name="menu" size="md" class="AppHeader-menuIcon" />
        </button>
      </div>
      <div class="AppHeader-side AppHeader-side--center">
        <button class="AppHeader-whatsappButton" aria-label="לבוט הוואטסאפ שלנו">
          <img src="/icons/whatsapp-icon.svg" alt="" class="AppHeader-whatsappIcon" />
          <span class="AppHeader-whatsappText">לבוט הוואטסאפ שלנו</span>
        </button>
      </div>
      <div class="AppHeader-side AppHeader-side--logo">
        <ClientOnly>
          <img
            v-if="!isMobile"
            src="/logos/valleyluz-logo.png"
            alt="Valley Luz"
            class="AppHeader-logo"
          />
          <img
            v-else
            src="/logos/valleyluz-icon.svg"
            alt="Valley Luz"
            class="AppHeader-logo AppHeader-logo--icon"
          />
          <template #fallback>
            <img
              src="/logos/valleyluz-logo.png"
              alt="Valley Luz"
              class="AppHeader-logo"
            />
          </template>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>

<script setup>
import { MOBILE_BREAKPOINT } from '~/consts/ui.const'

defineOptions({ name: 'AppHeader' })

const isMobile = useScreenWidth(MOBILE_BREAKPOINT)
</script>

<style lang="scss">
.AppHeader {
  position: sticky;
  top: 0;
  height: var(--header-height);
  background-color: var(--color-background);
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  &-container {
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
    padding-inline: var(--spacing-3xl);
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr;
    align-items: center;
    gap: var(--spacing-md);

    @media (max-width: 768px) {
      padding-inline: 1rem;
    }
  }

  &-side {
    display: flex;
    align-items: center;
    min-width: 0;
    grid-row: 1;

    &--menu {
      justify-content: flex-end;
      grid-column: 1;
    }

    &--center {
      justify-content: center;
      grid-column: 2;
    }

    &--logo {
      justify-content: flex-start;
      grid-column: 3;
      direction: ltr;
    }
  }

  [dir='rtl'] &-side--menu {
    justify-content: flex-start;
  }

  &-logo {
    height: 2rem;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
    direction: ltr;
  }

  &-menuButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    background-color: transparent;
    color: var(--brand-dark-green);
    cursor: pointer;
    transition: background-color 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background-color: var(--weekend-day-bg);
    }
  }

  &-menuIcon {
    flex-shrink: 0;
  }

  &-whatsappButton {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background-color: var(--whatsapp-green);
    border: none;
    border-radius: 999px;
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-md);
    transition: opacity 0.2s ease;
    flex-shrink: 0;
    height: 34px;

    &:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      padding: var(--spacing-xs) var(--spacing-md);
      gap: var(--spacing-sm);
    }
  }

  &-whatsappIcon {
    width: 18px;
    height: 18px;
    filter: brightness(0) saturate(100%);

    @media (max-width: 768px) {
      width: 16px;
      height: 16px;
    }
  }

  &-whatsappText {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
  }
}
</style>
