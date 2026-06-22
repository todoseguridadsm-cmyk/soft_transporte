'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { approveAndCompleteTrip } from '@/app/actions/trips'
import { Loader2 } from 'lucide-react'

export function ApproveTripButton({ tripId }: { tripId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveAndCompleteTrip(tripId)
      if (result?.error) {
        alert(result.error)
      } else {
        alert("Viaje finalizado y cerrado definitivamente.")
      }
    })
  }

  return (
    <Button 
      onClick={handleApprove} 
      disabled={isPending}
      variant="default" 
      size="sm" 
      className="h-8 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold min-w-[140px]"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {isPending ? 'Cerrando...' : 'Cerrar Definitivo'}
    </Button>
  )
}
