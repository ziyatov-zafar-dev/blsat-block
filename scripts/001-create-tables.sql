-- Linkler tablosu (admin panelden eklenen tum kullanicilara gosterilecek linkler)
CREATE TABLE IF NOT EXISTS reward_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  gold_reward INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kodlar tablosu (admin panelden eklenen tum kullanicilara gosterilecek kodlar)
CREATE TABLE IF NOT EXISTS reward_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  gold INTEGER DEFAULT 100,
  mini_bomb INTEGER DEFAULT 0,
  standard_bomb INTEGER DEFAULT 0,
  eraser INTEGER DEFAULT 0,
  board_refresh INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Herkesin okuyabilmesi icin RLS politikalari
ALTER TABLE reward_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_codes ENABLE ROW LEVEL SECURITY;

-- Herkes linkleri okuyabilir
CREATE POLICY "Anyone can read links" ON reward_links FOR SELECT USING (true);

-- Herkes kodlari okuyabilir
CREATE POLICY "Anyone can read codes" ON reward_codes FOR SELECT USING (true);

-- Herkes kod kullanim sayisini guncelleyebilir
CREATE POLICY "Anyone can update code usage" ON reward_codes FOR UPDATE USING (true);
