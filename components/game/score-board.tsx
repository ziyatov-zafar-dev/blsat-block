"use client"

import { ArrowLeft, Trophy, Medal } from "lucide-react"
import type { ScoreEntry } from "@/app/page"

interface ScoreBoardProps {
  scores: ScoreEntry[]
  onBack: () => void
}

export default function ScoreBoard({ scores, onBack }: ScoreBoardProps) {
  const getMedal = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return null
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Skor Tablosu
        </h1>
      </div>

      {/* Scores List */}
      <div className="flex-1 overflow-y-auto">
        {scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/50">
            <Medal className="w-16 h-16 mb-4" />
            <p className="text-lg">Henüz skor yok!</p>
            <p className="text-sm">Oynamaya başla ve ilk skorunu kaydet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((entry, index) => (
              <div
                key={index}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${
                    index < 3
                      ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
                      : "bg-white/5 border-white/10"
                  }
                `}
              >
                <div className="w-10 text-center">
                  {getMedal(index) || <span className="text-white/50 font-bold">{index + 1}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-xl">{entry.score.toLocaleString()}</p>
                  <p className="text-white/50 text-sm">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
