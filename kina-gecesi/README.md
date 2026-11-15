# 🕯️ Kına Gecesi (3B Temalı Varyant) — Port 3300

Ortak modüller (`/ortak/*` ve `/karakterler/*`) kullanılarak geliştirilmiş **3B Kına Gecesi** oyunu.

## Özellikler
- **Ortada Gelin Tahtı ve Kına Tepsisi**: Kırmızı tül cibinlikli altın-bordo Gelin Tahtında kırmızı bindallılı ve al duvaklı **Gelin** oturur; önünde mumları yanan altın kına tepsisi yer alır.
- **Hediyeyle Kına Yakma & Mum Dağıtma**:
  - `kina` (1 jeton): Geline kına yakılır, tepsi mumları ve kına kıvılcımları parlar.
  - `mum` (5 jeton): Kına halkasındaki herkese yanan kına mumu dağıtılır.
  - `halaybasi` (10), `cerez` (20), `tef` (30), `nedime` (50), `altin` (99).
- **Büyük Hediyede Gelin Ağlar & Müzik Değişir (`aglat` · 200+ jeton)**:
  - Gelin ellerini yüzüne götürüp başını eğer, gözyaşı damlaları (`😭` / `💧`) dökülür.
  - Salon ışıkları duygusal mor-bordo spota döner ve Web Audio müzik motoru neşeli kına ritminden duygusal **"Yüksek Yüksek Tepelere"** türkü ezgisine geçer!
- **Karakter Seçimi ve Küfür Filtresi**: `bocek`, `kedi`, `kopek`, `insan`, `karisik` ve `!kedi` / `!köpek` / `!insan` / `!böcek` komutları ile `filtre.json` küfür filtresi dahildir.

## Kurulum ve Çalıştırma
```bash
cd kina-gecesi
npm start
```
- **Kontrol / Demo Paneli**: `http://localhost:3300`
- **Yayın / Pencere Yakalama Modu**: `http://localhost:3300/?clean`
- Windows'ta çift tıklayarak başlatmak için: `BASLAT.bat`
