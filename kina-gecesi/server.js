// Kına Gecesi — ortak sunucu modülü üzerinden çalışır (port 3300)
const { baslat } = require('../ortak/sunucu');

baslat({
  dir: __dirname,
  port: 3300,
  baslik: 'Kına Gecesi',
  ikon: '🕯️',
});
