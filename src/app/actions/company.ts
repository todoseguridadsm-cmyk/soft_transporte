'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCompanySettings(formData: FormData) {
  try {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const company_name = formData.get('company_name') as string
    const fantasy_name = formData.get('fantasy_name') as string
    const cuit = formData.get('cuit') as string
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const postal_code = formData.get('postal_code') as string
    const city = formData.get('city') as string
    const province = formData.get('province') as string

    if (id) {
      const { error } = await supabase
        .from('company_settings')
        .update({ company_name, fantasy_name, cuit, address, phone, email, postal_code, city, province })
        .eq('id', id)

      if (error) return { error: error.message }
    } else {
      const { error } = await supabase
        .from('company_settings')
        .insert([{ company_name, fantasy_name, cuit, address, phone, email, postal_code, city, province }])

      if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/company')
    return { success: true }
  } catch (err: any) {
    console.error("Crash in updateCompanySettings:", err)
    return { error: 'Server exception: ' + (err.message || String(err)) }
  }
}

export async function createPartner(formData: FormData) {
  const supabase = await createClient()

  const full_name = formData.get('full_name') as string
  const dni_cuit = formData.get('dni_cuit') as string
  const share_percentage = parseFloat(formData.get('share_percentage') as string) || 0

  const { error } = await supabase
    .from('partners')
    .insert([{ full_name, dni_cuit, share_percentage }])

  if (error) return { error: error.message }

  revalidatePath('/dashboard/company')
  return { success: true }
}

export async function createPartnerTransaction(formData: FormData) {
  const supabase = await createClient()

  const partner_id = formData.get('partner_id') as string
  const type = formData.get('type') as string
  const amount = parseFloat(formData.get('amount') as string) || 0
  const description = formData.get('description') as string

  const { error } = await supabase
    .from('partner_transactions')
    .insert([{ partner_id, type, amount, description }])

  if (error) return { error: error.message }

  revalidatePath('/dashboard/partners-wallet')
  return { success: true }
}
