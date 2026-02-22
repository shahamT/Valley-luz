<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="WelcomeModal"
      @click.self="handleDismiss"
    >
      <div class="WelcomeModal-content">
        <section class="WelcomeModal-body">
          <div class="WelcomeModal-bodyInner">
            <img
              src="/logos/galiluz-logo.svg"
              alt="גלילוז"
              class="WelcomeModal-logo"
            />
            <p class="WelcomeModal-intro">
            ברוכים הבאים לגרסת הבטא של <span class="WelcomeModal-brandGreen">גלי</span><span class="WelcomeModal-brandBlue">לו"ז</span>!
          </p>
          <p class="WelcomeModal-disclaimer">
            בגרסה זו - האירועים המופיעים בלו"ז התקבלו מפרסומים בקבוצות וואטסאפ ולא ישירות מהמארגנים. האירועים עברו עיבוד בAI כדי להציג אותם בצורה מיטבית ואין לנו איך לאמת את הפרטים.
            <span class="WelcomeModal-disclaimerHighlight">אז לפני שאתם שמים את האירוע ביומן - אל תשכחו לוודא שהבינה המלאכותית לא הוזה...</span>
          </p>
          <p class="WelcomeModal-organizers">
            מארגנים אירוע/אירועים? מעוניינים לפרסם אצלנו אירועים בעצמכם בצורה ישירה?
            <a
              :href="CONTACT_WHATSAPP_LINK"
              target="_blank"
              rel="noopener noreferrer"
              class="WelcomeModal-whatsappLink"
            >שלחו לנו הודעה</a>
          </p>
          </div>
        </section>
        <div class="WelcomeModal-actions">
          <button
            type="button"
            class="WelcomeModal-ctaButton"
            @click="handleDismiss"
          >
            {{ WELCOME_CTA_TEXT }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { WELCOME_MODAL_STORAGE_KEY, WELCOME_MODAL_EXPIRY_DAYS, CONTACT_WHATSAPP_LINK } from '~/consts/ui.const'

defineOptions({ name: 'WelcomeModal' })

defineEmits(['close'])

const WELCOME_CTA_TEXT = 'יאללה קחו אותי ללו"ז'

const isVisible = ref(false)

const EXPIRY_MS = WELCOME_MODAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000

onMounted(() => {
  if (import.meta.server) return
  if (import.meta.dev) {
    isVisible.value = true
    return
  }
  try {
    const stored = localStorage.getItem(WELCOME_MODAL_STORAGE_KEY)
    if (!stored) {
      isVisible.value = true
      return
    }
    const seenAt = new Date(stored).getTime()
    if (Number.isNaN(seenAt) || Date.now() - seenAt > EXPIRY_MS) {
      isVisible.value = true
    }
  } catch {
    isVisible.value = true
  }
})

function handleDismiss() {
  try {
    localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, new Date().toISOString())
  } catch {
    // ignore
  }
  isVisible.value = false
}
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.WelcomeModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-backdrop-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 0;

  &-content {
    position: relative;
    width: 100%;
    max-width: var(--modal-max-width);
    max-height: 100%;
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    background-color: var(--light-bg);
    margin: var(--spacing-lg);
    overflow: hidden;

    @include mobile {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      border-radius: 0;
      margin: 0;
      padding: var(--spacing-lg);
      display: grid;
      grid-template-rows: 1fr auto;
    }
  }

  &-body {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    text-align: center;
    direction: ltr;
  }

  &-bodyInner {
    direction: rtl;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    text-align: center;
    min-height: min-content;
  }

  &-logo {
    width: 100%;
    max-width: 12rem;
    height: auto;
    display: block;
    flex-shrink: 0;

    @include mobile {
      max-width: 16rem;
    }
  }

  &-intro {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;

    @include mobile {
      font-size: var(--font-size-2xl);
    }
  }

  &-brandGreen {
    color: var(--brand-dark-green);
    font-weight: 700;
  }

  &-brandBlue {
    color: var(--brand-dark-blue);
    font-weight: 700;
  }

  &-disclaimer,
  &-organizers {
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin: 0;
    line-height: 1.5;

    @include mobile {
      font-size: var(--font-size-lg);
    }
  }

  &-disclaimer {
    color: var(--color-text-light);
  }

  &-disclaimerHighlight {
    color: var(--color-text);
  }

  &-organizers {
    font-weight: 500;
  }

  &-whatsappLink {
    color: var(--brand-dark-green);
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.85;
      text-decoration: underline;
    }
  }

  &-actions {
    flex-shrink: 0;
    padding-top: var(--spacing-lg);

    @include mobile {
      padding-top: var(--spacing-md);
    }
  }

  &-ctaButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--brand-dark-green);
    color: var(--chip-text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: color-mix(in srgb, var(--brand-dark-green) 85%, black);
    }

    &:active {
      transform: scale(0.98);
    }

    @include mobile {
      width: 100%;
      padding-block: 0.75rem;
      font-size: var(--font-size-lg);
    }
  }
}
</style>
