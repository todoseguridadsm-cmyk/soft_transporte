import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createPartnerTransaction } from '@/app/actions/company'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet, TrendingUp, TrendingDown, Landmark, ArrowRightLeft } from 'lucide-react'

export default async function PartnersWalletPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const filterPartner = searchParams.partner_id as string || ''
  
  const supabase = await createClient()

  // 1. Calculate General Metrics (Sales - Expenses)
  const { data: sales } = await supabase.from('sales').select('id, amount, created_at, client_id, clients(company_name)')
  const { data: expenses } = await supabase.from('expenses').select('id, amount, description, created_at, ocr_data, driver_id, profiles(full_name)').eq('status', 'approved')
  const { data: company_expenses } = await supabase.from('company_expenses').select('id, amount, description, created_at, category, supplier_id, suppliers(company_name), driver_id, profiles(full_name)')

  const totalSales = sales?.reduce((acc, sale) => acc + (sale.amount || 0), 0) || 0
  const totalTripExpenses = expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0
  const totalCompanyExpenses = company_expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0
  const totalExpenses = totalTripExpenses + totalCompanyExpenses
  const netProfit = totalSales - totalExpenses

  // 2. Fetch Partners and Transactions
  const { data: partners } = await supabase.from('partners').select('*').order('full_name')

  let query = supabase.from('partner_transactions').select(`
    *,
    partners ( full_name )
  `).order('created_at', { ascending: false })

  if (filterPartner) {
    query = query.eq('partner_id', filterPartner)
  }

  const { data: transactions } = await query

  const totalRetiros = transactions?.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0) || 0

  // 3. Unify Ledger (Libro Diario)
  let mergedLedger: any[] = []

  if (!filterPartner) {
    // Ingresos por Ventas
    sales?.forEach(s => mergedLedger.push({
      id: `sale-${s.id}`,
      date: s.created_at,
      type: 'Ingreso',
      concept: 'Facturación / Cobro de Viaje',
      entity: s.clients?.company_name || 'Cliente',
      income: s.amount,
      expense: 0,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    }))

    // Egresos por Gastos de Empresa
    company_expenses?.forEach(e => mergedLedger.push({
      id: `cexp-${e.id}`,
      date: e.created_at,
      type: 'Egreso Empresa',
      concept: e.description || e.category.replace('_', ' '),
      entity: e.suppliers?.company_name || e.profiles?.full_name || 'Empresa',
      income: 0,
      expense: e.amount,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }))

    // Egresos por Gastos de Choferes
    expenses?.forEach(e => mergedLedger.push({
      id: `texp-${e.id}`,
      date: e.created_at,
      type: 'Gasto Viaje',
      concept: `Ticket: ${e.description}`,
      entity: e.profiles?.full_name || 'Chofer',
      income: 0,
      expense: e.amount,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }))
  }

  // Movimientos de Socios
  transactions?.forEach(t => mergedLedger.push({
    id: `ptx-${t.id}`,
    date: t.created_at,
    type: t.type === 'withdrawal' ? 'Retiro Socio' : 'Aporte Socio',
    concept: t.description || (t.type === 'withdrawal' ? 'Retiro de Ganancias' : 'Aporte de Capital'),
    entity: t.partners?.full_name || 'Socio',
    income: t.type === 'investment' ? t.amount : 0,
    expense: t.type === 'withdrawal' ? t.amount : 0,
    color: t.type === 'withdrawal' ? 'text-amber-500' : 'text-blue-500',
    bg: t.type === 'withdrawal' ? 'bg-amber-500/10' : 'bg-blue-500/10'
  }))

  // Sort unified ledger by date
  mergedLedger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate final running balance if needed, but for now we just list them.
  let runningBalance = 0;
  // If we want a running balance, we would sort ascending, calculate, then reverse.
  mergedLedger.reverse().forEach(item => {
    runningBalance += (item.income - item.expense)
    item.balance = runningBalance
  })
  mergedLedger.reverse() // back to descending for display

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">Flujo de Caja General y Socios</h2>
        <p className="text-muted-foreground font-medium mt-1">Libro diario con rentabilidad general y retiros/aportes.</p>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">${totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Egresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-500">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600 border-none shadow-xl text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Landmark className="h-32 w-32 -mt-4 -mr-4" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-blue-100 uppercase flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Caja Neta Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black">${netProfit.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* New Transaction Form */}
        <Card className="lg:col-span-1 bg-card/40 backdrop-blur-xl border-border/40 shadow-xl h-fit">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg font-bold">Movimiento de Socios</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={createPartnerTransaction} className="space-y-4">
              
              <div className="space-y-2">
                <Label>Socio <span className="text-destructive">*</span></Label>
                <Select name="partner_id" required>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Seleccionar socio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Movimiento <span className="text-destructive">*</span></Label>
                <Select name="type" required defaultValue="withdrawal">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withdrawal">Retiro de Ganancias</SelectItem>
                    <SelectItem value="investment">Aporte de Capital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Monto <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">$</div>
                  <Input type="number" step="0.01" name="amount" required placeholder="0.00" className="pl-8 bg-background/50 text-lg font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción / Concepto</Label>
                <Input name="description" placeholder="Ej: Retiro mensual de julio" className="bg-background/50" />
              </div>

              <Button type="submit" className="w-full gap-2 mt-4 bg-amber-600 hover:bg-amber-700 text-white">
                Guardar Movimiento
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transactions History */}
        <Card className="lg:col-span-2 bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
          <CardHeader className="border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold">Libro Diario General</CardTitle>
            
            <form action="/dashboard/partners-wallet" className="flex items-center gap-2">
              <select name="partner_id" defaultValue={filterPartner} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm w-full sm:w-48">
                <option value="">Caja General (Todos)</option>
                {partners?.map(p => <option key={p.id} value={p.id}>Solo {p.full_name}</option>)}
              </select>
              <Button type="submit" variant="secondary" size="sm" className="h-9">Filtrar</Button>
            </form>
          </CardHeader>
          <CardContent className="p-0">
            {filterPartner && (
              <div className="bg-amber-500/10 p-4 border-b border-amber-500/20 text-center">
                <p className="text-sm text-amber-600/80 font-bold uppercase tracking-wider">Total Retirado por este socio</p>
                <p className="text-2xl font-black text-amber-500 mt-1">${totalRetiros.toLocaleString()}</p>
              </div>
            )}
            
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent sticky top-0 bg-card/90 backdrop-blur z-10">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo / Entidad</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Ingreso</TableHead>
                    <TableHead className="text-right">Egreso</TableHead>
                    <TableHead className="text-right border-l border-border/30">Saldo Caja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mergedLedger && mergedLedger.length > 0 ? (
                    mergedLedger.map((t) => (
                      <TableRow key={t.id} className="border-border/40 hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-sm font-medium">
                          {new Date(t.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.bg} ${t.color} mb-1`}>
                            {t.type}
                          </span>
                          <div className="font-bold text-foreground/90 text-sm">
                            {t.entity}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={t.concept}>
                          {t.concept || '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-500">
                          {t.income > 0 ? `$${Number(t.income).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-500">
                          {t.expense > 0 ? `$${Number(t.expense).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-black border-l border-border/30 ${t.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                          ${t.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay movimientos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
