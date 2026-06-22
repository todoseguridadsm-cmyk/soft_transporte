'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteUser } from '@/app/actions/users'
import { Loader2 } from 'lucide-react'

export function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return
    
    startTransition(async () => {
      const res = await deleteUser(userId)
      if (res?.error) {
        alert('Error al eliminar: ' + res.error)
      }
    })
  }

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      className="h-8" 
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
    </Button>
  )
}
