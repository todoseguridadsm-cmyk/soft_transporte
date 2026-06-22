import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Truck, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DeleteTripButton } from '@/components/trips/DeleteTripButton'
import { ApproveTripButton } from '@/components/trips/ApproveTripButton'

export default async function TripsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const filterStatus = searchParams.status as string || 'active'
  const filterDriver = searchParams.driver_id as string || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'cliente'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile) role = profile.role
  }

  const isChofer = role === 'chofer'
  const isAdminOrEmp = role === 'admin' || role === 'empleado'

  // Fetch drivers for filter
  let drivers: any[] = []
  if (isAdminOrEmp) {
    const { data: dData } = await supabase.from('profiles').select('id, full_name').eq('role', 'chofer')
    if (dData) drivers = dData
  }

  // Fetch trips
  let query = supabase
    .from('trips')
    .select(`
      id,
      origin,
      destination,
      status,
      price,
      trip_code,
      advance_payment,
      created_at,
      clients ( company_name ),
      vehicles ( plate ),
      profiles!trips_driver_id_fkey ( full_name ),
      expenses ( id, status, amount )
    `)
    .order('created_at', { ascending: false })

  if (isChofer && user) {
    query = query.eq('driver_id', user.id)
  } else {
    if (filterStatus === 'active') {
      query = query.in('status', ['in_progress', 'pending'])
    } else if (filterStatus === 'completed') {
      query = query.eq('status', 'completed')
    }
    if (filterDriver) {
      query = query.eq('driver_id', filterDriver)
    }
  }

  const { data: trips } = await query

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">
            {isChofer ? 'Mis Viajes' : 'Gestión de Viajes'}
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {isChofer ? 'Consulta tus rutas activas y sube tus gastos.' : 'Monitorea y administra la rentabilidad de las rutas.'}
          </p>
        </div>
        <div className="flex gap-2">
          {isChofer && (
            <Link href="/dashboard/expenses">
              <Button variant="secondary" className="gap-2 shadow-lg hover:shadow-secondary/20 transition-all border border-border/50 bg-card">
                <Truck className="h-4 w-4" /> Subir Tickets
              </Button>
            </Link>
          )}
          {!isChofer && (
            <Link href="/dashboard/trips/new">
              <Button className="gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                <Plus className="h-4 w-4" /> Iniciar Viaje
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!isChofer && (
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Estado</label>
            <div className="flex bg-muted/30 rounded-lg p-1 border border-border/50">
              <Link href="?status=active" className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${filterStatus === 'active' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Activos</Link>
              <Link href="?status=completed" className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${filterStatus === 'completed' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Completados</Link>
              <Link href="?status=all" className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${filterStatus === 'all' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Todos</Link>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Filtrar Chofer</label>
            <form action="/dashboard/trips" className="flex gap-2">
              <input type="hidden" name="status" value={filterStatus} />
              <select name="driver_id" defaultValue={filterDriver} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                <option value="">Todos los choferes</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              <Button type="submit" variant="secondary" size="sm" className="h-9">Filtrar</Button>
            </form>
          </div>
        </Card>
      )}

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold text-foreground/90">
              {isChofer ? 'Viajes Asignados' : 'Todos los Viajes'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Código / Ruta</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Chofer</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Económico</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips && trips.length > 0 ? (
                trips.map((trip) => {
                  const expensesList = (trip.expenses as any[]) || [];
                  const pendingTickets = expensesList.filter(e => e.status === 'pending').length;
                  const totalGastos = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

                  return (
                  <TableRow key={trip.id} className="border-border/40 hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-medium text-foreground/90">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-primary/80 mb-1">{trip.trip_code || 'S/C'}</span>
                        <div>
                          <span className="text-foreground/80">{trip.origin}</span> <span className="mx-1 text-primary/50">→</span> <span className="text-foreground/80">{trip.destination}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-semibold">
                      {(trip.clients as any)?.company_name || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(trip.profiles as any)?.full_name || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        trip.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        trip.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-muted text-muted-foreground border-border/50'
                      }`}>
                        {trip.status === 'completed' ? 'Completado' : trip.status === 'pending' ? 'A Confirmar' : trip.status === 'in_progress' ? 'En Curso' : 'Pendiente'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <div className="flex flex-col items-end gap-1">
                        {!isChofer && <span className="text-emerald-500 text-sm">Venta: ${trip.price?.toLocaleString() || '0.00'}</span>}
                        {trip.advance_payment ? (
                          <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">
                            Adelanto: ${trip.advance_payment.toLocaleString()}
                          </span>
                        ) : null}
                        {totalGastos > 0 ? (
                          <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full mt-0.5">
                            Gastos Rind.: ${totalGastos.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {/* Audit / Confirm Trip */}
                        {!isChofer && trip.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            {(() => {
                               const canClose = pendingTickets === 0;
                               return canClose ? (
                                 <ApproveTripButton tripId={trip.id} />
                               ) : (
                                 <div className="flex items-center gap-2">
                                   <span className="text-xs text-destructive font-bold">{pendingTickets} Tickets sin auditar</span>
                                   <Link href="/dashboard/expenses"><Button variant="outline" size="sm" className="h-8 text-xs">Auditar Tickets</Button></Link>
                                 </div>
                               )
                            })()}
                          </div>
                        )}

                        {/* Force Close / Ver / Editar */}
                        {!isChofer && (
                          <div className="flex items-center gap-1 border-l border-border/50 pl-2 ml-2">
                            <Link href={`/dashboard/trips/${trip.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </Button>
                            </Link>
                            <DeleteTripButton id={trip.id} />
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground/80 font-medium">
                    No hay viajes activos. Crea uno nuevo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
