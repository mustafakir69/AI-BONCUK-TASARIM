# Geliştirme Yol Haritası

Her aşama, önceki aşamanın kabul ölçütleri sağlanıp kullanıcı onayı alındıktan sonra başlar. Görev kimlikleri [TASKS.md](TASKS.md) ile birlikte kullanılır.

## Aşama 0 — Planlama

**Amaç:** Ürün sınırlarını, veri modelini, mimariyi ve doğrulama kurallarını koddan önce netleştirmek.

Görevler:

- P0.1 Ürün amacı, kullanıcılar, kapsam içi/dışı maddeler ve başarı ölçütleri
- P0.2 Frontend/backend sınırları ve katmanlı mimari
- P0.3 Malzeme, yerleşim, hedef motif ve proje şemaları
- P0.4 Döndürülmüş şekiller, daireler, sınır ve minimum aralık yaklaşımı
- P0.5 AI girdi/çıktı sözleşmesi ve güvenlik sınırları
- P0.6 Aşamaları küçük, test edilebilir görevlere ayırma
- P0.7 Teknik karar, görev ve değişiklik kayıtlarını başlatma

**Çıkış ölçütü:** Aşama 0 belgelerinin tamamı tutarlı ve bağlantılıdır; uygulama/paket kurulmamıştır.

**Doğrulama:** Belge bağlantıları, zorunlu dosya listesi, veri alanları ve gereksinim izlenebilirliği elle/otomatik metin kontrolleriyle gözden geçirilir.

## Aşama 1 — Temel uygulama

**Amaç:** Çalışan frontend iskeleti ile Türkçe, üç panelli boş tasarım arayüzünü kurmak.

Görevler:

- P1.1 `frontend` altında Vite + React + TypeScript projesi oluşturma
- P1.2 Sıkı TypeScript, lint, format ve Vitest ayarları
- P1.3 Uygulama kabuğu ve Türkçe metin altyapısı
- P1.4 Üst araç çubuğu, sol/orta/sağ panel yerleşimi
- P1.5 Hedef motif genişlik/yükseklik ve mm/cm giriş modeli
- P1.6 Saf mm/cm dönüşüm yardımcıları ve birim testleri
- P1.7 Açık gri sonsuz Konva düzlemi, negatif koordinatlar ve motif kılavuzu
- P1.8 Saf dünya/ekran dönüşümleri; zoom/pan ve imleç koordinatı
- P1.8A Sabit yatay/dikey milimetrik cetveller ve zoom uyumlu işaret aralıkları
- P1.9 Temel erişilebilirlik ve farklı pencere boyutlarında düzen
- P1.10 README kurulum/çalıştırma/test komutlarını güncelleme

**Çıkış ölçütü:** Kullanıcı hedef motif ölçülerini seçebilir; sonsuz düzlem, cetvel ve kılavuz aynı mm dönüşümünü kullanır; zoom/pan fiziksel koordinatları değiştirmez; test ve üretim derlemesi geçer. Malzeme ekleme yoktur.

**Doğrulama:** Birim testleri, bileşen duman testi, farklı zoom/pan ve negatif koordinat vakaları, `typecheck`, üretim derlemesi ve 200×250 / 300×400 / 100×150 mm motif kontrolü.

## Aşama 2 — Malzeme sistemi

**Amaç:** Gerçek ölçülü ve kullanıcı tarafından yönetilen malzeme kataloğu oluşturmak.

Görevler:

- P2.1 `Material` tipi ve başlangıç malzemeleri
- P2.2 Malzeme kartları, seçme ve etkin/pasif durumu
- P2.3 Ekleme formu ve alan doğrulaması
- P2.4 Düzenleme ve bağlı nesne etkisi için servis sınırı
- P2.5 Güvenli silme/devre dışı bırakma akışı
- P2.6 Renk girişi ve isteğe bağlı görsel önizleme araştırması
- P2.7 Katalog durumunun proje modeline bağlanması
- P2.8 Model/form/iş kuralı testleri

**Çıkış ölçütü:** Dört başlangıç malzemesi doğru ölçülerle görünür; geçerli özel malzeme eklenip düzenlenebilir; geçersiz fiziksel ölçü kabul edilmez.

**Doğrulama:** Birim ve bileşen testleri; aynı malzemeye bağlı modelin tek fiziksel ölçü kaynağını kullandığının testi.

## Aşama 3 — Manuel editör

**Amaç:** Üretim kurallarına uyan gerçek bir boncuk yerleşim editörü sağlamak.

Görevler:

- P3.1 Geometri temel tipleri ve dönüşümler
- P3.2 Alan sınırı kontrolleri
- P3.3 Daire–daire çakışması
- P3.4 SAT ile döndürülmüş dikdörtgen–dikdörtgen çakışması
- P3.5 Daire–döndürülmüş dikdörtgen çakışması
- P3.6 Şekiller arası minimum mesafe ve aralık kuralı
- P3.7 AABB ön eleme ve gerekirse uzamsal indeks ölçümü
- P3.8 Konva malzeme çizimleri ve fiziksel ölçek dönüşümü
- P3.9 Katalogdan tıklayarak/işaret ederek nesne ekleme
- P3.10 Tekli seçim ve çoklu seçime hazır `selectedIds`
- P3.11 Sürükleme önizlemesi, geçersiz durum ve geri dönme
- P3.12 Döndürme ve açı normalizasyonu
- P3.13 Silme ve yerleşim bazlı renk değişikliği
- P3.14 Komut geçmişi, geri al ve yinele
- P3.15 Nesnelerden otomatik malzeme sayımı
- P3.16 Izgara, cetvel ve isteğe bağlı yapışma
- P3.17 1.000/5.000 nesneli performans ölçümü

**Çıkış ölçütü:** Ekleme/taşıma/döndürme sırasında alan dışı, çakışan ve aralık ihlalli durumlar kalıcılaşmaz; geri al/yinele ve sayım doğrudur.

**Doğrulama:** [DESIGN-RULES.md](DESIGN-RULES.md) test matrisi, editör entegrasyon testleri ve elle sürükleme/döndürme senaryoları.

## Aşama 4 — Dosya ve çıktı sistemi

**Amaç:** Düzenlenebilir projeyi kaydedip geri açmak ve görsel çıktı almak.

Görevler:

- [x] P4.1 JSON V1 çalışma zamanı şeması
- [x] P4.2 Atomik proje içe aktarma ve anlaşılır Türkçe hata
- [x] P4.3 JSON indirme ve dosyadan açma
- [x] P4.4 Kaydet-aç turu, negatif koordinat ve dönüş testleri
- [x] P4.5 Bilinmeyen sürümü güvenli reddetme ve gelecekteki göç sınırı
- [x] P4.6 Görünümden bağımsız yüksek çözünürlüklü PNG/JPEG çizimi
- [x] P4.7 Motif/yerleşim alanı, DPI, zemin, şeffaflık ve kalite seçenekleri
- [x] P4.8 Büyük çıktı, büyük/bozuk dosya ve atomiklik sınır testleri
- [x] P4.9 Kayıt anına göre değişiklik takibi ve yeni proje güvenlik onayı
- [x] P4.10 UTF-8 BOM'lu CSV malzeme adet raporu

**Çıkış ölçütü:** Bir proje veri kaybı olmadan JSON turu yapar; geçersiz dosya mevcut projeyi bozmaz; güncel tasarım JPEG olarak indirilebilir.

**Doğrulama:** Altın JSON dosyaları, tur testi, bozuk giriş testleri ve JPEG boyut/görsel duman kontrolü.

## Aşama 5 — Gelişmiş boncuk düzenleme araçları

**Amaç:** Büyük manuel tasarımlarda çoklu seçim ve atomik toplu düzenleme sağlamak.

Görevler:

- [x] P5.1 Shift, alan ve Ctrl+A ile çoklu seçim
- [x] P5.2 Dünya koordinatında atomik toplu taşıma ve klavye adımları
- [x] P5.3 Kopyala/yapıştır/çoğalt ve hassas tekrarlı çoğaltma
- [x] P5.4 Kalıcı grup modeli, grup seçimi, taşıma ve ortak merkezde dönüş
- [x] P5.5 Gerçek döndürülmüş sınırlara göre hizalama ve eşit dağıtma
- [x] P5.6 Delta tabanlı tek adımlı undo/redo toplu komutları
- [x] P5.7 JSON `1.1` grup/ayar şeması ve `1.0` geçişi
- [x] P5.8 AABB sıralı tam-proje doğrulaması ve 5.000 nesne testleri
- [x] P5.9 Responsive Türkçe gelişmiş araç paneli ve klavye kısayolları

**Çıkış ölçütü:** Çoklu/gruplu işlemler kısmi uygulanmaz, geometriyi gevşetmez ve tek undo/redo adımıdır; gruplar JSON turunda korunur.

**Doğrulama:** Seçim, toplu komut, grup, hizalama, JSON geçişi ve 5.000 nesneli performans testleri.

## Aşama 6 — Akıllı motif üretim motoru

**Amaç:** Gerçek AI servisi veya backend olmadan, seçili katalog malzemelerinden deterministik ve düzenlenebilir geometrik motifler üretmek.

Görevler:

- [x] P6.1 Altı geometrik motif türü ve seed tabanlı saf üretim çekirdeği
- [x] P6.2 Seçili malzemeler ve göreli kullanım oranları
- [x] P6.3 Yatay, dikey, dört yönlü ve 3/4/5/6/8/12 tekrarlı radyal simetri
- [x] P6.4 Motif sınırı, minimum aralık ve kesin geometri doğrulaması
- [x] P6.5 Uzamsal hücre ön elemesi ile nesne/adım/süre güvenlik sınırları
- [x] P6.6 Projeyi değiştirmeyen çalışma alanı önizlemesi ve gerçek üretim raporu
- [x] P6.7 Mevcut tasarıma ekleme veya onaylı değiştirme; atomik tek undo/redo adımı
- [x] P6.8 JSON `1.1` placement uyumluluğu ve eski `1.0`/`1.1` projelerin korunması
- [x] P6.9 Responsive Türkçe üretim penceresi ve otomatik testler

**Çıkış ölçütü:** Aynı seed ve aynı parametreler aynı yerleşimleri üretir; önizleme projeyi değiştirmez; uygulama bütün geometri kurallarını yeniden doğrular ve kısmi sonuç bırakmaz.

**Doğrulama:** Altı motif türü, simetri/açı, seçili malzeme, sınır/aralık, negatif koordinat, atomiklik, undo/redo, JSON turu ve büyük motif testleri.

### Aşama 6.1 — Gezinme ve eğri yerleşimi revizyonu

- [x] Boş alanda sol sürükleme pan; Shift + sol sürükleme alan seçimi
- [x] Space + sol, orta tuş, dokunma ve imleç merkezli tekerlek zoomunu koruma
- [x] Halka, spiral, dalga ve çiçekte yay uzunluğuna dayalı yerleşim
- [x] Hedef boncuk aralığı ile minimum güvenlik aralığını ayırma
- [x] Karışık malzeme boyutu/açısı ve deterministik komşu yeniden dağıtımı
- [x] Jest, yay uzunluğu, kapanış aralığı ve kesin geometri testleri

**Çıkış ölçütü:** Gezinme fiziksel koordinatları değiştirmez; eğri yoğunluğu rastgele delik üretmez; son sonuç ortak çakışma ve minimum aralık kurallarını geçer.

## Aşama 7 — Referans görsel analizi

**Amaç:** JPEG/PNG motifini, seçili gerçek malzemelerle yaklaşık ve düzenlenebilir tasarıma dönüştürmek.

Görevler:

- P7.1 Temsili veri seti ve başarı ölçütü tanımı
- P7.2 Dosya türü/boyutu/çözünürlük doğrulaması
- P7.3 Arka plan ayırma ve motif maskesi prototipi
- P7.4 Siluet/kenar/renk bölgesi çıkarımı deneyi
- P7.5 Fiziksel alana ölçekleme ve yoğunluk kontrolü
- P7.6 Seçili malzemelerle yerleşim sezgiseli
- P7.7 Ortak geometri doğrulama/onarım hattı
- P7.8 Kalite uyarısı ve kullanıcı ayarlama akışı
- P7.9 Gizlilik, silme ve sağlayıcı politikası

**Çıkış ölçütü:** Temsili örneklerde düzenlenebilir ve kurallara uygun yaklaşık yerleşim üretilir; kusursuzluk iddiası olmadan kalite/sınırlamalar kullanıcıya gösterilir.

**Doğrulama:** Etiketli örnek seti, siluet benzerliği ve geçerli yerleşim oranı; uzman kullanıcı değerlendirmesi.

## Aşama 8 — Ticari sürüm

**Amaç:** Ürünü güvenli, yönetilebilir ve lisanslanabilir bir hizmete dönüştürmek.

Görev kümeleri:

- P8.1 Kimlik doğrulama, yetkilendirme ve hesap yaşam döngüsü
- P8.2 Bulut proje depolama, kota, yedekleme ve sürümleme
- P8.3 Abonelik, faturalama ve yetki özellikleri
- P8.4 Lisans ve kullanım koşulları
- P8.5 Denetim kayıtları, izleme, hata takibi ve destek
- P8.6 Güvenlik/gizlilik değerlendirmesi ve veri silme
- P8.7 Ölçek/perf yük testleri ve felaket kurtarma
- P8.8 Pilot kullanıcı, kullanılabilirlik ve ticari yayın kontrol listesi

**Çıkış ölçütü:** Güvenlik, veri, ödeme ve operasyon kontrolleri doğrulanmış; pilot geri bildirimiyle yayın kararı alınmıştır.

## Aşamalar arası genel kalite kapısı

Her aşamada:

1. İlgili görevler tamamlanır ve `TASKS.md` güncellenir.
2. Yeni/etkilenen davranışın otomatik testleri geçer.
3. Tür denetimi ve üretim derlemesi geçer (kod aşamalarında).
4. Belgeler ve karar kaydı günceldir.
5. Bilinen sınırlamalar açıkça yazılır.
6. Kullanıcıya test yöntemi ve sonuç özeti sunulur.
7. Sonraki aşama için açık onay beklenir.

