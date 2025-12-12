"use client"

import { useState, useEffect, createContext, useContext } from "react"
import MainMenu from "@/components/game/main-menu"
import GameBoard from "@/components/game/game-board"
import ScoreBoard from "@/components/game/score-board"
import Settings from "@/components/game/settings"
import Store from "@/components/game/store"
import PowerUps from "@/components/game/power-ups"
import DailyTasks from "@/components/game/daily-tasks"
import FreeGold from "@/components/game/free-gold"
import AdminPanel from "@/components/game/admin-panel"
import { translations, type Language, type TranslationKey } from "@/lib/translations"

export type GameScreen = "menu" | "game" | "scores" | "settings" | "store" | "powerups" | "tasks" | "freeGold" | "admin"

export interface GameSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  language: Language
  country: string
}

export interface ScoreEntry {
  score: number
  date: string
  country?: string
  playerName?: string
}

export interface WorldScoreEntry {
  id: string
  score: number
  playerName: string
  country: string
  date: string
}

export interface DailyTask {
  id: string
  description: string
  target: number
  progress: number
  reward: number
  type: "easy" | "hard"
  completed: boolean
}

interface LanguageContextType {
  language: Language
  t: (key: TranslationKey) => string
  setLanguage: (lang: Language) => void
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "tr",
  t: (key) => translations.tr[key],
  setLanguage: () => {},
})

export const useTranslation = () => useContext(LanguageContext)

export default function BlockBlastGame() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("menu")
  const [highScore, setHighScore] = useState(0)
  const [gold, setGold] = useState(0)
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [worldScores, setWorldScores] = useState<WorldScoreEntry[]>([])
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    vibrationEnabled: true,
    language: "tr",
    country: "TR",
  })
  const [powerUps, setPowerUps] = useState({
    miniBomb: 0,
    standardBomb: 0,
    extraMoves: 0,
    eraser: 0,
    startBonus: 0,
    boardRefresh: 0,
  })
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [lastTaskDate, setLastTaskDate] = useState<string>("")
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [playerName, setPlayerName] = useState("")

  const t = (key: TranslationKey): string => {
    return translations[settings.language]?.[key] || translations.tr[key] || key
  }

  const generateDailyTasks = (): DailyTask[] => {
    return [
      {
        id: "easy1",
        description: t("complete1Game"),
        target: 1,
        progress: 0,
        reward: 50,
        type: "easy",
        completed: false,
      },
      {
        id: "easy2",
        description: t("earn500Points"),
        target: 500,
        progress: 0,
        reward: 75,
        type: "easy",
        completed: false,
      },
      {
        id: "easy3",
        description: t("clear3Lines"),
        target: 3,
        progress: 0,
        reward: 100,
        type: "easy",
        completed: false,
      },
      {
        id: "hard1",
        description: t("earn2000Points"),
        target: 2000,
        progress: 0,
        reward: 200,
        type: "hard",
        completed: false,
      },
      {
        id: "hard2",
        description: t("complete5Games"),
        target: 5,
        progress: 0,
        reward: 250,
        type: "hard",
        completed: false,
      },
      {
        id: "hard3",
        description: t("clear10Lines"),
        target: 10,
        progress: 0,
        reward: 300,
        type: "hard",
        completed: false,
      },
    ]
  }

  useEffect(() => {
    const savedHighScore = localStorage.getItem("blockblast-highscore")
    const savedScores = localStorage.getItem("blockblast-scores")
    const savedSettings = localStorage.getItem("blockblast-settings")
    const savedGold = localStorage.getItem("blockblast-gold")
    const savedPowerUps = localStorage.getItem("blockblast-powerups")
    const savedTasks = localStorage.getItem("blockblast-dailytasks")
    const savedTaskDate = localStorage.getItem("blockblast-taskdate")
    const hasPlayed = localStorage.getItem("blockblast-hasplayed")
    const savedWorldScores = localStorage.getItem("blockblast-worldscores")
    const savedPlayerName = localStorage.getItem("blockblast-playername")

    if (savedHighScore) setHighScore(Number.parseInt(savedHighScore))
    if (savedScores) setScores(JSON.parse(savedScores))
    if (savedSettings) setSettings(JSON.parse(savedSettings))
    if (savedGold) setGold(Number.parseInt(savedGold))
    if (savedPowerUps) setPowerUps(JSON.parse(savedPowerUps))
    if (savedWorldScores) setWorldScores(JSON.parse(savedWorldScores))
    if (savedPlayerName) setPlayerName(savedPlayerName)

    if (!hasPlayed) {
      setIsFirstTime(true)
      const starterPowerUps = {
        miniBomb: 1,
        standardBomb: 1,
        extraMoves: 0,
        eraser: 1,
        startBonus: 0,
        boardRefresh: 1,
      }
      setPowerUps(starterPowerUps)
      localStorage.setItem("blockblast-powerups", JSON.stringify(starterPowerUps))
      localStorage.setItem("blockblast-hasplayed", "true")
      setGold(100)
      localStorage.setItem("blockblast-gold", "100")
    }

    const today = new Date().toDateString()
    if (savedTaskDate !== today) {
      const newTasks = generateDailyTasks()
      setDailyTasks(newTasks)
      setLastTaskDate(today)
      localStorage.setItem("blockblast-dailytasks", JSON.stringify(newTasks))
      localStorage.setItem("blockblast-taskdate", today)
    } else if (savedTasks) {
      setDailyTasks(JSON.parse(savedTasks))
      setLastTaskDate(savedTaskDate)
    }

    if (!savedWorldScores) {
      const sampleWorldScores: WorldScoreEntry[] = [
        { id: "1", score: 125000, playerName: "ProGamer", country: "US", date: new Date().toISOString() },
        { id: "2", score: 98500, playerName: "BlockMaster", country: "JP", date: new Date().toISOString() },
        { id: "3", score: 87200, playerName: "PuzzleKing", country: "DE", date: new Date().toISOString() },
        { id: "4", score: 76800, playerName: "TetrisFan", country: "KR", date: new Date().toISOString() },
        { id: "5", score: 65400, playerName: "CubeHero", country: "BR", date: new Date().toISOString() },
        { id: "6", score: 54200, playerName: "BlastQueen", country: "FR", date: new Date().toISOString() },
        { id: "7", score: 43100, playerName: "GameLover", country: "GB", date: new Date().toISOString() },
        { id: "8", score: 32000, playerName: "CasualPlay", country: "TR", date: new Date().toISOString() },
        { id: "9", score: 21500, playerName: "NewPlayer", country: "ES", date: new Date().toISOString() },
        { id: "10", score: 10800, playerName: "Beginner", country: "IT", date: new Date().toISOString() },
      ]
      setWorldScores(sampleWorldScores)
      localStorage.setItem("blockblast-worldscores", JSON.stringify(sampleWorldScores))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveScore = (score: number, linesCleared?: number) => {
    const newEntry: ScoreEntry = {
      score,
      date: new Date().toLocaleString(settings.language === "tr" ? "tr-TR" : "en-US"),
      country: settings.country,
    }
    const updatedScores = [...scores, newEntry].sort((a, b) => b.score - a.score).slice(0, 50)
    setScores(updatedScores)
    localStorage.setItem("blockblast-scores", JSON.stringify(updatedScores))

    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("blockblast-highscore", score.toString())
    }

    if (playerName && score > 0) {
      const newWorldEntry: WorldScoreEntry = {
        id: Date.now().toString(),
        score,
        playerName,
        country: settings.country,
        date: new Date().toISOString(),
      }
      const updatedWorldScores = [...worldScores, newWorldEntry].sort((a, b) => b.score - a.score).slice(0, 100)
      setWorldScores(updatedWorldScores)
      localStorage.setItem("blockblast-worldscores", JSON.stringify(updatedWorldScores))
    }

    updateTaskProgress("game", 1)
    updateTaskProgress("score", score)
    if (linesCleared) {
      updateTaskProgress("lines", linesCleared)
    }
  }

  const updateTaskProgress = (type: string, amount: number) => {
    setDailyTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.completed) return task

        let shouldUpdate = false
        if ((type === "game" && task.id.includes("easy1")) || task.id.includes("hard2")) shouldUpdate = true
        if (type === "score" && (task.id.includes("easy2") || task.id.includes("hard1"))) shouldUpdate = true
        if (type === "lines" && (task.id.includes("easy3") || task.id.includes("hard3"))) shouldUpdate = true

        if (shouldUpdate) {
          const newProgress = task.progress + amount
          return { ...task, progress: Math.min(newProgress, task.target) }
        }
        return task
      })
      localStorage.setItem("blockblast-dailytasks", JSON.stringify(updated))
      return updated
    })
  }

  const claimTaskReward = (taskId: string) => {
    setDailyTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.id === taskId && task.progress >= task.target && !task.completed) {
          updateGold(task.reward)
          return { ...task, completed: true }
        }
        return task
      })
      localStorage.setItem("blockblast-dailytasks", JSON.stringify(updated))
      return updated
    })
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

  const updatePlayerName = (name: string) => {
    setPlayerName(name)
    localStorage.setItem("blockblast-playername", name)
  }

  return (
    <LanguageContext.Provider
      value={{ language: settings.language, t, setLanguage: (lang) => updateSettings({ ...settings, language: lang }) }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 overflow-hidden">
        {currentScreen === "menu" && (
          <MainMenu
            highScore={highScore}
            gold={gold}
            onNavigate={setCurrentScreen}
            isFirstTime={isFirstTime}
            onFirstTimeComplete={() => setIsFirstTime(false)}
            playerName={playerName}
            onPlayerNameChange={updatePlayerName}
          />
        )}
        {currentScreen === "game" && (
          <GameBoard
            settings={settings}
            powerUps={powerUps}
            onPowerUpUse={updatePowerUps}
            onGameOver={saveScore}
            onBack={() => setCurrentScreen("menu")}
          />
        )}
        {currentScreen === "scores" && (
          <ScoreBoard scores={scores} worldScores={worldScores} onBack={() => setCurrentScreen("menu")} />
        )}
        {currentScreen === "settings" && (
          <Settings settings={settings} onUpdate={updateSettings} onBack={() => setCurrentScreen("menu")} />
        )}
        {currentScreen === "store" && (
          <Store
            gold={gold}
            powerUps={powerUps}
            onPurchase={updateGold}
            onPowerUpAdd={updatePowerUps}
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
        {currentScreen === "tasks" && (
          <DailyTasks tasks={dailyTasks} onClaimReward={claimTaskReward} onBack={() => setCurrentScreen("menu")} />
        )}
        {currentScreen === "freeGold" && (
          <FreeGold gold={gold} onGoldEarn={updateGold} onBack={() => setCurrentScreen("store")} />
        )}
        {currentScreen === "admin" && <AdminPanel onBack={() => setCurrentScreen("menu")} />}
      </div>
    </LanguageContext.Provider>
  )
}
