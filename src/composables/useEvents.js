import { useQuery } from '@tanstack/vue-query'
import eventsService from '../services/events.service'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => eventsService.fetchEvents(),
  })
}
