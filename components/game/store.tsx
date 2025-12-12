"use client"

import { useState } from "react"
import { ArrowLeft, Sparkles, Wifi, WifiOff, Gift } from "lucide-react"
import type { GameScreen } from "@/app/page"
import { useTranslation } from "@/app/page"
import RedeemCode from "./redeem-code"

interface StoreProps {
  gold: number
  powerUps: {
    miniBomb: number
    standardBomb: number
    extraMoves: number
    eraser: number
    startBonus: number
    boardRefresh: number
  }
  onPurchase: (amount: number) => void
  onPowerUpAdd: (powerUps: StoreProps["powerUps"]) => void
  onBack: () => void
  onNavigate: (screen: GameScreen) => void
}

export default function Store({ gold, powerUps, onPurchase, onPowerUpAdd, onBack, onNavigate }: StoreProps) {
  const { t } = useTranslation()
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)

  const goldPackages = [
    {
      id: "small",
      name: t("smallPack"),
      icon: "💵",
      gold: 5000,
      price: "₺9,99",
      description: t("testPack"),
      badge: null,
      gradient: "from-green-500 to-emerald-600",
    },
    {
      id: "medium",
      name: t("mediumPack"),
      icon: "⭐",
      gold: 25000,
      price: "₺39,99",
      description: t("bestValue"),
      badge: t("mostPopular"),
      gradient: "from-yellow-500 to-amber-600",
    },
    {
      id: "large",
      name: t("largePack"),
      icon: "🎁",
      gold: 60000,
      price: "₺79,99",
      description: t("advantagePack"),
      badge: null,
      gradient: "from-purple-500 to-violet-600",
    },
    {
      id: "premium",
      name: t("premiumPack"),
      icon: "💎",
      gold: 150000,
      price: "₺189,99",
      description: t("biggestSave"),
      badge: t("premium"),
      gradient: "from-pink-500 to-rose-600",
    },
  ]

  const powerUpItems = [
    {
      id: "miniBomb",
      name: t("miniBomb"),
      icon: "💣",
      description: t("miniBombDesc"),
      price: 150,
      gradient: "from-red-500 to-orange-600",
    },
    {
      id: "standardBomb",
      name: t("standardBomb"),
      icon: "💥",
      description: t("standardBombDesc"),
      price: 400,
      gradient: "from-orange-500 to-red-600",
    },
    {
      id: "eraser",
      name: t("eraser"),
      icon: "✏️",
      description: t("eraserDesc"),
      price: 80,
      gradient: "from-yellow-500 to-amber-600",
    },
    {
      id: "boardRefresh",
      name: t("boardRefresh"),
      icon: "🔄",
      description: t("boardRefreshDesc"),
      price: 500,
      gradient: "from-blue-500 to-cyan-600",
    },
  ]

  const checkInternetConnection = async (): Promise<boolean> => {
    setIsCheckingConnection(true)
    try {
      if (!navigator.onLine) {
        setIsCheckingConnection(false)
        return false
      }
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      await fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      setIsCheckingConnection(false)
      return true
    } catch {
      setIsCheckingConnection(false)
      return false
    }
  }

  const handlePurchase = async (pkg: (typeof goldPackages)[0]) => {
    const isOnline = await checkInternetConnection()

    if (!isOnline) {
      alert(t("noConnection") + "\n\n" + t("connectionError"))
      return
    }

    if (confirm(`${pkg.name}?\n\n${pkg.gold.toLocaleString()} ${t("gold")} - ${pkg.price}`)) {
      onPurchase(pkg.gold)
      alert(t("purchaseSuccess").replace("{amount}", pkg.gold.toLocaleString()))
    }
  }

  const handlePowerUpBuy = (item: (typeof powerUpItems)[0]) => {
    if (gold < item.price) {
      alert(t("notEnoughGold"))
      return
    }

    if (confirm(`${item.name}?\n\n${item.price} ${t("gold")}`)) {
      onPurchase(-item.price)
      const newPowerUps = { ...powerUps }
      newPowerUps[item.id as keyof typeof powerUps] += 1
      onPowerUpAdd(newPowerUps)
      alert(`${item.name} ${t("success").toLowerCase()}!`)
    }
  }

  const handleCodeRedeem = (
    earnedGold: number,
    earnedPowerUps: { miniBomb: number; standardBomb: number; eraser: number; boardRefresh: number },
  ) => {
    if (earnedGold > 0) {
      onPurchase(earnedGold)
    }

    const newPowerUps = { ...powerUps }
    newPowerUps.miniBomb += earnedPowerUps.miniBomb
    newPowerUps.standardBomb += earnedPowerUps.standardBomb
    newPowerUps.eraser += earnedPowerUps.eraser
    newPowerUps.boardRefresh += earnedPowerUps.boardRefresh
    onPowerUpAdd(newPowerUps)
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-black/20">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t("storeName")}</h1>
        <div className="ml-auto flex items-center gap-2">
          {navigator.onLine ? (
            <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-scroll overscroll-contain p-3 sm:p-4 space-y-4 sm:space-y-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Gold Balance */}
        <div className="bg-gradient-to-r from-yellow-500/30 to-amber-500/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs sm:text-sm">{t("goldBalance")}</p>
              <p className="text-2xl sm:text-3xl font-black text-yellow-400">💰 {gold.toLocaleString()}</p>
            </div>
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
          </div>
        </div>

        <div className="space-y-3">
          <RedeemCode onRedeem={handleCodeRedeem} />
        </div>

        <button
          onClick={() => onNavigate("freeGold" as GameScreen)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-3 sm:p-4 border border-white/20 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="text-white font-bold text-base sm:text-lg">{t("freeGold")}</span>
          </div>
        </button>

        {/* Gold Packages */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t("goldPackages")}</h2>
          <p className="text-white/50 text-[10px] sm:text-xs mb-2 flex items-center gap-1">
            <Wifi className="w-3 h-3" /> {t("internetRequired")}
          </p>
          <div className="grid gap-2 sm:gap-3">
            {goldPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-gradient-to-r ${pkg.gradient} rounded-2xl p-3 sm:p-4 border border-white/20 shadow-lg`}
              >
                {pkg.badge && (
                  <div className="absolute -top-2 right-3 sm:right-4 bg-white text-gray-900 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
                    {pkg.badge}
                  </div>
                )}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-3xl sm:text-4xl">{pkg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg truncate">{pkg.name}</h3>
                    <p className="text-white/70 text-xs sm:text-sm truncate">{pkg.description}</p>
                    <p className="text-yellow-300 font-bold mt-0.5 sm:mt-1 text-sm sm:text-base">
                      {pkg.gold.toLocaleString()} {t("gold")}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={isCheckingConnection}
                    className={`bg-white/20 hover:bg-white/30 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm sm:text-base ${
                      isCheckingConnection ? "opacity-50 cursor-wait" : ""
                    }`}
                  >
                    {isCheckingConnection ? "..." : pkg.price}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Power-Ups */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t("powerUpsTitle")}</h2>
          <div className="grid gap-2 sm:gap-3">
            {powerUpItems.map((item) => {
              const owned = powerUps[item.id as keyof typeof powerUps]
              const canAfford = gold >= item.price

              return (
                <div
                  key={item.id}
                  className={`relative bg-gradient-to-r ${item.gradient} rounded-2xl p-3 sm:p-4 border border-white/20 shadow-lg`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-base sm:text-lg truncate">{item.name}</h3>
                        {owned > 0 && (
                          <span className="bg-white/20 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                            x{owned}
                          </span>
                        )}
                      </div>
                      <p className="text-white/70 text-xs sm:text-sm truncate">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handlePowerUpBuy(item)}
                      disabled={!canAfford}
                      className={`font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl transition-all flex items-center gap-1 text-sm sm:text-base ${
                        canAfford
                          ? "bg-white/20 hover:bg-white/30 text-white hover:scale-105 active:scale-95"
                          : "bg-white/10 text-white/50 cursor-not-allowed"
                      }`}
                    >
                      <span className="text-yellow-300">💰</span>
                      <span>{item.price}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Note */}
        <p className="text-white/40 text-[10px] sm:text-xs text-center pb-4">{t("offlineNote")}</p>

        {/* Alt bosluk - scroll icin */}
        <div className="h-8"></div>
      </div>
    </div>
  )
}
