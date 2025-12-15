import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/data-access/auth'
import { LoginForm } from './login-form'

export default async function LoginPage() {
    const user = await getCurrentUser()
    if (user) {
        redirect('/')
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to Sleak</h1>
                    <p className="text-muted-foreground mt-2">Sign in to analyze your sales conversations</p>
                </div>

                <LoginForm />

                <p className="text-muted-foreground text-center text-sm">
                    We&apos;ll send you a magic link to sign in without a password
                </p>
            </div>
        </div>
    )
}
