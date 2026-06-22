'use client'

import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ExportExcelButtonProps {
  data: any[]
  filename: string
  sheetName?: string
  className?: string
}

export function ExportExcelButton({ data, filename, sheetName = 'Hoja 1', className }: ExportExcelButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    try {
      setLoading(true)
      // Import xlsx dynamically so it doesn't inflate the initial client bundle
      const XLSX = await import('xlsx')
      
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      
      XLSX.writeFile(workbook, `${filename}.xlsx`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Hubo un error al exportar a Excel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleExport} 
      disabled={loading || data.length === 0}
      variant="outline"
      size="sm"
      className={`gap-2 text-emerald-600 border-emerald-600/30 hover:bg-emerald-600/10 ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Exportar a Excel
    </Button>
  )
}
