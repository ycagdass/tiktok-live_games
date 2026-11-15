# 🎉 TikTok LIVE Halay, Düğün, Sıra Gecesi, Kına ve Horon Oyunları

TikTok canlı yayınlarında izleyicilerin **yorum, beğeni ve hediyelerle** sahnede kendi adlarıyla doğup halay çektiği, horon teptiği, çalgı çaldığı ve ikramda bulunduğu geleneksel eğlence oyunları paketi.

> **Kaynak ve Atıf**: Bu proje, [bilallturan/Tiktok-Dugun-Halay](https://github.com/bilallturan/Tiktok-Dugun-Halay) açık kaynak deposu temel alınarak geliştirilmiştir; ortak karakter seçimi sistemi (`bocek`, `kedi`, `kopek`, `insan`), `sira-gecesi-v2` ve temalı tören varyantları (`kina-gecesi`, `koy-dugunu`, `horon`) eklenmiştir.

---

## 🎮 Oyun Listesi ve Portlar

| # | Klasör | Oyun Adı | Boyut | Port | Demo / Kontrol Adresi | Yayın Modu (`?clean`) |
|---|--------|----------|-------|------|-----------------------|-----------------------|
| 1 | `canli-dugun/` | 💍 **Canlı Düğün** | 2B Canvas | `3000` | `http://localhost:3000` | `http://localhost:3000/?clean` |
| 2 | `sira-gecesi/` | 🌶️ **Sıra Gecesi** | 3B Three.js | `3100` | `http://localhost:3100` | `http://localhost:3100/?clean` |
| 3 | `sira-gecesi-v2/` | 🪔 **Sıra Gecesi v2** | 3B Three.js | `3200` | `http://localhost:3200` | `http://localhost:3200/?clean` |
| 4 | `kina-gecesi/` | 🕯️ **Kına Gecesi** | 3B Three.js | `3300` | `http://localhost:3300` | `http://localhost:3300/?clean` |
| 5 | `koy-dugunu/` | 🥁 **Açık Hava Köy Düğünü** | 3B Three.js | `3400` | `http://localhost:3400` | `http://localhost:3400/?clean` |
| 6 | `horon/` | 🎻 **Karadeniz Horonu** | 3B Three.js | `3500` | `http://localhost:3500` | `http://localhost:3500/?clean` |

- **3B Karakter Önizleme Sayfası**: Herhangi bir 3B oyunda `/karakter.html` adresinden (ör. `http://localhost:3100/karakter.html`) tüm karakter türlerini, kıyafet/renk seçeneklerini ve animasyonları canlı deneyebilirsiniz.

---

## 🚀 Nasıl Başlatılır?

### 1. Tek Menüden Başlatma (Windows)
Kök dizindeki **`BASLAT-HEPSI.bat`** dosyasına çift tıklayın. Açılan menüden `1-7` arasında seçim yaparak istediğiniz oyunu tek tuşla başlatabilirsiniz.

### 2. Komut Satırından Başlatma
İlk kurulumda `canli-dugun` ve `sira-gecesi` içindeki bağımlılıkları yükleyin (`sira-gecesi-v2`, `kina-gecesi`, `koy-dugunu` ve `horon` ortak modül sayesinde `sira-gecesi/node_modules` paketlerini otomatik paylaşır):
```bash
cd canli-dugun && npm install
cd ../sira-gecesi && npm install
```
Ardından istediğiniz oyunu başlatın:
```bash
node canli-dugun/server.js      # Port 3000
node sira-gecesi/server.js      # Port 3100
node sira-gecesi-v2/server.js   # Port 3200
node kina-gecesi/server.js      # Port 3300
node koy-dugunu/server.js       # Port 3400
node horon/server.js            # Port 3500
```

---

## 🎭 Karakter Seçimi Sistemi (`karakterler/`)

Tüm oyunlar ortak karakter sistemini (`karakterYap(tur, renk, ad)`) kullanır ve 4 seçilebilir türü destekler:
- 🪳 **`bocek`** — Hamam Böceği *(varsayılan)*
- 🐱 **`kedi`** — Kedi *(S-kıvrımlı sallanan kuyruk, oynayan sivri kulaklar, bıyıklar, halayda iki arka ayak üstüne kalkış)*
- 🐶 **`kopek`** — Köpek *(neşeyle sallanan kuyruk, sarkık kulaklar, burun/dil, halayda iki ayak üstüne kalkış)*
- 🧑 **`insan`** — İnsan *(sade stilize figür, yöresel yelek/elbise, halayda el ele tutuşma)*
- 🎲 **`karisik`** — Her izleyiciye kendi ID tohumuna göre rastgele tür atanır.

### Seçim Yolları
1. **Yayıncı Seçimi (`ayarlar.json` veya Sağ Panel)**:
   Her oyunun `ayarlar.json` dosyasında (veya sağ kontrol panelindeki **🎭 Karakter seçimi** düğmelerinden) ayarlanır:
   ```json
   {
     "username": "",
     "signApiKey": "",
     "karakter": "bocek",
     "izleyiciSecer": true
   }
   ```
2. **İzleyici Yorum Komutu**:
   `"izleyiciSecer": true` iken izleyiciler TikTok sohbetinde (veya demo yorum kutusunda) **`!kedi`**, **`!köpek`**, **`!insan`**, **`!böcek`** (veya renkli: `!kedi turuncu`, `!insan mavi`) yazarak kendi karakterlerini anında o türe dönüştürebilir.
3. **Rol Karakterleri**:
   Sazcı, solist, darbukacı, tefçi, kemençeci, tulumcu, çiğ köfteci, çaycı, gelin, damat ve halay başı yayıncının seçtiği türden doğar; hediyeyle rol alan izleyici kendi seçtiği türü korur.

---

## 🧩 Ortak Modül Mimarisi (`ortak/` ve `karakterler/`)

Kod tekrarını önlemek için TikTok bağlantısı, hediye eşleme, küfür filtreleme ve karakter üretimi kök dizindeki ortak modüllerden sunulur:
- `karakterler/index.js`, `karakterler/ortak.js`, `karakterler/parcalar3d.js`, `karakterler/bocek3d.js`, `karakterler/kedi3d.js`, `karakterler/kopek3d.js`, `karakterler/insan3d.js`, `karakterler/karakter2d.js`
- `ortak/sunucu.js` — Ortak HTTP + SSE + TikTok LIVE (`tiktok-live-connector`) + `/karakterler/` + `/ortak/` + `/three/` sunucusu
- `ortak/hediye-esle.js` — Ortak hediye ID / ad / jeton / minJeton eşleme modülü
- `ortak/filtre.js` — Türkçe küfür ve nefret söylemi filtresi (`filtre.json` destekli)
- `ortak/canli-baglanti.js` — Tarayıcı tarafı ortak SSE, kural ve ayar senkronizasyonu

---

## 🛠️ Teknik Notlar ve Varsayılan Tercihler
- **Güvenlik**: `ayarlar.json` dosyalarında `username` ve `signApiKey` alanları boş bırakılmıştır; API anahtarları asla repoya gömülmez.
- **Telifsiz İçerik**: Tüm 3B ve 2B karakterler, sahne dekorları ve enstrümanlar tamamen kodla (Three.js primitifleri ve HTML5 Canvas) üretilir. `müzik/` klasörü boş olduğunda her oyun kendi Web Audio sentezleyicisini (davul-zurna, kına/Yüksek Yüksek Tepelere ezgisi, 7/8 Karadeniz kemençe ve tulumu) otomatik çalar.
- **TikTok LIVE Studio Kurulumu**: Ayrıntılı Windows ve Pencere Yakalama adımları için [`KURULUM.md`](./KURULUM.md) dosyasına bakın.
