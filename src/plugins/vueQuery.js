import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retries: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  }
})

export default function installVueQuery(app) {
  app.use(VueQueryPlugin, {
    queryClient
  })
}
