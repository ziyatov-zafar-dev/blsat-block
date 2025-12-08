"use client"

import type { GameScreen } from "@/app/page"
import { Sparkles, Trophy, Settings, Store, Play } from "lucide-react"

interface MainMenuProps {
  highScore: number
  gold: number
  onNavigate: (screen: GameScreen) => void
}

export default function MainMenu({ highScore, gold, onNavigate }: MainMenuProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Gold Display */}
      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
        <span className="text-2xl">💰</span>
        <span className="text-white font-bold text-lg">{gold.toLocaleString()}</span>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2 drop-shadow-lg">
          BLOCK
        </h1>
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-lg">
          BLAST
        </h1>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          <span className="text-white/80 text-lg">Puzzle Game</span>
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
      </div>

      {/* High Score */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 mb-8 border border-white/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-white/70">En Yüksek Skor:</span>
          <span className="text-white font-bold text-xl">{highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onNavigate("game")}
          className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-3">
            <Play className="w-6 h-6" fill="white" />
            <span>OYNA</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("store")}
          className="group relative bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-3">
            <Store className="w-6 h-6" />
            <span>MAĞAZA</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("scores")}
          className="group relative bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-6 h-6" />
            <span>SKOR TABLOSU</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("settings")}
          className="group relative bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-3">
            <Settings className="w-6 h-6" />
            <span>AYARLAR</span>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-white/40 text-sm">Block Blast v1.0</div>
    </div>
  )
}
