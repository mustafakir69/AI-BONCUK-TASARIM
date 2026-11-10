# Ürün Kapsamı ve Gereksinimler

## 1. Ürün vizyonu

AI Boncuk Tasarım, görsel bir motif fikrini üretilebilir bir boncuk nakış planına dönüştürür. Düzenlenebilir projenin kaynağı bir resim değil; malzeme kimlikleri, gerçek ölçüler, koordinatlar ve dönüş açılarından oluşan yapılandırılmış veridir.

## 2. Problem

Müşterilerden gelen yapay zekâ üretimi veya fotoğraf tabanlı referanslarda şu sorunlar görülür:

- Boncuk ölçüleri kendi içinde tutarsızdır.
- Görseldeki malzemelerin fiziksel karşılığı bulunmayabilir.
- Malzemeler üst üste binebilir veya kumaş alanının dışına çıkabilir.
- Görselden güvenilir adet ve üretim planı çıkarılamaz.
- Küçük bir değişiklik için motifin tamamını yeniden üretmek gerekebilir.

Uygulama, kullanıcının tanımladığı gerçek malzeme kataloğunu ve deterministik geometri doğrulamasını merkeze alarak bu sorunları çözer.

## 3. Hedef kullanıcılar

- Nakış desinatörleri
- Boncuk ve pul işleme atölyeleri
- Tekstil üreticileri
- Moda tasarımcıları

Arayüz profesyonel iş akışlarını desteklerken Türkçe, sade ve öğrenilebilir olacaktır.

## 4. Ürün ilkeleri

1. **Gerçek ölçü:** Alan modeli yalnızca milimetre kullanır.
2. **Üretilebilirlik:** Her kalıcı yerleşim sınır ve çakışma doğrulamasından geçer.
3. **Düzenlenebilirlik:** Her boncuk bağımsız, kimlikli bir nesnedir.
4. **Tek kaynak:** Malzemenin boyut ve geometrisi katalog kaydından gelir.
5. **Doğru adet:** Sayılar yerleşim nesnelerinden hesaplanır.
6. **İnsan denetimi:** Yapay zekâ önerir; kurallar doğrular; kullanıcı düzenler.
7. **Aşamalı teslim:** Her aşama bağımsız kabul ölçütleriyle tamamlanır.

## 5. Kapsam

### İlk kullanılabilir sürüm

- Hedef motif genişliği/yüksekliği ve mm/cm girişi
- Sınırsız tasarım düzlemi; negatif koordinatlar
- Gerçek milimetrik yatay/dikey cetvel, ızgara, yakınlaştırma ve kaydırma
- Düzlemi sınırlamayan, açılıp kapatılabilir motif sınır kılavuzu
- Malzeme ekleme, düzenleme, devre dışı bırakma ve silme kuralları
- Boncuk ekleme, seçme, taşıma, döndürme, renklendirme ve silme
- Geri al/yinele
- Çoklu/alan seçimi, toplu taşıma/döndürme, kopyalama, gruplama, hizalama ve dağıtma
- Sınır, çakışma ve minimum aralık doğrulaması
- Malzeme adet özeti
- Sürümlü JSON proje kaydetme/açma
- PNG/JPEG görsel dışa aktarma ve CSV malzeme raporu
- Seçili gerçek malzemelerle seed tabanlı geometrik motif üretimi, geçici önizleme ve atomik uygulama
- Serbest metin ve yerel referans görselle AI tasarım isteği hazırlama; katalog yetkisi ve güvenli şema doğrulaması

### İleri kapsam

- Yazılı komuttan yapılandırılmış yerleşim önerisi
- Referans görselden motif geometrisi çıkarma ve gerçek malzemelerle yeniden kurma
- Kullanıcı hesabı, bulut proje yönetimi, abonelik ve lisanslama

### İlk sürüm kapsamı dışında

- JPEG'in düzenlenebilir projenin asıl kaynağı olması
- Yapay zekânın adet tahmin etmesi
- Onaysız veya katalog dışı malzeme üretilmesi
- Kumaş fiziği, ip yolu, dikiş sırası ve makine dosyası üretimi
- Referans görseli kusursuz veya birebir dönüştürme garantisi
- Gerçek zamanlı ortak çalışma ve mobil yerel uygulama

## 6. Ana kullanıcı akışları

### Manuel tasarım

1. Kullanıcı hedef motif ölçüsünü mm veya cm olarak girer.
2. Sistem değeri mm'ye çevirip saklar.
3. Sistem sonsuz düzlemde motif hedefini merkezdeki sınır kılavuzuyla gösterebilir.
4. Kullanıcı katalogdan bir malzeme seçer ve düzleme yerleştirir.
5. Sistem etkin motif sınırı ve çakışma kurallarını denetler.
6. Geçerli işlem kaydedilir ve sayım güncellenir; geçersiz işlem reddedilir.
7. Kullanıcı projeyi JSON olarak kaydeder veya JPEG önizlemesi alır.

### Yapay zekâ ile tasarım

1. Kullanıcı alanı ve izinli malzemeleri seçip komut yazar.
2. Aşama 7B arayüzü isteği yerel olarak doğrular ve tam aktarım onayı ister.
3. FastAPI backend katalog yetkisini yeniden doğrular; etkinleştirme, anahtar ve model yapılandırması varsa OpenAI Responses API'den sürümlü yapılandırılmış plan ister.
4. Plan frontend sözleşmesinden ve deterministik geometri yorumlayıcısından geçer; desteklenmeyen/yaklaştırılan bileşenler açıkça raporlanır.
5. Geçici önizleme projeyi değiştirmez. Yalnız tüm zorunlu kuralları geçen placement dizisi kullanıcı onayıyla tek atomik komutta editöre alınır.
6. Adetler kabul edilmiş gerçek placement nesnelerinden hesaplanır.

### Referans görsel

Aşama 7B'de kullanıcı JPEG/PNG/WebP yükler; dosya önce yerel, açık onaydan sonra backend tarafında yeniden doğrulanır. Güvenli yeniden kodlanan görsel gerçek görme yetenekli modele gönderilebilir. Model yalnız yapısal plan önerir; fiziksel ölçek kullanıcı hedefinden gelir ve referansın birebir/kusursuz dönüşümü garanti edilmez.

## 7. İşlevsel gereksinimler

| Kimlik | Gereksinim | Öncelik |
| --- | --- | --- |
| FR-01 | Hedef motif ölçüsü mm veya cm ile tanımlanabilmeli; içeride mm saklanmalı | Zorunlu |
| FR-01A | Tasarım düzlemi fiziksel sınır taşımamalı; pan/zoom ve negatif koordinatları desteklemeli | Zorunlu |
| FR-01B | Sabit cetveller görünüm dönüşümünden gerçek mm koordinatlarını göstermeli | Zorunlu |
| FR-02 | Kullanıcı malzeme oluşturabilmeli, düzenleyebilmeli ve güvenli biçimde silebilmeli | Zorunlu |
| FR-03 | Her yerleşim kimlik, malzeme kimliği, merkez koordinatı ve açı taşımalı | Zorunlu |
| FR-04 | Ekleme/taşıma/döndürme öncesi sınır ve çakışma kontrolü yapılmalı | Zorunlu |
| FR-05 | Tekli seçim, silme, renk değiştirme, geri al/yinele bulunmalı | Zorunlu |
| FR-06 | Adet özeti gerçek yerleşimlerden türetilmeli | Zorunlu |
| FR-07 | Proje sürümlü JSON olarak kaydedilip açılabilmeli | Zorunlu |
| FR-08 | Güncel tasarım motif veya yerleşim sınırından PNG/JPEG olarak dışa aktarılabilmeli | Zorunlu |
| FR-08A | Malzeme adetleri Excel uyumlu CSV raporuna aktarılabilmeli | Zorunlu |
| FR-09 | Izgara, cetvel, yakınlaştırma ve kaydırma bulunmalı | Zorunlu |
| FR-09A | Shift/alan/Ctrl+A ile çoklu seçim ve gerçek geometriye dayalı toplu düzenleme bulunmalı | Zorunlu |
| FR-09B | Gruplar proje JSON'unda saklanmalı ve toplu işlemler tek undo/redo adımı olmalı | Zorunlu |
| FR-09C | Geometrik motif motoru yalnız seçili katalog malzemeleriyle deterministik placement nesneleri üretmeli | Zorunlu |
| FR-09D | Motif önizlemesi projeyi değiştirmemeli; uygulama yeniden doğrulanmalı ve tek undo/redo adımı olmalı | Zorunlu |
| FR-10 | AI isteği üç açık malzeme yetki modundan birini kullanmalı; katalog dışı kayıt yasak olmalı | Zorunlu |
| FR-10A | Yapılandırılmış AI planı sürüm, katalog, koordinat, açı, boyut ve çıktı sınırlarıyla doğrulanmalı | Zorunlu |
| FR-10B | Sağlayıcı ve plan-yerleşim üreticisi geometri/editör katmanından bağımsız portlar olmalı | Zorunlu |
| FR-11 | JPEG/PNG/WebP referans tür, imza, boyut ve çözünürlük açısından yerel doğrulanmalı | Zorunlu |
| FR-11A | Referansın harici analizi yalnız açık onaylı Aşama 7B sunucu akışında yapılmalı | Zorunlu |
| FR-11B | Gizli anahtar yalnız backend'de kalmalı; ücretli çağrı ayrıca etkinleştirilmeden çalışmamalı | Zorunlu |
| FR-11C | AI planı yalnız desteklenen parametrik geometriler için placement'a çevrilmeli; desteklenmeyen biçimler açıkça raporlanmalı | Zorunlu |

## 8. İşlevsel olmayan gereksinimler

- **Doğruluk:** Boyut/konum işlemleri kayan nokta toleransı dışında deterministik olmalıdır.
- **Test edilebilirlik:** Geometri fonksiyonları DOM, Canvas ve ağ olmadan çalışmalıdır.
- **Performans:** İlk hedef, yaygın bir masaüstü tarayıcıda 5.000 nesneli sahnede temel düzenlemenin akıcı kalmasıdır; ölçüm Aşama 3'te yapılır.
- **Taşınabilirlik:** Güncel Chrome, Edge ve Firefox masaüstü sürümleri hedeflenir.
- **Erişilebilirlik:** Araçların metin etiketi, klavye odağı ve yalnız renge dayanmayan durum bildirimi olmalıdır.
- **Yerelleştirme:** İlk dil Türkçedir; kullanıcı metinleri bileşen mantığına gömülmeyecek biçimde merkezileştirilebilir.
- **Güvenilirlik:** Proje içe aktarımı şema ve iş kuralı doğrulamasından geçmeden duruma alınmaz.
- **Gizlilik:** Manuel editör yerel tarayıcıda çalışır. AI metni/görseli yalnız açık onayla güvenli backend üzerinden sağlayıcıya gönderilir; proje verisi otomatik buluta kaydedilmez.

## 9. Aşama 0 kabul ölçütleri

- İstenen bütün Markdown belgeleri oluşturulmuştur.
- Frontend/backend sınırları ve planlanan klasör yapısı tanımlanmıştır.
- Malzeme, yerleşim ve proje veri modelleri örnekleriyle belgelenmiştir.
- Döndürülmüş dikdörtgen, daire-dikdörtgen, sınır ve aralık algoritmaları açıklanmıştır.
- Yol haritası küçük ve test edilebilir görevlere ayrılmıştır.
- Aşama 1 yapılacakları ve çıkış ölçütleri açıkça yazılmıştır.

## 10. Başarı ölçütleri

- Geçersiz yerleşimlerin kalıcı duruma girme oranı: %0 (tanımlı kurallar dahilinde).
- Adet özeti ile gerçek nesne sayısı arasında fark: 0.
- JSON kaydet-aç turunda konum, açı, renk ve malzeme bilgisinin kaybı: 0.
- Kullanıcı, yapay zekâya tekrar komut vermeden tek bir nesneyi değiştirebilir.

