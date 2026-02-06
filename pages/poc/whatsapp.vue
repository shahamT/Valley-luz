<template>
  <LayoutAppShell>
    <div class="WhatsAppPoc">
      <div class="WhatsAppPoc-header">
        <h1 class="WhatsAppPoc-title">WhatsApp Group Listener (PoC)</h1>
        <p class="WhatsAppPoc-note">
          ⚠️ This is a temporary PoC page for testing the WhatsApp listener integration.
        </p>
        <button @click="loadMessages" class="WhatsAppPoc-refresh" :disabled="isLoading">
          {{ isLoading ? 'טוען...' : 'רענן' }}
        </button>
      </div>

      <div v-if="error" class="WhatsAppPoc-error">
        {{ error }}
      </div>

      <div v-else-if="messages.length === 0" class="WhatsAppPoc-empty">
        אין הודעות להצגה
      </div>

      <div v-else class="WhatsAppPoc-messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="WhatsAppPoc-message"
        >
          <div class="WhatsAppPoc-messageHeader">
            <div class="WhatsAppPoc-messageGroup">{{ message.chat?.name || message.chat?.id || 'Unknown Group' }}</div>
            <div class="WhatsAppPoc-messageTime">{{ formatTime(message.timestamp || message.timestampISO) }}</div>
          </div>
          <div class="WhatsAppPoc-messageSender">
            {{ message.notifyName || message.author || message.from || 'Unknown' }}
          </div>
          <div v-if="message.body" class="WhatsAppPoc-messageText">
            {{ message.body }}
          </div>
          <div v-if="message.localMediaPath" class="WhatsAppPoc-messageMedia">
            <a 
              :href="`/api/whatsapp-media/${getMediaFilename(message.localMediaPath)}`" 
              target="_blank"
              class="WhatsAppPoc-mediaLink"
            >
              📎 View Media ({{ getMediaType(message) }})
            </a>
            <a 
              :href="`/api/whatsapp-media/${getMediaFilename(message.localMediaPath)}`" 
              :download="getMediaFilename(message.localMediaPath)"
              class="WhatsAppPoc-mediaDownload"
            >
              ⬇️ Download
            </a>
          </div>
          <div v-else-if="message.hasMedia && !message.localMediaPath" class="WhatsAppPoc-messageMedia">
            [Media Message - Not Downloaded]
          </div>
        </div>
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
const messages = ref([])
const isLoading = ref(false)
const error = ref(null)

const loadMessages = async () => {
  isLoading.value = true
  error.value = null

  try {
    const data = await $fetch('/api/whatsapp-messages', {
      params: { limit: 200 },
    })
    messages.value = data.messages || []
  } catch (err) {
    error.value = 'שגיאה בטעינת הודעות'
    console.error('Error loading messages:', err)
  } finally {
    isLoading.value = false
  }
}

const formatTime = (timestamp) => {
  // Handle both Unix timestamp and ISO string
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp * 1000) 
    : new Date(timestamp)
  return date.toLocaleString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getMediaFilename = (mediaPath) => {
  // Extract filename from path like "media/filename.ext"
  return mediaPath.split('/').pop() || mediaPath
}

const getMediaType = (message) => {
  if (message.type) {
    return message.type.toUpperCase()
  }
  if (message.mimetype) {
    return message.mimetype.split('/')[0].toUpperCase()
  }
  return 'MEDIA'
}

// Load messages on mount
onMounted(() => {
  loadMessages()
})
</script>

<style lang="scss">
.WhatsAppPoc {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);

  &-header {
    margin-bottom: var(--spacing-xl);
  }

  &-title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: var(--spacing-md);
  }

  &-note {
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-sm);
    background-color: var(--color-surface);
    border-radius: var(--radius-md);
  }

  &-refresh {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--brand-dark-blue);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-base);
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background-color: var(--brand-light-blue);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &-error {
    padding: var(--spacing-md);
    background-color: rgba(211, 47, 47, 0.1);
    color: var(--color-error);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
  }

  &-empty {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-light);
    font-size: var(--font-size-lg);
  }

  &-messages {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  &-message {
    background-color: var(--card-bg);
    border-radius: var(--card-radius);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-card);
  }

  &-messageHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }

  &-messageGroup {
    font-weight: 600;
    color: var(--color-text);
    font-size: var(--font-size-base);
  }

  &-messageTime {
    font-size: var(--font-size-xs);
    color: var(--color-text-light);
  }

  &-messageSender {
    font-size: var(--font-size-sm);
    color: var(--brand-dark-blue);
    margin-bottom: var(--spacing-xs);
  }

  &-messageText {
    color: var(--color-text);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  &-messageMedia {
    margin-top: var(--spacing-sm);
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  &-mediaLink,
  &-mediaDownload {
    color: var(--brand-dark-blue);
    text-decoration: none;
    font-size: var(--font-size-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--brand-dark-blue);
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      background-color: var(--brand-dark-blue);
      color: var(--color-background);
    }
  }
}
</style>
