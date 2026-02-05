import httpService from './http.service'
import dummyEvents from '../data/events.json'

const eventsService = {
  async fetchEvents() {
    // Simulate API call with timeout
    return new Promise((resolve) => {
      setTimeout(() => {
        // TODO: Replace with real API call
        // return httpService.get('/api/events')
        resolve(dummyEvents)
      }, 400)
    })
  },
}

export default eventsService
