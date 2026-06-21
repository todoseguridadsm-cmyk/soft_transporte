import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Building2, Users, Save, UserPlus } from 'lucide-react'
import { updateCompanySettings, createPartner } from '@/app/actions/company'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function CompanyPage() {
  const supabase = await createClient()

  const { data: companySettingsArray } = await supabase.from('company_settings').select('*').limit(1)
  const company = companySettingsArray && companySettingsArray.length > 0 ? companySettingsArray[0] : null
  
  const { data: partners } = await supabase.from('partners').select('*').order('created_at')

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">Mi Empresa</h2>
        <p className="text-muted-foreground font-medium mt-1">Configuración general y gestión de socios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Company Settings Form */}
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-bold">Datos de Facturación</CardTitle>
                <CardDescription>Esta información aparecerá en los PDFs y recibos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={updateCompanySettings} className="space-y-4">
              <input type="hidden" name="id" value={company?.id || ''} />
              
              <div className="space-y-2">
                <Label>Razón Social <span className="text-destructive">*</span></Label>
                <Input name="company_name" required defaultValue={company?.company_name || ''} placeholder="Ej: Transportes del Sur S.R.L." className="bg-background/50" />
              </div>
              
              <div className="space-y-2">
                <Label>Nombre de Fantasía</Label>
                <Input name="fantasy_name" defaultValue={company?.fantasy_name || ''} placeholder="Ej: Transur" className="bg-background/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CUIT</Label>
                  <Input name="cuit" defaultValue={company?.cuit || ''} placeholder="Ej: 30-12345678-9" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input name="phone" defaultValue={company?.phone || ''} placeholder="Ej: +54 9 11 1234-5678" className="bg-background/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección Fiscal</Label>
                <Input name="address" defaultValue={company?.address || ''} placeholder="Ej: Av. Siempreviva 742, CABA" className="bg-background/50" />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" name="email" defaultValue={company?.email || ''} placeholder="Ej: administracion@transur.com" className="bg-background/50" />
              </div>

              <Button type="submit" className="w-full gap-2 mt-4">
                <Save className="h-4 w-4" /> Guardar Datos
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Partners Management */}
        <div className="space-y-8">
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg font-bold">Agregar Nuevo Socio</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={createPartner} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Completo <span className="text-destructive">*</span></Label>
                  <Input name="full_name" required placeholder="Ej: Juan Pérez" className="bg-background/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>DNI / CUIT</Label>
                    <Input name="dni_cuit" placeholder="Opcional" className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>% Participación</Label>
                    <Input type="number" step="0.01" name="share_percentage" placeholder="Ej: 50.00" className="bg-background/50" />
                  </div>
                </div>
                <Button type="submit" variant="secondary" className="w-full gap-2">
                  <UserPlus className="h-4 w-4" /> Agregar Socio
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle className="text-lg font-bold">Listado de Socios</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead>Nombre</TableHead>
                    <TableHead>DNI/CUIT</TableHead>
                    <TableHead className="text-right">Participación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners && partners.length > 0 ? (
                    partners.map((partner) => (
                      <TableRow key={partner.id} className="border-border/40">
                        <TableCell className="font-bold text-foreground/90">{partner.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{partner.dni_cuit || '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{partner.share_percentage}%</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No hay socios registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
