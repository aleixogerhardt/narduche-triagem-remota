import { motion } from 'motion/react'
import { Building2, ClipboardList, Gauge, LogOut, Menu, Printer, UserRound, Wrench } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Brand } from './Brand'
import { cn, friendlyError } from '../lib/utils'
import { signOut } from '../services/api'
import { useAuth } from '../context/useAuth'

const navBase = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition'

export function AppLayout() {
  const { profile } = useAuth()
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()

  const links = [
    { to: '/', label: 'Visão geral', icon: Gauge, show: true },
    { to: '/triagem', label: 'Nova triagem', icon: Wrench, show: profile?.role === 'client' },
    { to: '/chamados', label: 'Chamados', icon: ClipboardList, show: true },
    { to: '/admin/empresas', label: 'Empresas', icon: Building2, show: profile?.role === 'admin' },
    { to: '/admin/equipamentos', label: 'Equipamentos', icon: Printer, show: profile?.role === 'admin' },
    { to: '/perfil', label: 'Perfil', icon: UserRound, show: true },
  ].filter(x => x.show)

  async function handleLogout() {
    try { await signOut() } catch (e) { toast.error(friendlyError(e)) }
  }

  const nav = <>{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileMenu(false)} className={({ isActive }) => cn(navBase, isActive ? 'bg-indigo-500/15 text-indigo-200 ring-1 ring-inset ring-indigo-400/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white')}><Icon className="h-4 w-4" />{label}</NavLink>)}</>

  return <div className="min-h-screen soft-grid">
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 border-y-0 border-l-0 lg:flex lg:flex-col">
      <div className="p-5"><Brand /></div>
      <nav className="flex-1 space-y-1 px-3">{nav}</nav>
      <div className="border-t border-slate-800/80 p-3">
        <div className="mb-2 rounded-xl bg-slate-950/35 px-3 py-3">
          <div className="truncate text-sm font-semibold text-slate-200">{profile?.full_name}</div>
          <div className="truncate text-xs text-slate-500">{profile?.email}</div>
        </div>
        <button onClick={handleLogout} className={cn(navBase, 'w-full text-slate-400 hover:bg-red-500/10 hover:text-red-200')}><LogOut className="h-4 w-4" />Sair</button>
      </div>
    </aside>

    <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between border-x-0 border-t-0 px-4 lg:hidden">
      <Brand compact />
      <button onClick={() => setMobileMenu(v => !v)} className="rounded-xl border border-slate-700 bg-slate-900/70 p-2.5 text-slate-200"><Menu className="h-5 w-5" /></button>
    </header>

    {mobileMenu && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass fixed left-3 right-3 top-20 z-40 rounded-2xl p-3 lg:hidden"><nav className="space-y-1">{nav}</nav><button onClick={handleLogout} className={cn(navBase, 'mt-2 w-full text-red-200 hover:bg-red-500/10')}><LogOut className="h-4 w-4" />Sair</button></motion.div>}

    <main className="pb-24 lg:ml-64 lg:pb-8">
      <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }} className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </motion.div>
    </main>

    <nav className="glass fixed inset-x-3 bottom-3 z-20 grid grid-cols-4 rounded-2xl p-1.5 lg:hidden">
      {links.slice(0, 4).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => cn('flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium', isActive ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-500')}><Icon className="h-4 w-4" /><span className="max-w-full truncate">{label}</span></NavLink>)}
    </nav>
  </div>
}
