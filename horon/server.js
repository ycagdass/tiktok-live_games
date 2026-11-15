// Karadeniz Horonu — ortak sunucu modülü üzerinden çalışır (port 3500)
const { baslat } = require('../ortak/sunucu');

baslat({
  dir: __dirname,
  port: 3500,
  baslik: 'Karadeniz Horonu',
  ikon: '🎻',
});
