import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'motion/react'
import { ArrowRight, Database, ShieldCheck, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Brand } from '../components/Brand'
import { Button, Input, Label } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'
import { friendlyError } from '../lib/utils'
import { signIn } from '../services/api'

const schema = z.object({ email: z.string().email('Informe um e-mail válido.'), password: z.string().min(6, 'A senha deve possuir pelo menos 6 caracteres.') })
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })
  if (session) return <Navigate to="/" replace />
  if (!isSupabaseConfigured) return <Navigate to="/configuracao" replace />

  async function submit(values: FormData) {
    try {
      await signIn(values.email, values.password)
      toast.success('Acesso autorizado.')
      navigate('/')
    } catch (e) { toast.error(friendlyError(e)) }
  }

  return <div className="min-h-screen p-4 sm:p-6 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:gap-6">
    <motion.section initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="relative hidden overflow-hidden rounded-3xl border border-indigo-400/15 bg-gradient-to-br from-indigo-600/20 via-slate-950/70 to-cyan-500/10 p-10 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 soft-grid opacity-70" />
      <div className="relative"><Brand /><div className="mt-16 max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-xs font-semibold text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Suporte inteligente e rastreável</div><h1 className="text-5xl font-black leading-[1.04] tracking-tight text-white">Diagnóstico primeiro.<br/><span className="text-gradient">Deslocamento só quando necessário.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300/80">Triagem guiada para impressoras, coleta de evidências e chamados com contexto técnico desde o primeiro contato.</p></div></div>
      <div className="relative grid grid-cols-3 gap-3">{[[ShieldCheck,'RLS','Autorização no banco'],[Database,'PostgreSQL','Dados centralizados'],[Sparkles,'Mobile First','Experiência responsiva']].map(([Icon,title,desc]) => { const C=Icon as typeof ShieldCheck; return <div key={String(title)} className="rounded-2xl border border-white/8 bg-white/5 p-4"><C className="mb-4 h-5 w-5 text-indigo-300"/><div className="text-sm font-bold text-white">{String(title)}</div><div className="mt-1 text-xs text-slate-500">{String(desc)}</div></div>})}</div>
    </motion.section>

    <section className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="lg:hidden"><Brand /></div>
        <div className="mt-10 lg:mt-0"><div className="text-xs font-bold uppercase tracking-[.18em] text-indigo-300">Acesso seguro</div><h2 className="mt-2 text-3xl font-bold text-white">Entrar na Narduche</h2><p className="mt-2 text-sm leading-6 text-slate-400">Use sua conta cadastrada no Supabase Auth.</p></div>
        <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-4">
          <div><Label>E-mail</Label><Input autoComplete="email" placeholder="voce@empresa.com" {...register('email')} />{errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}</div>
          <div><Label>Senha</Label><Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />{errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}</div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : <>Entrar <ArrowRight className="h-4 w-4" /></>}</Button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-slate-600">A autenticação é processada pelo Supabase Auth. A aplicação não armazena senhas.</p>
      </motion.div>
    </section>
  </div>
}
