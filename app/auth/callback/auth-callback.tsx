'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthCallback() {
    const router = useRouter()

    React.useEffect(() => {
        const handleAuthCallback = async () => {
            const supabase = createClient()

            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                })

                if (error) {
                    console.error('Error setting session:', error)
                    router.push('/auth/login?error=Authentication failed')
                    return
                }
            }

            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (session) {
                router.push('/')
            } else {
                router.push('/auth/login?error=No valid session found')
            }
        }

        handleAuthCallback()
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Signing you in...</p>
            </div>
        </div>
    )
}

