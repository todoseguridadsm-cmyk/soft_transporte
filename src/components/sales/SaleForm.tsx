'use client'

import { useState } from 'react'
import { addSale } from '@/app/actions/sales'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Receipt, Banknote, Calendar } from 'lucide-react'

export function SaleForm({ clients, trips, defaultTripId, defaultClientId, trigger }: { clients: any[], trips: any[], defaultTripId?: string, defaultClientId?: string, trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [clientId, setClientId] = useState(defaultClientId || '')
  const [tripId, setTripId] = useState(defaultTripId || '')
  const [amount, setAmount] = useState('')
  const [ivaRate, setIvaRate] = useState('0.21') // Default 21%

  // Cálculos dinámicos
  const numAmount = parseFloat(amount) || 0
  const numIvaRate = parseFloat(ivaRate)
  const subtotal = numAmount / (1 + numIvaRate)
  const ivaAmount = numAmount - subtotal

  // Filtrar viajes del cliente seleccionado
  const clientTrips = trips.filter(t => !clientId || t.client_id === clientId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('payment_method', paymentMethod)
    if (tripId) {
      formData.set('trip_id', tripId)
    }

    const userNotes = formData.get('notes') as string
    const notesObj = {
      text: userNotes,
      iva_rate: numIvaRate,
      subtotal: subtotal,
      iva_amount: ivaAmount
    }
    formData.set('notes', JSON.stringify(notesObj))

    const result = await addSale(formData)
    
    setLoading(false)
    if (result.error) {
      alert(result.error)
    } else {
      alert(`Venta registrada exitosamente. Comprobante: ${result.voucher_number}`)
      setOpen(false)
      if (!defaultClientId) setClientId('')
      if (!defaultTripId) setTripId('')
      setPaymentMethod('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className="gap-2 shadow-lg hover:shadow-primary/20 transition-all bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" /> Facturar Viaje / Venta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Receipt className="h-6 w-6 text-blue-500" /> Registrar Venta
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Factura un viaje realizado a un cliente y define la condición de cobro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          
          <div className="space-y-3">
            <Label className="text-foreground/80 font-semibold">Cliente <span className="text-destructive">*</span></Label>
            <Select name="client_id" value={clientId} onValueChange={setClientId} required>
              <SelectTrigger className="bg-background/50 h-11">
                {clientId ? clients.find(c => c.id === clientId)?.company_name : <span className="text-muted-foreground">Seleccionar Cliente</span>}
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-foreground/80 font-semibold">Viaje Asociado (Opcional)</Label>
            <Select name="trip_id" value={tripId} onValueChange={setTripId}>
              <SelectTrigger className="bg-background/50 h-11">
                {tripId ? (() => {
                  const t = trips.find(x => x.id === tripId);
                  return t ? `${t.trip_code || 'S/C'} - ${t.origin} a ${t.destination}` : "Vincular a un Viaje"
                })() : <span className="text-muted-foreground">{clientTrips.length === 0 ? "No hay viajes para este cliente" : "Vincular a un Viaje"}</span>}
              </SelectTrigger>
              <SelectContent>
                {clientTrips.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.trip_code || 'S/C'} - {t.origin} a {t.destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-foreground/80 font-semibold">Total a Facturar ($) <span className="text-destructive">*</span></Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="bg-background/50 h-11 font-bold text-blue-500 text-lg" />
            </div>
            
            <div className="space-y-3">
              <Label className="text-foreground/80 font-semibold">Tipo de IVA <span className="text-destructive">*</span></Label>
              <Select value={ivaRate} onValueChange={setIvaRate} required>
                <SelectTrigger className="bg-background/50 h-11">
                  <SelectValue placeholder="IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.21">IVA 21%</SelectItem>
                  <SelectItem value="0.105">IVA 10.5%</SelectItem>
                  <SelectItem value="0">Exento (0%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50 flex justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground font-semibold">Subtotal Neto</span>
              <span className="font-bold text-foreground/80">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-muted-foreground font-semibold">IVA ({numIvaRate * 100}%)</span>
              <span className="font-bold text-foreground/80">${ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-foreground/80 font-semibold flex items-center gap-2"><Banknote className="h-4 w-4" /> Cobro <span className="text-destructive">*</span></Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
              <SelectTrigger className="bg-background/50 h-11">
                <SelectValue placeholder="¿Cómo paga?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contado">Contado / Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                <SelectItem value="cheque">Cheque (A Cobrar)</SelectItem>
                <SelectItem value="cuenta_corriente">Cuenta Corriente (Deuda)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-foreground/80 font-semibold">Observaciones</Label>
            <Input id="notes" name="notes" placeholder="Ej. Incluye IVA, peajes extra, etc." className="bg-background/50 h-11" />
          </div>

          {paymentMethod === 'cheque' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 animate-in fade-in zoom-in-95">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="bank_name" className="text-xs">Banco emisor</Label>
                <Input id="bank_name" name="bank_name" placeholder="Ej. Santander" required={paymentMethod === 'cheque'} className="h-9" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="check_number" className="text-xs">Número de Cheque</Label>
                <Input id="check_number" name="check_number" placeholder="Ej. 00012345" required={paymentMethod === 'cheque'} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_date" className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> F. Emisión</Label>
                <Input id="issue_date" name="issue_date" type="date" required={paymentMethod === 'cheque'} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> F. Cobro</Label>
                <Input id="due_date" name="due_date" type="date" required={paymentMethod === 'cheque'} className="h-9" />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-11 font-bold text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all mt-6" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirmar Venta y Generar Presupuesto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
