const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lxapudhqvkjpacwtlnsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YXB1ZGhxdmtqcGFjd3RsbnN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQwMzAxNCwiZXhwIjoyMDk2OTc5MDE0fQ.OhuFT1j86IXiDTfdVWRrFAVxQY8Gc1XNoX1Z_cWOSew'
)

async function checkSchema() {
  const { data, error } = await supabase.from('sales').select('*').limit(1)
  if (error) console.error(error)
  else console.log(Object.keys(data[0] || {}))
}

checkSchema()
