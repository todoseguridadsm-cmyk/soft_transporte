import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck } from 'lucide-react'
import { TripForm } from '@/components/trips/TripForm'

export default async function NewTripPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase.from('clients').select('id, company_name').order('company_name')
  const { data: vehicles } = await supabase.from('vehicles').select('id, plate, brand').order('plate')
  const { data: drivers } = await supabase.from('profiles').select('id, full_name').eq('role', 'chofer').order('full_name')

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">Iniciar Nuevo Viaje</h2>
        <p className="text-muted-foreground font-medium mt-1">Asigna cliente, vehículo y chofer para comenzar el recorrido.</p>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl">
        <CardHeader className="border-b border-border/30 bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-primary" /> Detalles de Operación
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <TripForm clients={clients || []} vehicles={vehicles || []} drivers={drivers || []} />
        </CardContent>
      </Card>
    </div>
  )
}
