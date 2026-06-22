'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function addVehicle(formData: FormData) {
  // Use Service Role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const plate = formData.get('plate') as string
  const brand = formData.get('brand') as string
  const model = formData.get('model') as string
  const yearStr = formData.get('year') as string
  const capacityStr = formData.get('capacity') as string

  const current_kmStr = formData.get('current_km') as string
  const next_service_kmStr = formData.get('next_service_km') as string
  const next_oil_change_date = formData.get('next_oil_change_date') as string
  const next_oil_filter_change_kmStr = formData.get('next_oil_filter_change_km') as string
  const next_oil_filter_change_date = formData.get('next_oil_filter_change_date') as string
  const next_air_filter_change_kmStr = formData.get('next_air_filter_change_km') as string
  const next_air_filter_change_date = formData.get('next_air_filter_change_date') as string
  const next_gearbox_oil_change_kmStr = formData.get('next_gearbox_oil_change_km') as string
  const next_gearbox_oil_change_date = formData.get('next_gearbox_oil_change_date') as string

  if (!plate || !brand || !model || !yearStr) {
    return { error: 'Por favor completa todos los campos requeridos.' }
  }

  const { error } = await supabase.from('vehicles').insert({
    plate: plate.toUpperCase(),
    brand,
    model,
    year: parseInt(yearStr, 10),
    capacity_kg: capacityStr ? parseInt(capacityStr, 10) : null,
    status: 'available',
    current_km: current_kmStr ? parseInt(current_kmStr, 10) : 0,
    next_service_km: next_service_kmStr ? parseInt(next_service_kmStr, 10) : null,
    next_oil_change_date: next_oil_change_date || null,
    next_oil_filter_change_km: next_oil_filter_change_kmStr ? parseInt(next_oil_filter_change_kmStr, 10) : null,
    next_oil_filter_change_date: next_oil_filter_change_date || null,
    next_air_filter_change_km: next_air_filter_change_kmStr ? parseInt(next_air_filter_change_kmStr, 10) : null,
    next_air_filter_change_date: next_air_filter_change_date || null,
    next_gearbox_oil_change_km: next_gearbox_oil_change_kmStr ? parseInt(next_gearbox_oil_change_kmStr, 10) : null,
    next_gearbox_oil_change_date: next_gearbox_oil_change_date || null
  })

  if (error) {
    console.error('Error adding vehicle:', error)
    return { error: 'Error al agregar el vehículo.' }
  }

  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/trips/new')
  return { success: true }
}

export async function deleteVehicle(vehicleId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
  
  if (error) {
    console.error('Error delete vehicle:', error)
    return { error: 'No se puede eliminar el vehículo, es probable que tenga viajes asignados.' }
  }

  revalidatePath('/dashboard/vehicles')
  return { success: true }
}

export async function deleteVehicleForm(formData: FormData) {
  const id = formData.get('id') as string;
  return deleteVehicle(id);
}

export async function updateVehicle(formData: FormData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const id = formData.get('id') as string
  const plate = formData.get('plate') as string
  const brand = formData.get('brand') as string
  const model = formData.get('model') as string
  const yearStr = formData.get('year') as string
  const capacityStr = formData.get('capacity') as string

  const current_kmStr = formData.get('current_km') as string
  const next_service_kmStr = formData.get('next_service_km') as string
  const next_oil_change_date = formData.get('next_oil_change_date') as string
  const next_oil_filter_change_kmStr = formData.get('next_oil_filter_change_km') as string
  const next_oil_filter_change_date = formData.get('next_oil_filter_change_date') as string
  const next_air_filter_change_kmStr = formData.get('next_air_filter_change_km') as string
  const next_air_filter_change_date = formData.get('next_air_filter_change_date') as string
  const next_gearbox_oil_change_kmStr = formData.get('next_gearbox_oil_change_km') as string
  const next_gearbox_oil_change_date = formData.get('next_gearbox_oil_change_date') as string

  if (!id || !plate || !brand || !model || !yearStr) {
    return { error: 'Por favor completa todos los campos requeridos.' }
  }

  const { error } = await supabase.from('vehicles').update({
    plate: plate.toUpperCase(),
    brand,
    model,
    year: parseInt(yearStr, 10),
    capacity_kg: capacityStr ? parseInt(capacityStr, 10) : null,
    current_km: current_kmStr ? parseInt(current_kmStr, 10) : 0,
    next_service_km: next_service_kmStr ? parseInt(next_service_kmStr, 10) : null,
    next_oil_change_date: next_oil_change_date || null,
    next_oil_filter_change_km: next_oil_filter_change_kmStr ? parseInt(next_oil_filter_change_kmStr, 10) : null,
    next_oil_filter_change_date: next_oil_filter_change_date || null,
    next_air_filter_change_km: next_air_filter_change_kmStr ? parseInt(next_air_filter_change_kmStr, 10) : null,
    next_air_filter_change_date: next_air_filter_change_date || null,
    next_gearbox_oil_change_km: next_gearbox_oil_change_kmStr ? parseInt(next_gearbox_oil_change_kmStr, 10) : null,
    next_gearbox_oil_change_date: next_gearbox_oil_change_date || null
  }).eq('id', id)

  if (error) {
    console.error('Error updating vehicle:', error)
    return { error: 'Error al actualizar el vehículo.' }
  }

  revalidatePath('/dashboard/vehicles')
  revalidatePath(`/dashboard/vehicles/${id}`)
  return { success: true }
}

export async function addMaintenanceLog(formData: FormData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const vehicle_id = formData.get('vehicle_id') as string
  const service_type = formData.get('service_type') as string
  const costStr = formData.get('cost') as string
  const km_at_serviceStr = formData.get('km_at_service') as string
  
  const update_field_km = formData.get('update_field_km') as string
  const new_limit_kmStr = formData.get('new_limit_km') as string
  
  const update_field_date = formData.get('update_field_date') as string
  const new_limit_date = formData.get('new_limit_date') as string

  if (!vehicle_id || !service_type || !costStr || !km_at_serviceStr) {
    return { error: 'Faltan campos obligatorios para el service.' }
  }

  const { error: logError } = await supabase.from('maintenance_logs').insert({
    vehicle_id,
    service_type,
    cost: parseFloat(costStr),
    km_at_service: parseInt(km_at_serviceStr, 10)
  })

  if (logError) {
    console.error('Error adding maintenance log:', logError)
    return { error: 'Error al registrar el service en el historial.' }
  }

  const updateData: any = {}
  if (update_field_km && new_limit_kmStr) {
    updateData[update_field_km] = parseInt(new_limit_kmStr, 10)
  }
  if (update_field_date && new_limit_date) {
    updateData[update_field_date] = new_limit_date
  }

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicle_id)
    
    if (updateError) {
      console.error('Error updating vehicle limits:', updateError)
      return { error: 'Service guardado, pero falló al actualizar los nuevos límites de mantenimiento.' }
    }
  }

  revalidatePath(`/dashboard/vehicles/${vehicle_id}`)
  revalidatePath('/dashboard/vehicles')
  return { success: true }
}

export async function deleteMaintenanceLogForm(formData: FormData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const id = formData.get('id') as string
  const vehicle_id = formData.get('vehicle_id') as string

  if (!id || !vehicle_id) return { error: 'ID requerido.' }

  const { error } = await supabase.from('maintenance_logs').delete().eq('id', id)

  if (error) {
    console.error('Error delete maintenance log:', error)
    return { error: 'Error al eliminar el service.' }
  }

  revalidatePath(`/dashboard/vehicles/${vehicle_id}`)
  return { success: true }
}
