# 💍 Canlı Düğün (2B) — Port 3000

TikTok LIVE yayınında izleyicilerin yorum, beğeni ve hediyelerle katıldığı **2B geleneksel düğün ve halay oyunu**.

## Özellikler
- **2B Düğün Meydanı**: Ortada halay halkası, gelin ve damat masası, takı töreni, konfeti ve para yağmuru.
- **Karakter Seçimi (2B Canvas Sprite)**:
  - Türler: `bocek` (varsayılan hamam böceği), `kedi`, `kopek`, `insan`, `karisik`.
  - Yayıncı: `ayarlar.json` veya sağ panelden seçebilir.
  - İzleyici: Sohbette `!kedi`, `!köpek`, `!insan`, `!böcek` yazarak kendi karakterini dönüştürebilir.
- **Hediye Eylemleri (`hediyeler.json`)**:
  - `halaybasi` (Halay Başı Ol), `tepsi` (Çiğ Köfte Yoğur), `para` (Para Yağmuru), `taki` (Gelin & Damada Altın Tak), `cosku` (Salonu Coştur).

## Kurulum ve Çalıştırma
```bash
cd canli-dugun
npm install
npm start
```
- **Kontrol / Demo Paneli**: `http://localhost:3000`
- **Yayın / Pencere Yakalama Modu**: `http://localhost:3000/?clean`
- Windows'ta çift tıklayarak başlatmak için: `BASLAT.bat`

## TikTok LIVE Studio Pencere Yakalama Notu
1. `BASLAT.bat` dosyasını çalıştırın (540×960 dikey uygulama penceresi açılır).
2. TikTok LIVE Studio'da **Kaynak Ekle → Pencere Yakalama (Window Capture)** seçin ve açılan pencereyi ekleyin.
3. Gerçek yayına bağlanmak için `ayarlar.json` içine Euler Stream `signApiKey` değerinizi girin veya sağ panelden `@kullaniciadi` ile bağlanın (anahtarı asla git'e commit etmeyin).
