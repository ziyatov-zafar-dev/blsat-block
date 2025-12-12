// Global oyun konfigurasyonu - tum kullanicilar icin gecerli
// Bu dosyayi duzenleyerek tum kullanicilar icin link ve kod ekleyebilirsiniz

export interface GlobalRewardLink {
  id: string
  title: string
  url: string
  goldReward: number
  active: boolean
}

export interface GlobalRewardCode {
  id: string
  code: string
  gold: number
  miniBomb: number
  standardBomb: number
  eraser: number
  boardRefresh: number
  usageLimit: number // Her kullanici icin kullanim limiti
  active: boolean
}

// Yeni link eklemek icin asagidaki array'e ekleyin
export const GLOBAL_LINKS: GlobalRewardLink[] = [
  // Ornek link - aktif degil, siz aktif edene kadar gosterilmez
  // {
  //   id: "link1",
  //   title: "Reklam Izle",
  //   url: "https://example.com",
  //   goldReward: 50,
  //   active: true
  // },
]

// Yeni kod eklemek icin asagidaki array'e ekleyin
export const GLOBAL_CODES: GlobalRewardCode[] = [
  // Ornek kod - aktif degil
  // {
  //   id: "code1",
  //   code: "HOSGELDIN",
  //   gold: 500,
  //   miniBomb: 2,
  //   standardBomb: 1,
  //   eraser: 3,
  //   boardRefresh: 1,
  //   usageLimit: 1,
  //   active: true
  // },
]
