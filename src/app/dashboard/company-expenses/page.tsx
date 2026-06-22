import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet, Banknote, UserRound } from 'lucide-react'
import { CompanyExpenseForm } from '@/components/companyExpenses/CompanyExpenseForm'
import { Button } from '@/components/ui/button'
import { ExportExcelButton } from '@/components/ui/ExportExcelButton'

export default async function CompanyExpensesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const filterMonth = searchParams.month as string || ''

  const supabase = await createClient()

  let expensesQuery = supabase
    .from('company_expenses')
    .select(`
      *,
      suppliers ( company_name ),
      profiles ( full_name )
    `)
    .order('created_at', { ascending: false })

  let driverExpensesQuery = supabase
    .from('expenses')
    .select(`
      *,
      profiles ( full_name )
    `)
    .eq('status', 'approved')

  if (filterMonth) {
    const [year, month] = filterMonth.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString()
    const endDate = new Date(parseInt(year), parseInt(month), 1).toISOString()
    
    expensesQuery = expensesQuery.gte('created_at', startDate).lt('created_at', endDate)
    driverExpensesQuery = driverExpensesQuery.gte('created_at', startDate).lt('created_at', endDate)
  }

  const { data: expenses } = await expensesQuery
  const { data: driverExpenses } = await driverExpensesQuery

  const { data: suppliers } = await supabase.from('suppliers').select('id, company_name')
  const { data: drivers } = await supabase.from('profiles').select('id, full_name, balance').eq('role', 'chofer')

  const mergedExpenses = [
    ...(expenses || []).map(e => ({
       id: e.id,
       date: e.created_at,
       type: 'company_expense',
       category: e.category,
       description: e.description,
       supplier: e.suppliers?.company_name || null,
       driver: e.profiles?.full_name || null,
       payment_method: e.payment_method,
       amount: e.amount
    })),
    ...(driverExpenses || []).map(e => ({
       id: e.id,
       date: e.created_at,
       type: 'trip_expense',
       category: e.category,
       description: `Ticket Viaje: ${e.description}`,
       supplier: e.ocr_data?.proveedor || null,
       driver: e.profiles?.full_name || null,
       payment_method: 'Saldado (Chofer)',
       amount: e.amount
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Prepare data for Excel
  const excelData = mergedExpenses.map(exp => ({
    Fecha: new Date(exp.date).toLocaleDateString(),
    Tipo: exp.type === 'company_expense' ? 'Gasto Empresa' : 'Gasto Chofer/Viaje',
    Categoría: exp.category.replace('_', ' ').toUpperCase(),
    Descripción: exp.description,
    Proveedor: exp.supplier || '-',
    Chofer: exp.driver || '-',
    'Forma de Pago': exp.payment_method.replace('_', ' ').toUpperCase(),
    Monto: exp.amount
  }))

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">Egresos y Sueldos</h2>
          <p className="text-muted-foreground font-medium mt-1">Gestión de gastos operativos, proveedores y liquidación de choferes.</p>
        </div>
        <CompanyExpenseForm suppliers={suppliers || []} drivers={drivers || []} />
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 p-4 flex flex-wrap gap-4 items-end justify-between">
        <form action="/dashboard/company-expenses" className="flex gap-2 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Filtrar por Mes</label>
            <input type="month" name="month" defaultValue={filterMonth} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm block" />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9">Filtrar</Button>
          {filterMonth && (
            <Button type="button" variant="ghost" size="sm" className="h-9" asChild>
              <a href="/dashboard/company-expenses">Limpiar</a>
            </Button>
          )}
        </form>
        <ExportExcelButton data={excelData} filename={`Egresos_${filterMonth || 'Total'}`} />
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
          <UserRound className="h-4 w-4" /> Saldos de Choferes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {drivers?.map(d => (
            <Card key={d.id} className="bg-card/40 backdrop-blur-xl border-border/40 shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">{d.full_name}</p>
                  <div className={`text-xl font-black mt-1 ${
                    (d.balance || 0) < 0 ? 'text-red-500' : (d.balance || 0) > 0 ? 'text-emerald-500' : 'text-foreground'
                  }`}>
                    ${(d.balance || 0).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {(d.balance || 0) < 0 ? 'Le debemos al chofer' : (d.balance || 0) > 0 ? 'El chofer tiene a favor' : 'Cuenta al día'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  (d.balance || 0) < 0 ? 'bg-red-500/10 text-red-500' : (d.balance || 0) > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                }`}>
                  <Wallet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-lg font-bold text-foreground/90">Historial de Egresos Consolidado</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Fecha</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Categoría</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Descripción / Entidad</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Forma de Pago</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Monto</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedExpenses.length > 0 ? (
                mergedExpenses.map((exp) => (
                  <TableRow key={`${exp.type}-${exp.id}`} className="border-border/40 hover:bg-muted/30 transition-colors group">
                    <TableCell className="text-muted-foreground font-medium">
                      {new Date(exp.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                        exp.type === 'trip_expense' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-muted text-muted-foreground border-border/50'
                      }`}>
                        {exp.category.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground/90">{exp.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {exp.supplier ? `Prov: ${exp.supplier} ` : ''}
                        {exp.driver ? `Chofer: ${exp.driver}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <Banknote className="h-3 w-3" /> {exp.payment_method.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-500">
                      ${exp.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {exp.type === 'company_expense' ? (
                        <form action={async () => {
                          'use server'
                          const { deleteCompanyExpense } = await import('@/app/actions/companyExpenses')
                          await deleteCompanyExpense(exp.id)
                        }}>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            Anular
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Gasto de Viaje</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground/80 font-medium">
                    No hay egresos registrados.
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
