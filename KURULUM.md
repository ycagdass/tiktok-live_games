# Kurulum ve Canlı Yayın Rehberi (OBS & TikTok LIVE Studio)

Bu projede **6 adet** geleneksel eğlence oyunu bulunur. Hepsi aynı kurulum mantığıyla çalışır:

| Klasör | Oyun | Port / Kontrol Paneli | Yayına Verilecek Sahne (`?clean`) |
|---|---|---|---|
| `canli-dugun/` | Canlı Düğün (2B Canvas) | `http://localhost:3000` | `http://localhost:3000/?clean` |
| `sira-gecesi/` | Sıra Gecesi (3B Three.js) | `http://localhost:3100` | `http://localhost:3100/?clean` |
| `sira-gecesi-v2/` | Sıra Gecesi v2 (3B + Teşekkür + Filtre) | `http://localhost:3200` | `http://localhost:3200/?clean` |
| `kina-gecesi/` | Kına Gecesi (3B Gelin & Kına) | `http://localhost:3300` | `http://localhost:3300/?clean` |
| `koy-dugunu/` | Köy Düğünü (3B Meydan & Çay Ocağı) | `http://localhost:3400` | `http://localhost:3400/?clean` |
| `horon/` | Karadeniz Horonu (3B Halka & Kemençe) | `http://localhost:3500` | `http://localhost:3500/?clean` |

---

## 1. Node.js Kurulumu

https://nodejs.org adresinden **LTS** sürümünü (`v20` veya üstü) indirip kurun.

---

## 2. Euler Stream Ücretsiz API Anahtarı (`euler_...`) ve `ayarlar.json`

Oyun, TikTok yayınındaki yorum, beğeni ve hediyeleri **tiktok-live-connector** kütüphanesiyle okur.

1. https://www.eulerstream.com adresine ücretsiz üye olun ve panelden **API Key** oluşturun (`euler_...` ile başlar).
2. Oynayacağınız oyunun klasöründeki (ör. `sira-gecesi-v2/ayarlar.json` veya `sira-gecesi/ayarlar.json`) dosyayı Not Defteri ile açın:

```json
{
  "username": "tiktok_kullanici_adin",
  "signApiKey": "euler_buraya_kendi_anahtarini_yapistir",
  "karakter": "bocek",
  "izleyiciSecer": true
}
```

- **`username`**: TikTok kullanıcı adınız (`@` işareti olmadan). İsterseniz boş bırakıp oyun açılınca sağ üstteki kutudan da yazabilirsiniz.
- **`signApiKey`**: Euler Stream anahtarınız. *(Not: Tek bir oyunun `ayarlar.json` dosyasına `signApiKey` yazmanız yeterlidir; diğer 5 oyun anahtarı otomatik olarak oradan okur!)*

---

## 3. Oyunu Başlatma

Ana klasördeki **`BASLAT-HEPSI.bat`** dosyasına (veya ilgili oyunun klasöründeki **`BASLAT.bat`** dosyasına) çift tıklayın.

Açıldığında **3 pencere** gelir:
1. **Siyah `SUNUCU` penceresi**: Arka planda TikTok bağlantısını yapar, yayın boyunca **kapatmayın**.
2. **Dikey (`9:16`) Kenarlıksız Sahne Penceresi (`?clean`)**: Yayına verilecek asıl oyun ekranıdır.
3. **Kontrol Paneli Penceresi (`http://localhost:PORT`)**: Sağ üstten kullanıcı adı bağlama, demo test düğmeleri ve gelen hediyeleri görme ekranıdır.

---

## 4. "TikTok Yayında İlla Kamera İstiyor!" Sorununun Kesin Çözümü (OBS Sanal Kamera)

TikTok'ta yayın açarken (gerek **TikTok LIVE Studio**'da kamera doğrulaması/sahnesi istendiğinde, gerek **TikTok Web / Mobil Kamera** yayınında) TikTok sizden zorunlu olarak bir **Kamera (Webcam)** kaynağı ister.

Fiziksel kameranızı açmadan **doğrudan oyun ekranını TikTok'a kamera gibi göstermenin** en kesin yolu **OBS Sanal Kamera (OBS Virtual Camera)** kullanmaktır:

### Adım A — OBS Studio'yu Dikey (9:16) Yapın ve Oyunu Ekleyin
1. **OBS Studio**'yu açın (yüklü değilse https://obsproject.com adresinden ücretsiz kurun).
2. Sağ alttan **Ayarlar (Settings) → Video** sekmesine girin:
   - **Temel (Tuval) Çözünürlüğü (Base Resolution):** `1080x1920` (elle yazabilirsiniz)
   - **Çıkış (Boyutlandırılmış) Çözünürlüğü (Output Resolution):** `1080x1920`
   - **Uygula (Apply) → Tamam (OK)** deyin. Artık OBS ekranınız dikey telefon boyutundadır.
3. OBS'de alt ortadaki **Kaynaklar (Sources)** kutusunda **`+`** butonuna basın → **Tarayıcı (Browser)** seçin ve adını `TikTok Oyun` koyup Tamam deyin.
4. Açılan özellikler penceresinde şu ayarları yapın:
   - **URL:** `http://localhost:3200/?clean` *(Hangi oyunu açtıysanız onun portunu yazın: `3000`, `3100`, `3200`, `3300`, `3400` veya `3500`. Sonundaki `/?clean` sağdaki kontrol panelini gizler, sadece sahneyi gösterir).*
   - **Genişlik (Width):** `1080`
   - **Yükseklik (Height):** `1920`
   - **Ses kontrolünü OBS üzerinden yap (Control audio via OBS):** İşaretleyin (böylece oyun müziği doğrudan OBS ses mikserine düşer).
   - **Tamam**'a basın. Oyun sahnesi OBS'e tam ekran dikey olarak gelecektir!

### Adım B — OBS Sanal Kamerayı Başlatın
1. OBS Studio'nun sağ alt köşesindeki **Kontroller (Controls)** bölümünden **"Sanal Kamerayı Başlat" (Start Virtual Camera)** butonuna tıklayın.
2. Artık bilgisayarınızda **`OBS Virtual Camera`** adında gerçek bir webcam varmış gibi çalışır ve içinde oyun görünür!

### Adım C — TikTok'ta Kamera Olarak "OBS Virtual Camera" Seçin
- **Durum 1: TikTok LIVE Studio "Kamera" İstiyorsa:**
  1. TikTok LIVE Studio'da **Kamera (Camera)** ekleme penceresi açıldığında cihaz listesinden **`OBS Virtual Camera`**'yı seçin.
  2. Çözünürlüğü `1080x1920` seçip sahneye tam ekran yayın. TikTok kameranızın açık olduğunu görür ve kamera zorunluluğu tamamen çözülür!
- **Durum 2: TikTok LIVE Studio "Oyun + Gerçek Yüz Kamerası" Doğrulaması İstiyorsa:**
  1. Ana kaynak olarak **Pencere Yakalama (Window Capture)** veya **Kamera (`OBS Virtual Camera`)** ile oyunu tam ekran koyun.
  2. Eğer TikTok algoritma kontrolü için fiziksel kameranızı da sahnede görmek isterse, **Kaynak Ekle → Kamera** diyerek kendi webcam'inizi ekleyin, boyutunu küçültüp ekranın bir köşesine koyun (veya katman sırasını oyun kaynağının altına/arkasına çekin).
- **Durum 3: OBS'den Doğrudan Yayın (Stream Key / Yayın Anahtarınız Varsa):**
  - TikTok'tan Stream Key alabiliyorsanız TikTok LIVE Studio'ya hiç gerek kalmadan OBS'de **Ayarlar → Yayın (Stream)** kısmına TikTok Sunucu URL ve Yayın Anahtarınızı girip doğrudan **Yayını Başlat** diyebilirsiniz.

### Adım D — Oyun Sesinin Yayına Gitmesi
- Oyunu başlattığınızda ses gelmiyorsa, açık olan kontrol paneli penceresinde (`http://localhost:3200`) sağ üstteki **`🔇 Sesi Aç`** butonuna bir kez tıklayın.
- TikTok LIVE Studio kullanıyorsanız sol alttaki **Ses Mikseri (Audio Mixer)** kısmında **Masaüstü Sesi (Desktop Audio)** açık olduğundan emin olun; oyunun müziği ve efektleri masaüstü sesinden yayına gider.

---

## 5. TikTok LIVE Studio'da Doğrudan Pencere Yakalama (OBS Kullanmadan)

OBS kullanmadan doğrudan TikTok LIVE Studio ile yakalamak isterseniz:
1. **TikTok LIVE Studio**'yu açın ve yayın yönünü **Dikey (9:16 - 1080x1920)** olarak seçin.
2. `BASLAT.bat` çalıştığında açılan **kenarlıksız dikey pencereyi (`?clean`)** kapatmayın ve **simge durumuna küçültmeyin (minimize etmeyin)** (Windows küçültülen pencerelerin çizimini durdurduğu için yayında donar; arka planda açık kalabilir).
3. TikTok LIVE Studio'da **Kaynak ekle (Add Source) → Pencere yakalama (Window Capture)** seçin ve `[chrome.exe]: Sıra Gecesi` / `[msedge.exe]` sahne penceresini seçin.
4. Siyah ekran olursa **Uyumluluk modu (Compatibility Mode)** kutucuğunu işaretleyin.
5. Kamera sorarsa yukarıdaki **4. Adımdaki `OBS Virtual Camera`** yöntemini kullanın.

---

## 6. Sık Karşılaşılan Sorunlar ve Çözümleri

| Belirti / Mesaj | Neden Olur ve Çözümü |
|---|---|
| **`Failed to retrieve Room ID from all sources`** veya **`YAYIN BEKLENİYOR: @kullanici şu an yayında değil`** | **Bu bir kod arızası değildir!** Yazdığınız TikTok hesabı **o anda henüz canlı yayında değilse** TikTok henüz bir "Oda Numarası (Room ID)" oluşturmamıştır. Sunucu artık bu durumda hata vermek yerine otomatik olarak **sarı `YAYIN BEKLENİYOR` moduna** geçer ve **30 saniyede bir** kontrol eder. Siz TikTok'ta **"Yayına Geç (Go Live)"** tuşuna bastığınız anda 30 saniye içinde kendiliğinden yeşil **`CANLI: @kullanici`** durumuna geçer! |
| **Yayını açtım ama hala bağlanmıyor** | 1) Kullanıcı adınızı `@` olmadan doğru yazdığınızdan emin olun. 2) `ayarlar.json` içine `euler_` ile başlayan `signApiKey` anahtarınızı girdiğinizden emin olun (ücretsiz Euler Stream hesabı şarttır). |
| **TikTok yayında illa kamera istiyor** | Yukarıdaki **4. Bölümde** anlatıldığı gibi **OBS Studio → Sanal Kamerayı Başlat (Start Virtual Camera)** özelliğini açıp TikTok'ta kamera olarak **`OBS Virtual Camera`** seçin. |
| **Oyun müziği çalmıyor** | Tarayıcılar otomatik sesi engelleyebilir; oyun penceresine bir kez tıklayın veya sağ üstteki **`Sesi Aç`** düğmesine basın. Kendi şarkılarınızı oyunun içindeki `müzik/` klasörüne `.mp3` olarak atabilirsiniz. |
| **`rate limit` hatası** | Ücretsiz Euler anahtarının saatlik istek sınırı dolmuştur. Sürekli Bağlan/Kes yapmayın; program 45 saniye bekleyip kendisi bağlanır. |

---

## 7. Oyunda İzleyici Komutları ve Etkileşim

| İzleyici Eylemi | Oyunda Ne Olur? |
|---|---|
| **Yayına girer / Yorum yazar** | Adıyla karakter olarak sahnede doğar, adı karakterin üstünde görünür |
| **`!kedi`, `!köpek`, `!insan`, `!böcek` yazar** | İzleyicinin karakteri anında seçtiği türe dönüşür |
| **`halay` / `halaya katıl` yazar** | Karakter halay halkasına / sırasına girer |
| **`oyna` / `zıpla` yazar** | Karakter zıplar ve kutlama animasyonu yapar |
| **`kadın` / `erkek` yazar** | Karakterin kıyafet/görünüm stili değişir |
| **Beğeni (Like) gönderir** | Halay ve müzik coşkusu hızlanır, kalpler uçar |
| **Hediye gönderir** | `hediyeler.json` içindeki jeton karşılığına göre özel olay tetiklenir (Çiğ köfteci, Halay başı, Herkese çay, Sazcı, Solist, Darbukacı, Acı isot, Havai fişek coşkusu, Kına yakma vb.) |
