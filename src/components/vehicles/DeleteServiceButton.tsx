'use client'

import { useState } from 'react'
import { deleteMaintenanceLogForm } from '@/app/actions/vehicles'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

export function DeleteServiceButton({ id, vehicleId }: { id: string, vehicleId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de service?')) return
    
    setLoading(true)
    const formData = new FormData()
    formData.append('id', id)
    formData.append('vehicle_id', vehicleId)

    const res = await deleteMaintenanceLogForm(formData)
    setLoading(false)

    if (res.error) {
      alert(res.error)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={loading}
      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
      title="Eliminar service"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
