"use client"

import { ArrowLeft } from "lucide-react"

interface PowerUpsProps {
  gold: number
  powerUps: {
    miniBomb: number
    standardBomb: number
    extraMoves: number
    eraser: number
    startBonus: number
    boardRefresh: number
  }
  onPurchase: (cost: number) => void
  onPowerUpAdd: (powerUps: PowerUpsProps["powerUps"]) => void
  onBack: () => void
}

const powerUpItems = [
  {
    id: "miniBomb",
    name: "Mini Bomba",
    icon: "💣",
    description: "2×2 alanı temizler",
    price: 500,
    gradient: "from-red-500 to-orange-600",
  },
  {
    id: "standardBomb",
    name: "Standart Bomba",
    icon: "💥",
    description: "3×3 alanı temizler",
    price: 1000,
    gradient: "from-orange-500 to-red-600",
    featured: true,
  },
  {
    id: "extraMoves",
    name: "+5 Hamle",
    icon: "➕",
    description: "5 ekstra hamle hakkı",
    price: 750,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "eraser",
    name: "Tekli Silgi",
    icon: "✏️",
    description: "Tek bir hücreyi temizler",
    price: 300,
    gradient: "from-yellow-500 to-amber-600",
  },
  {
    id: "startBonus",
    name: "Başlangıç Avantajı",
    icon: "⭐",
    description: "+500 başlangıç puanı",
    price: 1500,
    gradient: "from-purple-500 to-violet-600",
  },
  {
    id: "boardRefresh",
    name: "Tahta Yenileme",
    icon: "📜",
    description: "Yeni bloklar al",
    price: 800,
    gradient: "from-blue-500 to-cyan-600",
  },
]

export default function PowerUps({ gold, powerUps, onPurchase, onPowerUpAdd, onBack }: PowerUpsProps) {
  const handleBuy = (item: (typeof powerUpItems)[0]) => {
    if (gold < item.price) {
      alert("Yeterli altınınız yok! 💰")
      return
    }

    if (confirm(`${item.name} satın almak istiyor musunuz?\n\nFiyat: ${item.price.toLocaleString()} Altın`)) {
      onPurchase(item.price)
      const newPowerUps = { ...powerUps }
      newPowerUps[item.id as keyof typeof powerUps] += 1
      onPowerUpAdd(newPowerUps)
      alert(`${item.name} satın alındı! 🎉`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-black text-white">Güç-Up'lar</h1>
      </div>

      {/* Gold Balance */}
      <div className="bg-gradient-to-r from-yellow-500/30 to-amber-500/30 backdrop-blur-md rounded-2xl p-3 mb-4 border border-yellow-500/30">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-2xl font-black text-yellow-400">{gold.toLocaleString()}</span>
        </div>
      </div>

      {/* Power-up Items */}
      <div className="grid gap-3">
        {powerUpItems.map((item) => {
          const owned = powerUps[item.id as keyof typeof powerUps]
          const canAfford = gold >= item.price

          return (
            <div
              key={item.id}
              className={`relative bg-gradient-to-r ${item.gradient} rounded-2xl p-4 border border-white/20 shadow-lg ${
                item.featured ? "ring-2 ring-yellow-400" : ""
              }`}
            >
              {item.featured && (
                <div className="absolute -top-2 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ÖNERİLEN
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="text-4xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-lg">{item.name}</h3>
                    {owned > 0 && (
                      <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        x{owned}
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">{item.description}</p>
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  className={`
                    font-bold py-2 px-4 rounded-xl transition-all
                    ${
                      canAfford
                        ? "bg-white/20 hover:bg-white/30 text-white hover:scale-105 active:scale-95"
                        : "bg-white/10 text-white/50 cursor-not-allowed"
                    }
                  `}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-300">💰</span>
                    <span>{item.price.toLocaleString()}</span>
                  </div>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Inventory */}
      <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
        <h3 className="text-white font-bold mb-3">Envanteriniz</h3>
        <div className="grid grid-cols-3 gap-2">
          {powerUpItems.map((item) => {
            const owned = powerUps[item.id as keyof typeof powerUps]
            return (
              <div
                key={item.id}
                className={`text-center p-2 rounded-xl ${owned > 0 ? "bg-white/10" : "bg-white/5 opacity-50"}`}
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="text-white font-bold">{owned}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
