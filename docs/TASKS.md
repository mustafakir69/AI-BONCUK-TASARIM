# Görevler

Durum işaretleri: `[ ]` yapılacak, `[~]` devam ediyor, `[x]` tamamlandı, `[!]` engelli.

## Mevcut aşama

**Aşama 0 — Planlama: tamamlandı (2026-11-08).**

### Tamamlanan işler

- [x] P0.1 Ürün vizyonu, hedef kullanıcılar, kapsam ve başarı ölçütlerini belgelemek
- [x] P0.2 Teknoloji seçeneklerini ve frontend/backend ayrımını gerekçelendirmek
- [x] P0.3 Katmanlı mimariyi, bağımlılık yönünü ve klasör sınırlarını tanımlamak
- [x] P0.4 Milimetre tabanlı koordinat ve görünüm dönüşümü kararını vermek
- [x] P0.5 Malzeme, yerleşim, çalışma alanı ve proje V1 modelini tasarlamak
- [x] P0.6 Başlangıç malzemelerini ve silme/devre dışı bırakma politikasını tanımlamak
- [x] P0.7 Sınır, döndürülmüş dikdörtgen, daire ve minimum aralık algoritmalarını belgelemek
- [x] P0.8 Zorunlu geometri test matrisini hazırlamak
- [x] P0.9 AI girdi/çıktı sözleşmesini, doğrulama hattını ve güvenlik kurallarını planlamak
- [x] P0.10 Yol haritasını küçük, test edilebilir görevlere ayırmak
- [x] P0.11 Aşama 1 yapılacaklarını ve kabul ölçütlerini hazırlamak
- [x] P0.12 AGENTS, README, CHANGELOG, karar ve görev kayıtlarını oluşturmak

### Aşama 0 doğrulama listesi

- [x] İstenen 11 Markdown dosyasının tümü mevcut
- [x] Uygulama kodu veya paket kurulumu yapılmadı
- [x] Frontend ve backend dizin sınırları hazırlandı
- [x] Doküman bağlantıları ve başlıkları gözden geçirildi
- [x] Temel gereksinimler veri modeli, mimari ve yol haritasında karşılandı

## Onay bekleyen aşama

**Aşama 1 — Temel uygulama.** Kullanıcı onayı olmadan başlanmayacaktır.

### Aşama 1 yapılacaklar listesi

- [ ] P1.1 `frontend` içinde Vite + React + TypeScript iskeletini oluştur
- [ ] P1.2 Node sürümü, paket yöneticisi ve kilit dosyası politikasını kaydet
- [ ] P1.3 TypeScript `strict`, lint, format ve test komutlarını yapılandır
- [ ] P1.4 Vitest + Testing Library duman testini kur
- [ ] P1.5 Uygulama renkleri, boşlukları ve tipografisi için temel CSS değişkenlerini tanımla
- [ ] P1.6 Türkçe uygulama kabuğunu ve üst araç çubuğunu oluştur
- [ ] P1.7 Sol malzeme, orta tuval ve sağ özellik paneli düzenini oluştur
- [ ] P1.8 Çalışma alanı genişlik/yükseklik formunu ve mm/cm seçimini ekle
- [ ] P1.9 Saf `toMillimeters` / `fromMillimeters` yardımcılarını ve sınır testlerini yaz
- [ ] P1.10 Boş Konva sahnesini açık gri zemin ve doğru en-boy oranıyla çiz
- [ ] P1.11 Zoom/pan görünüm durumunu model ölçülerinden ayır
- [ ] P1.12 Alanı ekrana sığdır ve pencere boyutu değişimini yönet
- [ ] P1.13 Araçlara Türkçe etiket, klavye odağı ve pasif durum ekle
- [ ] P1.14 200×250, 300×400 ve 100×150 mm senaryoları için test/elle kontrol yap
- [ ] P1.15 `typecheck`, test ve üretim derlemesini çalıştır
- [ ] P1.16 README, TASKS, DECISIONS ve CHANGELOG belgelerini sonuçla güncelle

### Aşama 1 kabul ölçütleri

- [ ] Uygulama belgelenen tek komutla geliştirme modunda açılıyor
- [ ] Üç ana panel ve üst araç çubuğu Türkçe ve kullanılabilir görünüyor
- [ ] Kullanıcı mm/cm ile geçerli alan boyutu girebiliyor; model mm saklıyor
- [ ] Boş tasarım alanı gerçek ölçü oranını koruyor
- [ ] Zoom/pan çalışma alanının fiziksel boyutunu değiştirmiyor
- [ ] Geçersiz/negatif/sonlu olmayan ölçüler kabul edilmiyor
- [ ] Birim ve duman testleri, tür denetimi ve üretim derlemesi geçiyor
- [ ] Malzeme yerleştirme henüz eklenmemiş; aşama sınırı korunuyor

## Gelecek aşamalar

Aşama 2–7 görev kırılımı [ROADMAP.md](ROADMAP.md) dosyasında tutulur. Her aşama başlamadan önce buraya ayrıntılı aktif görev listesi taşınır.

## Bilinen açık konular

- [ ] Aşama 1 başında desteklenecek Node sürümünü mevcut LTS ve bağımlılık gereksinimlerine göre doğrulamak
- [ ] Aşama 2'de malzeme görselinin proje JSON'unda veri URI olarak saklanmasının dosya boyutu etkisini ölçmek
- [ ] Aşama 3'te komut geçmişi için anlık görüntü ve terslenebilir komut yaklaşımını performansla karşılaştırmak
- [ ] Aşama 3'te 5.000 nesne hedefi için uzamsal indeks gerekip gerekmediğini ölçmek
- [ ] Ticari hedeflerden önce kumaş kenar payı (`edgeGapMm`) gereksinimini uzman kullanıcılarla doğrulamak

