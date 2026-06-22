'use client'

import { useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { updateCompanySettings } from '@/app/actions/company'

export function CompanySettingsForm({ company }: { company: any }) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await updateCompanySettings(formData)
      if (res?.error) {
        alert('Error al guardar: ' + res.error)
      } else {
        alert('Datos guardados correctamente')
      }
    })
  }

  // Si los valores por defecto eran los de ejemplo, los mostramos vacíos para no estorbar
  const defaultCompanyName = company?.company_name === 'Mi Empresa S.A.' ? '' : (company?.company_name || '')
  const defaultFantasyName = company?.fantasy_name === 'Transportes' ? '' : (company?.fantasy_name || '')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="id" value={company?.id || ''} />
      
      <div className="space-y-2">
        <Label>Razón Social <span className="text-destructive">*</span></Label>
        <Input name="company_name" required defaultValue={defaultCompanyName} placeholder="Ej: Transportes del Sur S.R.L." className="bg-background/50" />
      </div>
      
      <div className="space-y-2">
        <Label>Nombre de Fantasía</Label>
        <Input name="fantasy_name" defaultValue={defaultFantasyName} placeholder="Ej: Transur" className="bg-background/50" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CUIT</Label>
          <Input name="cuit" defaultValue={company?.cuit || ''} placeholder="Ej: 30-12345678-9" className="bg-background/50" />
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input name="phone" defaultValue={company?.phone || ''} placeholder="Ej: +54 9 11 1234-5678" className="bg-background/50" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dirección Fiscal</Label>
        <Input name="address" defaultValue={company?.address || ''} placeholder="Ej: Av. Siempreviva 742" className="bg-background/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Input name="city" defaultValue={company?.city || ''} placeholder="Ej: Mendoza" className="bg-background/50" />
        </div>
        <div className="space-y-2">
          <Label>Provincia</Label>
          <Input name="province" defaultValue={company?.province || ''} placeholder="Ej: Mendoza" className="bg-background/50" />
        </div>
        <div className="space-y-2">
          <Label>Código Postal</Label>
          <Input name="postal_code" defaultValue={company?.postal_code || ''} placeholder="Ej: 5500" className="bg-background/50" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" name="email" defaultValue={company?.email || ''} placeholder="Ej: administracion@transur.com" className="bg-background/50" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full gap-2 mt-4">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isPending ? 'Guardando...' : 'Guardar Datos'}
      </Button>
    </form>
  )
}
