"use client"

import { useState } from "react"
import type { GameScreen } from "@/app/page"
import { useTranslation } from "@/app/page"
import { Sparkles, Trophy, Settings, Store, Play, CalendarDays, User } from "lucide-react"

interface MainMenuProps {
  highScore: number
  gold: number
  onNavigate: (screen: GameScreen) => void
  isFirstTime?: boolean
  onFirstTimeComplete?: () => void
  playerName?: string
  onPlayerNameChange?: (name: string) => void
}

const ADMIN_PASSWORD = "blockblast2024"

export default function MainMenu({
  highScore,
  gold,
  onNavigate,
  isFirstTime,
  onFirstTimeComplete,
  playerName,
  onPlayerNameChange,
}: MainMenuProps) {
  const { t } = useTranslation()
  const [tapCount, setTapCount] = useState(0)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [tempName, setTempName] = useState(playerName || "")

  const handleTitleTap = () => {
    const newCount = tapCount + 1
    setTapCount(newCount)

    if (newCount >= 5) {
      setShowAdminLogin(true)
      setTapCount(0)
    }

    setTimeout(() => setTapCount(0), 2000)
  }

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setShowAdminLogin(false)
      setAdminPassword("")
      setPasswordError(false)
      onNavigate("admin")
    } else {
      setPasswordError(true)
    }
  }

  const handleNameSave = () => {
    if (tempName.trim() && onPlayerNameChange) {
      onPlayerNameChange(tempName.trim())
    }
    setShowNameInput(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 mx-4 text-center border border-white/20 shadow-2xl max-w-sm w-full">
            <h2 className="text-xl sm:text-2xl font-black text-white mb-4">{t("adminPanel")}</h2>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value)
                setPasswordError(false)
              }}
              placeholder="..."
              className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${passwordError ? "border-red-500" : "border-white/20"} text-white placeholder-white/50 mb-2 outline-none focus:border-purple-500`}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            />
            {passwordError && <p className="text-red-400 text-sm mb-2">{t("error")}!</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAdminLogin(false)
                  setAdminPassword("")
                  setPasswordError(false)
                }}
                className="flex-1 bg-white/10 text-white font-bold py-3 px-4 rounded-xl hover:bg-white/20 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleAdminLogin}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-xl hover:scale-105 transition-transform"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Name Input Modal */}
      {showNameInput && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl p-6 mx-4 text-center border border-white/20 shadow-2xl max-w-sm w-full">
            <User className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <h2 className="text-xl sm:text-2xl font-black text-white mb-4">Player Name</h2>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={15}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 mb-4 outline-none focus:border-cyan-500 text-center"
              onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNameInput(false)}
                className="flex-1 bg-white/10 text-white font-bold py-3 px-4 rounded-xl hover:bg-white/20 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleNameSave}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 px-4 rounded-xl hover:scale-105 transition-transform"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFirstTime && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-6 mx-4 text-center border border-white/20 shadow-2xl max-w-sm w-full">
            <div className="text-5xl sm:text-6xl mb-4">🎁</div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">{t("welcomeTitle")}</h2>
            <p className="text-white/70 mb-4 text-sm sm:text-base">{t("welcomeDesc")}</p>
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="bg-white/10 rounded-xl p-2">
                <span className="text-xl">💣</span>
                <p className="text-white/70 text-xs sm:text-sm">{t("miniBomb")} x1</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <span className="text-xl">💥</span>
                <p className="text-white/70 text-xs sm:text-sm">{t("standardBomb")} x1</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <span className="text-xl">✏️</span>
                <p className="text-white/70 text-xs sm:text-sm">{t("eraser")} x1</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <span className="text-xl">🔄</span>
                <p className="text-white/70 text-xs sm:text-sm">{t("boardRefresh")} x1</p>
              </div>
            </div>
            <button
              onClick={onFirstTimeComplete}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
            >
              {t("startPlaying")}
            </button>
          </div>
        </div>
      )}

      {/* Gold Display */}
      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-amber-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 shadow-lg">
        <span className="text-xl sm:text-2xl">💰</span>
        <span className="text-white font-bold text-base sm:text-lg">{gold.toLocaleString()}</span>
      </div>

      {/* Player Name */}
      <button
        onClick={() => setShowNameInput(true)}
        className="absolute top-4 left-4 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-colors"
      >
        <User className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
        <span className="text-white font-medium text-sm sm:text-base truncate max-w-[100px]">
          {playerName || "Player"}
        </span>
      </button>

      {/* Title */}
      <div className="text-center mb-6 sm:mb-8 mt-8" onClick={handleTitleTap}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-1 sm:mb-2 drop-shadow-lg select-none cursor-pointer">
          BLOCK
        </h1>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-lg select-none cursor-pointer">
          BLAST
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
          <span className="text-white/80 text-base sm:text-lg">Puzzle Game</span>
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
        </div>
      </div>

      {/* High Score */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 border border-white/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <span className="text-white/70 text-sm sm:text-base">{t("highScore")}:</span>
          <span className="text-white font-bold text-lg sm:text-xl">{highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs sm:max-w-sm lg:max-w-md">
        <button
          onClick={() => onNavigate("game")}
          className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Play className="w-5 h-5 sm:w-6 sm:h-6" fill="white" />
            <span>{t("play")}</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("tasks")}
          className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>{t("dailyTasks")}</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("store")}
          className="group relative bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>{t("store")}</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("scores")}
          className="group relative bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white font-bold text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>{t("scores")}</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("settings")}
          className="group relative bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>{t("settings")}</span>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 sm:bottom-4 text-white/40 text-xs sm:text-sm">Block Blast v1.0</div>
    </div>
  )
}
