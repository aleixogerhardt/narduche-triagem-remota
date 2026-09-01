import { motion } from 'motion/react'

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3">
    <motion.div initial={{ rotate: -8, scale: .92 }} animate={{ rotate: 0, scale: 1 }} className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-950/40">
      <span className="text-lg font-black italic text-white">N</span>
      <span className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-white/20 blur-sm" />
    </motion.div>
    {!compact && <div><div className="text-base font-black tracking-[.06em] text-white">NARDUCHE</div><div className="text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">Triagem Remota</div></div>}
  </div>
}
