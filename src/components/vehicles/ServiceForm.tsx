'use client'

import { useState } from 'react'
import { addMaintenanceLog } from '@/app/actions/vehicles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Wrench } from 'lucide-react'

export function ServiceForm({ vehicle }: { vehicle: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [updateFieldKm, setUpdateFieldKm] = useState('none')
  const [updateFieldDate, setUpdateFieldDate] = useState('none')

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    formData.append('vehicle_id', vehicle.id)
    formData.append('service_type', serviceType === 'Otro' ? formData.get('service_type_other') as string : serviceType)
    
    if (updateFieldKm !== 'none') {
      formData.append('update_field_km', updateFieldKm)
    }
    if (updateFieldDate !== 'none') {
      formData.append('update_field_date', updateFieldDate)
    }
    
    const res = await addMaintenanceLog(formData)
    
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold transition-all">
          <Wrench className="h-4 w-4" /> Cargar Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-amber-500/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-amber-500">
            <Wrench className="h-6 w-6" />
            Cargar Mantenimiento / Service
          </DialogTitle>
          <DialogDescription>
            Registra un service mecánico. Opcionalmente, puedes actualizar los topes de mantenimiento para que las alertas vuelvan a calcularse.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-6 pt-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Tipo de Service <span className="text-destructive">*</span></Label>
              <Select value={serviceType} onValueChange={setServiceType} required>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aceite de Motor">Aceite de Motor</SelectItem>
                  <SelectItem value="Filtro de Aceite">Filtro de Aceite</SelectItem>
                  <SelectItem value="Filtro de Aire">Filtro de Aire</SelectItem>
                  <SelectItem value="Aceite de Caja">Aceite de Caja</SelectItem>
                  <SelectItem value="Service General">Service General</SelectItem>
                  <SelectItem value="Reparación">Reparación Extra</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {serviceType === 'Otro' && (
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Especificar Service <span className="text-destructive">*</span></Label>
                <Input name="service_type_other" required className="bg-background/50" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Km al momento <span className="text-destructive">*</span></Label>
              <Input name="km_at_service" type="number" defaultValue={vehicle.current_km} required className="bg-background/50" />
            </div>

            <div className="space-y-2">
              <Label>Costo ($) <span className="text-destructive">*</span></Label>
              <Input name="cost" type="number" step="0.01" required placeholder="0.00" className="bg-background/50" />
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <h4 className="text-sm font-semibold text-foreground/80">Opcional: Actualizar Topes de Alertas</h4>
            <p className="text-xs text-muted-foreground">Si hiciste un cambio de aceite, podés fijar acá cuándo será el próximo cambio para reiniciar la alerta.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 border-r border-border/50 pr-2">
                <Label className="text-xs font-bold text-amber-500">Tope por Kilómetros</Label>
                <Select value={updateFieldKm} onValueChange={setUpdateFieldKm}>
                  <SelectTrigger className="h-8 text-xs bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No actualizar ninguno</SelectItem>
                    <SelectItem value="next_service_km">Aceite Motor</SelectItem>
                    <SelectItem value="next_oil_filter_change_km">Filtro Aceite</SelectItem>
                    <SelectItem value="next_air_filter_change_km">Filtro Aire</SelectItem>
                    <SelectItem value="next_gearbox_oil_change_km">Aceite Caja</SelectItem>
                  </SelectContent>
                </Select>
                {updateFieldKm !== 'none' && (
                  <Input name="new_limit_km" type="number" placeholder="Ej: 160000" className="h-8 text-xs mt-2 bg-background/50" />
                )}
              </div>

              <div className="space-y-2 pl-2">
                <Label className="text-xs font-bold text-amber-500">Tope por Fecha</Label>
                <Select value={updateFieldDate} onValueChange={setUpdateFieldDate}>
                  <SelectTrigger className="h-8 text-xs bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No actualizar ninguno</SelectItem>
                    <SelectItem value="next_oil_change_date">Aceite Motor</SelectItem>
                    <SelectItem value="next_oil_filter_change_date">Filtro Aceite</SelectItem>
                    <SelectItem value="next_air_filter_change_date">Filtro Aire</SelectItem>
                    <SelectItem value="next_gearbox_oil_change_date">Aceite Caja</SelectItem>
                  </SelectContent>
                </Select>
                {updateFieldDate !== 'none' && (
                  <Input name="new_limit_date" type="date" className="h-8 text-xs mt-2 bg-background/50 block" />
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</p>}
          
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="shadow-lg bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrar Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
