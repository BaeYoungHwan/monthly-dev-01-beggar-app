import { getProfileSettings } from '@/app/actions/settings'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const initial = await getProfileSettings()
  return <SettingsForm initial={initial} />
}
