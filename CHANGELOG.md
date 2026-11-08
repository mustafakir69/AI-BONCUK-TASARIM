# Değişiklik Geçmişi

Bu proje [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) yaklaşımını izler. Sürümler ürün olgunlaştıkça anlamsal sürümlemeye bağlanacaktır.

## [Yayımlanmadı]

### Planlanan

- Aşama 7: Kullanıcı onayı olmadan başlanmayacak referans görsel analizi

## [0.7.0] — 2026-11-09

### Eklendi

- Düz çizgi, halka, spiral, dalga, çiçek ve tekrarlı geometrik desen üreten saf TypeScript motif motoru
- Seed tabanlı deterministik örnekleme, yoğunluk ve göreli malzeme kullanım oranları
- Yatay/dikey/dört yönlü ayna ile 3/4/5/6/8/12 tekrarlı radyal simetri
- Motif türü, fiziksel ölçü, negatif/pozitif merkez, malzeme, aralık, simetri, tekrar, yoğunluk ve seed kontrollerini içeren Türkçe responsive üretim penceresi
- Kesin olmayan boncuk sayısı/uygunluk tahmini ve gerçek yerleşimlerden türetilen üretim raporu
- Projeyi değiştirmeyen etkileşimsiz Konva önizlemesi
- Mevcut tasarıma ekleme veya açık onayla tasarımı değiştirme akışı

### Değiştirildi

- Editör komut sistemi atomik `document.replace` komutuyla genişletildi; motif uygulaması tek undo/redo adımı oldu
- Uygulama aşama göstergesi Aşama 6, paket sürümü `0.7.0` oldu
- Mimari ve yol haritası Aşama 6'nın backend/LLM içermeyen deterministik kapsamına göre güncellendi

### Güvenlik ve performans

- Üretim adayları gerçek döndürülmüş geometri, motif sınırı, minimum aralık ve pul dış disk politikasıyla doğrulanır
- Hücre tabanlı uzamsal ön eleme yalnız yakın adayları kesin teste gönderir
- Üretim 5.000 kabul edilmiş placement, 40.000 aday ve 1.000 ms hesap bütçesiyle sınırlıdır
- Uygulama sırasında bütün aday proje yeniden doğrulanır; tek hata bütün işlemi reddeder ve mevcut tasarım korunur

### Doğrulandı

- TypeScript ve ESLint başarılı
- 14 dosyada 140 otomatik test başarılı
- Altı motif türü, seed tekrarlanabilirliği, farklı seed, seçili malzeme, oran, simetri/açı, sınır/aralık, negatif merkez, önizleme, atomiklik, undo/redo, JSON ve büyük motif senaryoları başarılı
- Vite üretim derlemesi, yerel HTTP 200 duman kontrolü ve güvenlik denetimi başarılı; 0 açık bulundu

### Kapsam

- Gerçek LLM/bulut AI, Python/FastAPI backend, referans görsel analizi, commit/push ve yayınlama eklenmemiştir.

## [0.6.0] — 2026-11-08

### Eklendi

- Shift tıklama, dünya koordinatlı seçim dikdörtgeni ve Ctrl+A ile çoklu seçim
- Atomik toplu taşıma, ortak geometrik merkezde 15/30/45/90 derece veya özel açılı döndürme
- Ctrl+C/V/D kısayolları ve benzersiz kimlikli, malzeme/renk/açı koruyan kopyalar
- Yatay/dikey mm ofseti ve tekrar sayılı hassas çoğaltma; 1.000 tekrar/10.000 nesne sınırı
- Ctrl+G/Ctrl+Shift+G ile kalıcı grup oluşturma/çözme ve grup birlikte seçim davranışı
- Gerçek döndürülmüş sınırlara dayalı sekiz hizalama ve eşit dağıtma işlemi
- Özelleştirilebilir normal/Shift ok tuşu taşıma adımları
- JSON `1.1` grup ve klavye ayarları ile `1.0` geriye uyumluluk geçişi

### Değiştirildi

- Komut geçmişi etkilenen yerleşim/grup deltalarını taşıyan toplu komutlarla genişletildi
- Tam-proje geometri doğrulaması sıralı AABB etkin kümesiyle binlerce uzak nesne için hızlandırıldı
- Sağ panel responsive gelişmiş düzenleme araçları ve gerçek seçili nesne sayısıyla genişletildi
- Seçim modunda sürükleme alan seçer; Boşluk+sürükleme veya orta tuş sonsuz düzlemi kaydırır
- Paket sürümü `0.6.0`, proje şeması `1.1` ve aşama göstergesi Aşama 5 oldu

### Güvenlik

- Toplu işlemde tek bir çakışma/aralık ihlali bütün işlemi reddeder; kısmi sonuç kalıcılaşmaz
- Grup üyelikleri benzersiz kimlik, var olan yerleşim başvurusu ve tek grup üyeliği açısından doğrulanır
- Çok yüksek çoğaltma işlemleri başlamadan sayı/bellek sınırında reddedilir

### Doğrulandı

- TypeScript ve ESLint başarılı
- 12 dosyada 95 otomatik test başarılı
- 5.000 nesneli seçim ve tam-proje geometri doğrulaması başarılı
- Vite üretim derlemesi, güvenlik denetimi ve yerel HTTP kontrolü başarılı

### Kapsam

- Yapay zekâ, backend, bulut/veritabanı, commit/push ve yayınlama eklenmemiştir.

## [0.5.0] — 2026-11-08

### Eklendi

- Kullanılan malzeme kayıtlarını, mm yerleşimlerini, motifi ve minimum aralığı taşıyan `1.0` sürümlü proje JSON'u
- Araç çubuğundan yerel JSON kaydetme, dosyadan açma ve yeni proje akışları
- Kayıt anına göre çalışan kaydedilmemiş değişiklik göstergesi ve veri kaybı onay penceresi
- Motif/yerleşim alanı, 150/300/600 DPI, kenar payı, şeffaf PNG, JPEG kalite ve zemin seçenekli dışa aktarma
- Gerçek yerleşim adetleriyle UTF-8 BOM'lu CSV malzeme raporu
- Döndürülmüş geometri sınırı, DPI, bellek, JSON turu, bozuk dosya, kimlik çakışması ve atomiklik testleri

### Değiştirildi

- Yeni proje, aç, kaydet ve dışa aktar araçları Aşama 4 işlevlerine bağlandı
- Proje açma; sözdizimi, sürüm, benzersiz kimlik, malzeme başvurusu, sonlu sayı, çakışma ve minimum aralık doğrulaması yapar
- Yerel katalogda aynı kimlikli farklı malzeme varsa yerel kayıt korunur; proje malzemesi ve yerleşimleri yeni kimliğe güvenli eşlenir
- Uygulama aşama göstergesi Aşama 4 ve paket sürümü `0.5.0` olarak güncellendi

### Güvenlik

- Geçersiz proje mevcut tasarıma kısmi değişiklik uygulamadan reddedilir
- Proje dosyası 10 MB, görsel çıktı 16.384 piksel kenar ve 64 milyon piksel toplam sınırıyla korunur
- Motif dışındaki boncukları kırpacak çıktı açık kullanıcı onayı olmadan başlatılmaz

### Doğrulandı

- TypeScript ve ESLint başarılı
- 11 dosyada 74 otomatik test başarılı
- Vite üretim derlemesi başarılı
- Güvenlik denetimi 0 açık ve yerel geliştirme sunucusu HTTP 200

### Kapsam

- Bu sürümde yapay zekâ, bulut/veritabanı ve otomatik yayınlama eklenmemiştir.

## [0.4.0] — 2026-11-08

### Eklendi

- `materialId`, benzersiz kimlik, dünya koordinatı ve açı taşıyan kanonik yerleşim modeli
- SAT tabanlı döndürülmüş dikdörtgen, daire–daire ve daire–dikdörtgen çakışma motoru
- Kesin şekil uzaklığına dayalı `0–100 mm` minimum malzeme aralığı doğrulaması
- Katalogdan yerleştirme modu, yarı saydam geçerli/geçersiz aday önizlemesi ve sonsuz düzlemde negatif koordinat desteği
- Seçme, sürükleyerek taşıma, silme, 15° döndürme ve sağ panelden X/Y/açı düzenleme araçları
- Delete, Escape, Ctrl+Z, Ctrl+Y ve Ctrl+Shift+Z klavye kısayolları
- 100 komutla sınırlı terslenebilir geri al/yinele geçmişi
- Yerleşimlerden gerçek zamanlı türetilen malzeme bazlı ve toplam sayaç
- Kullanılan malzeme silme engeli ve ölçü değişikliği sonrası bütün tasarım doğrulaması

### Değiştirildi

- Üst araç çubuğundaki geri al/yinele işlemleri gerçek editör geçmişine bağlandı
- Sağ panel nesne özellikleri, minimum aralık ve gerçek sayaçla etkinleştirildi
- Konva yerleşim grubu imleç önizlemesinden ayrılarak memoize edildi; kesin testlerden önce AABB ön elemesi eklendi
- Uygulama aşama göstergesi Aşama 3 olarak güncellendi

### Doğrulandı

- TypeScript ve ESLint başarılı
- 8 dosyada 50 otomatik test başarılı
- Vite üretim derlemesi başarılı
- Güvenlik denetimi 0 açık ve yerel geliştirme sunucusu HTTP 200
- 5.000 uzak yerleşimli aday doğrulaması otomatik testte başarılı

### Kapsam

- Sonsuz çalışma alanı ve görsel motif kılavuzu korunmuştur. JSON/JPEG dosya akışı, yapay zekâ ve referans görsel özellikleri eklenmemiştir.

## [0.3.0] — 2026-11-08

### Eklendi

- Kare, dikdörtgen, daire ve ortası delikli daire geometrilerini içeren kanonik TypeScript malzeme modeli
- 2,5 mm kum boncuk, 2,5 × 4 mm boru boncuk, 4 mm inci ve 5 mm / 1,5 mm delikli pul başlangıç kataloğu
- Türkçe malzeme ekleme/düzenleme penceresi, ondalıklı mm girişi, renk seçici ve canlı geometrik önizleme
- Açık kullanıcı onaylı silme akışı ve gelecekte kullanılan malzemeyi koruyacak kullanım sayısı kapısı
- Sürümlü LocalStorage servisi, yenilemede geri yükleme ve bozuk/geçersiz kayıt kurtarma politikası
- Ekleme, düzenleme, silme, ölçü/çap/delik doğrulaması, benzersiz kimlik ve yerel saklama testleri

### Değiştirildi

- Sol paneldeki statik örnek kartlar gerçek, yönetilebilir malzeme kayıtlarına dönüştürüldü
- Uygulama aşama göstergesi Aşama 2 olarak güncellendi
- Malzeme önizlemeleri fiziksel mm oranları ve katalog renginden SVG olarak türetilir hale getirildi

### Doğrulandı

- TypeScript, ESLint, 5 dosyada 29 otomatik test, Vite üretim derlemesi, güvenlik denetimi ve yerel HTTP 200 kontrolü başarılı

### Kapsam

- Sonsuz çalışma alanı, cetveller ve koordinat sistemi korunmuştur; yerleştirme, çakışma, yapay zekâ, referans görsel ve JPEG dışa aktarma eklenmemiştir.

## [0.2.1] — 2026-11-08

### Değiştirildi

- Sınırlandırılmış beyaz tasarım sayfası, açık gri sonsuz Konva düzlemiyle değiştirildi
- Çalışma alanı genişlik/yükseklik alanları hedef motif ölçüsü olarak yeniden tanımlandı
- Ekrana sığdırma işlemi sonsuz arka plan yerine motif kılavuzunu merkeze alacak biçimde uyarlandı

### Eklendi

- Sabit yatay/dikey milimetrik cetveller ve zoom uyumlu `1/5/10/50/100 mm` ana aralıklar
- Belirgin `(0,0)` orijini, negatif koordinatlar ve gerçek zamanlı imleç koordinatı
- Ortak dünya/ekran dönüşüm modülü
- Açılıp kapatılabilir, düzlemi sınırlamayan motif sınır kılavuzu
- Pan, zoom, negatif koordinat, cetvel adımı ve motif bağımsızlığı testleri

### Doğrulandı

- TypeScript, lint, 3 dosyada 16 test, üretim derlemesi, güvenlik denetimi ve yerel HTTP 200 kontrolü başarılı

### Kapsam

- Bu sürüm Aşama 1 revizyonudur; malzeme yerleştirme, çakışma ve yapay zekâ eklenmedi.

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

