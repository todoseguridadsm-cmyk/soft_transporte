import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateTrip } from '@/app/actions/trips'
import { MapPin, DollarSign, Truck, Users, UserRound } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function EditTripPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tripId = params.id
  const supabase = await createClient()

  // Fetch the trip to edit
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (!trip) {
    redirect('/dashboard/trips')
  }

  const { data: clients } = await supabase.from('clients').select('id, company_name').order('company_name')
  const { data: vehicles } = await supabase.from('vehicles').select('id, plate, brand').order('plate')
  const { data: drivers } = await supabase.from('profiles').select('id, full_name').eq('role', 'chofer').order('full_name')

  async function onSubmit(formData: FormData) {
    'use server'
    const res = await updateTrip(tripId, formData)
    if (res?.success) {
      redirect('/dashboard/trips')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">Editar Viaje</h2>
        <p className="text-muted-foreground font-medium mt-1">Modifica los detalles del viaje en curso o pendiente.</p>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl">
        <CardHeader className="border-b border-border/30 bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-primary" /> Viaje {trip.trip_code || 'S/C'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={onSubmit} className="space-y-6">
            
            {/* Cliente */}
            <div className="space-y-3">
              <Label htmlFor="client_id" className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" /> Cliente
              </Label>
              <Select name="client_id" defaultValue={trip.client_id || undefined}>
                <SelectTrigger className="bg-background/50 h-11">
                  <SelectValue placeholder="Selecciona un cliente" />
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
                <Label htmlFor="vehicle_id" className="flex items-center gap-2 font-semibold">
                  <Truck className="h-4 w-4 text-muted-foreground" /> Vehículo
                </Label>
                <Select name="vehicle_id" defaultValue={trip.vehicle_id || undefined}>
                  <SelectTrigger className="bg-background/50 h-11">
                    <SelectValue placeholder="Patente / Camión" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.plate} ({v.brand})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="driver_id" className="flex items-center gap-2 font-semibold">
                  <UserRound className="h-4 w-4 text-muted-foreground" /> Chofer Asignado
                </Label>
                <Select name="driver_id" defaultValue={trip.driver_id || undefined}>
                  <SelectTrigger className="bg-background/50 h-11">
                    <SelectValue placeholder="Selecciona chofer" />
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
                <Input name="origin" required defaultValue={trip.origin} placeholder="Ej: Mendoza, ARG" className="bg-background/50 h-11" />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="destination" className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Destino <span className="text-destructive">*</span>
                </Label>
                <Input name="destination" required defaultValue={trip.destination} placeholder="Ej: Santiago, CHL" className="bg-background/50 h-11" />
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="estimated_km" className="flex items-center gap-2 font-semibold text-amber-500">
                  Kilómetros (Ida y Vuelta) <span className="text-destructive">*</span>
                </Label>
                <Input type="number" name="estimated_km" required defaultValue={trip.estimated_km} placeholder="Ej: 1200" className="bg-background/50 h-11" />
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
                  <Input type="number" step="0.01" name="advance_payment" defaultValue={trip.advance_payment} placeholder="0.00" className="pl-8 bg-background/50 h-12 text-lg font-bold text-amber-500" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all mt-6">
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
