# 🥁 Açık Hava Köy Düğünü (3B Temalı Varyant) — Port 3400

Ortak modüller (`/ortak/*` ve `/karakterler/*`) kullanılarak geliştirilmiş **3B Açık Hava Köy Meydanı Düğünü** oyunu.

## Özellikler
- **Açık Hava Köy Meydanı**: Yıldızlı gece göğü, dolunay, arka planda pencereleri ışıklı kiremit çatılı köy evleri, ağaçlar ve direkler arasına gerilmiş renkli düğün ampulleri.
- **Gelin ve Damat Masası**: Çiçekli beyaz düğün takı altında Gelin ve Damat oturur; `gelindamat` (99 jeton) hediyesiyle çiftimize altın/takı takılır.
- **Meydanda Davul-Zurna & Bakır Semaverli Çay Ocağı**:
  - `cayocagi` (1 jeton): Köy çay ocağındaki bakır semaverden bütün meydana çay dağıtılır.
  - `davul` (5 jeton) ve `zurna` (25 jeton): İzleyici meydanda davulcu veya zurnacı olur.
  - `halaybasi` (10), `bahsis` (50), `havaifisek` (199), `konvoy` (500+ jeton düğün konvoyu coşkusu).
- **Karakter Seçimi ve Küfür Filtresi**: `bocek`, `kedi`, `kopek`, `insan`, `karisik` ve `!kedi` / `!köpek` / `!insan` / `!böcek` komutları ile `filtre.json` küfür filtresi dahildir.

## Kurulum ve Çalıştırma
```bash
cd koy-dugunu
npm start
```
- **Kontrol / Demo Paneli**: `http://localhost:3400`
- **Yayın / Pencere Yakalama Modu**: `http://localhost:3400/?clean`
- Windows'ta çift tıklayarak başlatmak için: `BASLAT.bat`
