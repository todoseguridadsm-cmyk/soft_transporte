'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Check } from 'lucide-react'
import { completeTrip } from '@/app/actions/trips'
import { useRouter } from 'next/navigation'

export function FinishTripButton({ tripId, initialStatus = 'in_progress' }: { tripId: string, initialStatus?: string }) {
  const [loading, setLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(initialStatus === 'pending')
  const router = useRouter()

  const handleFinish = async () => {
    if (confirm('¿Cargaste todos los tickets y comprobantes? ¿Estás seguro de finalizar el viaje?')) {
      setLoading(true)
      const res = await completeTrip(tripId)
      if (res?.error) {
        alert(res.error)
        setLoading(false)
      } else {
        setIsFinished(true)
        router.refresh()
      }
    }
  }

  if (isFinished || initialStatus === 'pending') {
    return (
      <Button 
        disabled
        className="w-full bg-gray-700 text-gray-300 font-bold h-12 rounded-xl shadow-none transition-all mt-6 opacity-80 cursor-not-allowed border border-gray-600"
      >
        <Check className="w-5 h-5 mr-2" />
        VIAJE FINALIZADO
      </Button>
    )
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
