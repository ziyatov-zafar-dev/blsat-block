"use client"

import { useState, useEffect } from "react"
import { Gift, Sparkles, Loader2 } from "lucide-react"
import { useTranslation } from "@/app/page"

interface RewardCode {
  id: string
  code: string
  gold: number
  mini_bomb: number
  standard_bomb: number
  eraser: number
  board_refresh: number
  usage_limit: number
  used_count: number
  active: boolean
}

interface RedeemCodeProps {
  onRedeem: (
    gold: number,
    powerUps: { miniBomb: number; standardBomb: number; eraser: number; boardRefresh: number },
  ) => void
}

export default function RedeemCode({ onRedeem }: RedeemCodeProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [usedCodes, setUsedCodes] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [reward, setReward] = useState<{ gold: number; powerUps: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("blockblast-used-codes")
    if (saved) setUsedCodes(JSON.parse(saved))
  }, [])

  const handleRedeem = async () => {
    const inputCode = code.trim().toUpperCase()

    if (!inputCode) {
      alert(t("enterCode"))
      return
    }

    if (usedCodes.includes(inputCode)) {
      alert(t("invalidCode"))
      return
    }

    setLoading(true)

    try {
      // Supabase'den kodlari al
      const res = await fetch("/api/admin/codes")
      if (!res.ok) {
        alert(t("invalidCode"))
        setLoading(false)
        return
      }

      const codes: RewardCode[] = await res.json()
      const foundCode = codes.find((c) => c.code === inputCode && c.active)

      if (!foundCode) {
        alert(t("invalidCode"))
        setLoading(false)
        return
      }

      // Kullanim limiti kontrolu
      const userUsageKey = `blockblast-code-usage-${inputCode}`
      const userUsage = Number.parseInt(localStorage.getItem(userUsageKey) || "0")

      if (userUsage >= foundCode.usage_limit) {
        alert(t("invalidCode"))
        setLoading(false)
        return
      }

      // Kullanim sayisini guncelle
      localStorage.setItem(userUsageKey, (userUsage + 1).toString())

      // Kodu kullanildi olarak isaretle
      const newUsedCodes = [...usedCodes, inputCode]
      setUsedCodes(newUsedCodes)
      localStorage.setItem("blockblast-used-codes", JSON.stringify(newUsedCodes))

      const earnedPowerUps: string[] = []
      if (foundCode.mini_bomb > 0) earnedPowerUps.push(`💣 x${foundCode.mini_bomb}`)
      if (foundCode.standard_bomb > 0) earnedPowerUps.push(`💥 x${foundCode.standard_bomb}`)
      if (foundCode.eraser > 0) earnedPowerUps.push(`✏️ x${foundCode.eraser}`)
      if (foundCode.board_refresh > 0) earnedPowerUps.push(`🔄 x${foundCode.board_refresh}`)

      setReward({ gold: foundCode.gold, powerUps: earnedPowerUps })
      setShowSuccess(true)

      onRedeem(foundCode.gold, {
        miniBomb: foundCode.mini_bomb,
        standardBomb: foundCode.standard_bomb,
        eraser: foundCode.eraser,
        boardRefresh: foundCode.board_refresh,
      })

      setCode("")
    } catch (error) {
      alert(t("invalidCode"))
    }

    setLoading(false)
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setReward(null)
    setIsOpen(false)
  }

  return (
    <>
      {/* Kod Gir Butonu */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-3 sm:p-4 border border-white/20 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          <span className="text-white font-bold text-base sm:text-lg">{t("redeemCode")}</span>
        </div>
      </button>

      {/* Kod Girisi Modal */}
      {isOpen && !showSuccess && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-5 sm:p-6 mx-4 border border-white/20 shadow-2xl max-w-sm w-full">
            <div className="text-center mb-4">
              <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-pink-400 mx-auto mb-2" />
              <h2 className="text-xl sm:text-2xl font-black text-white">{t("redeemCode")}</h2>
              <p className="text-white/60 text-xs sm:text-sm">{t("enterCode")}</p>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 sm:py-3 text-white text-center font-mono text-lg sm:text-xl uppercase placeholder:text-white/30 mb-4"
              maxLength={12}
            />

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-white/10 text-white font-bold py-2.5 sm:py-3 rounded-xl hover:bg-white/20 transition-colors text-sm sm:text-base"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2.5 sm:py-3 rounded-xl hover:scale-105 transition-transform text-sm sm:text-base disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("redeem")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basari Modal */}
      {showSuccess && reward && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-3xl p-5 sm:p-6 mx-4 border border-white/20 shadow-2xl max-w-sm w-full text-center">
            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">{t("success")}!</h2>
            <p className="text-white/70 mb-3 sm:mb-4 text-sm sm:text-base">{t("codeUsed")}</p>

            <div className="bg-white/10 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 space-y-1.5 sm:space-y-2">
              {reward.gold > 0 && (
                <p className="text-yellow-400 font-bold text-lg sm:text-xl">
                  💰 +{reward.gold} {t("gold")}
                </p>
              )}
              {reward.powerUps.map((pu, i) => (
                <p key={i} className="text-white/80 text-sm sm:text-base">
                  {pu}
                </p>
              ))}
            </div>

            <button
              onClick={closeSuccess}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2.5 sm:py-3 rounded-xl hover:scale-105 transition-transform text-sm sm:text-base"
            >
              {t("confirm")}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
