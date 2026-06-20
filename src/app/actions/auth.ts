'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(data: { email: string; password: string }) {
  const supabase = await createClient()

  // Si ingresan "Transporte2026", lo transformamos internamente al correo que está en la base de datos
  // Si ingresan cualquier otro usuario sin @, le agregamos @sendacmr.com
  let loginInput = data.email.trim();
  let loginEmail = loginInput;

  const isUsernameLogin = !loginInput.includes('@') && loginInput.toLowerCase() !== 'transporte2026';

  if (isUsernameLogin) {
    // Verificación ESTRICTA de mayúsculas/minúsculas consultando el perfil real
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', loginInput)
      .single();

    if (!profile) {
      return { error: 'Credenciales inválidas. Por favor, respete exactamente las mayúsculas y minúsculas de su usuario.' }
    }

    loginEmail = `${loginInput}@sendacmr.com`;
  } else if (loginInput.toLowerCase() === 'transporte2026') {
    loginEmail = 'transporte2026@admin.com';
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
