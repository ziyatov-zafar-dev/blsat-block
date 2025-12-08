"use client"

import { ArrowLeft, Volume2, VolumeX, Smartphone, Info } from "lucide-react"
import type { GameSettings } from "@/app/page"

interface SettingsProps {
  settings: GameSettings
  onUpdate: (settings: GameSettings) => void
  onBack: () => void
}

export default function Settings({ settings, onUpdate, onBack }: SettingsProps) {
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-black text-white">Ayarlar</h1>
      </div>

      {/* Settings Options */}
      <div className="space-y-4">
        {/* Sound Toggle */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-6 h-6 text-white" />
              ) : (
                <VolumeX className="w-6 h-6 text-white/50" />
              )}
              <div>
                <p className="text-white font-medium">Ses Efektleri</p>
                <p className="text-white/50 text-sm">Oyun seslerini aç/kapat</p>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ ...settings, soundEnabled: !settings.soundEnabled })}
              className={`
                w-14 h-8 rounded-full transition-all duration-300
                ${settings.soundEnabled ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-white/20"}
              `}
            >
              <div
                className={`
                  w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300
                  ${settings.soundEnabled ? "translate-x-7" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Vibration Toggle */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className={`w-6 h-6 ${settings.vibrationEnabled ? "text-white" : "text-white/50"}`} />
              <div>
                <p className="text-white font-medium">Titreşim</p>
                <p className="text-white/50 text-sm">Dokunsal geri bildirim</p>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
              className={`
                w-14 h-8 rounded-full transition-all duration-300
                ${settings.vibrationEnabled ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-white/20"}
              `}
            >
              <div
                className={`
                  w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300
                  ${settings.vibrationEnabled ? "translate-x-7" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-white" />
            <p className="text-white font-medium">Nasıl Oynanır?</p>
          </div>
          <div className="space-y-3 text-white/70 text-sm">
            <p>🎮 Alt kısımdaki blokları parmağınızla sürükleyin</p>
            <p>📍 Blokları 8x8 oyun tahtasına yerleştirin</p>
            <p>✨ Satır veya sütun dolduğunda otomatik patlar</p>
            <p>💯 Her blok için puan kazanın</p>
            <p>🔥 Çoklu patlatmalar kombo bonusu verir</p>
            <p>❌ Hamle kalmayınca oyun biter</p>
          </div>
        </div>
      </div>
    </div>
  )
}
