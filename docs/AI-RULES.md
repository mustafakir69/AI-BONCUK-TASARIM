# Yapay Zekâ Tasarım Kuralları

## 1. Rol ve sınır

Yapay zekâ bir görsel üretici değil, kısıtlı bir yerleşim önericisi olarak kullanılacaktır. Otoriter karar mercii yapay zekâ değil, sürümlü şema ve deterministik geometri doğrulayıcısıdır.

Aşama 6'da gerçek LLM veya bulut sağlayıcısı yerine, aynı güvenlik sınırlarını kullanan yerel ve deterministik motif üretim motoru uygulanmıştır. Harici AI sağlayıcısı ayrıca onaylanmadan eklenmez.

## 2. Değişmez kurallar

Yapay zekâ:

- Yalnız kullanıcının açıkça izin verdiği `materialId` değerlerini kullanır.
- Malzeme boyutunu, şeklini veya fiziksel özelliklerini değiştiremez.
- JPEG/PNG üretip bunu düzenlenebilir proje olarak sunamaz.
- Malzeme adetlerini tahmin edemez; yalnız yerleşimler önerir.
- Şema dışı alanlarla güvenilir komut veremez.
- Çakışma veya alan dışı yerleşimi geçerli ilan edemez.
- Kullanıcı projesini doğrulama ve onay olmadan kalıcı olarak değiştiremez.
- Referans görselde var diye katalog dışı hayali malzeme ekleyemez.

## 3. Girdi sözleşmesi

```ts
interface DesignGenerationRequest {
  requestId: string;
  prompt: string;
  motif: {
    widthMm: number;
    heightMm: number;
  };
  minimumGapMm: number;
  allowedMaterials: Array<{
    id: string;
    name: string;
    widthMm: number;
    heightMm: number;
    shape: "square" | "rectangle" | "circle" | "ring";
    color: string;
  }>;
  constraints?: {
    maxTotalPlacements?: number;
    maxByMaterial?: Record<string, number>;
    preferredRegion?: { xMm: number; yMm: number; widthMm: number; heightMm: number };
  };
}
```

Komut metninde geçen ölçüler ile yapılandırılmış motif hedefi çelişirse sistem kullanıcıya çelişkiyi açıklar; sessizce rastgele seçim yapmaz. Güvenlik ve maliyet için komut uzunluğu ve azami nesne sayısı sınırlandırılır.

## 4. Çıktı sözleşmesi

```ts
interface DesignProposal {
  schemaVersion: "1.0";
  requestId: string;
  placements: Array<{
    clientRef: string;
    materialId: string;
    xMm: number;
    yMm: number;
    rotationDeg: number;
    colorOverride?: string;
  }>;
  notes?: string[];
}
```

AI'nin verdiği nesne kimlikleri doğrudan güvenilir kabul edilmez. Sistem doğrulamadan sonra gerçek `PlacementId` üretir. Çıktıda malzeme ölçüsü bulunmaz; katalog tek kaynaktır.

## 5. İşleme hattı

```text
Kullanıcı komutu
  → istek şeması ve limit doğrulaması
  → izinli malzemelerle model çağrısı
  → katı yapılandırılmış çıktı çözümleme
  → kimlik/malzeme/kısıt doğrulaması
  → deterministik sınır ve çakışma doğrulaması
  → gerekirse sınırlı onarım denemesi
  → kullanıcıya önizleme ve doğrulama özeti
  → kullanıcı kabul ederse editör projesine tek komut olarak ekleme
  → gerçek nesnelerden adet hesaplama
```

Her aşama gözlemlenebilir hata kodu üretir; ham model metni doğrudan proje durumuna girmez.

## 6. Geçersiz öneri politikası

- Şema hatası varsa öneri bütünüyle reddedilir.
- Katalog dışı malzeme varsa öneri bütünüyle reddedilir.
- Geometri hatasında varsayılan yaklaşım, modeli en fazla sınırlı sayıda yeniden denemek veya deterministik yerleştirme onarımı uygulamaktır.
- Kısmi sonuç ancak ürün kararıyla, kullanıcıya atlanan nesne ve nedenleri açıkça gösterilerek sunulabilir; sessizce nesne düşürülmez.
- Deneme sınırı sonunda geçerli sonuç yoksa mevcut proje değişmez.
- Modelin açıklaması, doğrulama sonucunu geçersiz kılamaz.

Onarım algoritması ayrı ve deterministik olmalı; nesneleri küçük adımlarla taşırken motif bütünlüğünü bozabileceği için sonuç yeniden doğrulanmalı ve kullanıcıya belirtilmelidir.

## 7. Adet ve kısıt denetimi

- `maxByMaterial`, kabul edilen yerleşimlerin gerçek sayımıyla kontrol edilir.
- “En fazla 6 inci” gibi kısıtlar malzeme kimliğine çözümlenir; aynı adla birden fazla kayıt varsa kullanıcıdan seçim gerekir.
- Toplam ve malzeme bazlı adetler çıktı alanından okunmaz.
- Sayım, yalnız doğrulanıp projeye kabul edilen nesneler üzerinde yapılır.

## 8. Referans görsel kuralları (Aşama 7)

- JPEG/PNG yalnız motifin siluet, yön, yoğunluk ve renk bölgeleri gibi özelliklerini çıkarmak için kullanılır.
- Görseldeki boncuğun piksel boyutu gerçek fiziksel ölçü sayılmaz.
- Kullanıcı hedef motif ölçüsünü ve izinli malzemeleri ayrıca seçer.
- Sistem, görseli birebir kopyalama veya kusursuz dönüşüm garantisi vermez.
- Çıktı yine `DesignProposal` benzeri yapılandırılmış yerleşimdir ve aynı geometri hattından geçer.
- Yüklenen görselin türü, boyutu, çözünürlüğü ve gizlilik koşulları çağrıdan önce doğrulanır.
- Model güven puanı varsa yalnız bilgilendirme amaçlıdır; geometrik doğrulamanın yerine geçmez.

## 9. Güvenlik ve gizlilik

- API anahtarları yalnız backend'de saklanır.
- Kullanıcı metni ve görseli güvenilmeyen girdidir; istem enjeksiyonu veri kısıtlarını değiştiremez.
- Sağlayıcıya yalnız görev için gerekli malzeme ve hedef motif verisi gönderilir.
- Sağlayıcı, saklama süresi ve kullanıcı onayı ticari sürümden önce belgelenir.
- Hassas içerik loglarda maskelenir; ham görseller varsayılan olarak kalıcı tutulmaz.
- Zaman aşımı, maliyet, hız ve azami çıktı nesnesi limitleri sunucuda uygulanır.

## 10. Sağlayıcı bağımsızlığı

Gelecekte harici bir sağlayıcı eklenirse uygulama, sağlayıcıya özgü yanıtı alan modeline taşımayan bir `DesignGenerator` arayüzü kullanır. Sağlayıcı değişikliği editör ve geometri çekirdeğini etkilememelidir. Yapılandırılmış çıktı desteği, maliyet, gecikme ve veri politikası ayrı bir aşama/onay kapsamında değerlendirilir.

## 11. Test yaklaşımı

- Sahte sağlayıcıyla geçerli yapılandırılmış öneri
- Bozuk JSON ve eksik alan
- İzin verilmeyen malzeme kimliği
- `NaN`, sonsuz, alan dışı ve çakışan koordinat
- Kullanıcı üst sınırını aşan gerçek yerleşim sayısı
- Sağlayıcı zaman aşımı ve yeniden deneme sınırı
- Kısmi/başarısız sonuçta projenin değişmeden kalması
- Aynı önerinin frontend ve backend doğrulamasında aynı sonucu vermesi
- Referans görsel akışında katalog dışı malzemenin reddedilmesi

## 12. Başarı ölçütü

Bir AI özelliği, ürettiği resmin estetik görünümüyle değil; geçerli yerleşim oranı, kısıt uyumu, düzenlenebilirlik, kullanıcı düzeltme yükü ve gerçek nesne sayımının doğruluğuyla değerlendirilir.

## 13. Aşama 6 deterministik motif motoru

Aşama 6 motoru bir LLM değildir ve ağ çağrısı yapmaz. `frontend/src/domain/motifGeneration.ts` içindeki saf TypeScript üretici şu sözleşmeyi uygular:

- Düz çizgi, halka, spiral, dalga, çiçek ve tekrarlı geometrik desen üretir.
- Yalnız kullanıcının işaretlediği etkin katalog `materialId` değerlerini ve pozitif göreli oranları kabul eder.
- Aynı seed, parametre ve katalogla aynı koordinat/malzeme/açı dizisini üretir; kontrolsüz `Math.random()` kullanmaz.
- Yatay, dikey, dört yönlü ve radyal simetride koordinatla birlikte açıyı dönüştürür; aynı merkez koordinatını çoğaltmaz.
- Her adayın gerçek döndürülmüş geometrisini üretim dikdörtgeni, çakışma ve minimum aralık kurallarına karşı sınar.
- Yakın adayları hücre tabanlı uzamsal indeksle bulur; kesin karar mevcut daire/SAT/uzaklık fonksiyonlarınındır.
- En fazla 5.000 kabul edilmiş boncuk, 40.000 aday ve 1.000 ms çalışma bütçesi kullanır. Sınır aşımında kısmi sonuç projeye uygulanmaz.
- Önizleme geçici UI durumudur. Uygulama anında bütün aday proje yeniden doğrulanır ve tek undo/redo komutuyla eklenir veya değiştirilir.
- Malzeme oranı hedefi yaklaşık dağılımdır; reddedilen adaylar nedeniyle kesin oran garantisi verilmez. Rapor gerçek kabul edilen placement nesnelerinden hesaplanır.

Üretim ayarları Aşama 6'da proje şemasına yazılmaz. Uygulanan placement nesneleri mevcut JSON `1.1` modeliyle kaydedilir; böylece `1.0` ve `1.1` geriye uyumluluğu değişmez.

## 14. Aşama 6.1 eğri yerleşim revizyonu

- Halka, spiral, dalga ve çiçek eğrileri `arcLength.ts` içindeki saf kümülatif uzunluk tablosundan örneklenir.
- Hedef boncuk aralığı görsel yoğunluğu belirler; minimum güvenlik aralığı kesin geometri doğrulamasının ayrı alt sınırıdır.
- Yoğunluk rastgele aday silmez; deterministik merkez adımını düzenli biçimde büyütür.
- Merkez adımı seçili malzemenin katalog genişlik/yüksekliğini ve eğri teğetine göre dönüşünü hesaba katar.
- Açık yol artığı uçlara ortalanır; kapalı yol artığı kapanış dahil komşulara yeniden dağıtılır. Kesin testte çakışan bir eğri adayında önceki/yeni komşu teğet boyunca üç sınırlı deterministik karşılıklı kaydırmayla yeniden sınanır.
- Üretimden geçen her sonuç yine ortak çakışma ve minimum aralık çekirdeğiyle bütünüyle doğrulanır; geometrik olarak mümkün olmayan aday kabul edilmez.
- Aynı seed ve parametreler aynı malzeme/konum/açı dizisini üretmeye devam eder.

## 15. Aşama 7A AI istek ve plan sözleşmesi

Aşama 7A gerçek AI modeli bağlamaz. Arayüz bir `AiDesignRequest 1.0` hazırlar ve yalnız yerel doğrulama yapar. Sağlayıcı yapılandırılmadığında doğru durum “AI bağlantısı henüz yapılandırılmadı”dır; sahte sonuç, ilerleme yüzdesi veya analiz iddiası gösterilmez.

### Malzeme yetkisi

- `user-only`: izinli küme kullanıcının işaretlediği etkin kimliklerdir; çıktı bu kümenin dışına çıkamaz.
- `ai-selects`: kullanıcı bu modu seçerek etkin kataloğun tamamını aday küme olarak yetkilendirir; zorunlu kimlik yoktur.
- `collaborative`: işaretlenen etkin kimlikler zorunludur; etkin kataloğun kalanı tamamlayıcı adaydır.
- Her modda katalog dışı, devre dışı veya planın kendi `materialIds` kümesi dışında kalan placement reddedilir.

### Sürümlü plan

`AiDesignPlan 1.0`; açıklama, hedef ölçü, malzeme kimlikleri, bileşen türü/konumu/boyutu/açısı, katman/öncelik, yoğunluk bölgeleri, simetri, yerleşim üretim talimatları, uyarı ve belirsizlikleri taşır. Bilinmeyen sürüm, yinelenen kimlik, hedef dışı koordinat, `[0, 360)` dışı açı, kontrolsüz dizi veya kullanıcı adet sınırını aşan talimat bütünüyle reddedilir.

Plan doğrulaması placement doğrulamasının yerine geçmez. Gelecekteki yorumlayıcının ürettiği her placement:

1. benzersiz kimlik ve sonlu mm koordinatı,
2. kullanıcı/plan tarafından izinli etkin katalog malzemesi,
3. gerçek katalog ölçüsüyle hedef motif sınırı,
4. kullanıcı maksimum boncuk sayısı,
5. mevcut döndürülmüş geometri, pul dış disk ve minimum güvenlik aralığı

kapılarından geçer. Tek zorunlu hata önerinin projeye alınmasını engeller.

### Referans görsel

JPEG, PNG ve WebP dosyaları MIME ile dosya imzası uyumu, 8 MB, 8.192 px tek kenar ve 32 MP toplam limitleriyle yerel doğrulanır. Önizleme analizin yapıldığı anlamına gelmez. Dosya proje JSON'una veya kalıcı tarayıcı kaydına yazılmaz, kullanıcıdan habersiz ağ isteğine eklenmez ve pencere kapanınca nesne URL'si geri alınır.

## 16. Aşama 7B gerçek sağlayıcı ve güvenli sunucu

- Sağlayıcı OpenAI Responses API'dir; Assistants API kullanılmaz. Model adı `AI_MODEL` ortam değişkeninden gelir.
- Python SDK `responses.parse(..., text_format=AiDesignPlan)` ile Pydantic Structured Outputs ister; yanıt yine uygulama kurallarıyla bağımsız doğrulanır.
- `OPENAI_API_KEY` yalnız backend ortamındadır. Frontend yalnız `VITE_AI_API_BASE_URL` taşır.
- Ücretli çağrılar varsayılan olarak `AI_CALLS_ENABLED=false` ile kapalıdır. Anahtar/model/etkinleştirme yoksa backend çalışır, AI uç noktası açıklayıcı hata döndürür.
- Sağlayıcı isteği `store=False` kullanır. Metin ve görsel uygulama tarafından veritabanına, LocalStorage'a veya proje JSON'una yazılmaz; uygulama loglarında ham içerik tutulmaz.
- Harici çağrıdan önce şu açık onay zorunludur: “Yazdığınız tasarım tarifi ve seçtiğiniz referans görsel, tasarımın oluşturulması amacıyla seçtiğiniz yapay zekâ sağlayıcısına gönderilecektir.”
- Backend uzak görsel URL'si kabul etmez. Dosyayı imza/decode/boyut/piksel açısından yeniden doğrular, EXIF yönünü uygular, üst veriyi kaldırıp güvenli JPEG olarak yeniden kodlar.
- Görseldeki yazı veya talimat güvenilmeyen kullanıcı içeriğidir; sistem talimatı veya katalog yetkisi sayılmaz. Fiziksel ölçek yalnız kullanıcının `target` mm değeridir.
- Fiyat kod içine yazılmaz. Yalnız sağlayıcının gerçek token kullanımı varsa raporlanır; tahmini ücret gösterilmez.
- Frontend iptal, geç yanıt ve yinelenen gönderim koruması uygular. Backend sınırlı SDK yeniden denemesi, zaman aşımı, çıktı tokenı, oran ve eşzamanlılık limitleri uygular.

### Plan–geometri dönüşümü

Doğrudan düzenlenebilir koordinata dönüştürülen bileşenler: düz çizgi, polyline, kübik Bézier, elips kenarı, dikdörtgen kenarı/dolgusu ve açık nokta kümesi. Her sonuç bağımsız `Placement` nesnesidir; boyut katalog malzemesinden okunur.

`unsupported` işaretli özgün biçim, görsel maske/kontur, topolojik katman veya açık parametrik karşılığı olmayan semantik yaprak/çiçek sessizce başka motife çevrilmez. Sınır kutusu dolgusu gibi bir yaklaştırma yapılırsa raporda açıklanır ve kullanıcı ayrıca kabul eder. Her aday son olarak motif sınırı, katalog, çakışma ve minimum aralık kapısından geçer.

## 17. Aşama 7B.1 9Router sağlayıcı kuralları

- OpenAI ve 9Router ortak `DesignProvider` sözleşmesini uygular; birinin hatası diğerine otomatik veya sessiz geçiş başlatmaz.
- 9Router'a yalnız backend bağlanır. Kök adres tam olarak `http://127.0.0.1:20128/v1` olmalı ve yönlendirmeler izlenmemelidir.
- Model kimliği `/v1/models` listesinden tam olarak alınır. Kod model adı tahmin etmez, liste dışı modeli çağırmaz ve `NINEROUTER_MODEL` boşken hazır durumu göstermez.
- Ulaşılabilirlik ve model listesini okumak üretim yeteneğini kanıtlamaz. `NINEROUTER_MODEL_COMPATIBILITY_VERIFIED` açık değilse durum “uyumluluk doğrulanmadı”dır ve üretim çağrısı yapılmaz.
- Resmî olarak belgelenen OpenAI uyumlu yol `/v1/chat/completions` olduğundan 9Router adapter'ı bunu kullanır. Responses API veya native `json_schema` desteği bütün modeller için varsayılmaz.
- Varsayılan yapılandırmada yanıt düz metin JSON olarak ayrıştırılır ve `AiDesignPlan` Pydantic modeliyle doğrulanır. Bozuk JSON, eksik/fazla alan veya iş kuralı ihlali bütünüyle reddedilir.
- Görsel desteği yalnız `/v1/models` girdisi `capabilities.vision=true` bildiriyor ve operatör ayrı canlı testten sonra `NINEROUTER_VISION_VERIFIED=true` ayarlıyorsa etkinleşir. Aksi durumda frontend dosya seçimini, backend dosya aktarımını reddeder.
- 9Router modeli yerel süreçten uzak veya ücretli bir hesaba yönlendirebilir. Uygulama yalnız tam model kimliğini gönderir; 9Router içindeki combo/fallback/hesap politikası kullanıcı tarafından ayrıca denetlenmelidir.
- `NINEROUTER_API_KEY` yalnız backend `.env` dosyasındadır; frontend'e, loga, hata mesajına veya dokümantasyon örneğine gerçek değer yazılmaz.

