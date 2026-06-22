import { SupabaseClient } from '@supabase/supabase-js'

export async function getAlertsCount(supabase: SupabaseClient): Promise<number> {
  let count = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Checks
  const { data: checks } = await supabase
    .from('checks')
    .select('due_date')
    .eq('status', 'pending')

  if (checks) {
    checks.forEach(chk => {
      const target = new Date(chk.due_date + 'T00:00:00')
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24))
      if (diffDays <= 7) count++
    })
  }

  // 2. Drivers
  const { data: drivers } = await supabase
    .from('profiles')
    .select('license_expiry')
    .eq('role', 'chofer')

  if (drivers) {
    drivers.forEach(driver => {
      if (driver.license_expiry) {
        const target = new Date(driver.license_expiry + 'T00:00:00')
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24))
        if (diffDays <= 45) count++
      }
    })
  }

  // 3. Vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('current_km, next_service_km, next_oil_change_date, next_oil_filter_change_km, next_oil_filter_change_date, next_air_filter_change_km, next_air_filter_change_date, next_gearbox_oil_change_km, next_gearbox_oil_change_date')

  if (vehicles) {
    vehicles.forEach(v => {
      const currentKm = v.current_km || 0

      const checkKm = (limit: number | null) => {
        if (!limit) return
        const diff = limit - currentKm
        if (diff <= 1000) count++
      }

      const checkDate = (limitDate: string | null) => {
        if (!limitDate) return
        const target = new Date(limitDate + 'T00:00:00')
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24))
        if (diffDays <= 10) count++
      }

      checkKm(v.next_service_km)
      checkDate(v.next_oil_change_date)
      checkKm(v.next_oil_filter_change_km)
      checkDate(v.next_oil_filter_change_date)
      checkKm(v.next_air_filter_change_km)
      checkDate(v.next_air_filter_change_date)
      checkKm(v.next_gearbox_oil_change_km)
      checkDate(v.next_gearbox_oil_change_date)
    })
  }

  return count
}
