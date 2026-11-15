# 🌶️ Sıra Gecesi (3B) — Port 3100

TikTok LIVE yayınında izleyicilerin yorum, beğeni ve hediyelerle katıldığı **3B Three.js sıra gecesi oyunu**.

## Özellikler
- **3B Sıra Gecesi Salonu**: Arkada orkestra sahnesi (`saz`, `solist`, `darbuka`), ortada çiğ köfte tepsisi ve 6 yoğurucu, etrafında 3 iç içe halay halkası, yanlarda 10 yer masası ve başköşe.
- **Karakter Seçimi Sistemi (`/karakterler/index.js`)**:
  - Seçilebilir türler: `bocek` (varsayılan), `kedi`, `kopek`, `insan`, `karisik`.
  - Yayıncı `ayarlar.json` veya sağ panelden varsayılan türü belirler; izleyiciler `!kedi`, `!köpek`, `!insan`, `!böcek` yazarak kendi türünü seçebilir.
  - Sazcı, solist, darbukacı, çiğ köfteci ve halay başı seçili türden doğar; hediyeyle rol alan izleyici kendi türünü korur.
- **Karakter Önizleme**: `http://localhost:3100/karakter.html` üzerinden tüm tür, renk, kıyafet ve animasyonları (`yuru`, `halayCek`, `calgiCal`, `otur`, `kutla`, `hediyeHareketi`) canlı inceleyebilirsiniz.

## Kurulum ve Çalıştırma
```bash
cd sira-gecesi
npm install
npm start
```
- **Kontrol / Demo Paneli**: `http://localhost:3100`
- **Yayın / Pencere Yakalama Modu**: `http://localhost:3100/?clean`
- **Karakter Önizleme**: `http://localhost:3100/karakter.html`
- Windows'ta çift tıklayarak başlatmak için: `BASLAT.bat`

## TikTok LIVE Studio Pencere Yakalama Notu
1. `BASLAT.bat` ile oyunu başlatın.
2. TikTok LIVE Studio'da **Kaynak Ekle → Pencere Yakalama** ile `localhost:3100/?clean` penceresini seçin.
3. Kendi `.mp3/.wav/.ogg` parçalarınızı `müzik/` klasörüne atabilirsiniz; klasör boşsa Web Audio davul-zurna sentezleyicisi otomatik çalar.
