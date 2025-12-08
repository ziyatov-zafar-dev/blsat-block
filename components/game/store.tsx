"use client"

import { ArrowLeft, Sparkles } from "lucide-react"
import type { GameScreen } from "@/app/page"

interface StoreProps {
  gold: number
  onPurchase: (amount: number) => void
  onBack: () => void
  onNavigate: (screen: GameScreen) => void
}

const goldPackages = [
  {
    id: "small",
    name: "Küçük Avuç",
    icon: "💵",
    gold: 5000,
    price: "₺9,99",
    description: "Deneme amaçlı, düşük fiyatlı paket",
    badge: null,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "medium",
    name: "Orta Sandık",
    icon: "⭐",
    gold: 25000,
    price: "₺39,99",
    description: "En iyi fiyat-performans",
    badge: "EN POPÜLER",
    gradient: "from-yellow-500 to-amber-600",
  },
  {
    id: "large",
    name: "Büyük Hazine",
    icon: "🎁",
    gold: 60000,
    price: "₺79,99",
    description: "Avantajlı paket",
    badge: null,
    gradient: "from-purple-500 to-violet-600",
  },
  {
    id: "premium",
    name: "Dev Kasa",
    icon: "💎",
    gold: 150000,
    price: "₺189,99",
    description: "En büyük tasarruf",
    badge: "PREMİUM",
    gradient: "from-pink-500 to-rose-600",
  },
]

export default function Store({ gold, onPurchase, onBack, onNavigate }: StoreProps) {
  const handlePurchase = (pkg: (typeof goldPackages)[0]) => {
    if (
      confirm(`${pkg.name} paketini satın almak istiyor musunuz?\n\n${pkg.gold.toLocaleString()} Altın - ${pkg.price}`)
    ) {
      onPurchase(pkg.gold)
      alert(`Tebrikler! ${pkg.gold.toLocaleString()} altın hesabınıza eklendi! 🎉`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-black text-white">Mağaza</h1>
      </div>

      {/* Gold Balance */}
      <div className="bg-gradient-to-r from-yellow-500/30 to-amber-500/30 backdrop-blur-md rounded-2xl p-4 mb-6 border border-yellow-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Altın Bakiyeniz</p>
            <p className="text-3xl font-black text-yellow-400">💰 {gold.toLocaleString()}</p>
          </div>
          <Sparkles className="w-10 h-10 text-yellow-400" />
        </div>
      </div>

      {/* Gold Packages */}
      <h2 className="text-xl font-bold text-white mb-3">Altın Paketleri</h2>
      <div className="grid gap-3 mb-6">
        {goldPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative bg-gradient-to-r ${pkg.gradient} rounded-2xl p-4 border border-white/20 shadow-lg`}
          >
            {pkg.badge && (
              <div className="absolute -top-2 right-4 bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {pkg.badge}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="text-4xl">{pkg.icon}</div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{pkg.name}</h3>
                <p className="text-white/70 text-sm">{pkg.description}</p>
                <p className="text-yellow-300 font-bold mt-1">{pkg.gold.toLocaleString()} Altın</p>
              </div>
              <button
                onClick={() => handlePurchase(pkg)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                {pkg.price}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Power-ups Button */}
      <button
        onClick={() => onNavigate("powerups")}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
      >
        <span className="text-2xl">🎯</span>
        <span>GÜÇ-UP'LAR</span>
      </button>

      {/* Note */}
      <p className="text-white/40 text-xs text-center mt-4">
        ℹ️ Ödeme sistemi yakında eklenecektir. Test modunda çalışıyor.
      </p>
    </div>
  )
}
