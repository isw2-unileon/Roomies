import { useAppMetadata } from '@/hooks/useAppMetadata'
import AppRouter from '@/routes/AppRouter'

export default function App() {
  useAppMetadata()

  return <AppRouter />
}
