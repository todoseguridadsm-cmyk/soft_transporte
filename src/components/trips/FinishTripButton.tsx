'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { completeTrip } from '@/app/actions/trips'
import { useRouter } from 'next/navigation'

export function FinishTripButton({ tripId }: { tripId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFinish = async () => {
    if (confirm('¿Cargaste todos los tickets y comprobantes? ¿Estás seguro de finalizar el viaje?')) {
      setLoading(true)
      await completeTrip(tripId)
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleFinish} 
      disabled={loading}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all mt-6"
    >
      {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
      {loading ? 'Finalizando...' : 'FINALIZAR VIAJE'}
    </Button>
  )
}
