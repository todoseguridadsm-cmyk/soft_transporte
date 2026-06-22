import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, AlertTriangle, Receipt, Navigation, MapPin, Calendar, Clock, Home } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FinishTripButton } from '@/components/trips/FinishTripButton'

export async function DriverDashboardView({ userId, fullName }: { userId: string, fullName: string }) {
  const supabase = await createClient()

  // 1. Obtener viajes asignados al chofer (in_progress o pending)
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id, origin, destination, start_date, status, 
      vehicles(plate, next_service_km, current_km)
    `)
    .eq('driver_id', userId)
    .order('start_date', { ascending: false })
    .limit(1)
  
  const currentTrip = trips && trips.length > 0 ? trips[0] : null
  const vehicle = currentTrip?.vehicles as any

  // 2. Calcular alertas del vehículo asignado a este viaje
  let alertas = []
  if (vehicle) {
    const remaining = (vehicle.next_service_km || 0) - (vehicle.current_km || 0)
    if (vehicle.next_service_km > 0 && remaining <= 1000) {
      alertas.push({
        id: 'service',
        title: 'Mantenimiento Próximo',
        desc: remaining <= 0 
          ? `El camión ${vehicle.plate} requiere servicio INMEDIATO.` 
          : `El camión ${vehicle.plate} requerirá servicio en ${remaining} km.`,
        urgency: remaining <= 0 ? 'high' : 'medium'
      })
    }
  }

  return (
    <div className="space-y-6 pb-8 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Hola, {fullName.split(' ')[0]}</h2>
          <p className="text-muted-foreground font-medium text-sm mt-1">Acá tenés el resumen de tu jornada.</p>
        </div>
        <div className="h-10 w-10 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
          <Truck className="h-5 w-5 text-blue-500" />
        </div>
      </div>

      {/* Alertas (Solo si hay) */}
      {alertas.length > 0 && (
        <div className="space-y-3">
          {alertas.map((a, i) => (
            <div key={i} className={`p-4 rounded-xl border flex gap-3 shadow-lg ${
              a.urgency === 'high' 
                ? 'bg-red-500/10 border-red-500/30 text-red-100' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 shrink-0 ${a.urgency === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
              <div>
                <h4 className={`font-bold text-sm ${a.urgency === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{a.title}</h4>
                <p className="text-xs mt-1 opacity-90">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viaje Actual */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Tu Viaje Activo</h3>
        
        {currentTrip ? (
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Navigation className="h-24 w-24" />
            </div>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  currentTrip.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                  currentTrip.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {currentTrip.status === 'in_progress' ? 'En Ruta' : currentTrip.status === 'completed' ? 'Finalizado' : 'A Confirmar'}
                </span>
                {vehicle && <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-gray-400 border border-gray-700">{vehicle.plate}</span>}
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 items-start relative">
                  <div className="flex flex-col items-center gap-1 mt-1 z-10">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    <div className="w-0.5 h-10 bg-gray-700" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  </div>
                  <div className="flex-1 space-y-5">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Origen</p>
                      <p className="font-bold text-white text-lg">{currentTrip.origin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Destino</p>
                      <p className="font-bold text-white text-lg">{currentTrip.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-700/50 flex gap-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{currentTrip.start_date ? new Date(currentTrip.start_date).toLocaleDateString('es-AR') : 'Fecha pendiente'}</span>
                </div>
              </div>

              {/* Botón Finalizar Viaje */}
              {(currentTrip.status === 'in_progress' || currentTrip.status === 'pending') && (
                <div className="relative z-10">
                  <FinishTripButton tripId={currentTrip.id} initialStatus={currentTrip.status} />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2 border border-gray-700">
              <Home className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-300">No tenés ningún viaje asignado en este momento.</p>
            <p className="text-xs text-gray-500">Contactá a administración para nuevas asignaciones.</p>
          </div>
        )}
      </div>

      {/* Botones de Acción Rápida */}
      <div className="space-y-3 mt-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Acciones</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/expenses" className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 transition-colors rounded-2xl border border-gray-700 shadow-lg group">
            <div className="p-3 bg-emerald-500/10 rounded-full group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-gray-200">Cargar Ticket</span>
          </Link>
          
          <Link href="/dashboard/trips" className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 transition-colors rounded-2xl border border-gray-700 shadow-lg group">
            <div className="p-3 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-gray-200">Historial Viajes</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
