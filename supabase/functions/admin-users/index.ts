import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// القيم الثابتة (غير سرية)
const SUPABASE_URL  = 'https://ojclpkenecicujkqhhlu.supabase.co'
const SUPABASE_ANON = 'sb_publishable_d6q8hoDDcohuZFHk3jxI7g_IBWWCmNu'
// السري يأتي من Environment Variables فقط
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ORG_ID           = 'ddc8abe7-518f-40a4-8c3b-ee03bb0f47d5'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ① تحقق من JWT المستخدم
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'غير مصرح' }, 401)

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'جلسة غير صالحة' }, 401)

    // ② تحقق من دور المستخدم في org_members
    const { data: member } = await userClient
      .from('org_members')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('org_id', ORG_ID)
      .single()

    if (!member?.is_active) return json({ error: 'الحساب موقوف' }, 403)

    const allowedRoles = ['platform_owner', 'super_admin', 'camp_delegate']
    if (!allowedRoles.includes(member.role)) return json({ error: 'صلاحية غير كافية' }, 403)

    // ③ نفّذ العملية بـ Service Key
    const body = await req.json()
    const { action } = body
    const adminUrl = `${SUPABASE_URL}/auth/v1/admin/users`
    const headers  = {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_SERVICE,
      'Authorization': `Bearer ${SUPABASE_SERVICE}`,
    }

    // قيود الدور:
    // camp_delegate لا يستطيع إنشاء super_admin
    if (member.role === 'camp_delegate') {
      if (action === 'create' && body.role !== 'assistant')
        return json({ error: 'المندوب يستطيع إنشاء مساعدين فقط' }, 403)
    }
    if (member.role === 'super_admin') {
      if (action === 'create' && !['camp_delegate','assistant'].includes(body.role))
        return json({ error: 'مدير الإيواء يستطيع إنشاء مناديب ومساعدين فقط' }, 403)
    }

    // ── إنشاء مستخدم ──
    if (action === 'create') {
      const { nationalId, phone, fullName } = body
      if (!nationalId || !phone || !fullName) return json({ error: 'بيانات ناقصة' }, 400)

      const res = await fetch(adminUrl, {
        method:  'POST',
        headers,
        body: JSON.stringify({
          email:          nationalId + '@c.co',
          password:       phone,
          email_confirm:  true,
          user_metadata:  { full_name: fullName },
        }),
      })
      const data = await res.json()
      if (!res.ok) return json({ error: data.message || 'فشل إنشاء الحساب' }, res.status)
      return json({ id: data.id })
    }

    // ── حذف مستخدم ──
    if (action === 'delete') {
      const { userId } = body
      if (!userId) return json({ error: 'userId مطلوب' }, 400)
      const res = await fetch(`${adminUrl}/${userId}`, { method: 'DELETE', headers })
      if (!res.ok) { const e = await res.json(); return json({ error: e.message }, res.status) }
      return json({ success: true })
    }

    // ── إعادة كلمة المرور ──
    if (action === 'reset_password') {
      const { userId, newPassword } = body
      if (!userId || !newPassword) return json({ error: 'بيانات ناقصة' }, 400)
      const res = await fetch(`${adminUrl}/${userId}`, {
        method:  'PUT',
        headers,
        body: JSON.stringify({ password: newPassword }),
      })
      if (!res.ok) { const e = await res.json(); return json({ error: e.message }, res.status) }
      return json({ success: true })
    }

    return json({ error: 'action غير معروف' }, 400)

  } catch (e) {
    return json({ error: e.message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
