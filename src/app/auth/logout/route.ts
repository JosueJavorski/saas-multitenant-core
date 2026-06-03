import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Sign out the user
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.auth.signOut()
  }

  // Redirect to login page
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 303, // 303 redirect works best after POST requests in forms
  })
}
