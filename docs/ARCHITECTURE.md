# Teknik Mimari

## 1. Mimari hedefler

- Fiziksel ölçüleri görüntüleme ayrıntılarından ayırmak
- Geometriyi deterministik ve bağımsız test edilebilir tutmak
- Manuel editörü backend olmadan çalıştırmak
- Yapay zekâ ve görsel analizini daha sonra sınırları belli servisler olarak eklemek
- JSON şemasını sürümleyerek eski projelerin taşınabilmesini sağlamak
- Binlerce nesnede çoklu seçimi ve atomik toplu komutları verimli tutmak

## 2. Sistem bağlamı

```text
Kullanıcı
   │
   ▼
React editörü
   ├──► Alan modeli + geometri çekirdeği
   ├──► Deterministik motif üretici ──► Geçici önizleme ──► atomik komut
   ├──► JSON/JPEG/CSV uyarlayıcıları
   └──► AI istek şeması + yerel görsel güvenlik kapısı
                  │
                  └──► AiDesignProvider portu (7B: güvenli HTTP uyarlayıcısı)
                                      │
                                      └──► (7B, ayrı onay) güvenli sunucu
                                                        │
                                                        ▼
                                               AI/görsel sağlayıcısı
                                                        │
                                                        ▼
                                       Plan şeması → placement üretici
                                                        │
                                                        ▼
                                             Aynı geometri doğrulayıcısı
```

Manuel editör ve Aşama 6 deterministik motif motoru tarayıcı içinde ve backend'den bağımsız çalışır. Aşama 7B'de gerçek sağlayıcı çağrısı yalnız açık kullanıcı onayıyla, gizli anahtarı koruyan FastAPI backend üzerinden yapılır. Sağlayıcı sonucu otoriter değildir; frontend aynı plan ve geometri kapılarını yeniden uygular.

## 3. Katmanlar ve bağımlılık yönü

### Alan (`frontend/src/domain`)

- Malzeme, yerleşim, hedef motif ve proje tipleri
- mm/cm dönüşümleri
- Dünya/ekran koordinat dönüşümleri, cetvel adımı ve görünür işaret hesapları
- Sınır, çakışma, minimum aralık ve proje doğrulaması
- Adet türetme
- Seed tabanlı motif adayları, simetri dönüşümleri, sınır denetimi ve uzamsal ön eleme
- Sürümlü AI istek/plan modelleri, katalog yetkisi ve güvenilmeyen çıktı doğrulaması
- AI placement önerisi için motif sınırı ve ortak kesin geometri kapısı

Bu katman React, Konva, tarayıcı API'si veya ağ istemcisi bilmez.

### Uygulama (`frontend/src/features`)

- Editör komutları: ekle, taşı, döndür, sil, renk değiştir
- Çoklu seçim modeli (`selectedIds: Set<PlacementId>`) ve kalıcı, iç içe olmayan grup modeli
- Geri al/yinele geçmişi
- Malzeme kataloğu ve proje iş akışları
- Doğrulama sonucunu kullanıcı eylemine çevirme

### Sunum (`frontend/src/app` ve özellik bileşenleri)

- Üst araç çubuğu
- Sol malzeme paneli
- Orta çalışma alanı, cetvel ve ızgara
- Sağ ayarlar, sayım ve nesne özellikleri paneli
- Türkçe bildirimler, iletişim kutuları ve klavye etkileşimi
- Motif üretim ayarları, yaklaşık tahmin, geçici önizleme ve gerçek üretim raporu
- Serbest AI tasarım tarifi, katalog yetki modları, yerel referans görsel ve doğru bağlantı durumu

### Altyapı (`frontend/src/infrastructure`)

- Konva sahne uyarlayıcısı
- Sürümlü ve şema doğrulamalı yerel malzeme kataloğu saklaması
- Boyut sınırlı JSON dosya okuma ve Blob tabanlı indirme
- Görünümden bağımsız PNG/JPEG Canvas çıktısı
- Tarayıcı saklama/indirme API'leri
- Açık onay, iptal ve zaman aşımı destekli AI HTTP istemcisi
- Referans görsel MIME/imza, dosya boyutu ve çözünürlük doğrulaması; geçici nesne URL yaşam döngüsü

Bağımlılıklar dıştan içe akar: `sunum → uygulama → alan`. Altyapı, uygulamanın tanımladığı arayüzleri uygular; alan altyapıya bağımlı olmaz.

## 4. Koordinat, görünüm ve motif sistemi

- Alan modeli birimi: **mm**.
- Tasarım yüzeyi fiziksel sınırı olmayan sonsuz bir düzlemdir.
- Orijin düzlemde sabit `(0, 0)` noktasıdır; başlangıç görünümünde ekran merkezindedir.
- Pozitif X sağa, negatif X sola; pozitif Y aşağıya, negatif Y yukarıya gider.
- Yerleşimin `xMm`/`yMm` değeri geometrik merkezidir.
- Açı derece cinsindedir, saat yönünde artar ve kayıtta `[0, 360)` aralığına normalize edilir.
- Ekran dönüşümü: `screenPx = originPx + worldMm × pixelsPerMm`.
- `originPx`, görünüm merkezi ve ekran boyutundan türetilen fiziksel orijin konumudur.
- Kaydırma yalnız `viewCenterMm`, yakınlaştırma yalnız `pixelsPerMm` değerini değiştirir; proje geometrisi değişmez.
- Cetveller, ızgara, imleç koordinatı ve motif kılavuzu aynı saf dönüşüm fonksiyonlarını kullanır.
- Cetvel çubukları ekran kenarında sabittir; işaret değerleri görünür dünya aralığından üretilir.
- Cetvel ana adımı zoom düzeyine göre en az okunabilir piksel aralığını sağlayan `1, 5, 10, 50, 100… mm` dizisinden seçilir.
- Hedef motif `widthMm`/`heightMm` ile saklanır ve orijinde merkezlenir: `[-w/2,w/2] × [-h/2,h/2]`.
- Motif kılavuzu yalnız görsel/üretim hedefidir; sonsuz düzlemi kesmez veya yeniden boyutlandırmaz.
- Kullanıcı cm girerse sınırda `mm = cm × 10` dönüşümü yapılır.

Model koordinatlarını orijin ve nesne merkezi tabanlı seçmek, döndürme ve farklı geometriler için tutarlı çarpışma hesabı sağlar. Dönüşümler `domain/coordinates.ts` içinde React ve Konva'dan bağımsızdır.

## 5. Durum modeli

```text
EditorState
├── project                 Kalıcı ve dışa aktarılabilir veri
│   ├── motif                   Hedef genişlik/yükseklik (mm)
│   ├── materials
│   ├── placements
│   └── groups                  Kalıcı grup kimliği ve yerleşim üyeleri
├── selection.selectedIds   Geçici seçim durumu
├── viewport                viewCenterMm, pixelsPerMm, grid görünürlüğü
├── history                 undo/redo komutları veya anlık görüntüleri
├── generationPreview       projeye yazılmayan motif placement önizlemesi
├── aiDesignDraft           projeye yazılmayan metin/görsel/kısıt taslağı
├── aiPlanPreview           Aşama 7B'de doğrulanmış plan/placement önizlemesi
└── interaction             sürükleme önizlemesi ve doğrulama mesajı
```

`project` dışındaki görünüm/etkileşim durumu ilk JSON şemasına yazılmaz. `viewCenterMm`, `pixelsPerMm`, imleç ve kılavuz görünürlüğü geçici görünüm durumudur. Hedef motif ölçüsü kalıcı proje verisidir. Izgara ve minimum aralık gibi proje davranışını etkileyen ayarlar proje içine yazılır; zoom/pan tercihi daha sonra isteğe bağlı kullanıcı ayarı olabilir.

## 6. Komut ve geri alma yaklaşımı

Her düzenleme, öncesinde doğrulanan bir komut olarak ele alınır:

```ts
type EditorCommand =
  | { type: "placement.add"; placement: Placement }
  | { type: "placement.move"; id: string; from: PointMm; to: PointMm }
  | { type: "placement.rotate"; id: string; fromDeg: number; toDeg: number }
  | { type: "placement.remove"; placement: Placement }
  | { type: "placement.recolor"; id: string; from?: string; to?: string };
```

Sürükleme boyunca aday konum geçici olarak gösterilir; yalnız `dragEnd` sırasında geçerli komut geçmişe eklenir. Geçersiz adayda nesne son geçerli konumuna döner. Sürekli işaretçi hareketlerinin her biri geçmişe yazılmaz.

Aşama 3'te terslenebilir komut yaklaşımı seçilmiştir. Aşama 5'te bu yapı `placements.add/remove/update` ve `groups.update` toplu komutlarıyla genişletilmiştir. Aşama 6 motif eklemesi `placements.add`, tasarım değiştirme işlemi ise önce/sonra belge durumunu taşıyan tek `document.replace` komutudur. Komutlar yalnız gerekli deltayı taşır; geçmiş 100 komutla sınırlıdır ve her motif uygulaması tek geri alma adımıdır.

## 7. Geometri çekirdeği API taslağı

```ts
type ValidationIssueCode =
  | "OVERLAP"
  | "MIN_GAP_VIOLATION"
  | "MATERIAL_NOT_FOUND"
  | "MATERIAL_INACTIVE"
  | "INVALID_NUMBER";

type ValidationResult =
  | { valid: true }
  | { valid: false; issues: ValidationIssue[] };

validatePlacement(candidate, project, options): ValidationResult
validateProject(project): ValidationResult
countMaterials(placements): Record<MaterialId, number>
```

Çekirdek, aday nesneyi kendisiyle karşılaştırmaz. Önce hızlı eksen hizalı çevre kutusu (AABB) elemesi, sonra kesin şekil testi yapılır. Ayrıntılar [DESIGN-RULES.md](DESIGN-RULES.md) içindedir.

Aşama 3'te motif kılavuzu görseldir; bu nedenle `MOTIF_BOUNDS_EXCEEDED` manuel yerleştirme hattında etkin değildir. İleride açık bir proje ayarıyla motif sınırı zorunlu hale getirilirse aynı çekirdeğe ayrı sınır denetimi olarak eklenir.

## 8. Proje dosyası sınırı

- JSON dosyası açılırken önce sözdizimi, sonra sürüm/şema, ardından alan kuralları doğrulanır.
- Bilinmeyen ana sürüm reddedilir; bilinen eski sürüm açık bir göç fonksiyonuyla yükseltilir.
- Yükleme atomiktir: herhangi bir zorunlu hata mevcut projeyi kısmen değiştirmez.
- JPEG yalnız sunum çıktısıdır; tekrar içe aktarılıp düzenlenebilir veri sayılmaz.
- Aşama 4 şeması `1.0` sürümünü, proje kimliği/adı/tarihleri, motif ölçülerini, minimum aralığı, kullanılan malzeme kayıtlarını ve mm yerleşimlerini taşır.
- Aşama 5 şeması `1.1` sürümünde grup üyeliklerini ve normal/hızlı klavye taşıma adımlarını ekler. `1.0` dosyaları boş grup ve `0,5/5 mm` varsayılanlarıyla güncel modele taşınır.
- Aşama 6 üretim ayarları geçici araç durumudur; şemaya eklenmez. Uygulanan motif normal `Placement[]` olduğundan JSON sürümü `1.1` kalır ve Aşama 4/5 dosyaları aynı doğrulamayla açılır.
- Aşama 7A metni, referans görseli, malzeme yetki modu ve istek kısıtları geçici UI durumudur; AI sonucu uygulanmadığı için proje şeması yine `1.1` kalır.
- İçe aktarılan malzeme kimliği yerel katalogda farklı tanımla bulunursa yerel kayıt ezilmez; proje malzemesi yeni kimlikle eklenir ve bütün yerleşim başvuruları birlikte eşlenir.
- Kaydedilmemiş durum, tarih alanlarını dışarıda bırakan kanonik proje içeriği parmak izinin son başarılı kayıt/açma anıyla karşılaştırılmasından türetilir.
- Görsel çıktı Konva ekran görüntüsü değildir; kanonik mm geometrileri seçilen alan ve DPI üzerinden ayrı Canvas'a çizilir.
- Aşama 2'de malzeme önizlemesi şekil, renk ve mm oranından üretilir; raster malzeme görseli saklanmaz. İleride görsel yükleme gereksinimi doğrulanırsa dosya türü/boyutu ve proje paketleme politikası ayrıca kararlaştırılır.

## 9.1. Aşama 6 motif üretim hattı

```text
Tür/ölçü/merkez/malzeme/oran/aralık/simetri/tekrar/yoğunluk/seed
  → katı parametre doğrulaması ve yaklaşık kapasite
  → eğrilerde poligon yaklaşımı ve kümülatif yay uzunluğu tablosu
  → katalog boyutu/açısı + hedef aralıkla düzenli, seed tabanlı desen adayları
  → açık/kapalı yol artığının komşulara deterministik yeniden dağıtılması
  → çakışan eğri adayında sınırlı komşu teğet gevşetmesi
  → koordinat + açı simetri dönüşümü ve merkez tekilleştirme
  → üretim dikdörtgeni sınırı
  → hücre tabanlı yakın aday ön elemesi
  → mevcut kesin geometri/mesafe kuralları
  → geçici placement önizlemesi + gerçek nesne raporu
  → uygulamada bütün aday projenin yeniden doğrulanması
  → tek atomik editör komutu
```

Üretici React, Konva, DOM ve ağ bilmez. Seed için sabit bir karma ve yerel PRNG kullanır. Hücre indeksi yalnız aday kümesini azaltır; kesin karar `geometriesOverlap` ve `distanceBetweenGeometries` fonksiyonlarından gelir. Başarılı çıktı limiti 5.000, aday limiti 40.000 ve çalışma bütçesi 1.000 ms'dir. Süre/limit aşımı kısmi placement sonucu döndürmez.

`arcLength.ts` yalnız nokta dizisi, kümülatif fiziksel uzunluk ve mesafeden örnekleme bilir; motif türü veya çizim kütüphanesine bağımlı değildir. `targetGapMm` geçici üretim parametresidir. Kalıcı proje ayarı olan `minimumGapMm` son geometri kabulünde uygulanmaya devam eder; bu nedenle Aşama 6.1 proje şemasını değiştirmez.

## 9.2. Aşama 7A AI entegrasyon sınırı

```text
AiDesignRequest (1.0)
  → yerel alan doğrulaması
  → AiDesignProvider portu (Aşama 7B: HTTP backend uyarlayıcısı)
  → bilinmeyen sağlayıcı çıktısı
  → AiDesignPlan (1.0) şema + katalog yetki doğrulaması
  → AiPlanPlacementGenerator portu
  → Placement[]
  → adet + motif sınırı + katalog + açı + kesin çakışma/aralık doğrulaması
  → geçici önizleme
  → açık kullanıcı kabulü
  → mevcut atomik editör komutu
```

`AiDesignProvider` yalnız istek gönderme ve bilinmeyen ham yanıt alma sınırıdır; geometri veya proje durumu bilmez. `AiPlanPlacementGenerator` yalnız doğrulanmış planı kanonik placement adaylarına dönüştürür. `parseAiDesignPlan` ve `validateAiPlacementProposal` bu iki güvenilmeyen sınırdan sonra zorunlu kapılardır.

Malzeme modları bir yetki kümesine çevrilir. “AI seçsin” seçeneği, kullanıcının etkin katalog kümesini açıkça aday havuzu olarak yetkilendirmesidir; katalog dışı malzeme hiçbir modda kabul edilmez. Aşama 7B'de portun somut uygulaması yalnız güvenli backend kökünü bilir; API anahtarı veya model adı frontend'e girmez.

Referans dosyası JPEG/PNG/WebP MIME değeriyle birlikte dosya imzası, 8 MB boyut, 8.192 piksel tek kenar ve 32 milyon piksel toplam sınırından geçer. Dosya yalnız bileşen belleğinde ve geri alınan nesne URL'sinde tutulur; LocalStorage veya proje JSON'una yazılmaz. Yalnız açık aktarım onayından sonra geçici ağ isteğine eklenebilir.

## 9.3. Uygulanan backend sınırı (Aşama 7B)

Uygulanan güvenli sunucu sorumlulukları:

- Komut ve izinli malzeme şemasını Pydantic ile doğrulama
- OpenAI Responses API'ye Structured Outputs isteği gönderme
- Sağlayıcı çıktısını kanonik `AiDesignPlan 1.0` olarak ayrıştırma
- Ortak sözleşme örneğiyle TypeScript/Python uyumluluğunu sınama
- Hata, iptal, zaman aşımı, çıktı, yeniden deneme, eşzamanlılık ve oran sınırı yönetimi

Backend hiçbir zaman istemcinin geometri doğrulamasını atlama yetkisi vermez. İstemci, gelen öneriyi tekrar doğrular.

## 10. Performans ve ölçekleme

1. Önce AABB ile aday çiftleri elenir.
2. Küçük sahnelerde doğrusal tarama basitlik için yeterlidir.
3. Aşama 5 tam-proje doğrulaması AABB'ye göre sıralı tarama kullanır; yalnız X aralığı yakın nesneler etkin kümede kesin teste girer. 5.000 uzak nesneli tam proje ve alan seçimi test edilmiştir.
4. Aşama 6 motif adayları, en büyük seçili malzeme çapına göre hücrelenen uzamsal indeksle yalnız yakın kabul edilmiş yerleşimlere karşı kesin sınanır.
5. Konva yerleşim düğümleri memoize bir grupta tutulur; motif önizlemesi ayrı, etkileşimsiz katmandır ve kalıcı yerleşim dizisini değiştirmez.
6. Cetvel/ızgara görünüm ölçeğine göre seyreltilir; model nesnesi olarak saklanmaz.
7. Performans hedefi sentetik 1.000 ve 5.000 nesne senaryolarıyla ölçülür.

## 11. Test stratejisi

- **Birim:** Birim dönüşümü, açı normalizasyonu, SAT, daire/çokgen, sınır, aralık, sayım.
- **Özellik tabanlı:** Simetri (`intersects(a,b) === intersects(b,a)`), dönüş periyodu, sonlu sayı değişmezleri.
- **Bileşen:** Panel etkileşimleri, form doğrulaması, araç durumları.
- **AI sözleşmesi:** İstek modları, plan şeması, katalog yetkisi, koordinat/açı/limit ve placement geometri kapısı.
- **Referans dosyası:** MIME/imza uyuşmazlığı, bozuk dosya, boyut/çözünürlük ve seçme-kaldırma yaşam döngüsü.
- **Entegrasyon:** Ekle/taşı/döndür/reddet, çoklu seçim, kopyalama, grup, hizalama, toplu undo/redo ve katalog güvenlik kuralları.
- **Görsel/duman:** Üç panel düzeni, ızgara/cetvel ve JPEG önizleme.
- **Dosya/çıktı:** JSON turu, bozuk dosyada atomiklik, kimlik yeniden eşleme, döndürülmüş sınırlar, DPI/bellek ve CSV adetleri.
- **Uyumluluk:** TypeScript ve Python doğrulayıcılarına aynı sürümlü ortak sözleşme örneği.

## 12. Hata yönetimi ve güvenlik

- `NaN`, `Infinity`, negatif boyut ve eksik kimlik şema sınırında reddedilir.
- Dosya boyutu, görsel türü ve veri URI uzunluğu için limitler tanımlanır.
- Kullanıcıya teknik yığın izi yerine eyleme dönük Türkçe hata gösterilir.
- Yapay zekâ istemleri ve dosya içerikleri güvenilmeyen girdidir; yapılandırılmış şema dışında çalıştırılmaz.
- API anahtarları frontend paketine konmaz.

## 13. Dağıtım evrimi

- Aşama 1–7A: Statik frontend, yerel JSON/JPEG, deterministik motif üretimi ve sağlayıcısız AI istek mimarisi.
- Aşama 7B: Onaylanan güvenli sunucu, sağlayıcı ve açık veri aktarım izniyle gerçek plan/görsel analizi.
- Aşama 8: Kimlik, proje depolama ve ticari servisler; bu ihtiyaçlar kanıtlanmadan önce altyapı eklenmez.

## 14. Aşama 7B uygulanan backend ve istek hattı

```text
AiDesignDialog
  → yerel istek/görsel doğrulama
  → açık bulut aktarım onayı
  → HttpAiDesignProvider (FormData + AbortSignal + istemci zaman aşımı)
  → FastAPI /api/ai/design
      → Pydantic istek ve katalog yetkisi
      → Pillow imza/decode/bellek/üst veri kapısı
      → oran + eşzamanlılık + yinelenen istek sınırı
      → OpenAI Responses API / Structured Outputs / store=False
      → Pydantic AiDesignPlan + plan–istek çapraz doğrulaması
  → frontend AiDesignPlan doğrulaması
  → saf plan yorumlayıcı
  → ortak kesin placement/geometri doğrulaması
  → geçici Konva önizlemesi
  → kullanıcı kabulü
  → tek atomik editör komutu
```

Backend katmanları `config`, `models`, `prompt`, `provider`, `image_validation`, `security`, `validation` ve `main` olarak ayrılır. `app.main` HTTP/CORS/hata eşlemesini ve sağlayıcı kaydını; adapter'lar OpenAI veya 9Router çağrısını; doğrulama modülü plan–istek iş kurallarını taşır. Ham metin/görsel loglanmaz veya veritabanına yazılmaz.

`AiDesignPlan 1.0` geriye uyumlu kalır. Frontend eski, `geometry` alanı olmayan 1.0 planını şema olarak kabul edebilir; Aşama 7B backend'i düzenlenebilirlik için `geometry` alanını zorunlu Structured Output olarak üretir. Ortak JSON örneği iki dilde doğrulanır.

## 15. Aşama 7B.1 çoklu sağlayıcı ve 9Router sınırı

Frontend yalnız yerel FastAPI köküne bağlanır. Sağlayıcı seçimi multipart istekte `provider_id=openai|9router` olarak taşınır; backend seçilen kimliği kayıtlı adapter ile eşleştirir ve diğer sağlayıcıya otomatik geçmez.

```text
AiDesignDialog
  → HttpAiDesignProvider (geliştirmede aynı-origin /api)
    → Vite proxy → 127.0.0.1:8000
    → FastAPI sağlayıcı kaydı
      ├─ openai  → Responses API + native Structured Outputs + store=False
      └─ 9router → 127.0.0.1:20128/v1/chat/completions
                    → düz JSON ayrıştırma
                    → AiDesignPlan Pydantic doğrulama
  → ortak plan/izin/geometri doğrulaması
  → geçici önizleme
  → kullanıcı kabulüyle atomik uygulama
```

9Router kökü ayarlanabilir görünse de doğrulayıcı yalnız `http://127.0.0.1:20128/v1` değerini kabul eder; kimlik bilgisi, query ve fragment yasaktır, HTTP yönlendirmeleri izlenmez. `/v1/models` yalnız erişilebilirlik, tam model kimliği ve katalogdaki vision metadatası için okunur; bu kontrol prompt üretmez. Model kimliği kodda sabitlenmez veya tahmin edilmez.

9Router için belgelenmiş ortak payda Chat Completions'tır. Sağlayıcıya göre değişen native `json_schema` desteği varsayılmaz. Adapter sistem isteminde sürümlü şemayı verir, metin yanıtını JSON olarak ayrıştırır ve Pydantic ile katı doğrular. `NINEROUTER_JSON_MODE=json_object` yalnız operatör seçimiyle kullanılır; varsayılan `prompt_json` model özelliği varsaymaz. Metin ve görsel uyumluluğu ayrı bayraklardır; görsel ancak katalog ve açık doğrulama birlikte olumluysa backend ve UI tarafından açılır.

Geliştirme tarayıcısı aynı-origin `/api` yoluna bağlanır; Vite proxy isteği `127.0.0.1:8000` adresine taşır. CORS yalnız yapılandırılmış kaynakları kabul eder; `*` yasaktır. Bu yerel sınır üretim güvenliği sayılmaz: internet dağıtımı kimlik doğrulama, kullanıcı kotası, HTTPS, erişim kontrolü, merkezi denetim kaydı ve dağıtık oran sınırlama gerektirir.

## 16. Aşama 7B.2 sağlık durumu akışı

`HttpAiDesignProvider`, varsayılan boş API köküyle `/api/health` ister. Geliştirmede bu istek Vite proxy'den geçer; `VITE_AI_API_BASE_URL` yalnız ayrı barındırma halinde açıkça tanımlanır. İstemci yanıtı kullanmadan önce HTTP başarısını, `status=ok`, sağlayıcı kimliklerini ve durum enumlarını doğrular.

- Ağ/JSON/sözleşme hatası: `backendReachable=false`, kullanıcıya “Backend erişilemiyor”. Ham yanıt veya anahtar loglanmaz; geliştirici konsoluna yalnız hata türü, güvenli mesaj ve `/api/health` yolu yazılır.
- HTTP 200 + `providerState=disabled`: backend erişilebilir; kullanıcıya “AI çağrıları sunucu ayarlarında kapalı”. Bu durum bağlantı hatasına çevrilmez.
- 9Router `reachable=true`: yerel ağ geçidi erişilebilir olarak ayrıca gösterilir.
- `modelAvailable=true` ile `compatibilityVerified=false`: model katalogda vardır fakat canlı uyumluluk doğrulanmamıştır; oluşturma düğmesi kapalı kalır.
- `state=ready`: yalnız seçili sağlayıcı oluşturmayı etkinleştirir. Diğer kartın durumu ana uyarıyı değiştirmez.

Kullanıcı “Durumu yenile” ile sağlık kontrolünü tekrar çalıştırabilir. Yenileme mevcut kullanıcı sağlayıcı seçimini korur; yalnız o sağlayıcının ana mesajını günceller.

### Sağlık isteği yaşam döngüsü

`AiDesignDialog` sağlık effect'ini yalnız kararlı provider kimliğine bağlar. Önizleme callback'i ayrı ref üzerinden izlenir; parent render'ında callback kimliği değişse bile sağlık effect'i yeniden başlamaz. `App` ayrıca AI önizleme callback'ini `useCallback` ile kararlı tutar.

- Pencere açılışı bir sağlık kontrolü başlatır; kullanıcı “Durumu yenile” dediğinde ikinci kontrol yapılır.
- Aynı anda yalnız bir sağlık isteği çalışır. Sağlayıcı değişimi yeni sağlık isteği başlatmaz.
- Her istek sıra kimliği ve `AbortController` taşır. Kapanış/provider değişiminde eski istek iptal edilir; eski yanıt state'e yazılamaz.
- HTTP sağlık isteği 10 saniyede zaman aşımına uğrar ve loading mutlaka sonlanır. Otomatik retry veya periyodik polling yoktur.
- Geliştirme `StrictMode` effect tekrarında sağlık başlangıcı mikro-göreve ertelenir; deneme mount'u ağ isteği başlamadan elenir ve yalnız güncel mount tek istek gönderir. Parent state güncellemesi sonsuz effect döngüsü oluşturmaz.

