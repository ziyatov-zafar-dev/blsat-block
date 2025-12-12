-- Admin panelden ekleme yapabilmek icin INSERT politikalari

-- Herkes link ekleyebilir (admin panelden)
CREATE POLICY "Anyone can insert links" ON reward_links FOR INSERT WITH CHECK (true);

-- Herkes kod ekleyebilir (admin panelden)
CREATE POLICY "Anyone can insert codes" ON reward_codes FOR INSERT WITH CHECK (true);

-- Herkes link silebilir (admin panelden)
CREATE POLICY "Anyone can delete links" ON reward_links FOR DELETE USING (true);

-- Herkes kod silebilir (admin panelden)
CREATE POLICY "Anyone can delete codes" ON reward_codes FOR DELETE USING (true);
