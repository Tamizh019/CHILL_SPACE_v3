import { NextResponse } from 'next/server'
// The client you created in Step 2
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL after successful sign in
    const next = searchParams.get('next') ?? '/home'

    if (code) {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && session) {
            // Check if user has a username / is onboarded
            const { data: profile } = await supabase
                .from('users')
                .select('username')
                .eq('id', session.user.id)
                .single()

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            // If no profile or no username, redirect to onboarding
            if (!profile || !profile.username) {
                if (isLocalEnv) {
                    return NextResponse.redirect(`${origin}/onboarding`)
                } else if (forwardedHost) {
                    return NextResponse.redirect(`https://${forwardedHost}/onboarding`)
                } else {
                    return NextResponse.redirect(`${origin}/onboarding`)
                }
            }

            // Normal redirection
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
