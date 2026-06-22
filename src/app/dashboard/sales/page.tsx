import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Banknote, Truck, ArrowRight, FileText } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SaleForm } from '@/components/sales/SaleForm'
import { Button } from '@/components/ui/button'
import { DownloadPdfButton } from '@/components/sales/DownloadPdfButton'

export default async function SalesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const filterClient = searchParams.client_id as string || ''

  const supabase = await createClient()

  let query = supabase
    .from('sales')
    .select(`
      *,
      clients ( company_name, cuit ),
      trips ( trip_code, origin, destination )
    `)
    .order('created_at', { ascending: false })

  if (filterClient) {
    query = query.eq('client_id', filterClient)
  }

  const { data: sales } = await query

  const { data: clients } = await supabase.from('clients').select('id, company_name')
  
  // Fetch all trips and their sales to determine pending ones
  const { data: allTrips } = await supabase.from('trips').select(`
    id, trip_code, origin, destination, status, price, client_id, created_at,
    clients ( company_name, cuit ),
    sales ( id )
  `).order('created_at', { ascending: false })

  const pendingTrips = allTrips?.filter(t => !t.sales || t.sales.length === 0) || []
  
  const { data: companySettingsArray } = await supabase.from('company_settings').select('*').limit(1)
  const company = companySettingsArray && companySettingsArray.length > 0 ? companySettingsArray[0] : null

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">Ventas y Facturación</h2>
          <p className="text-muted-foreground font-medium mt-1">Gestión de cobros a clientes y facturación de viajes.</p>
        </div>
        <SaleForm clients={clients || []} trips={allTrips || []} />
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-xs font-bold text-muted-foreground uppercase">Filtrar por Cliente</label>
          <form action="/dashboard/sales" className="flex gap-2">
            <select name="client_id" defaultValue={filterClient} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm w-full sm:w-64">
              <option value="">Todos los clientes</option>
              {clients?.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
            <Button type="submit" variant="secondary" size="sm" className="h-9">Filtrar</Button>
          </form>
        </div>
      </Card>

      {/* Viajes Pendientes de Facturar */}
      <Card className="bg-card/40 backdrop-blur-xl border-amber-500/20 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-bold text-foreground/90">Viajes Pendientes de Facturación</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Fecha / Ruta</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Estado del Viaje</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Precio Ref.</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTrips.length > 0 ? (
                pendingTrips.map((trip) => (
                  <TableRow key={trip.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-bold text-primary/80 font-mono text-xs">{trip.trip_code || 'S/C'}</div>
                      <div className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                        {trip.origin} <ArrowRight className="h-3 w-3 text-muted-foreground" /> {trip.destination}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground/90">
                      {(trip.clients as any)?.company_name || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        trip.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {trip.status === 'in_progress' ? 'En Curso' : trip.status === 'completed' ? 'Finalizado' : 'A Confirmar'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-muted-foreground">
                      ${trip.price?.toLocaleString() || '0.00'}
                    </TableCell>
                    <TableCell className="text-right">
                      <SaleForm 
                        clients={clients || []} 
                        trips={allTrips || []} 
                        defaultTripId={trip.id} 
                        defaultClientId={trip.client_id}
                        trigger={
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 gap-2 text-xs">
                            <FileText className="h-3 w-3" /> Facturar
                          </Button>
                        } 
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground/80 font-medium text-sm">
                    No hay viajes pendientes de facturación.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-bold text-foreground/90">Historial de Ventas Facturadas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Comprobante</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Viaje Asoc.</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Forma de Pago</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Monto</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales && sales.length > 0 ? (
                sales.map((sale) => (
                  <TableRow key={sale.id} className="border-border/40 hover:bg-muted/30 transition-colors group">
                    <TableCell>
                      <div className="font-bold text-foreground/90 font-mono">{sale.voucher_number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(sale.created_at).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground/90">{sale.clients?.company_name || 'Consumidor Final'}</div>
                      <div className="text-xs text-muted-foreground">CUIT: {sale.clients?.cuit || '-'}</div>
                    </TableCell>
                    <TableCell>
                      {sale.trips ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-primary/80">{sale.trips.trip_code}</span>
                          <span className="text-xs text-muted-foreground">{sale.trips.origin} a {sale.trips.destination}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin viaje asociado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <Banknote className="h-3 w-3" /> {sale.payment_method.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-500 text-lg">
                      ${sale.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DownloadPdfButton sale={sale} company={company} />

                        <form action={async () => {
                          'use server'
                          const { deleteSale } = await import('@/app/actions/sales')
                          await deleteSale(sale.id)
                        }}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            ✕
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground/80 font-medium">
                    No hay ventas registradas.
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
