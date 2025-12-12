"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Copy, Check, Trash2, Plus, Link, Eye, EyeOff, Loader2 } from "lucide-react"

interface RewardLink {
  id: string
  title: string
  url: string
  gold_reward: number
  active: boolean
  created_at: string
}

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
  created_at: string
}

interface AdminPanelProps {
  onBack: () => void
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"links" | "codes">("links")
  const [links, setLinks] = useState<RewardLink[]>([])
  const [codes, setCodes] = useState<RewardCode[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Link form
  const [newLinkTitle, setNewLinkTitle] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkGold, setNewLinkGold] = useState(50)

  // Code form
  const [newCode, setNewCode] = useState("")
  const [newGold, setNewGold] = useState(100)
  const [newMiniBomb, setNewMiniBomb] = useState(0)
  const [newStandardBomb, setNewStandardBomb] = useState(0)
  const [newEraser, setNewEraser] = useState(0)
  const [newBoardRefresh, setNewBoardRefresh] = useState(0)
  const [newUsageLimit, setNewUsageLimit] = useState(1)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [linksRes, codesRes] = await Promise.all([fetch("/api/admin/links"), fetch("/api/admin/codes")])

      if (linksRes.ok) {
        const linksData = await linksRes.json()
        setLinks(linksData)
      }

      if (codesRes.ok) {
        const codesData = await codesRes.json()
        setCodes(codesData)
      }
    } catch (error) {
      console.error("Veri yukleme hatasi:", error)
    }
    setLoading(false)
  }

  // Link islemleri
  const createLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      alert("Baslik ve URL gerekli!")
      return
    }

    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newLinkTitle,
          url: newLinkUrl,
          goldReward: newLinkGold,
        }),
      })

      if (res.ok) {
        const newLink = await res.json()
        setLinks([newLink, ...links])
        setNewLinkTitle("")
        setNewLinkUrl("")
        setNewLinkGold(50)
        alert("Link eklendi! Tum kullanicilar gorebilir.")
      } else {
        alert("Link eklenemedi!")
      }
    } catch (error) {
      alert("Hata olustu!")
    }
  }

  const deleteLink = async (id: string) => {
    if (!confirm("Bu linki silmek istediginizden emin misiniz?")) return

    try {
      const res = await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setLinks(links.filter((l) => l.id !== id))
      }
    } catch (error) {
      alert("Silme hatasi!")
    }
  }

  const toggleLinkStatus = async (id: string, active: boolean) => {
    try {
      const res = await fetch("/api/admin/links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      })
      if (res.ok) {
        setLinks(links.map((l) => (l.id === id ? { ...l, active: !active } : l)))
      }
    } catch (error) {
      alert("Guncelleme hatasi!")
    }
  }

  // Code islemleri
  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(code)
  }

  const createCode = async () => {
    if (!newCode.trim()) {
      alert("Kod gerekli!")
      return
    }

    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          gold: newGold,
          miniBomb: newMiniBomb,
          standardBomb: newStandardBomb,
          eraser: newEraser,
          boardRefresh: newBoardRefresh,
          usageLimit: newUsageLimit,
        }),
      })

      if (res.ok) {
        const newCodeData = await res.json()
        setCodes([newCodeData, ...codes])
        setNewCode("")
        setNewGold(100)
        setNewMiniBomb(0)
        setNewStandardBomb(0)
        setNewEraser(0)
        setNewBoardRefresh(0)
        setNewUsageLimit(1)
        alert("Kod olusturuldu! Tum kullanicilar kullanabilir.")
      } else {
        const error = await res.json()
        alert(error.error || "Kod olusturulamadi!")
      }
    } catch (error) {
      alert("Hata olustu!")
    }
  }

  const deleteCode = async (id: string) => {
    if (!confirm("Bu kodu silmek istediginizden emin misiniz?")) return

    try {
      const res = await fetch(`/api/admin/codes?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setCodes(codes.filter((c) => c.id !== id))
      }
    } catch (error) {
      alert("Silme hatasi!")
    }
  }

  const toggleCodeStatus = async (id: string, active: boolean) => {
    try {
      const res = await fetch("/api/admin/codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      })
      if (res.ok) {
        setCodes(codes.map((c) => (c.id === id ? { ...c, active: !active } : c)))
      }
    } catch (error) {
      alert("Guncelleme hatasi!")
    }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl sm:text-2xl font-black text-white">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("links")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "links"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          <Link className="w-4 h-4 inline mr-2" />
          Linkler ({links.length})
        </button>
        <button
          onClick={() => setActiveTab("codes")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "codes"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          🎁 Kodlar ({codes.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" style={{ WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : activeTab === "links" ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Link Ekleme Formu */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Link Ekle
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Baslik (ornek: Reklam Izle)"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-white/50 text-sm"
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="URL (ornek: https://site.com)"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-white/50 text-sm"
                />
                <div>
                  <label className="text-white/70 text-xs block mb-1">Altin Odulu</label>
                  <input
                    type="number"
                    value={newLinkGold}
                    onChange={(e) => setNewLinkGold(Number(e.target.value))}
                    min={1}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm"
                  />
                </div>
                <button
                  onClick={createLink}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Link Ekle
                </button>
              </div>
            </div>

            {/* Link Listesi */}
            <div className="space-y-2">
              {links.length === 0 ? (
                <div className="text-center py-8 text-white/50">Henuz link eklenmemis</div>
              ) : (
                links.map((link) => (
                  <div
                    key={link.id}
                    className={`bg-white/10 rounded-xl p-3 border ${link.active ? "border-green-500/30" : "border-red-500/30"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm truncate">{link.title}</h3>
                        <p className="text-white/50 text-xs truncate">{link.url}</p>
                        <p className="text-yellow-400 text-xs">+{link.gold_reward} Altin</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleLinkStatus(link.id, link.active)}
                          className={`p-2 rounded-lg ${link.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                        >
                          {link.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="p-2 bg-red-500/20 rounded-lg text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Kod Ekleme Formu */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Kod Olustur
              </h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="Kod (ornek: HOSGELDIN)"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-white/50 uppercase text-sm"
                  />
                  <button
                    onClick={generateRandomCode}
                    className="px-3 py-2 bg-purple-500 rounded-xl text-white text-xs font-bold hover:bg-purple-600"
                  >
                    Rastgele
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white/70 text-xs block mb-1">Altin</label>
                    <input
                      type="number"
                      value={newGold}
                      onChange={(e) => setNewGold(Number(e.target.value))}
                      min={0}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-xs block mb-1">Kullanim Limiti</label>
                    <input
                      type="number"
                      value={newUsageLimit}
                      onChange={(e) => setNewUsageLimit(Number(e.target.value))}
                      min={1}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white/70 text-xs block mb-1">Mini Bomba</label>
                    <input
                      type="number"
                      value={newMiniBomb}
                      onChange={(e) => setNewMiniBomb(Number(e.target.value))}
                      min={0}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-xs block mb-1">Standart Bomba</label>
                    <input
                      type="number"
                      value={newStandardBomb}
                      onChange={(e) => setNewStandardBomb(Number(e.target.value))}
                      min={0}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white/70 text-xs block mb-1">Tekli Silgi</label>
                    <input
                      type="number"
                      value={newEraser}
                      onChange={(e) => setNewEraser(Number(e.target.value))}
                      min={0}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-xs block mb-1">Tahta Yenileme</label>
                    <input
                      type="number"
                      value={newBoardRefresh}
                      onChange={(e) => setNewBoardRefresh(Number(e.target.value))}
                      min={0}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={createCode}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Kod Olustur
                </button>
              </div>
            </div>

            {/* Kod Listesi */}
            <div className="space-y-2">
              {codes.length === 0 ? (
                <div className="text-center py-8 text-white/50">Henuz kod olusturulmamis</div>
              ) : (
                codes.map((code) => (
                  <div
                    key={code.id}
                    className={`bg-white/10 rounded-xl p-3 border ${code.active ? "border-green-500/30" : "border-red-500/30"}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono font-bold text-sm bg-white/10 px-2 py-1 rounded">
                          {code.code}
                        </span>
                        <button onClick={() => copyCode(code.code, code.id)} className="p-1 hover:bg-white/10 rounded">
                          {copiedId === code.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleCodeStatus(code.id, code.active)}
                          className={`p-2 rounded-lg ${code.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                        >
                          {code.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteCode(code.id)}
                          className="p-2 bg-red-500/20 rounded-lg text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-white/70 space-y-1">
                      <p>
                        💰 {code.gold} Altin | 📊 {code.used_count}/{code.usage_limit} Kullanim
                      </p>
                      <p>
                        💣 {code.mini_bomb} Mini | 💥 {code.standard_bomb} Standart | 🧹 {code.eraser} Silgi | 🔄{" "}
                        {code.board_refresh} Yenileme
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
