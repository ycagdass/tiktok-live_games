# 🎻 Karadeniz Horonu (3B Temalı Varyant) — Port 3500

Ortak modüller (`/ortak/*` ve `/karakterler/*`) kullanılarak geliştirilmiş **3B Karadeniz Yayla Horonu** oyunu.

## Özellikler
- **Karadeniz Yaylası**: Zümrüt yeşili çiçekli yayla çimeni, sisli Kaçkar dağları, ladin ağaçları, ahşap yayla evleri (serender) ve ortada bakır kuymak kazanı ile yayla ateşi.
- **7/8 Kemençe & Tulum Sesi (`public/js/ses.js`)**: Web Audio ile kodla üretilen kıvrak çift tel Karadeniz kemençesi ve tulum dem/ezgi sesi.
- **Beğeni Arttıkça Hızlanan Horon Halkası**:
  - Gelen beğeniler (`like`) `horonSpeed` çarpanını (`1.0x` → `3.4x`) ve kemençe/tulum BPM temposunu (`112` → `198 BPM`) doğrudan artırır.
  - Halka dönüş hızı ve karakterlerin dik horon omuz titretme hareketi beğeniyle birlikte gözle görülür biçimde hızlanır!
- **Hediye Eylemleri (`hediyeler.json`)**:
  - `cay` (1 · Rize Çayı), `kemence` (10 · Kemençeci Ol), `horonbasi` (20 · Horon Başı Ol), `tulum` (35 · Tulumcu Ol), `kuymak` (50 · Kuymak İkramı), `sis` (99 · Yayla Sisi İndir), `havaifisek` (199), `alasagi` (500+ · Dik Horon & Alaşağı Maksimum Hız).

## Kurulum ve Çalıştırma
```bash
cd horon
npm start
```
- **Kontrol / Demo Paneli**: `http://localhost:3500`
- **Yayın / Pencere Yakalama Modu**: `http://localhost:3500/?clean`
- Windows'ta çift tıklayarak başlatmak için: `BASLAT.bat`
