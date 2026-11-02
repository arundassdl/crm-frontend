// R64 (doc 68): the legacy SDL screen is retired; users and roles are managed in one place.
import { redirect } from 'next/navigation'

export default function LegacyRedirect(): never {
  redirect('/user/users')
}
