"use client"

import { useState, useEffect } from "react"
import MainMenu from "@/components/game/main-menu"
import GameBoard from "@/components/game/game-board"
import ScoreBoard from "@/components/game/score-board"
import Settings from "@/components/game/settings"
import Store from "@/components/game/store"
import PowerUps from "@/components/game/power-ups"

export type GameScreen = "menu" | "game" | "scores" | "settings" | "store" | "powerups"

export interface GameSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
}

export interface ScoreEntry {
  score: number
  date: string
}

export default function BlockBlastGame() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("menu")
  const [highScore, setHighScore] = useState(0)
  const [gold, setGold] = useState(0)
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    vibrationEnabled: true,
  })
  const [powerUps, setPowerUps] = useState({
    miniBomb: 0,
    standardBomb: 0,
    extraMoves: 0,
    eraser: 0,
    startBonus: 0,
    boardRefresh: 0,
  })

  useEffect(() => {
    const savedHighScore = localStorage.getItem("blockblast-highscore")
    const savedScores = localStorage.getItem("blockblast-scores")
    const savedSettings = localStorage.getItem("blockblast-settings")
    const savedGold = localStorage.getItem("blockblast-gold")
    const savedPowerUps = localStorage.getItem("blockblast-powerups")

    if (savedHighScore) setHighScore(Number.parseInt(savedHighScore))
    if (savedScores) setScores(JSON.parse(savedScores))
    if (savedSettings) setSettings(JSON.parse(savedSettings))
    if (savedGold) setGold(Number.parseInt(savedGold))
    if (savedPowerUps) setPowerUps(JSON.parse(savedPowerUps))
  }, [])

  const saveScore = (score: number) => {
    const newEntry: ScoreEntry = {
      score,
      date: new Date().toLocaleString("tr-TR"),
    }
    const updatedScores = [...scores, newEntry].sort((a, b) => b.score - a.score).slice(0, 50)
    setScores(updatedScores)
    localStorage.setItem("blockblast-scores", JSON.stringify(updatedScores))

    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("blockblast-highscore", score.toString())
    }
  }

  const updateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings)
    localStorage.setItem("blockblast-settings", JSON.stringify(newSettings))
  }

  const updateGold = (amount: number) => {
    const newGold = gold + amount
    setGold(newGold)
    localStorage.setItem("blockblast-gold", newGold.toString())
  }

  const updatePowerUps = (newPowerUps: typeof powerUps) => {
    setPowerUps(newPowerUps)
    localStorage.setItem("blockblast-powerups", JSON.stringify(newPowerUps))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 overflow-hidden">
      {currentScreen === "menu" && <MainMenu highScore={highScore} gold={gold} onNavigate={setCurrentScreen} />}
      {currentScreen === "game" && (
        <GameBoard
          settings={settings}
          powerUps={powerUps}
          onPowerUpUse={updatePowerUps}
          onGameOver={saveScore}
          onBack={() => setCurrentScreen("menu")}
        />
      )}
      {currentScreen === "scores" && <ScoreBoard scores={scores} onBack={() => setCurrentScreen("menu")} />}
      {currentScreen === "settings" && (
        <Settings settings={settings} onUpdate={updateSettings} onBack={() => setCurrentScreen("menu")} />
      )}
      {currentScreen === "store" && (
        <Store
          gold={gold}
          onPurchase={updateGold}
          onBack={() => setCurrentScreen("menu")}
          onNavigate={setCurrentScreen}
        />
      )}
      {currentScreen === "powerups" && (
        <PowerUps
          gold={gold}
          powerUps={powerUps}
          onPurchase={(cost) => updateGold(-cost)}
          onPowerUpAdd={updatePowerUps}
          onBack={() => setCurrentScreen("store")}
        />
      )}
    </div>
  )
}
