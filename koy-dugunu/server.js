// Açık Hava Köy Düğünü — ortak sunucu modülü üzerinden çalışır (port 3400)
const { baslat } = require('../ortak/sunucu');

baslat({
  dir: __dirname,
  port: 3400,
  baslik: 'Köy Düğünü',
  ikon: '🥁',
});
