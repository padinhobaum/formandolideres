import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { ClimateReminderEmail, type ClimateReminderType } from '../_shared/transactional-email-templates/climate-reminder.tsx'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/brevo'
const APP_URL = 'https://app.formandolideres.org'
const SUBJECTS: Record<ClimateReminderType, string> = {
  monday: 'Clima da Turma liberado — participe nesta semana',
  friday: 'Lembrete: responda o Clima da Turma',
  sunday: 'Último dia para responder o Clima da Turma',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    const brevoKey = Deno.env.get('BREVO_API_KEY')
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!apiKey || !brevoKey || !url || !serviceKey) return json({ error: 'Server configuration unavailable' }, 500)

    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {})
    const reminderType = ({ Mon: 'monday', Fri: 'friday', Sun: 'sunday' } as Record<string, ClimateReminderType>)[parts.weekday]
    if (!reminderType || parts.hour !== '12') return json({ skipped: true, reason: 'outside_schedule' }, 200)

    const localDate = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`)
    const day = localDate.getUTCDay()
    localDate.setUTCDate(localDate.getUTCDate() + (day === 0 ? -6 : 1 - day))
    const weekStart = localDate.toISOString().slice(0, 10)
    const admin = createClient(url, serviceKey)
    const [{ data: leaders }, { data: responses }, { data: sentRows }] = await Promise.all([
      admin.from('user_roles').select('user_id').eq('role', 'leader'),
      admin.from('class_climate_responses').select('user_id').eq('week_start', weekStart),
      admin.from('climate_email_deliveries').select('user_id').eq('week_start', weekStart).eq('reminder_type', reminderType),
    ])

    const responded = new Set((responses ?? []).map((row) => row.user_id))
    const alreadySent = new Set((sentRows ?? []).map((row) => row.user_id))
    const leaderIds = (leaders ?? []).map((row) => row.user_id).filter((id) => !responded.has(id) && !alreadySent.has(id))
    if (leaderIds.length === 0) return json({ sent: 0, skipped: 0 }, 200)

    const { data: profiles } = await admin.from('profiles').select('user_id, full_name').in('user_id', leaderIds)
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.full_name]))
    let sent = 0
    let skipped = 0

    for (const userId of leaderIds) {
      const { data: authData } = await admin.auth.admin.getUserById(userId)
      const email = authData.user?.email
      if (!email) { skipped += 1; continue }
      const htmlContent = await renderAsync(React.createElement(ClimateReminderEmail, {
        name: profileMap.get(userId) ?? 'Líder', reminderType, climateUrl: APP_URL,
      }))
      const response = await fetch(`${GATEWAY_URL}/smtp/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'X-Connection-Api-Key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'Formando Líderes', email: 'noreply@app.formandolideres.org' },
          to: [{ email, name: profileMap.get(userId) ?? 'Líder' }],
          subject: SUBJECTS[reminderType],
          htmlContent,
          tags: ['clima-da-turma', reminderType],
          headers: { 'idempotency-key': `climate-${reminderType}-${weekStart}-${userId}` },
        }),
      })
      if (!response.ok) {
        const details = await response.text()
        console.error(`Brevo send failed [${response.status}]: ${details}`)
        skipped += 1
        continue
      }
      const { error: deliveryError } = await admin.from('climate_email_deliveries').insert({ user_id: userId, week_start: weekStart, reminder_type: reminderType })
      if (deliveryError && deliveryError.code !== '23505') console.error('Delivery log failed', deliveryError)
      sent += 1
    }
    return json({ sent, skipped }, 200)
  } catch (error) {
    console.error('send-climate-reminders error', error)
    return json({ error: 'Unable to process reminders' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}