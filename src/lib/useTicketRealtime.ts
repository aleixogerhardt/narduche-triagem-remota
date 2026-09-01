import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeTickets } from '../services/api'

export function useTicketRealtime() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const unsubscribe = subscribeTickets(() => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['ticket'] }),
        queryClient.invalidateQueries({ queryKey: ['ticket-events'] }),
        queryClient.invalidateQueries({ queryKey: ['ticket-files'] }),
      ])
    })
    return unsubscribe
  }, [queryClient])
}
