# Değişiklik Geçmişi

Bu proje [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) yaklaşımını izler. Sürümler ürün olgunlaştıkça anlamsal sürümlemeye bağlanacaktır.

## [Yayımlanmadı]

### Planlanan

- Aşama 2: Gerçek malzeme veri modeli ve katalog yönetimi (kullanıcı onayı bekleniyor)

## [0.2.0] — 2026-11-08

### Eklendi

- React 19, TypeScript, Vite ve npm kilit dosyasıyla frontend uygulaması
- Sıkı TypeScript, ESLint, Vitest ve Testing Library kalite altyapısı
- Tamamen Türkçe, üç panelli ve responsive profesyonel editör arayüzü
- Sol örnek malzeme kütüphanesi ve Aşama 2 durum işaretleri
- Sağ tasarım özellikleri, çalışma alanı formu, ızgara ayarı ve malzeme sayacı
- Konva tabanlı boş çalışma alanı, dinamik ızgara, zoom, kaydırma ve ekrana sığdırma
- Milimetre/santimetre dönüşümü ve `1–5000 mm` alan doğrulaması
- Devre dışı işlemler için Aşama 3/4 açıklamaları
- Dokuz otomatik birim/bileşen testi

### Değiştirildi

- Konva çalışma alanı ayrı üretim parçası olarak tembel yüklenerek ilk paket küçültüldü
- README kurulum, çalışma, test ve üretim komutlarıyla güncellendi
- TypeScript, lint araç zincirinin desteklediği 6.0 hattına sabitlendi

### Güvenlik

- Geliştirme araç zincirindeki `minimatch` alt bağımlılığı düzeltilmiş sürüme kilitlendi; `npm audit` sonucu 0 açık

### Doğrulandı

- Tür denetimi, lint, 9 otomatik test, üretim derlemesi ve yerel HTTP 200 kontrolü başarılı

## [0.1.0] — 2026-11-08

### Eklendi

- Proje çalışma kurallarını içeren `AGENTS.md`
- Proje tanıtımı, teknoloji gerekçeleri ve klasör planını içeren `README.md`
- Ürün kapsamı, gereksinimler ve başarı ölçütleri
- Katmanlı frontend mimarisi ve ileri aşama FastAPI sınırı
- Malzeme, yerleşim, çalışma alanı ve sürümlü JSON proje modeli
- Döndürülmüş dikdörtgen, daire, sınır ve minimum aralık geometri yaklaşımı
- Yapılandırılmış AI istek/çıktı kuralları ve doğrulama hattı
- Aşama 0–7 yol haritası, test yöntemleri ve çıkış ölçütleri
- Aşama 1 için ayrıntılı yapılacaklar ve kabul listesi
- Teknik karar kaydı
- `frontend` ve `backend` için uygulama/test klasör iskeleti

### Not

- Bu sürüm yalnız Aşama 0 planlama çıktısıdır; uygulama kodu, paket veya AI entegrasyonu içermez.

