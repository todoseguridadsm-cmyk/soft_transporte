import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingDown, Receipt, Info } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'chofer') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <Wallet className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-foreground/80 mb-2">Sección de Choferes</h2>
        <p className="text-muted-foreground">La caja es de uso exclusivo para el personal en ruta.</p>
        <Link href="/dashboard" className="mt-4"><Button variant="outline">Volver</Button></Link>
      </div>
    )
  }

  // Fetch the most relevant trip (in_progress or pending, or most recent completed)
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id,
      trip_code,
      origin,
      destination,
      status,
      advance_payment,
      expenses ( id, amount, description, status )
    `)
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentTrip = trips && trips.length > 0 ? trips[0] : null

  if (!currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <Wallet className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-foreground/80 mb-2">Sin viajes</h2>
        <p className="text-muted-foreground">No tienes ningún viaje registrado aún.</p>
      </div>
    )
  }

  const adelantado = currentTrip.advance_payment || 0
  const gastosArray = currentTrip.expenses as any[] || []
  const gastado = gastosArray.reduce((acc, exp) => acc + (exp.amount || 0), 0)
  const saldo = adelantado - gastado

  const isNegativo = saldo < 0

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90 flex items-center gap-2">
          <Wallet className="h-8 w-8 text-primary" /> Mi Caja
        </h2>
        <p className="text-muted-foreground font-medium text-sm">Resumen financiero de tu viaje actual.</p>
      </div>

      <Card className="bg-[#111827] border-border/20 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="h-32 w-32" />
        </div>
        <CardHeader className="relative z-10 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saldo Disponible</CardTitle>
              <div className={`text-5xl font-black mt-2 ${isNegativo ? 'text-red-500' : 'text-emerald-400'}`}>
                ${saldo.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white/5 rounded-md p-2 w-max">
            <Info className="h-4 w-4" /> Viaje: <span className="text-primary font-bold">{currentTrip.trip_code || 'S/C'}</span> ({currentTrip.origin} a {currentTrip.destination})
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-400" /> Adelanto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground/90">${adelantado.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" /> Gastado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground/90">${gastado.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="font-bold text-sm text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Detalle de Tickets
        </h3>
        <div className="space-y-3">
          {gastosArray.length > 0 ? (
            gastosArray.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
                <div>
                  <p className="font-bold text-sm text-foreground/90">{exp.description}</p>
                  <p className={`text-xs mt-1 font-semibold ${
                    exp.status === 'approved' ? 'text-emerald-500' :
                    exp.status === 'rejected' ? 'text-red-500' :
                    'text-amber-500'
                  }`}>
                    {exp.status === 'approved' ? 'Aprobado' : exp.status === 'rejected' ? 'Rechazado' : 'Pendiente Aud.'}
                  </p>
                </div>
                <div className="font-bold text-lg text-foreground/90">
                  ${exp.amount.toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl">
              No has subido ningún ticket en este viaje.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
