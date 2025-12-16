import { signOut } from '../actions'

export async function GET() {
    await signOut()
}

