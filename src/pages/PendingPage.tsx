import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, LogOut } from 'lucide-react'
import { toast } from 'sonner'

import { signOut } from '../services/api'
import { Brand } from '../components/Brand'
import { Button, Card } from '../components/ui'

export function PendingPage() {
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)

  async function handleLogout() {
    if (leaving) return

    try {
      setLeaving(true)

      await signOut()

      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Erro ao sair:', error)

      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível encerrar a sessão.'
      )
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-lg text-center">
        <div className="mx-auto flex justify-center">
          <Brand />
        </div>

        <div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Clock3 className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-white">
          Conta aguardando ativação
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-400">
          Sua conta existe no Auth, mas ainda precisa ser ativada e vinculada
          corretamente a uma empresa ou perfil de equipe.
        </p>

        <Button
          type="button"
          className="mt-6"
          onClick={handleLogout}
          disabled={leaving}
        >
          <LogOut className="h-4 w-4" />

          {leaving ? 'Saindo...' : 'Sair'}
        </Button>
      </Card>
    </div>
  )
}