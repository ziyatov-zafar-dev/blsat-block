"use client"

import { useState } from "react"
import { ArrowLeft, Trophy, Medal, Globe, User } from "lucide-react"
import type { ScoreEntry, WorldScoreEntry } from "@/app/page"
import { useTranslation } from "@/app/page"
import { countries } from "@/lib/translations"

interface ScoreBoardProps {
  scores: ScoreEntry[]
  worldScores: WorldScoreEntry[]
  onBack: () => void
}

export default function ScoreBoard({ scores, worldScores, onBack }: ScoreBoardProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"world" | "my">("world")

  const getMedal = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return null
  }

  const getCountryFlag = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode)
    return country?.flag || "🌍"
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Header - Sabit */}
      <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-black/20">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
          {t("scoreBoard")}
        </h1>
      </div>

      {/* Tabs - Sabit */}
      <div className="flex-shrink-0 flex gap-2 px-3 sm:px-4 pb-3 sm:pb-4">
        <button
          onClick={() => setActiveTab("world")}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            activeTab === "world"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          {t("worldScores")}
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            activeTab === "my"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
          {t("myScores")}
        </button>
      </div>

      {/* Scores List - Scrollable */}
      <div
        className="flex-1 overflow-y-scroll overscroll-contain px-3 sm:px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="pb-8">
          {activeTab === "world" ? (
            worldScores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <Globe className="w-12 h-12 sm:w-16 sm:h-16 mb-4" />
                <p className="text-base sm:text-lg">{t("noScores")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {worldScores.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`
                      flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all
                      ${
                        index < 3
                          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
                          : "bg-white/5 border-white/10"
                      }
                    `}
                  >
                    <div className="w-8 sm:w-10 text-center text-lg sm:text-xl">
                      {getMedal(index) || (
                        <span className="text-white/50 font-bold text-sm sm:text-base">{index + 1}</span>
                      )}
                    </div>
                    <div className="text-xl sm:text-2xl">{getCountryFlag(entry.country)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-base sm:text-xl truncate">{entry.playerName}</p>
                      <p className="text-white/50 text-xs sm:text-sm">{new Date(entry.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-black text-base sm:text-xl">{entry.score.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/50">
              <Medal className="w-12 h-12 sm:w-16 sm:h-16 mb-4" />
              <p className="text-base sm:text-lg">{t("noScores")}</p>
              <p className="text-xs sm:text-sm">{t("startPlaying2")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((entry, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all
                    ${
                      index < 3
                        ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
                        : "bg-white/5 border-white/10"
                    }
                  `}
                >
                  <div className="w-8 sm:w-10 text-center text-lg sm:text-xl">
                    {getMedal(index) || (
                      <span className="text-white/50 font-bold text-sm sm:text-base">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base sm:text-xl">{entry.score.toLocaleString()}</p>
                    <p className="text-white/50 text-xs sm:text-sm">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
