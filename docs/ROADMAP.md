# Geliştirme Yol Haritası

Her aşama, önceki aşamanın kabul ölçütleri sağlanıp kullanıcı onayı alındıktan sonra başlar. Görev kimlikleri [TASKS.md](TASKS.md) ile birlikte kullanılır.

## Aşama 0 — Planlama

**Amaç:** Ürün sınırlarını, veri modelini, mimariyi ve doğrulama kurallarını koddan önce netleştirmek.

Görevler:

- P0.1 Ürün amacı, kullanıcılar, kapsam içi/dışı maddeler ve başarı ölçütleri
- P0.2 Frontend/backend sınırları ve katmanlı mimari
- P0.3 Malzeme, yerleşim, çalışma alanı ve proje şemaları
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
- P1.5 Genişlik/yükseklik ve mm/cm giriş modeli
- P1.6 Saf mm/cm dönüşüm yardımcıları ve birim testleri
- P1.7 Boş Konva çalışma alanı, açık gri zemin ve ekrana sığdırma
- P1.8 Görünüm durumu: zoom/pan; fiziksel modelden ayrım
- P1.9 Temel erişilebilirlik ve farklı pencere boyutlarında düzen
- P1.10 README kurulum/çalıştırma/test komutlarını güncelleme

**Çıkış ölçütü:** Kullanıcı alan ölçülerini seçebilir; boş alan doğru en-boy oranıyla görünür; zoom/pan fiziksel ölçüyü değiştirmez; test ve üretim derlemesi geçer. Malzeme ekleme yoktur.

**Doğrulama:** Birim testleri, bileşen duman testi, `typecheck`, üretim derlemesi ve 200×250 / 300×400 / 100×150 mm elle kontrolü.

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

- P4.1 JSON V1 çalışma zamanı şeması
- P4.2 Atomik proje içe aktarma ve anlaşılır hata listesi
- P4.3 JSON indirme ve dosyadan açma
- P4.4 Kaydet-aç turu testleri
- P4.5 Sürüm göçü altyapısı ve örnek eski sürüm testi
- P4.6 Konva'dan yüksek çözünürlüklü JPEG önizleme
- P4.7 JPEG indirme ve zemin/ölçek seçenekleri
- P4.8 Büyük dosya ve bozuk dosya sınır testleri

**Çıkış ölçütü:** Bir proje veri kaybı olmadan JSON turu yapar; geçersiz dosya mevcut projeyi bozmaz; güncel tasarım JPEG olarak indirilebilir.

**Doğrulama:** Altın JSON dosyaları, tur testi, bozuk giriş testleri ve JPEG boyut/görsel duman kontrolü.

## Aşama 5 — Yazılı komutla yapay zekâ

**Amaç:** Kullanıcı komutundan yalnız doğrulanmış, düzenlenebilir yerleşim üretmek.

Görevler:

- P5.1 Sağlayıcı ve yapılandırılmış çıktı araştırma deneyi
- P5.2 FastAPI iskeleti, yapılandırma ve sağlık uç noktası
- P5.3 İstek/öneri şemaları ve limitler
- P5.4 Sağlayıcı bağımsız `DesignGenerator` arayüzü
- P5.5 Komuttan izinli malzeme/kısıt çözümleme
- P5.6 Katı yapılandırılmış çıktı ve hata eşleme
- P5.7 Sunucu geometri doğrulaması ve ortak altın vakalar
- P5.8 Sınırlı yeniden deneme/onarım politikası
- P5.9 Frontend önizleme, kabul ve reddetme akışı
- P5.10 Gerçek nesnelerden kısıt ve adet doğrulaması
- P5.11 Zaman aşımı, maliyet, log ve gizlilik kontrolleri

**Çıkış ölçütü:** Katalog dışı, çakışan veya alan dışı AI önerisi projeye giremez; geçerli öneri tek işlemle kabul edilip manuel düzenlenebilir.

**Doğrulama:** Sahte sağlayıcı testleri, şema/geometri hata vakaları, frontend-backend uyumluluk testleri ve kontrollü sağlayıcı denemesi.

## Aşama 6 — Referans görsel analizi

**Amaç:** JPEG/PNG motifini, seçili gerçek malzemelerle yaklaşık ve düzenlenebilir tasarıma dönüştürmek.

Görevler:

- P6.1 Temsili veri seti ve başarı ölçütü tanımı
- P6.2 Dosya türü/boyutu/çözünürlük doğrulaması
- P6.3 Arka plan ayırma ve motif maskesi prototipi
- P6.4 Siluet/kenar/renk bölgesi çıkarımı deneyi
- P6.5 Fiziksel alana ölçekleme ve yoğunluk kontrolü
- P6.6 Seçili malzemelerle yerleşim sezgiseli
- P6.7 Ortak geometri doğrulama/onarım hattı
- P6.8 Kalite uyarısı ve kullanıcı ayarlama akışı
- P6.9 Gizlilik, silme ve sağlayıcı politikası

**Çıkış ölçütü:** Temsili örneklerde düzenlenebilir ve kurallara uygun yaklaşık yerleşim üretilir; kusursuzluk iddiası olmadan kalite/sınırlamalar kullanıcıya gösterilir.

**Doğrulama:** Etiketli örnek seti, siluet benzerliği ve geçerli yerleşim oranı; uzman kullanıcı değerlendirmesi.

## Aşama 7 — Ticari sürüm

**Amaç:** Ürünü güvenli, yönetilebilir ve lisanslanabilir bir hizmete dönüştürmek.

Görev kümeleri:

- P7.1 Kimlik doğrulama, yetkilendirme ve hesap yaşam döngüsü
- P7.2 Bulut proje depolama, kota, yedekleme ve sürümleme
- P7.3 Abonelik, faturalama ve yetki özellikleri
- P7.4 Lisans ve kullanım koşulları
- P7.5 Denetim kayıtları, izleme, hata takibi ve destek
- P7.6 Güvenlik/gizlilik değerlendirmesi ve veri silme
- P7.7 Ölçek/perf yük testleri ve felaket kurtarma
- P7.8 Pilot kullanıcı, kullanılabilirlik ve ticari yayın kontrol listesi

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

