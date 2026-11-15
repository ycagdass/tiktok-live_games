# 🎉 TikTok LIVE Halay, Düğün, Sıra Gecesi, Kına ve Horon Oyunları

TikTok canlı yayınlarında izleyicilerin **yorum, beğeni ve hediyelerle** sahnede kendi adlarıyla doğup halay çektiği, horon teptiği, çalgı çaldığı ve ikramda bulunduğu interaktif 2B/3B geleneksel eğlence oyunları paketi.

> **Kaynak ve Atıf**: Bu proje, [bilallturan/Tiktok-Dugun-Halay](https://github.com/bilallturan/Tiktok-Dugun-Halay) açık kaynak deposu temel alınarak geliştirilmiştir. Orijinal projedeki temel mekanikler korunmuş; üzerine **ortak 4 tür karakter seçimi sistemi (`bocek`, `kedi`, `kopek`, `insan`)**, **gelişmiş `sira-gecesi-v2` (teşekkür listesi, küfür filtresi, havai fişek)**, **3 yeni temalı tören varyantı (`kina-gecesi`, `koy-dugunu`, `horon`)**, **yayın bekleme (`YAYIN BEKLENİYOR`) desteği** ve **performans/FPS optimizasyonları** eklenmiştir.

---

## 🎮 Oyun Listesi ve Portlar

| # | Klasör | Oyun Adı | Boyut | Port | Kontrol Paneli | Sahne URL (`?clean`) |
|---|--------|----------|-------|------|----------------|----------------------|
| 1 | `canli-dugun/` | 💍 **Canlı Düğün** | 2B Canvas | `3000` | `http://localhost:3000` | `http://localhost:3000/?clean` |
| 2 | `sira-gecesi/` | 🌶️ **Sıra Gecesi** | 3B Three.js | `3100` | `http://localhost:3100` | `http://localhost:3100/?clean` |
| 3 | `sira-gecesi-v2/` | 🪔 **Sıra Gecesi v2** | 3B Three.js | `3200` | `http://localhost:3200` | `http://localhost:3200/?clean` |
| 4 | `kina-gecesi/` | 🕯️ **Kına Gecesi** | 3B Three.js | `3300` | `http://localhost:3300` | `http://localhost:3300/?clean` |
| 5 | `koy-dugunu/` | 🥁 **Açık Hava Köy Düğünü** | 3B Three.js | `3400` | `http://localhost:3400` | `http://localhost:3400/?clean` |
| 6 | `horon/` | 🎻 **Karadeniz Horonu** | 3B Three.js | `3500` | `http://localhost:3500` | `http://localhost:3500/?clean` |

- **3B Karakter Önizleme Sayfası**: Herhangi bir 3B oyunda `/karakter.html` adresinden (ör. `http://localhost:3200/karakter.html`) tüm karakter türlerini, renk/kıyafet seçeneklerini ve animasyonları canlı deneyebilirsiniz.

---

## 🚀 Kurulum ve Başlatma

### 1. Gereksinimler
- **Node.js `v20`** veya üstü ([nodejs.org](https://nodejs.org))
- Ücretsiz **Euler Stream API Anahtarı** (`euler_...` — [eulerstream.com](https://www.eulerstream.com))

### 2. Bağımlılıkları Kurma
İlk kurulumda `canli-dugun` ve `sira-gecesi` içindeki paketleri yükleyin (`sira-gecesi-v2`, `kina-gecesi`, `koy-dugunu` ve `horon` ortak modül üzerinden `sira-gecesi/node_modules` paketlerini paylaşır):
```bash
cd canli-dugun && npm install
cd ../sira-gecesi && npm install
```

### 3. Ayarları Yapılandırma (`ayarlar.json`)
Güvenlik gereği `ayarlar.json` dosyaları `.gitignore` içindedir. Kullanacağınız oyunun klasöründeki `ayarlar.ornek.json` dosyasını **`ayarlar.json`** olarak kopyalayın ve doldurun:
```json
{
  "username": "tiktok_kullanici_adin",
  "signApiKey": "euler_xxxxxxxxxxxx",
  "karakter": "bocek",
  "izleyiciSecer": true
}
```
> *Not: `signApiKey` anahtarını tek bir oyunun `ayarlar.json` dosyasına yazmanız yeterlidir; diğer oyunlar anahtarı otomatik olarak okur.*

### 4. Başlatma
- **Windows (Tek Menü):** Kök dizindeki **`BASLAT-HEPSI.bat`** dosyasına çift tıklayıp `1-6` arasından istediğiniz oyunu seçin.
- **Komut Satırı:**
  ```bash
  node sira-gecesi-v2/server.js   # Port 3200
  ```

### 5. TikTok LIVE Studio & OBS Bağlantısı
- TikTok LIVE Studio'da **Bağlantı (Link)** kaynağı kullanırken `localhost` yerine **`http://127.0.0.1.nip.io:3200/?clean`** adresini veya **Pencere Yakalama (Window Capture)** kaynağını kullanın.
- Ayrıntılı **OBS Sanal Kamera**, **TikTok LIVE Studio Pencere Yakalama** ve **Sorun Giderme** adımları için [`KURULUM.md`](./KURULUM.md) dosyasına bakın.

---

## 🎭 Karakter Seçimi Sistemi (`karakterler/`)

Tüm oyunlar ortak `karakterYap(tur, renk, ad)` arayüzünü kullanır:
- 🪳 **`bocek`** — Hamam Böceği *(varsayılan)*
- 🐱 **`kedi`** — Kedi *(S-kıvrımlı sallanan kuyruk, kulak hareketi, halayda iki ayak üstüne kalkış)*
- 🐶 **`kopek`** — Köpek *(sallanan kuyruk, sarkık kulaklar, burun/dil, halayda iki ayak üstüne kalkış)*
- 🧑 **`insan`** — İnsan *(stilize yöresel figür, halayda el ele tutuşma)*
- 🎲 **`karisik`** — Her izleyiciye kendi ID tohumuna göre rastgele tür atanır.

İzleyiciler `"izleyiciSecer": true` iken sohbette **`!kedi`**, **`!köpek`**, **`!insan`**, **`!böcek`** (veya `!kedi turuncu`) yazarak karakterlerini anında değiştirebilir.

---

## 🧩 Ortak Modül Mimarisi

- `karakterler/` — 2B ve 3B karakter üretimi, ortak animasyon arayüzü (`yuru`, `halayCek`, `calgiCal`, `otur`, `kutla`, `hediyeHareketi`) ve GPU bellek temizleyici (`karakterTemizle`)
- `ortak/sunucu.js` — Ortak HTTP + SSE + TikTok LIVE (`tiktok-live-connector`) sunucusu
- `ortak/hediye-esle.js` — Hediye ID / ad / jeton eşleme modülü
- `ortak/filtre.js` — Türkçe küfür ve nefret söylemi filtresi (`filtre.json` destekli)
- `ortak/canli-baglanti.js` — Tarayıcı tarafı ortak SSE, kural ve ayar senkronizasyonu

---

## 📜 Lisans ve Ticari Kullanım

Bu proje [`LICENSE`](./LICENSE) dosyasında belirtilen **Ticari Olmayan Açık Kaynak Lisansı** ile sunulmaktadır:
- Kişisel kullanım, inceleme ve kar amacı gütmeyen canlı yayınlar için **ücretsiz ve açıktır**.
- **Ticari amaçla kullanım (satış, kiralama, ücretli kurulum/hizmet veya ticari ürünlere entegrasyon) kesinlikle yasaktır.** Ticari kullanım talepleri için geliştirici ile görüşülmesi gerekmektedir.
- Tüm kopyalarda bu projeye ve orijinal [bilallturan/Tiktok-Dugun-Halay](https://github.com/bilallturan/Tiktok-Dugun-Halay) deposuna atıf korunmalıdır.
