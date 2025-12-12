"use client"

import { useState } from "react"
import { ArrowLeft, Volume2, VolumeX, Smartphone, Info, Globe, MapPin, ChevronDown } from "lucide-react"
import type { GameSettings } from "@/app/page"
import { useTranslation } from "@/app/page"
import { languages, countries, type Language } from "@/lib/translations"

interface SettingsProps {
  settings: GameSettings
  onUpdate: (settings: GameSettings) => void
  onBack: () => void
}

export default function Settings({ settings, onUpdate, onBack }: SettingsProps) {
  const { t } = useTranslation()
  const [showLanguages, setShowLanguages] = useState(false)
  const [showCountries, setShowCountries] = useState(false)

  const currentLanguage = languages.find((l) => l.code === settings.language)
  const currentCountry = countries.find((c) => c.code === settings.country)

  return (
    <div className="min-h-screen flex flex-col p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t("settingsTitle")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pb-4">
        {/* Language Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowLanguages(!showLanguages)}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <div>
                <p className="text-white font-medium text-sm sm:text-base">{t("language")}</p>
                <p className="text-white/50 text-xs sm:text-sm">
                  {currentLanguage?.flag} {currentLanguage?.name}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-white/50 transition-transform ${showLanguages ? "rotate-180" : ""}`}
            />
          </div>
          {showLanguages && (
            <div className="mt-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onUpdate({ ...settings, language: lang.code as Language })
                    setShowLanguages(false)
                  }}
                  className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl transition-all text-sm ${
                    settings.language === lang.code
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="truncate">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Country Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowCountries(!showCountries)}
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <div>
                <p className="text-white font-medium text-sm sm:text-base">{t("country")}</p>
                <p className="text-white/50 text-xs sm:text-sm">
                  {currentCountry?.flag} {currentCountry?.name}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-white/50 transition-transform ${showCountries ? "rotate-180" : ""}`}
            />
          </div>
          {showCountries && (
            <div className="mt-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    onUpdate({ ...settings, country: country.code })
                    setShowCountries(false)
                  }}
                  className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl transition-all text-sm ${
                    settings.country === country.code
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="truncate">{country.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sound Toggle */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-white/50" />
              )}
              <div>
                <p className="text-white font-medium text-sm sm:text-base">{t("sound")}</p>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ ...settings, soundEnabled: !settings.soundEnabled })}
              className={`
                w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all duration-300
                ${settings.soundEnabled ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-white/20"}
              `}
            >
              <div
                className={`
                  w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-lg transition-transform duration-300
                  ${settings.soundEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Vibration Toggle */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone
                className={`w-5 h-5 sm:w-6 sm:h-6 ${settings.vibrationEnabled ? "text-white" : "text-white/50"}`}
              />
              <div>
                <p className="text-white font-medium text-sm sm:text-base">{t("vibration")}</p>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
              className={`
                w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all duration-300
                ${settings.vibrationEnabled ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-white/20"}
              `}
            >
              <div
                className={`
                  w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-lg transition-transform duration-300
                  ${settings.vibrationEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <p className="text-white font-medium text-sm sm:text-base">How to Play?</p>
          </div>
          <div className="space-y-2 sm:space-y-3 text-white/70 text-xs sm:text-sm">
            <p>🎮 Drag blocks from the bottom</p>
            <p>📍 Place them on the 8x8 board</p>
            <p>✨ Complete rows or columns to clear</p>
            <p>💯 Earn points for each block</p>
            <p>🔥 Combos give bonus points</p>
            <p>❌ Game ends when no moves left</p>
          </div>
        </div>
      </div>
    </div>
  )
}
