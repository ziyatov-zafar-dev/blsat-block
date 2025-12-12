"use client"

import { ArrowLeft, CheckCircle, Clock, Star } from "lucide-react"
import type { DailyTask } from "@/app/page"
import { useTranslation } from "@/app/page"

interface DailyTasksProps {
  tasks: DailyTask[]
  onClaimReward: (taskId: string) => void
  onBack: () => void
}

export default function DailyTasks({ tasks, onClaimReward, onBack }: DailyTasksProps) {
  const { t } = useTranslation()
  const easyTasks = tasks.filter((task) => task.type === "easy")
  const hardTasks = tasks.filter((task) => task.type === "hard")

  const getProgressPercent = (task: DailyTask) => {
    return Math.min((task.progress / task.target) * 100, 100)
  }

  const canClaim = (task: DailyTask) => task.progress >= task.target && !task.completed

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Header - Sabit */}
      <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-black/20">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t("dailyTasksTitle")}</h1>
      </div>

      {/* Timer - Sabit */}
      <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/20 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <span className="text-white/70 text-xs sm:text-sm">{t("tasksRefresh")}</span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-scroll overscroll-contain px-3 sm:px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="space-y-4 sm:space-y-6 pb-8">
          {/* Easy Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">{t("easyTasks")}</h2>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {easyTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-3 sm:p-4 border ${
                    task.completed ? "border-green-500/50" : "border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm sm:text-base">{task.description}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 font-bold text-sm sm:text-base">+{task.reward}</span>
                      <span className="text-yellow-400">💰</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 bg-white/10 rounded-full h-2.5 sm:h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          task.completed ? "bg-green-500" : "bg-gradient-to-r from-green-400 to-emerald-400"
                        }`}
                        style={{ width: `${getProgressPercent(task)}%` }}
                      />
                    </div>
                    <span className="text-white/70 text-xs sm:text-sm min-w-[50px] sm:min-w-[60px] text-right">
                      {task.progress}/{task.target}
                    </span>
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                    ) : canClaim(task) ? (
                      <button
                        onClick={() => onClaimReward(task.id)}
                        className="px-2 sm:px-3 py-1 bg-green-500 hover:bg-green-400 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors animate-pulse"
                      >
                        {t("claim")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hard Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">{t("hardTasks")}</h2>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {hardTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-3 sm:p-4 border ${
                    task.completed ? "border-orange-500/50" : "border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm sm:text-base">{task.description}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 font-bold text-sm sm:text-base">+{task.reward}</span>
                      <span className="text-yellow-400">💰</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 bg-white/10 rounded-full h-2.5 sm:h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          task.completed ? "bg-orange-500" : "bg-gradient-to-r from-orange-400 to-red-400"
                        }`}
                        style={{ width: `${getProgressPercent(task)}%` }}
                      />
                    </div>
                    <span className="text-white/70 text-xs sm:text-sm min-w-[50px] sm:min-w-[60px] text-right">
                      {task.progress}/{task.target}
                    </span>
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                    ) : canClaim(task) ? (
                      <button
                        onClick={() => onClaimReward(task.id)}
                        className="px-2 sm:px-3 py-1 bg-orange-500 hover:bg-orange-400 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors animate-pulse"
                      >
                        {t("claim")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
