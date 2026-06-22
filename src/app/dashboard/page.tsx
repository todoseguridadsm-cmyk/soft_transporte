import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, AlertTriangle, DollarSign, ScanText, PieChart } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { RouteChart } from '@/components/dashboard/RouteChart'
import { DriverDashboardView } from '@/components/dashboard/DriverDashboardView'
import { CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  let fullName = 'Usuario'
  let role = 'empleado'

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
    if (profile) {
      fullName = profile.full_name || 'Usuario'
      role = profile.role
      if (role === 'chofer') {
        return <DriverDashboardView userId={user.id} fullName={fullName} />
      }
    }
  }

  // --- 1. Fetching Data for KPIs ---
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  
  const { data: currentMonthSales } = await supabase
    .from('sales')
    .select('amount, created_at, notes')
    .gte('created_at', firstDayOfMonth)

  const { data: currentMonthExpenses } = await supabase
    .from('company_expenses')
    .select('amount, created_at, description')
    .gte('created_at', firstDayOfMonth)

  const facturacionMes = currentMonthSales?.reduce((acc, s) => acc + (s.amount || 0), 0) || 0
  const facturacionCount = currentMonthSales?.length || 0

  let ivaVentas = 0
  currentMonthSales?.forEach(s => {
    try {
      if (s.notes && s.notes.startsWith('{')) {
        const obj = JSON.parse(s.notes)
        if (obj.iva_amount) ivaVentas += obj.iva_amount
      }
    } catch(e) {}
  })

  let ivaCompras = 0
  currentMonthExpenses?.forEach(e => {
    try {
      if (e.description && e.description.startsWith('{')) {
        const obj = JSON.parse(e.description)
        if (obj.iva_amount) ivaCompras += obj.iva_amount
      }
    } catch(e) {}
  })

  const saldoIva = ivaVentas - ivaCompras // Positivo: A Pagar (En Contra). Negativo: A Favor.

  const { data: allTrips } = await supabase.from('trips').select('id, origin, destination, price, status')
  const { data: allExpenses } = await supabase.from('expenses').select('trip_id, amount, status')
  const { data: allSales } = await supabase.from('sales').select('trip_id, amount')
  const { data: vehicles } = await supabase.from('vehicles').select('id, plate, current_km, next_service_km, status')
  
  // Calculate KPIs
  const completedTrips = allTrips?.filter(t => t.status === 'completed') || []
  
  let rentabilidadTotal = 0
  completedTrips.forEach(t => {
     const tripExpenses = allExpenses?.filter(e => e.trip_id === t.id && e.status === 'approved') || []
     const cost = tripExpenses.reduce((acc, e) => acc + e.amount, 0)
     
     const tripSales = allSales?.filter(s => s.trip_id === t.id) || []
     const income = tripSales.reduce((acc, s) => acc + (s.amount || 0), 0)
     
     rentabilidadTotal += (income - cost)
  })
  const rentabilidadPromedio = completedTrips.length > 0 ? (rentabilidadTotal / completedTrips.length) : 0

  let alertasCount = 0
  vehicles?.forEach(v => {
    const next = v.next_service_km || 0
    const curr = v.current_km || 0
    if (next > 0 && (next - curr) <= 1000) alertasCount++
  })

  const inProgressTripsCount = allTrips?.filter(t => t.status === 'in_progress').length || 0

  // --- 2. Charts Data Preparation ---
  // Dummy data para Ingresos vs Gastos para visualización. En producción, esto se agrupa por fecha.
  const revenueData = [
    { month: 'Ene', ingresos: 12000, gastos: 8400 },
    { month: 'Feb', ingresos: 15000, gastos: 9398 },
    { month: 'Mar', ingresos: 11000, gastos: 8800 },
    { month: 'Abr', ingresos: 17780, gastos: 10908 },
    { month: 'May', ingresos: 18890, gastos: 11800 },
    { month: 'Jun', ingresos: 23390, gastos: 12800 },
  ]
  
  // Rentabilidad por Ruta (agregada de datos reales)
  const routeMap: Record<string, { rentabilidad: number, count: number }> = {}
  completedTrips.forEach(t => {
     const route = `${t.origin} - ${t.destination}`
     const tripExpenses = allExpenses?.filter(e => e.trip_id === t.id && e.status === 'approved') || []
     const cost = tripExpenses.reduce((acc, e) => acc + e.amount, 0)
     const rent = (t.price || 0) - cost
     if (!routeMap[route]) routeMap[route] = { rentabilidad: 0, count: 0 }
     routeMap[route].rentabilidad += rent
     routeMap[route].count++
  })
  
  let routeData = Object.keys(routeMap).map(k => ({
     route: k,
     rentabilidad: routeMap[k].rentabilidad / routeMap[k].count
  })).sort((a,b) => b.rentabilidad - a.rentabilidad).slice(0, 5)

  if (routeData.length === 0) {
     routeData = [
       { route: 'Mza - Chile', rentabilidad: 1200 },
       { route: 'Mza - BsAs', rentabilidad: 850 },
       { route: 'Rosario - Cba', rentabilidad: 600 }
     ]
  }

  // --- 3. Viajes a Confirmar ---
  const { data: pendingAuditTrips } = await supabase
    .from('trips')
    .select('id, trip_code, origin, destination, profiles!trips_driver_id_fkey(full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">Command Center</h2>
          <p className="text-lg font-bold text-primary mt-1">¡Hola, {fullName}!</p>
          <p className="text-muted-foreground font-medium mt-1">Visión ejecutiva del estado general de la flota y finanzas.</p>
        </div>
      </div>

      {/* KPIs Superiores */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {/* Card IVA: Teal/Cyan Gradient */}
        <Card className={`bg-gradient-to-br ${saldoIva > 0 ? 'from-[#be123c] to-[#e11d48] shadow-rose-500/20 hover:shadow-rose-500/40' : 'from-[#0ea5e9] to-[#0284c7] shadow-sky-500/20 hover:shadow-sky-500/40'} border-none shadow-lg text-white transition-all relative overflow-hidden`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white/90">Posición IVA (Mes)</CardTitle>
            <div className={`p-2 rounded-full bg-white/20 backdrop-blur-md`}>
              <ScanText className={`h-4 w-4 text-white`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">${Math.abs(saldoIva).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <p className={`text-[11px] font-medium mt-1 text-white/90`}>
              {saldoIva > 0 ? 'Saldo En Contra (A Pagar)' : saldoIva < 0 ? 'Saldo A Favor (Crédito)' : 'Posición Neutra'}
            </p>
            <div className="text-[9px] mt-2 text-white/70 font-semibold uppercase tracking-wider flex justify-between">
              <span>Ventas: ${ivaVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              <span>Compras: ${ivaCompras.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
            </div>
          </CardContent>
        </Card>
        {/* Card 1: Dark with Green Accents */}
        <Card className="bg-[#111827] border-border/20 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-400/80">Facturado (Mes)</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${facturacionMes.toLocaleString()}</div>
            <p className="text-xs font-medium text-emerald-500 mt-1 flex items-center gap-1">
              {facturacionCount} comprobantes emitidos
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Dark with Red Accents (Gastos/Rentabilidad) */}
        <Card className="bg-[#111827] border-border/20 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-red-400/80">Rentabilidad Promedio</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-full">
              <PieChart className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${rentabilidadPromedio.toLocaleString()}</div>
            <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
              Neto por viaje
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Solid Yellow/Amber Gradient */}
        <Card className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] border-none shadow-lg shadow-amber-500/20 text-white hover:shadow-amber-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-amber-50">Camiones en Ruta</CardTitle>
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
              <Truck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{inProgressTripsCount}</div>
            <p className="text-xs font-medium text-amber-100 mt-1 flex items-center gap-1">
              Operando activamente
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Solid Purple/Blue Gradient */}
        <Card className={`bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-none shadow-lg shadow-indigo-500/20 text-white hover:shadow-indigo-500/40 transition-all relative overflow-hidden`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-indigo-50">Alertas de Flota</CardTitle>
            <div className={`p-2 rounded-full bg-white/20 backdrop-blur-md`}>
              <AlertTriangle className={`h-4 w-4 text-white`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{alertasCount}</div>
            <p className={`text-xs font-medium mt-1 text-indigo-100`}>
              Mantenimientos próximos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Gráficos y Viajes a Confirmar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Viajes a Confirmar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {pendingAuditTrips && pendingAuditTrips.length > 0 ? (
                pendingAuditTrips.map((trip: any) => (
                  <div key={trip.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                     <div className="space-y-1">
                       <p className="text-sm font-bold font-mono text-primary/80">{trip.trip_code || 'S/C'}</p>
                       <p className="text-xs text-muted-foreground">{trip.profiles?.full_name}</p>
                     </div>
                     <Link href="/dashboard/trips">
                       <Button variant="outline" size="sm" className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10">Auditar</Button>
                     </Link>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">No hay viajes pendientes de confirmación.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico Inferior y Tabla de Flota */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RouteChart data={routeData} />

        {/* Estado de Flota Rápido */}
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <CardTitle className="text-lg font-bold text-foreground/90">Estado de Flota Activa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-semibold text-muted-foreground">Camión</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Kilometraje</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Salud</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles && vehicles.length > 0 ? (
                  vehicles.slice(0, 5).map((vehicle) => {
                    const remaining = (vehicle.next_service_km || 0) - (vehicle.current_km || 0)
                    let dotColor = 'bg-emerald-500'
                    if (vehicle.next_service_km > 0) {
                      if (remaining <= 0) dotColor = 'bg-destructive'
                      else if (remaining <= 1000) dotColor = 'bg-amber-500'
                    }

                    return (
                      <TableRow key={vehicle.id} className="border-border/40 hover:bg-muted/30">
                        <TableCell className="font-semibold">
                          <Link href={`/dashboard/vehicles/${vehicle.id}`} className="hover:text-primary transition-colors">
                            {vehicle.plate}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono">
                          {vehicle.current_km?.toLocaleString() || 0} km
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`w-3 h-3 rounded-full ${dotColor} shadow-[0_0_8px_currentColor]`}></span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground/80 font-medium">
                      No hay vehículos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
