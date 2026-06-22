'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, DollarSign, Truck, Users, UserRound } from 'lucide-react'
import { createTrip } from '@/app/actions/trips'

export function TripForm({ clients, vehicles, drivers }: { clients: any[], vehicles: any[], drivers: any[] }) {
  const [clientId, setClientId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')

  const selectedClient = clients?.find(c => c.id === clientId)
  const selectedVehicle = vehicles?.find(v => v.id === vehicleId)
  const selectedDriver = drivers?.find(d => d.id === driverId)

  return (
    <form action={createTrip} className="space-y-6">
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <input type="hidden" name="driver_id" value={driverId} />
      
      {/* Cliente */}
      <div className="space-y-3">
        <Label htmlFor="client_id_select" className="flex items-center gap-2 font-semibold">
          <Users className="h-4 w-4 text-muted-foreground" /> Cliente
        </Label>
        <Select value={clientId} onValueChange={setClientId} required>
          <SelectTrigger className="bg-background/50 h-11 text-left">
            {selectedClient ? selectedClient.company_name : <span className="text-muted-foreground">Selecciona un cliente</span>}
          </SelectTrigger>
          <SelectContent>
            {clients?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vehículo y Chofer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="vehicle_id_select" className="flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4 text-muted-foreground" /> Vehículo
          </Label>
          <Select value={vehicleId} onValueChange={setVehicleId} required>
            <SelectTrigger className="bg-background/50 h-11 text-left">
              {selectedVehicle ? `${selectedVehicle.plate} (${selectedVehicle.brand})` : <span className="text-muted-foreground">Patente / Camión</span>}
            </SelectTrigger>
            <SelectContent>
              {vehicles?.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.plate} ({v.brand})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="driver_id_select" className="flex items-center gap-2 font-semibold">
            <UserRound className="h-4 w-4 text-muted-foreground" /> Chofer Asignado
          </Label>
          <Select value={driverId} onValueChange={setDriverId} required>
            <SelectTrigger className="bg-background/50 h-11 text-left">
              {selectedDriver ? selectedDriver.full_name : <span className="text-muted-foreground">Selecciona chofer</span>}
            </SelectTrigger>
            <SelectContent>
              {drivers?.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Origen y Destino */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        <div className="space-y-3">
          <Label htmlFor="origin" className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-muted-foreground" /> Origen <span className="text-destructive">*</span>
          </Label>
          <Input name="origin" required placeholder="Ej: Mendoza, ARG" className="bg-background/50 h-11" />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="destination" className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-muted-foreground" /> Destino <span className="text-destructive">*</span>
          </Label>
          <Input name="destination" required placeholder="Ej: Santiago, CHL" className="bg-background/50 h-11" />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="estimated_km" className="flex items-center gap-2 font-semibold text-amber-500">
            Kilómetros (Ida y Vuelta) <span className="text-destructive">*</span>
          </Label>
          <Input type="number" name="estimated_km" required placeholder="Ej: 1200" className="bg-background/50 h-11" />
          <p className="text-xs text-muted-foreground">Esta distancia se sumará automáticamente al odómetro del vehículo al finalizar el viaje para calcular los mantenimientos.</p>
        </div>
      </div>

      {/* Adelantos */}
      <div className="border-t border-border/40 pt-6 mt-6">
        <div className="space-y-3">
          <Label htmlFor="advance_payment" className="flex items-center gap-2 font-semibold">
            <DollarSign className="h-4 w-4 text-amber-500" /> Adelanto Entregado al Chofer
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground">$</span>
            </div>
            <Input type="number" step="0.01" name="advance_payment" placeholder="0.00" className="pl-8 bg-background/50 h-12 text-lg font-bold text-amber-500" />
          </div>
          <p className="text-xs text-muted-foreground">Este monto se registrará en el sistema como saldo negativo (deuda) del chofer hasta que rinda sus gastos.</p>
        </div>
      </div>

      <Button type="submit" className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all mt-6">
        Iniciar Viaje
      </Button>
    </form>
  )
}
