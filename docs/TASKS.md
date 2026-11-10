# Görevler

Durum işaretleri: `[ ]` yapılacak, `[~]` devam ediyor, `[x]` tamamlandı, `[!]` engelli.

## Mevcut aşama

**Aşama 7B.4 — kontrollü sağlık isteği yaşam döngüsü: tamamlandı (2026-11-10). Aşama 7C için kullanıcı onayı bekleniyor.**

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

## Aşama 1 — Tamamlanan işler

Kullanıcı onayı 2026-11-08 tarihinde alındı.

### Aşama 1 yapılacaklar listesi

- [x] P1.1 `frontend` içinde Vite + React + TypeScript iskeletini oluştur
- [x] P1.2 Node sürümü, paket yöneticisi ve kilit dosyası politikasını kaydet
- [x] P1.3 TypeScript `strict`, lint ve test komutlarını yapılandır
- [x] P1.4 Vitest + Testing Library duman testini kur
- [x] P1.5 Uygulama renkleri, boşlukları ve tipografisi için temel CSS değişkenlerini tanımla
- [x] P1.6 Türkçe uygulama kabuğunu ve üst araç çubuğunu oluştur
- [x] P1.7 Sol malzeme, orta tuval ve sağ özellik paneli düzenini oluştur
- [x] P1.8 Hedef motif genişlik/yükseklik formunu ve mm/cm seçimini ekle
- [x] P1.9 Saf `toMillimeters` / `fromMillimeters` yardımcılarını ve sınır testlerini yaz
- [x] P1.10 Konva sahnesini açık gri sonsuz düzlem olarak çiz
- [x] P1.11 Zoom/pan görünüm durumunu model ölçülerinden ayır
- [x] P1.12 Alanı ekrana sığdır ve pencere boyutu değişimini yönet
- [x] P1.13 Araçlara Türkçe etiket, klavye odağı ve pasif durum ekle
- [x] P1.14 200×250, 300×400 ve 100×150 mm motif senaryolarını otomatik testlerle doğrula; responsive kırılımları ekle
- [x] P1.15 `typecheck`, lint, test, güvenlik denetimi ve üretim derlemesini çalıştır
- [x] P1.16 README, TASKS, DECISIONS ve CHANGELOG belgelerini sonuçla güncelle

### Aşama 1 kabul ölçütleri

- [x] Uygulama belgelenen tek komutla geliştirme modunda açılıyor
- [x] Üç ana panel ve üst araç çubuğu Türkçe ve kullanılabilir görünüyor
- [x] Kullanıcı mm/cm ile geçerli motif boyutu girebiliyor; model mm saklıyor
- [x] Sonsuz tasarım düzlemi fiziksel genişlik/yükseklik sınırı taşımıyor
- [x] Zoom/pan fiziksel koordinatları ve motif ölçüsünü değiştirmiyor
- [x] Geçersiz/negatif/sonlu olmayan ölçüler kabul edilmiyor
- [x] Birim ve duman testleri, tür denetimi, lint ve üretim derlemesi geçiyor
- [x] Malzeme yerleştirme henüz eklenmemiş; aşama sınırı korunuyor

### Aşama 1 çalışma alanı revizyonu

- [x] P1R.1 Beyaz ve sınırlandırılmış tasarım sayfasını kaldırmak
- [x] P1R.2 Açık gri, her yöne kaydırılabilen sonsuz Konva düzlemi oluşturmak
- [x] P1R.3 `(0,0)` merkezli ve negatif değer destekli fiziksel koordinat sistemini kurmak
- [x] P1R.4 Dünya/ekran dönüşümlerini saf `domain/coordinates.ts` modülüne ayırmak
- [x] P1R.5 Sabit yatay/dikey cetvelleri ve zoom uyumlu 1/5/10/50/100 mm adımlarını eklemek
- [x] P1R.6 İmleç koordinatını cetvelle aynı dönüşümden hesaplamak
- [x] P1R.7 Genişlik/yükseklik ayarlarını hedef motif ölçüsü olarak yeniden adlandırmak
- [x] P1R.8 Sonsuz düzlemi sınırlamayan, açılıp kapatılabilir motif kılavuzu eklemek
- [x] P1R.9 Zoom/pan, negatif koordinat, cetvel adımı ve motif bağımsızlığı testlerini yazmak
- [x] P1R.10 İlgili mimari, veri modeli, geometri ve yol haritası belgelerini güncellemek

### Aşama 1 doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 3 dosya, 16 test
- [x] `npm run build` — uyarısız üretim çıktısı
- [x] `npm audit --audit-level=moderate` — 0 açık
- [x] Yerel Vite sunucusu — HTTP 200
- [!] Tarayıcı görsel QA yüzeyi bu çalışma oturumunda kullanılamadı; responsive CSS ve erişilebilirlik otomatik/kod kontrolleriyle doğrulandı

## Aşama 2 — Tamamlanan işler

Kullanıcı onayı 2026-11-08 tarihinde alındı.

- [x] P2.1 Kanonik `Material`, `MaterialDraft` ve dört geometri türünü oluşturmak
- [x] P2.2 Dört başlangıç malzemesini gerçek mm ölçüleri ve kararlı kimliklerle tanımlamak
- [x] P2.3 Ekleme/düzenleme penceresini Türkçe alanlar, renk seçici ve canlı önizlemeyle oluşturmak
- [x] P2.4 Kare/daire eşit kenar-çap ve pul delik çapı kurallarını doğrulamak
- [x] P2.5 Benzersiz kullanıcı malzemesi kimliği üretmek; aynı adlı kayıtları desteklemek
- [x] P2.6 Düzenleme ve açık onaylı silme akışını eklemek
- [x] P2.7 Kullanılan malzemeyi engelleyebilecek `usageCount` silme kapısını hazırlamak
- [x] P2.8 Sürümlü LocalStorage servisinde güvenli okuma/yazma ve bozuk kayıt kurtarmasını uygulamak
- [x] P2.9 Geometrik önizlemeleri mm oranlarından türetmek; pikseli yalnız sunumda kullanmak
- [x] P2.10 Mobil/masaüstü katalog kartları ve responsive düzenleme penceresini stillendirmek
- [x] P2.11 Alan, saklama ve kullanıcı akışı testlerini yazmak
- [x] P2.12 TypeScript, lint, test, üretim derlemesi ve güvenlik denetimini çalıştırmak

### Aşama 2 kabul ölçütleri

- [x] Dört başlangıç malzemesi doğru fiziksel ölçü ve geometriyle gösteriliyor
- [x] Kullanıcı geçerli malzemeyi ekleyebiliyor, düzenleyebiliyor ve onayla silebiliyor
- [x] Geçersiz ölçü, daire çapı ve pul delik çapı reddediliyor
- [x] Aynı adlı kayıtların kimlikleri benzersiz kalıyor
- [x] Katalog yenileme sonrasında geri yükleniyor; bozuk kayıt uygulamayı çökertmiyor
- [x] Sonsuz çalışma alanı, cetveller ve motif ölçü sistemi değiştirilmedi
- [x] Yerleştirme, çakışma, AI ve dışa aktarma kapsam dışında bırakıldı

### Aşama 2 doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 5 dosya, 29 test
- [x] `npm run build` — Vite üretim çıktısı başarılı
- [x] `npm audit --audit-level=moderate` — 0 açık
- [x] Yerel Vite sunucusu — HTTP 200
- [!] Tarayıcı görsel QA yüzeyi bu çalışma oturumunda kullanılamadı; responsive modal/katalog akışları bileşen testleri ve kod kontrolleriyle doğrulandı

## Aşama 3 — Tamamlanan işler

Kullanıcı onayı 2026-11-08 tarihinde alındı.

- [x] P3.1 Kimlikli, `materialId` bağlı ve mm koordinatlı `Placement` modelini oluşturmak
- [x] P3.2 Kare/dikdörtgenleri döndürülmüş çokgen, daire/pulu dış disk geometrisi olarak üretmek
- [x] P3.3 SAT ile döndürülmüş dikdörtgen çakışmasını uygulamak
- [x] P3.4 Daire–daire ve daire–dikdörtgen kesin çakışma testlerini uygulamak
- [x] P3.5 Şekil çiftlerinde kesin dış sınır uzaklığı ve minimum aralık kuralını uygulamak
- [x] P3.6 AABB ön elemesi ve 5.000 uzak yerleşimli aday doğrulamasını eklemek
- [x] P3.7 Katalog kartından yerleştirme modu ve yarı saydam geçerli/geçersiz önizleme eklemek
- [x] P3.8 Seçme, sürükleyerek taşıma, 15° döndürme ve silme araçlarını bağlamak
- [x] P3.9 Sağ panelde X/Y/açı düzenlemesi ve minimum aralık formunu çalıştırmak
- [x] P3.10 Delete, Escape, Ctrl+Z, Ctrl+Y ve Ctrl+Shift+Z klavye akışlarını eklemek
- [x] P3.11 Terslenebilir ve 100 komutla sınırlı geri al/yinele geçmişi oluşturmak
- [x] P3.12 Gerçek yerleşimlerden türetilen malzeme sayacı ve toplamı göstermek
- [x] P3.13 Kullanılan malzeme silmeyi engellemek ve nedeni kullanıcıya açıklamak
- [x] P3.14 Malzeme ölçüsü değişikliğini bütün tasarıma karşı doğrulayıp çakışmada reddetmek
- [x] P3.15 Sonsuz düzlem, negatif koordinat, pan/zoom ve cetvel dönüşümünü korumak
- [x] P3.16 Geometri, komut/durum ve uygulama entegrasyon testlerini tamamlamak
- [x] P3.17 TypeScript, ESLint, bütün testler ve üretim derlemesini doğrulamak

### Aşama 3 kabul ölçütleri

- [x] Dört malzeme geometrisi katalogdan seçilip dünya koordinatında yerleştirilebiliyor
- [x] Çakışan veya minimum aralığı ihlal eden aday kalıcı duruma girmiyor
- [x] Geçersiz sürükleme son geçerli konuma dönüyor
- [x] Seçim, taşıma, silme, döndürme ve mm koordinat düzenleme çalışıyor
- [x] Geri al/yinele düğmeleri ve klavye kısayolları çalışıyor
- [x] Sayaç yalnız gerçek yerleşimlerden türetiliyor
- [x] Kullanılan malzeme silinemiyor; riskli ölçü değişikliği reddediliyor
- [x] Motif kılavuzu görsel kalıyor; negatif ve motif dışı koordinatlar destekleniyor
- [x] Aşama 4 dosya/JPEG özellikleri ve yapay zekâ eklenmedi

### Aşama 3 doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 8 dosya, 50 test
- [x] `npm run build` — Vite üretim çıktısı başarılı
- [x] `npm audit --audit-level=moderate` — 0 açık
- [x] Yerel Vite sunucusu — HTTP 200
- [!] Tarayıcı görsel QA yüzeyi bu çalışma oturumunda kullanılamadı; etkileşimler uygulama entegrasyon testleri, derleme ve HTTP duman kontrolüyle doğrulandı

## Aşama 4 — Tamamlanan işler

Kullanıcı onayı 2026-11-08 tarihinde alındı.

- [x] P4.1 `schemaVersion: "1.0"` taşıyan okunabilir proje JSON modelini uygulamak
- [x] P4.2 Proje kimliği/adı/tarihleri, motif, minimum aralık, kullanılan malzemeler ve mm yerleşimlerini kaydetmek
- [x] P4.3 JSON sözdizimi, sürüm, kimlik, malzeme başvurusu, sonlu sayı ve geometri doğrulaması yapmak
- [x] P4.4 Geçersiz açma işleminde mevcut tasarımı değiştirmeyen atomik akışı kurmak
- [x] P4.5 Yerel katalog kimlik çakışmasını kaydı ezmeden yeniden eşlemek
- [x] P4.6 Yeni proje kimliği, varsayılan ad, temiz geçmiş ve kaydedilmemiş değişiklik onayı eklemek
- [x] P4.7 Kayıt anına göre çalışan ve undo/redo ile temiz duruma dönebilen değişiklik takibini eklemek
- [x] P4.8 Motif veya gerçek yerleşim sınırı seçilebilen PNG/JPEG dışa aktarma penceresini oluşturmak
- [x] P4.9 150/300/600 DPI, JPEG kalitesi/zemini ve şeffaf PNG seçeneklerini uygulamak
- [x] P4.10 Motif dışı kırpmaya açık onay ve piksel/bellek güvenlik sınırlarını uygulamak
- [x] P4.11 Zoom/pan/ızgara/cetvelden bağımsız kanonik mm Canvas çizimini ve pul deliğini uygulamak
- [x] P4.12 Gerçek yerleşim adetlerinden UTF-8 BOM'lu CSV malzeme raporu üretmek
- [x] P4.13 JSON, içe aktarma, değişiklik durumu, çıktı sınırları, DPI, bellek ve CSV testlerini tamamlamak
- [x] P4.14 TypeScript, ESLint, bütün testler, üretim derlemesi ve yerel HTTP kontrolünü çalıştırmak

### Aşama 4 kabul ölçütleri

- [x] Proje kullanılan katalog kayıtlarıyla birlikte JSON turunda veri kaybetmiyor
- [x] Bozuk, eksik başvurulu, çakışan veya aralık ihlalli dosya mevcut tasarımı bozmuyor
- [x] Aynı kimlikli farklı yerel malzeme sessizce ezilmiyor
- [x] Yeni proje yerleşimleri/geçmişi temizlerken yerel kataloğu koruyor
- [x] Kaydetme değişiklik göstergesini temizliyor; undo/redo kayıt anına göre doğru durumu gösteriyor
- [x] PNG/JPEG çıktısı yalnız boncukları gerçek fiziksel oran/dönüşle çiziyor
- [x] Döndürülmüş sınırlar, motif dışı uyarı ve çıktı boyut limitleri uygulanıyor
- [x] CSV adetleri yalnız gerçek yerleşimlerden türetiliyor

### Aşama 4 doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 11 dosya, 74 test
- [x] `npm run build` — Vite üretim çıktısı başarılı
- [x] `npm audit --audit-level=moderate` — 0 açık
- [x] Yerel Vite sunucusu — HTTP 200
- [!] Tarayıcı görsel QA yüzeyi bu çalışma oturumunda kullanılamadı; dışa aktarma matematiği, bileşen akışları, derleme ve HTTP duman kontrolüyle doğrulandı

## Aşama 5 — Tamamlanan işler

Kullanıcı onayı 2026-11-08 tarihinde alındı.

- [x] P5.1 Shift tıklama, dünya koordinatlı alan seçimi ve Ctrl+A çoklu seçimini eklemek
- [x] P5.2 Kısmi pozitif geometri kesişimi seçim politikasını uygulamak ve belgelemek
- [x] P5.3 Çoklu seçimi göreli konumları koruyarak atomik taşımak
- [x] P5.4 Ctrl+C/V/D ve benzersiz kimlikli, 10 mm varsayılan ofsetli kopyaları eklemek
- [x] P5.5 Ofset/tekrar kontrollü hassas çoğaltma ve 1.000/10.000 işlem limitini uygulamak
- [x] P5.6 Kalıcı, iç içe olmayan grup modelini ve Ctrl+G/Ctrl+Shift+G akışını eklemek
- [x] P5.7 Grup birlikte seçme, taşıma ve geometrik merkez çevresinde döndürmeyi uygulamak
- [x] P5.8 Gerçek döndürülmüş AABB sınırlarıyla sekiz hizalama/dağıtma işlemini eklemek
- [x] P5.9 15/30/45/90 derece ve özel açılı toplu döndürmeyi bağlamak
- [x] P5.10 Özelleştirilebilir 0,5/5 mm ok tuşu taşımasını uygulamak
- [x] P5.11 Toplu işlemleri etkilenen delta komutlarıyla tek undo/redo adımı yapmak
- [x] P5.12 Proje şemasını grup ve klavye ayarlarıyla `1.1` sürümüne yükseltmek
- [x] P5.13 `1.0` projelerini doğrulamayı gevşetmeden varsayılanlarla açmak
- [x] P5.14 Tam-proje doğrulamasını AABB sıralı etkin küme taramasıyla iyileştirmek
- [x] P5.15 Gelişmiş araç panelini responsive ve tamamen Türkçe hazırlamak
- [x] P5.16 Seçim, toplu işlem, grup, JSON ve 5.000 nesne testlerini tamamlamak

### Aşama 5 kabul ölçütleri

- [x] Shift, alan ve Ctrl+A seçimleri ile seçili boncuk sayısı doğru çalışıyor
- [x] Toplu taşıma/döndürme, hizalama ve çoğaltma tek adım ve atomik
- [x] Geçersiz toplu sonuç hiçbir yerleşimi kalıcılaştırmıyor
- [x] Gruplar birlikte seçiliyor, taşınıyor, döndürülüyor ve JSON turunda korunuyor
- [x] Kopyalar yeni kimlik alıyor; malzeme, renk ve açı korunuyor
- [x] Ok tuşları metin alanları dışında özelleştirilmiş mm adımlarıyla çalışıyor
- [x] Eski `1.0` JSON dosyaları sıkı doğrulamayla açılıyor
- [x] 5.000 nesneli seçim ve bütün proje doğrulaması otomatik testte geçiyor

### Aşama 5 doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 12 dosya, 95 test
- [x] `npm run build` — Vite üretim çıktısı başarılı
- [x] `npm audit --audit-level=moderate` — 0 açık
- [x] Yerel Vite sunucusu — HTTP 200
- [!] Tarayıcı görsel QA yüzeyi bu çalışma oturumunda kullanılamadı; responsive CSS, bileşen testleri, derleme ve HTTP duman kontrolüyle doğrulandı

## Aşama 6 — Tamamlanan işler

Kullanıcı onayı 2026-11-09 tarihinde alındı.

- [x] P6.1 React/Konva'dan bağımsız saf motif üretim veri modeli ve parametre doğrulaması
- [x] P6.2 Düz çizgi, halka, spiral, dalga, çiçek ve tekrarlı geometrik desen algoritmaları
- [x] P6.3 Seed tabanlı PRNG ile aynı girdide aynı geometrik sonuç
- [x] P6.4 Seçili katalog malzemeleri ve pozitif göreli kullanım oranları
- [x] P6.5 Yatay/dikey/dört yönlü ayna ve 3/4/5/6/8/12 yönlü radyal simetri
- [x] P6.6 Simetride koordinat/açı dönüşümü ve aynı merkez adaylarının tekilleştirilmesi
- [x] P6.7 Gerçek döndürülmüş geometriyle üretim sınırı, çakışma ve minimum aralık kontrolü
- [x] P6.8 Hücre tabanlı uzamsal ön eleme ve 5.000/40.000/1.000 ms güvenlik limitleri
- [x] P6.9 Tahmini boncuk sayısı, uygunluk uyarısı ve tahminin kesin olmadığının gösterilmesi
- [x] P6.10 Motif türü/ölçü/merkez/malzeme/oran/aralık/simetri/tekrar/yoğunluk/seed arayüzü
- [x] P6.11 Projeyi değiştirmeyen, çalışma alanında gerçek placement geometrisiyle önizleme
- [x] P6.12 Gerçek sayım, ölçü, simetri, aralık, kabul/red ve uyarı üretim raporu
- [x] P6.13 Mevcut tasarıma ekleme veya kaydedilmemiş değişiklik onaylı tasarım değiştirme
- [x] P6.14 Uygulamada yeniden tam-proje doğrulaması ve kısmi sonuç bırakmayan atomik işlem
- [x] P6.15 Motif uygulamasını tek undo/redo komutuna bağlamak
- [x] P6.16 JSON `1.1` placement uyumluluğu ve `1.0`/`1.1` geriye uyumluluğunu korumak
- [x] P6.17 Responsive Türkçe motif üretim penceresi ve çalışma alanı önizleme durumu
- [x] P6.18 Alan, bileşen, editör ve uygulama entegrasyon testlerini tamamlamak

### Aşama 6 kabul ölçütleri

- [x] Altı motif türü bağımsız, düzenlenebilir placement nesneleri üretir
- [x] Aynı seed aynı sonucu; farklı seed uygun yoğunlukta farklı sonucu verir
- [x] Yalnız seçilen katalog malzemeleri kullanılır; ölçü/şekil/renk değiştirilmez
- [x] Bütün kabul edilmiş boncuklar üretim sınırı, çakışma ve minimum aralık kurallarını geçer
- [x] Simetri koordinat ve açıları doğru dönüştürür; aynı nokta çoğaltılmaz
- [x] Negatif motif merkezi pan/zoom'dan bağımsız fiziksel koordinat olarak çalışır
- [x] Önizleme projeyi, geçmişi ve kaydedilmemiş durumunu değiştirmez
- [x] Ekleme/değiştirme atomiktir, uygulamada yeniden doğrulanır ve tek undo/redo adımıdır
- [x] Üretim raporu yalnız gerçek kabul edilmiş placement nesnelerinden türetilir
- [x] Eski proje dosyaları açılır; yeni motifler mevcut JSON şemasında saklanır
- [x] Gerçek AI servisi, Python/FastAPI backend ve Aşama 7 kapsamı eklenmemiştir

### Aşama 6 doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 14 dosya, 140 test
- [x] `npm run build` — Vite üretim çıktısı başarılı
- [x] `npm audit --audit-level=moderate` — 0 açık
- [x] Yerel Vite üretim önizlemesi — HTTP 200
- [x] Altı motif, seed, oran, simetri, sınır/aralık, negatif merkez, atomiklik, undo/redo, JSON ve büyük motif senaryoları otomatik testte başarılı
- [!] Tarayıcı görsel QA yüzeyi bu çalışma oturumunda kullanılamadı; responsive üretim penceresi bileşen testleri, derleme ve HTTP duman kontrolüyle doğrulandı

### Bilinen sınırlamalar

- Üretim hesaplaması Aşama 6'da ana iş parçacığında çalışır; 1.000 ms/40.000 aday/5.000 sonuç sınırı tarayıcıyı korur. Daha ağır işler ölçülürse Web Worker değerlendirilecektir.
- Malzeme oranları hedef dağılımdır; geometri nedeniyle reddedilen adaylar kesin oranı değiştirebilir.
- Üretim ayarları projede saklanmaz; yalnız uygulanan düzenlenebilir placement sonuçları saklanır.
- Araç geometrik ve deterministiktir; doğal dil, LLM, bulut AI veya referans görsel analizi içermez.

## Aşama 6.1 — Tamamlanan revizyon

- [x] P6.1.1 Seçim modunda boş alandaki sol sürüklemeyi serbest pan hareketine çevirmek
- [x] P6.1.2 Space + sol sürükleme, orta tuş ve dokunmatik pan davranışını korumak
- [x] P6.1.3 Alan seçimini Shift + sol sürüklemeye taşımak; boncuk tıklama/sürüklemeyi korumak
- [x] P6.1.4 İmleç merkezli tekerlek zoomunun yalnız görünüm dönüşümünü değiştirdiğini doğrulamak
- [x] P6.1.5 Eğri motifleri bağımsız, saf yay uzunluğu tablosuyla örneklemek
- [x] P6.1.6 Hedef boncuk aralığını minimum güvenlik aralığından ayrı parametre ve arayüz alanı yapmak
- [x] P6.1.7 Karışık malzeme boyutları ve teğet açılarıyla merkez mesafesini hesaplamak
- [x] P6.1.8 Açık eğride artık mesafeyi iki uca, kapalı eğride kapanış artığını bütün komşulara dağıtmak
- [x] P6.1.9 Yoğunluğu rastgele delikler yerine düzenli merkez mesafesi çarpanı olarak uygulamak
- [x] P6.1.10 Kesin çakışma/minimum aralık çekirdeğini ve seed tekrarlanabilirliğini korumak
- [x] P6.1.11 Jest, yay uzunluğu, kapanış boşluğu, karışık malzeme ve aralık testlerini eklemek

### Aşama 6.1 kabul ölçütleri

- [x] Boş alanda sol sürükleme, Space + sol sürükleme ve orta tuş çalışma alanını kaydırır
- [x] Shift + sol sürükleme alan seçer; boncuk seçme ve taşıma davranışı değişmez
- [x] Pan/zoom yalnız görünüm merkezini ve ölçeğini değiştirir; placement mm koordinatlarına yazmaz
- [x] Halka kapanışı ve eğri üzerindeki adaylar yay uzunluğuna göre dengeli dağılır
- [x] Hedef aralık yoğunluğu yönetir; minimum güvenlik aralığı kesin doğrulama eşiği olarak kalır
- [x] Karışık/döndürülmüş malzemeler katalog ölçüleriyle hesaplanır ve son doğrulamadan geçer
- [x] Geometrik olarak geçersiz adaylar kalıcı sonuca alınmaz

### Aşama 6.1 doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 16 dosya, 152 test
- [x] `npm run build` — Vite üretim çıktısı başarılı
- [!] Tarayıcı üzerinde manuel etkileşim/görsel QA bu çalışma oturumunda yapılmadı; jest kararları, koordinat dönüşümleri, bileşen testleri ve üretim derlemesiyle doğrulandı

## Aşama 7A — Tamamlanan işler

- [x] P7A.1 Serbest metinli “Yapay Zekâ ile Tasarla” ana arayüzünü eklemek
- [x] P7A.2 Geometrik motif üreticisini ayrı “Geometrik araçlar” bölümünde korumak
- [x] P7A.3 JPEG/PNG/WebP tür, dosya imzası, 8 MB, 8.192 px ve 32 MP doğrulamasını uygulamak
- [x] P7A.4 Yerel referans önizleme, değiştirme ve kaldırma yaşam döngüsünü eklemek
- [x] P7A.5 Kullanıcı seçimi, AI seçimi ve birlikte seçim malzeme yetki modlarını uygulamak
- [x] P7A.6 Hedef mm ölçüsü, güvenlik/hedef aralığı, yoğunluk, simetri ve maksimum adet alanlarını eklemek
- [x] P7A.7 Sağlayıcıdan bağımsız `AiDesignProvider` ve `AiPlanPlacementGenerator` portlarını tanımlamak
- [x] P7A.8 Sürümlü `AiDesignRequest` ve `AiDesignPlan` şemalarını katı doğrulamak
- [x] P7A.9 Bilinmeyen/izin verilmeyen katalog kimliği, koordinat, açı, boyut ve çıktı limitlerini reddetmek
- [x] P7A.10 AI placement önerisini motif sınırı, katalog, adet, çakışma ve minimum aralık kapısından geçirmek
- [x] P7A.11 Sağlayıcı yokken doğru bağlantı durumunu göstermek; sahte üretim/ilerleme sunmamak
- [x] P7A.12 AI taslak durumunu proje/geçmiş dışında tutarak mevcut editörü ve JSON `1.1` uyumluluğunu korumak
- [x] P7A.13 Alan, altyapı, bileşen ve uygulama entegrasyon testlerini eklemek

### Aşama 7A kabul ölçütleri

- [x] Kullanıcı kategori seçmeden serbest tasarım tarifi yazabilir
- [x] Referans görsel yerel olarak doğrulanır, önizlenir ve kaldırılır; editör değişmez
- [x] Üç malzeme modu yalnız etkin katalog kayıtlarından izin kümesi üretir
- [x] AI çıktısı sürüm ve şema doğrulamasını geçmeden plan sayılmaz
- [x] Plan veya placement içindeki katalog dışı malzeme bütünüyle reddedilir
- [x] Placement önerisi mevcut kesin geometri çekirdeğini ve motif sınırını atlayamaz
- [x] Gerçek sağlayıcı, API anahtarı, harici aktarım veya sahte AI sonucu eklenmemiştir
- [x] Geometrik araçlar ve mevcut proje JSON akışı korunmuştur

### Aşama 7A doğrulama sonucu

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 20 dosya, 181 test
- [x] `npm run build` — Vite üretim çıktısı başarılı
- [!] Tarayıcı üzerinde manuel görsel QA bu çalışma oturumunda yapılmadı; responsive arayüz bileşen ve uygulama testleriyle doğrulandı

### Bilinen sınırlamalar

- Gerçek AI sağlayıcısı ve güvenli sunucu çağrısı Aşama 7A kapsamında yoktur.
- Referans görsel yalnız geçici yerel girdidir; analiz edilmez ve projeye kaydedilmez.
- Planı placement nesnelerine dönüştüren sağlayıcı bağımsız yorumlayıcı portu tanımlıdır, gerçek üretim uygulaması Aşama 7B kararına bağlıdır.
- Sağlayıcı, veri bölgesi, saklama politikası, maliyet/limit ve kullanıcı aktarım onayı henüz seçilmemiştir.

## Aşama 7B — Tamamlanan işler

- [x] P7B.1 Python/FastAPI backend, katı Pydantic istek/plan sözleşmesi ve `/api/health` uç noktasını kurmak
- [x] P7B.2 Modeli ortamdan seçen OpenAI Responses API + Structured Outputs uyarlayıcısını eklemek
- [x] P7B.3 `OPENAI_API_KEY` değerini yalnız backend ortamında tutmak; anahtarsız başlatma ve dürüst `503` davranışı sağlamak
- [x] P7B.4 Ücretli çağrıları varsayılan kapalı `AI_CALLS_ENABLED` ayarına bağlamak
- [x] P7B.5 Açık veri aktarım onayı olmadan sağlayıcı çağrısını hem frontend hem backend tarafında engellemek
- [x] P7B.6 JPEG/PNG/WebP yüklemesini sunucuda bağımsız çözümlemek; tür, boyut, kenar, piksel ve üst veri eşleşmesini doğrulamak
- [x] P7B.7 Kullanıcı seçimi, AI seçimi ve birlikte seçim katalog yetkisini sunucuda yeniden doğrulamak
- [x] P7B.8 Plan–istek hedefi, koordinat, bileşen sayısı, malzeme ve maksimum placement sınırlarını doğrulamak
- [x] P7B.9 Çizgi, polyline, kübik Bézier, elips/dikdörtgen ve nokta kümesi yorumlayıcısını eklemek
- [x] P7B.10 Desteklenmeyen özgün biçimleri sessiz dönüştürmemek; yaklaştırma/uyarı raporu ve kullanıcı kabulü eklemek
- [x] P7B.11 Geçici Konva önizlemesini gerçek placement sayımına bağlamak; açık onayla tek atomik komutta uygulamak
- [x] P7B.12 İptal, geç yanıt, yinelenen tıklama, istemci/sunucu zaman aşımı, yeniden deneme, oran ve eşzamanlılık sınırlarını eklemek
- [x] P7B.13 `store=False`, ham içerik loglamama, yalnız yerel dosya yüklemesi ve yapılandırılmış CORS politikasını uygulamak
- [x] P7B.14 Frontend/backend ortak sözleşme örneği ile API, güvenlik, bileşen ve geometri testlerini eklemek
- [x] P7B.15 PowerShell kurulumunu, `.env.example`, güvenlik notlarını ve ilgili belgeleri güncellemek

### Aşama 7B doğrulama sonucu

- [x] Frontend `npm run typecheck`
- [x] Frontend `npm run lint`
- [x] Frontend `npm test` — 23 dosya, 191 test
- [x] Frontend `npm run build` — Vite üretim derlemesi başarılı
- [x] Backend `ruff check app tests`
- [x] Backend `mypy app tests`
- [x] Backend `pytest` — 22 test başarılı, gerçek ücretli entegrasyon testi 1 adet açık opt-in olmadığı için atlandı
- [!] Gerçek OpenAI anahtarı/ücretli çağrı ve tarayıcı üzerinde manuel görsel QA bu çalışmada bilinçli olarak yapılmadı

### Bilinen sınırlar

- Metin ve görselin gerçek model tarafından yorumlanacağı üretim yolu hazırdır; bu teslimde anahtar kullanılmadığı için canlı sağlayıcı yanıtı gözlenmedi.
- Serbest/özgün konturlar yalnız açık nokta/polyline/Bézier ile ifade edildiyse placement'a dönüşür. Görsel maske, topolojik katman, birebir yaprak/çiçek silueti ve kumaş/dikiş fiziği desteklenmez.
- Geliştirme sunucusu `127.0.0.1` içindir. Üretimde kimlik doğrulama, kullanıcı kotası, HTTPS, merkezi erişim kaydı ve dağıtık oran sınırı ayrıca zorunludur.

## Aşama 7B.1 — Tamamlanan işler

- [x] P7B1.1 Mevcut OpenAI Responses API adapter'ını koruyarak ortak provider kaydına almak
- [x] P7B1.2 9Router için yalnız `127.0.0.1:20128/v1` kökünü kabul eden Chat Completions adapter'ı eklemek
- [x] P7B1.3 `AI_PROVIDER`, `NINEROUTER_BASE_URL`, `NINEROUTER_API_KEY` ve `NINEROUTER_MODEL` yapılandırmasını eklemek
- [x] P7B1.4 `/v1/models` ile erişilebilirliği, tam model kimliğini ve katalog vision metadatasını prompt göndermeden denetlemek
- [x] P7B1.5 9Router yanıtını düz JSON olarak ayrıştırıp Pydantic `AiDesignPlan` sözleşmesiyle doğrulamak
- [x] P7B1.6 Sağlayıcı seçimini frontend'e eklemek; doğrulanmamış modeli hazır veya görsel destekli göstermemek
- [x] P7B1.7 Seçilen sağlayıcıyı açık onayla backend'e iletmek ve sessiz OpenAI/9Router fallback'ini engellemek
- [x] P7B1.8 Yerel adres dışını ve HTTP yönlendirmesini engellemek; anahtarları backend sınırında tutmak
- [x] P7B1.9 Offline/mocked adapter, bozuk JSON, sağlayıcı seçimi, model kataloğu ve UI durum testlerini eklemek
- [x] P7B1.10 PowerShell kurulumu, AI kuralları, mimari, karar kaydı ve değişiklik geçmişini güncellemek

### Aşama 7B.1 doğrulama sonucu

- [x] İlk kontrolde yerel TCP `127.0.0.1:20128` erişilebilir ve `GET /v1/models` 200 idi; 25 model ile capability alanları salt okunur alındı
- [!] 2026-11-10 son kontrolde yerel 9Router süreci kapalı/erişilemezdi; arayüzün “kullanılamıyor” durumu mock ve bileşen testleriyle doğrulandı
- [x] Frontend `npm run typecheck`
- [x] Frontend `npm run lint`
- [x] Frontend `npm test` — 23 dosya, 193 test başarılı
- [x] Frontend `npm run build` — Vite üretim derlemesi başarılı
- [x] Backend `ruff check app tests`
- [x] Backend `mypy app tests`
- [x] Backend `pytest` — 28 test başarılı, 3 canlı entegrasyon testi açık opt-in olmadığı için atlandı
- [!] 9Router'a prompt/model çağrısı, gerçek API anahtarı ve ücretli çağrı bilinçli olarak kullanılmadı
- [!] Tarayıcı üzerinde manuel görsel QA yapılmadı

### Aşama 7B.1 bilinen sınırlar

- Yerel `/v1/models` metin üretimi veya şema uyumluluğunu tek başına kanıtlamaz; model hazır durumu ayrı canlı doğrulama bayrağı ister.
- 9Router native `json_schema` desteği model/yol bazında değişebildiğinden varsayılan adapter JSON metnini Pydantic ile doğrular.
- Görsel alanı katalogdaki vision metadatasına ek olarak ayrı operatör doğrulaması olmadan açılmaz.
- 9Router'ın kendi combo/fallback ve uzak hesap politikası uygulama tarafından denetlenemez; kullanıcı bunu 9Router panelinde yapılandırmalıdır.

## Aşama 7B.2 — Tamamlanan işler

- [x] P7B2.1 Frontend sağlık isteğinin gerçek URL'sini ve backend sözleşmesini incelemek
- [x] P7B2.2 Geliştirme varsayılanını sabit `127.0.0.1:8000` yerine Vite aynı-origin `/api` proxy'sine taşımak
- [x] P7B2.3 HTTP 200 + `status=ok` + `providerState=disabled` yanıtını bağlantı hatasından ayırmak
- [x] P7B2.4 Ağ/JSON/sözleşme hatalarını güvenli geliştirici konsolu kaydıyla raporlamak
- [x] P7B2.5 OpenAI/9Router radyo seçimini tekil tutmak ve ana mesajı yalnız seçili sağlayıcıdan üretmek
- [x] P7B2.6 Backend, 9Router erişimi, katalog modeli ve canlı uyumluluk durumlarını ayrı göstermek
- [x] P7B2.7 “Durumu yenile” akışını eklemek ve yeniden bağlantıda kullanıcı seçimini korumak
- [x] P7B2.8 Pasif oluşturma düğmesinin eksik ayar/güvenlik gerekçesini görünür yapmak
- [x] P7B2.9 Vite proxy, sağlık sözleşmesi, kesinti/yeniden bağlantı ve sağlayıcı seçim testlerini eklemek
- [x] P7B2.10 README, mimari, karar kaydı, görevler ve değişiklik geçmişini güncellemek

### Aşama 7B.2 doğrulama sonucu

- [x] Doğrudan FastAPI `http://127.0.0.1:8000/api/health` — HTTP 200
- [x] Vite proxy `http://127.0.0.1:5173/api/health` — HTTP 200 ve aynı JSON sözleşmesi
- [x] Frontend TypeScript ve ESLint
- [x] Frontend otomatik testleri — 24 dosya, 197 test başarılı; Vite üretim derlemesi başarılı
- [x] Backend Ruff ve strict mypy başarılı; pytest 28 başarılı, 3 açık opt-in canlı test atlandı
- [!] Computer-use tarayıcı/native erişim yüzeyleri kullanılamadığı için otomatik gerçek tarayıcı etkileşimi yapılamadı; kullanıcı tarafından bildirilen gerçek tarayıcı bulgusu ve iki gerçek HTTP uç noktası doğrulandı
- [!] Canlı AI/model isteği gönderilmedi; `AI_CALLS_ENABLED=false` değiştirilmedi

## Aşama 7B.3 — Tamamlanan işler

- [x] P7B3.1 Gerçek tarayıcıdaki `Window.fetch` bağlam kaybını kök neden düzeyinde düzeltmek
- [x] P7B3.2 Varsayılan tarayıcı fetch'i, enjekte edilen fetch ve mock fetch davranışlarını ayrı regresyon testleriyle korumak
- [x] P7B3.3 HTTP 200 sağlık yanıtında 9Router `unverified` durumunu erişim hatasından ayırmak
- [x] P7B3.4 9Router doğrulanmamış mesajını “erişilebilir ancak model uyumluluğu henüz doğrulanmadı” olarak sabitlemek
- [x] P7B3.5 OpenAI/9Router tekil seçim ve seçime bağlı oluşturma düğmesi politikasını doğrulamak
- [x] P7B3.6 Canlı uyumluluk doğrulama gereksinimini güvenlik bayrağını atlamadan kullanıcıya açıklamak
- [x] P7B3.7 Değişiklik geçmişi, karar kaydı ve görev doğrulamalarını güncellemek

### Aşama 7B.3 doğrulama sonucu

- [x] Vite proxy `http://127.0.0.1:5173/api/health` — HTTP 200; 9Router erişilebilir, model katalogda mevcut ve uyumluluk doğrulanmamış
- [x] Doğrudan FastAPI `http://127.0.0.1:8000/api/health` — HTTP 200
- [x] Hedefli frontend testleri — 2 dosya, 19 test başarılı
- [x] Frontend TypeScript ve ESLint başarılı; tam test paketi 24 dosya, 199 test başarılı; Vite üretim derlemesi başarılı
- [x] Backend Ruff ve strict mypy başarılı; pytest 28 başarılı, 3 açık opt-in canlı test atlandı
- [!] Windows Computer Use native bağlantısı kullanılamadığı için bu oturumda otomatik gerçek tarayıcı tıklama testi yapılamadı; gerçek HTTP yolları ve tarayıcı bağlamını zorunlu kılan regresyon testi doğrulandı
- [!] Canlı AI/model isteği gönderilmedi; `AI_CALLS_ENABLED` ve uyumluluk doğrulama ayarları değiştirilmedi

## Aşama 7B.4 — Tamamlanan işler

- [x] P7B4.1 Sonsuz sağlık döngüsünün kararsız `onPreview` prop'u ile effect cleanup parent state güncellemesinden kaynaklandığını belirlemek
- [x] P7B4.2 `App` AI önizleme callback'ini kararlı hale getirmek ve sağlık effect'ini önizleme callback kimliğinden ayırmak
- [x] P7B4.3 Sağlık kontrolünü açılış ve kullanıcı yenilemesiyle sınırlamak; eşzamanlı ikinci isteği engellemek
- [x] P7B4.4 İstek sıra kimliği, `AbortController`, kapanış iptali ve eski yanıt koruması eklemek
- [x] P7B4.5 Sağlık istemcisine 10 saniyelik zaman aşımı ve anlaşılır hata durumu eklemek
- [x] P7B4.6 HTTP 200 sonrasında loading'i kapatmak ve OpenAI/9Router kartlarını göstermek
- [x] P7B4.7 Yeniden render, callback kimliği değişimi, yenileme, kapanış, StrictMode'da tek açılış isteği ve sağlayıcı seçimi regresyonlarını test etmek
- [x] P7B4.8 Mimari, karar kaydı, görevler, README ve değişiklik geçmişini güncellemek

### Aşama 7B.4 doğrulama sonucu

- [x] Hedefli frontend kontrolleri — TypeScript ve ESLint başarılı; 3 dosyada 46 test başarılı
- [x] Frontend tam paket — 24 dosyada 204 test başarılı; Vite üretim derlemesi başarılı
- [x] Backend Ruff ve strict mypy başarılı; pytest 28 başarılı, 3 açık opt-in canlı test atlandı
- [x] Geçici yerel backend ile doğrudan FastAPI ve Vite proxy sağlık yolları ayrı ayrı HTTP 200 döndürdü; logda yalnız iki açık doğrulama GET isteği oluştu
- [!] Windows Computer Use native bağlantısı kullanılamadığı için Network paneli bu oturumda otomatik izlenemedi; istek sayısı ve iptal yaşam döngüsü StrictMode/re-render bileşen testleriyle doğrulandı
- [!] Canlı AI/model isteği gönderilmedi; API anahtarları ve model uyumluluk ayarları değiştirilmedi

## Onay bekleyen aşama

**Aşama 7C veya Aşama 8 başlatılmadı.** Yeni kapsam için kullanıcı onayı beklenecektir.

## Gelecek aşamalar

Sonraki onaylı aşamaların görev kırılımı [ROADMAP.md](ROADMAP.md) dosyasında tutulur. Her aşama başlamadan önce buraya ayrıntılı aktif görev listesi taşınır.

## Bilinen açık konular

- [x] Node.js alt sınırını 24, paket yöneticisini npm ve kilit dosyasını `package-lock.json` olarak belirlemek
- [x] Aşama 2'de malzeme önizlemesini kanonik geometriden üretmek ve raster görsel saklamayı ertelemek
- [x] Aşama 3'te 100 adımlı terslenebilir komut geçmişini seçmek
- [x] Aşama 3'te 5.000 uzak nesneli aday testinde AABB ön elemesinin yeterli olduğunu doğrulamak
- [ ] Ticari hedeflerden önce kumaş kenar payı (`edgeGapMm`) gereksinimini uzman kullanıcılarla doğrulamak
- [x] Aşama 7B sağlayıcısı, saklama azaltımı, maliyet etkinleştirme, zaman aşımı ve oran sınırını kararlaştırmak
- [x] Görsel/metin harici aktarımı için açık kullanıcı onayı metnini uygulamak

