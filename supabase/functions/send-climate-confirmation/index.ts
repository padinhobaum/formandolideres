import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const BodySchema = z.object({ responseId: z.string().uuid() })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)
    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anonKey || !serviceKey) return json({ error: 'Server configuration unavailable' }, 500)

    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user?.email) return json({ error: 'Unauthorized' }, 401)
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)

    const admin = createClient(url, serviceKey)
    const { data: response } = await admin.from('class_climate_responses')
      .select('id, user_id, class_name').eq('id', parsed.data.responseId).eq('user_id', user.id).maybeSingle()
    if (!response) return json({ error: 'Response not found' }, 404)
    const { data: profile } = await admin.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle()
    const result = await sendTemplateEmail('climate-confirmation', user.email, {
      templateData: { name: profile?.full_name ?? 'Líder', className: response.class_name },
      idempotencyKey: `climate-confirmation-${response.id}`,
    })
    return json(result, 200)
  } catch (error) {
    console.error('send-climate-confirmation error', error)
    return json({ error: 'Unable to send confirmation' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}