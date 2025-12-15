import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/data-access/auth'
import { AuthCallback } from './auth-callback'

export default async function CallbackPage() {
    const user = await getCurrentUser()

    if (user) {
        redirect('/')
    }

    return <AuthCallback />
}

