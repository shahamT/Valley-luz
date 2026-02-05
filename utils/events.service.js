export const eventsService = {
  async fetchEvents() {
    return await $fetch('/api/events')
  },
}
