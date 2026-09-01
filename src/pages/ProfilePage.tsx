import { Building2, Mail, Shield, UserRound } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useAuth } from '../context/useAuth'

const roleName = { client: 'Cliente', technician: 'Técnico', admin: 'Administrador' }
export function ProfilePage() { const { profile }=useAuth(); return <><PageHeader eyebrow="Conta" title="Meu perfil" description="Informações de identidade e autorização do usuário autenticado."/><Card className="max-w-2xl"><div className="grid gap-4 sm:grid-cols-2">{[[UserRound,'Nome',profile?.full_name],[Mail,'E-mail',profile?.email],[Shield,'Perfil de acesso',profile ? roleName[profile.role] : '—'],[Building2,'Empresa vinculada',profile?.company_id ?? (profile?.role==='client'?'Não vinculada':'Acesso de equipe')]].map(([Icon,label,value])=>{const C=Icon as typeof UserRound;return <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4"><C className="h-4 w-4 text-indigo-300"/><div className="mt-3 text-xs uppercase tracking-wider text-slate-600">{String(label)}</div><div className="mt-1 break-all text-sm font-semibold text-slate-200">{String(value ?? '—')}</div></div>})}</div></Card></> }
