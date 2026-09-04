import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  const users = [
    {
      email: 'ciso@quantifysec.demo',
      password: 'DemoPass123!',
      role: 'ciso',
    },
    {
      email: 'cfo@quantifysec.demo',
      password: 'DemoPass123!',
      role: 'cfo',
    },
  ]

  for (const u of users) {
    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        app_metadata: { role: u.role },
      })

    if (error) {
      console.error(`Failed for ${u.email}:`, error.message)
    } else {
      console.log(
        `Created ${u.email} with role ${u.role}, id: ${data.user.id}`
      )
    }
  }
}

seed()