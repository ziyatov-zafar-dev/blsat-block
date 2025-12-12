"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Gift, ExternalLink, Clock, Loader2 } from "lucide-react"
import { useTranslation } from "@/app/page"

interface RewardLink {
  id: string
  title: string
  url: string
  gold_reward: number
  active: boolean
}

interface FreeGoldProps {
  gold: number
  onGoldEarn: (amount: number) => void
  onBack: () => void
}

export default function FreeGold({ gold, onGoldEarn, onBack }: FreeGoldProps) {
  const { t } = useTranslation()
  const [links, setLinks] = useState<RewardLink[]>([])
  const [loading, setLoading] = useState(true)
  const [claimedLinks, setClaimedLinks] = useState<string[]>([])
  const [pendingLink, setPendingLink] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    fetchLinks()
    loadClaimedLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/links")
      if (res.ok) {
        const data = await res.json()
        setLinks(data.filter((l: RewardLink) => l.active))
      }
    } catch (error) {
      console.error("Link yukleme hatasi:", error)
    }
    setLoading(false)
  }

  const loadClaimedLinks = () => {
    const savedClaimed = localStorage.getItem("blockblast-claimed-links")
    if (savedClaimed) {
      const claimed = JSON.parse(savedClaimed)
      const today = new Date().toDateString()
      const savedDate = localStorage.getItem("blockblast-claimed-date")
      if (savedDate !== today) {
        setClaimedLinks([])
        localStorage.setItem("blockblast-claimed-links", JSON.stringify([]))
        localStorage.setItem("blockblast-claimed-date", today)
      } else {
        setClaimedLinks(claimed)
      }
    }
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && pendingLink) {
      const link = links.find((l) => l.id === pendingLink)
      if (link) {
        onGoldEarn(link.gold_reward)
        const newClaimed = [...claimedLinks, pendingLink]
        setClaimedLinks(newClaimed)
        localStorage.setItem("blockblast-claimed-links", JSON.stringify(newClaimed))
        alert(`${t("goldEarned")} +${link.gold_reward}`)
      }
      setPendingLink(null)
    }
  }, [countdown, pendingLink, claimedLinks, onGoldEarn, t, links])

  const handleLinkClick = (link: RewardLink) => {
    if (claimedLinks.includes(link.id)) {
      return
    }
    window.open(link.url, "_blank")
    setPendingLink(link.id)
    setCountdown(10)
  }

  const activeLinks = links.filter((l) => !claimedLinks.includes(l.id))
  const claimedCount = links.filter((l) => claimedLinks.includes(l.id)).length

  return (
    <div className="min-h-screen flex flex-col p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t("freeGoldTitle")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 space-y-4 sm:space-y-6">
        {/* Gold Display */}
        <div className="bg-gradient-to-r from-yellow-500/30 to-amber-500/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs sm:text-sm">{t("goldBalance")}</p>
              <p className="text-2xl sm:text-3xl font-black text-yellow-400">💰 {gold.toLocaleString()}</p>
            </div>
            <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
          </div>
        </div>

        {/* Progress */}
        {links.length > 0 && (
          <div className="bg-white/10 rounded-2xl p-3 sm:p-4 border border-white/20">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-white/70">Progress</span>
              <span className="text-white font-bold">
                {claimedCount}/{links.length}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${links.length > 0 ? (claimedCount / links.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {pendingLink && countdown > 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-6 sm:p-8 text-center border border-white/20">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
              <p className="text-white/70 mb-2 text-sm sm:text-base">{t("loading")}</p>
              <p className="text-5xl sm:text-6xl font-black text-white mb-4">{countdown}</p>
            </div>
          </div>
        )}

        {/* Links */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
            <div className="text-5xl sm:text-6xl mb-4">🎁</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t("rewardsComingSoon")}</h2>
            <p className="text-white/50 text-sm sm:text-base">{t("rewardsComingSoon")}</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">
              {t("freeGoldTitle")} ({activeLinks.length})
            </h2>

            {links.map((link) => {
              const isClaimed = claimedLinks.includes(link.id)
              const isPending = pendingLink === link.id

              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  disabled={isClaimed || isPending}
                  className={`w-full rounded-2xl p-3 sm:p-4 border text-left transition-all ${
                    isClaimed
                      ? "bg-green-500/20 border-green-500/30"
                      : isPending
                        ? "bg-yellow-500/20 border-yellow-500/30"
                        : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`text-2xl sm:text-3xl ${isClaimed ? "grayscale" : ""}`}>
                        {isClaimed ? "✅" : "🎁"}
                      </div>
                      <div>
                        <h3 className={`font-bold text-sm sm:text-base ${isClaimed ? "text-green-400" : "text-white"}`}>
                          {link.title}
                        </h3>
                        <p className="text-white/50 text-xs sm:text-sm flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {t("visitAndEarn")}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ${isClaimed ? "text-green-400" : "text-yellow-400"}`}>
                      {isClaimed ? (
                        <span className="text-xs sm:text-sm">{t("success")}!</span>
                      ) : (
                        <>
                          <span className="font-black text-lg sm:text-xl">+{link.gold_reward}</span>
                          <p className="text-[10px] sm:text-xs">{t("gold")}</p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
