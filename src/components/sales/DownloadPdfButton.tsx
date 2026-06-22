'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DownloadPdfButtonProps {
  sale: any
  company: any
}

export function DownloadPdfButton({ sale, company }: DownloadPdfButtonProps) {
  const generatePDF = () => {
    const doc = new jsPDF()
    
    const companyName = company?.company_name || 'Mi Empresa S.A.'
    const fantasyName = company?.fantasy_name || 'Transportes'
    const cuit = company?.cuit || 'CUIT NO REGISTRADO'
    const address = company?.address || ''
    const phone = company?.phone || ''
    
    // Header
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(fantasyName, 14, 20)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(companyName, 14, 28)
    doc.text(`CUIT: ${cuit}`, 14, 33)
    if (address) doc.text(address, 14, 38)
    if (phone) doc.text(`Tel: ${phone}`, 14, 43)

    // Recibo Box
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('RECIBO / COMPROBANTE', 130, 20)
    doc.setFontSize(12)
    doc.text(`N°: ${sale.voucher_number || 'S/N'}`, 130, 28)
    doc.setFont('helvetica', 'normal')
    doc.text(`Fecha: ${new Date(sale.created_at).toLocaleDateString()}`, 130, 34)

    doc.line(14, 48, 196, 48)

    // Client Info
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Datos del Cliente:', 14, 56)
    doc.setFont('helvetica', 'normal')
    const clientName = sale.clients?.company_name || 'Consumidor Final'
    const clientCuit = sale.clients?.cuit || 'S/N'
    doc.text(`Nombre/Razón Social: ${clientName}`, 14, 63)
    doc.text(`CUIT/DNI: ${clientCuit}`, 14, 69)

    // Trip Info if exists
    if (sale.trips) {
      doc.setFont('helvetica', 'bold')
      doc.text('Datos del Viaje:', 130, 56)
      doc.setFont('helvetica', 'normal')
      doc.text(`Código: ${sale.trips.trip_code}`, 130, 63)
      doc.text(`Ruta: ${sale.trips.origin} -> ${sale.trips.destination}`, 130, 69)
    }

    doc.line(14, 76, 196, 76)

    // Parse IVA from notes
    let subtotal = Number(sale.amount)
    let ivaAmount = 0
    let ivaRate = 0
    try {
      if (sale.notes && sale.notes.startsWith('{')) {
        const notesObj = JSON.parse(sale.notes)
        if (notesObj.subtotal !== undefined) {
          subtotal = notesObj.subtotal
          ivaAmount = notesObj.iva_amount
          ivaRate = notesObj.iva_rate
        }
      }
    } catch (e) {}

    // Detail Table
    autoTable(doc, {
      startY: 85,
      head: [['Concepto', 'Forma de Pago', 'Importe']],
      body: [
        [
          `Servicio de Transporte / Flete${sale.trips ? ` (Ref: ${sale.trips.trip_code})` : ''}`,
          sale.payment_method.replace('_', ' ').toUpperCase(),
          `$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' }
      }
    })

    // Totals
    let finalY = (doc as any).lastAutoTable.finalY || 120
    
    if (ivaAmount > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Subtotal: $${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY + 10, { align: 'right' })
      doc.text(`IVA (${ivaRate * 100}%): $${ivaAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY + 16, { align: 'right' })
      finalY += 12
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL RECIBIDO: $${Number(sale.amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY + 15, { align: 'right' })

    // Footer
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Documento no válido como factura. Recibo de uso interno/administrativo.', 105, 280, { align: 'center' })

    doc.save(`Recibo_${sale.voucher_number || 'S-N'}.pdf`)
  }

  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={generatePDF}>
      <Download className="h-3.5 w-3.5" /> PDF
    </Button>
  )
}
