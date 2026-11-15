# 🪔 Sıra Gecesi v2 (3B) — Port 3200

Ortak sunucu, hediye eşleme, küfür filtresi ve karakter modülü üzerinde çalışan geliştirilmiş **Sıra Gecesi v2** sürümü.

## Yenilikler ve Özellikler
- **Yorumla Doğma ve Ad Etiketi**: Yorum yazan her izleyici kendi adıyla sahnede karakter olarak doğar; adı ve rolü karakterin başının üstünde net biçimde görünür.
- **Beğeniyle Hızlanan Halay**: Gelen beğeniler (`like`) sahne enerjisini ve halay dönüş/adımlama hızını (`likeBoost`) artırır.
- **Özel Hediye Olayları (`hediyeler.json`)**:
  - `havaifisek` (Havai Fişek Patlat · 199 jeton)
  - `cay` (Herkese Çay İkramı · 50 jeton)
  - `solist` (Solist Değişimi · 30 jeton)
  - `cigkofte` (1), `darbuka` (5), `halaybasi` (10), `isot` (20), `saz` (99), `cosku` (1000+)
- **Teşekkür Listesi**: Yarışma/rekabet yerine samimi **"🙏 Bu Gece En Çok Hediye Atanlar"** teşekkür panosu.
- **Küfür ve Nefret Filtresi (`filtre.json` & `/ortak/filtre.js`)**: Uygunsuz yorumlar ekrana ve konuşma balonlarına basılmadan otomatik engellenir; engellenen sayısı sağ panelde izlenir.

## Kurulum ve Çalıştırma
> Not: Bağımlılıklar (`three`, `tiktok-live-connector`) ortak sunucu tarafından otomatik olarak `../sira-gecesi/node_modules` üzerinden çözümlenir.

```bash
cd sira-gecesi-v2
npm start
```
- **Kontrol / Demo Paneli**: `http://localhost:3200`
- **Yayın / Pencere Yakalama Modu**: `http://localhost:3200/?clean`
- Windows'ta çift tıklayarak başlatmak için: `BASLAT.bat`
