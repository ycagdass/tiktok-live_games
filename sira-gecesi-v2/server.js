// Sıra Gecesi v2 — ortak sunucu modülü üzerinden çalışır (port 3200)
const { baslat } = require('../ortak/sunucu');

baslat({
  dir: __dirname,
  port: 3200,
  baslik: 'Sıra Gecesi v2',
  ikon: '🪔',
});
