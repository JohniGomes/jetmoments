import { Sparkles } from 'lucide-react'

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="glass rounded-3xl p-12 border border-pink-500/15 max-w-sm w-full">
        <Sparkles className="w-10 h-10 text-pink-400 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(247,37,133,0.6)]" />
        <h2 className="text-xl font-black gradient-text">{title}</h2>
        <p className="text-white/30 mt-3 text-sm">Em construção ♡<br />Em breve por aqui</p>
        <div className="mt-6 h-1 rounded-full overflow-hidden bg-white/5">
          <div className="h-full w-1/3 rounded-full" style={{background:'linear-gradient(90deg,#f72585,#7209b7)'}} />
        </div>
      </div>
    </div>
  )
}
