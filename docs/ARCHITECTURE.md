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
React editörü ──► Alan modeli + geometri çekirdeği
   │                         ▲
   ├──► Deterministik motif üretici ──► Geçici önizleme / atomik komut
   ├──► JSON/JPEG uyarlayıcıları
   │
   └──► (gelecek, ayrı onay) FastAPI ──► AI/görsel analiz sağlayıcıları
                               │
                               └──► Yapısal öneri
                                        │
                                        ▼
                              Aynı geometri doğrulayıcısı
```

Manuel editör ve Aşama 6 deterministik motif motoru tarayıcı içinde ve yerel dosyalarla çalışır. Backend, ancak ileride gizli anahtarları koruyan gerçek bir sağlayıcı veya uzun süren sunucu işi ayrıca onaylanırsa eklenir.

## 3. Katmanlar ve bağımlılık yönü

### Alan (`frontend/src/domain`)

- Malzeme, yerleşim, hedef motif ve proje tipleri
- mm/cm dönüşümleri
- Dünya/ekran koordinat dönüşümleri, cetvel adımı ve görünür işaret hesapları
- Sınır, çakışma, minimum aralık ve proje doğrulaması
- Adet türetme
- Seed tabanlı motif adayları, simetri dönüşümleri, sınır denetimi ve uzamsal ön eleme

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

### Altyapı (`frontend/src/infrastructure`)

- Konva sahne uyarlayıcısı
- Sürümlü ve şema doğrulamalı yerel malzeme kataloğu saklaması
- Boyut sınırlı JSON dosya okuma ve Blob tabanlı indirme
- Görünümden bağımsız PNG/JPEG Canvas çıktısı
- Tarayıcı saklama/indirme API'leri
- İleride HTTP istemcisi

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
- İçe aktarılan malzeme kimliği yerel katalogda farklı tanımla bulunursa yerel kayıt ezilmez; proje malzemesi yeni kimlikle eklenir ve bütün yerleşim başvuruları birlikte eşlenir.
- Kaydedilmemiş durum, tarih alanlarını dışarıda bırakan kanonik proje içeriği parmak izinin son başarılı kayıt/açma anıyla karşılaştırılmasından türetilir.
- Görsel çıktı Konva ekran görüntüsü değildir; kanonik mm geometrileri seçilen alan ve DPI üzerinden ayrı Canvas'a çizilir.
- Aşama 2'de malzeme önizlemesi şekil, renk ve mm oranından üretilir; raster malzeme görseli saklanmaz. İleride görsel yükleme gereksinimi doğrulanırsa dosya türü/boyutu ve proje paketleme politikası ayrıca kararlaştırılır.

## 9.1. Aşama 6 motif üretim hattı

```text
Tür/ölçü/merkez/malzeme/oran/aralık/simetri/tekrar/yoğunluk/seed
  → katı parametre doğrulaması ve yaklaşık kapasite
  → seed tabanlı desen adayları
  → koordinat + açı simetri dönüşümü ve merkez tekilleştirme
  → üretim dikdörtgeni sınırı
  → hücre tabanlı yakın aday ön elemesi
  → mevcut kesin geometri/mesafe kuralları
  → geçici placement önizlemesi + gerçek nesne raporu
  → uygulamada bütün aday projenin yeniden doğrulanması
  → tek atomik editör komutu
```

Üretici React, Konva, DOM ve ağ bilmez. Seed için sabit bir karma ve yerel PRNG kullanır. Hücre indeksi yalnız aday kümesini azaltır; kesin karar `geometriesOverlap` ve `distanceBetweenGeometries` fonksiyonlarından gelir. Başarılı çıktı limiti 5.000, aday limiti 40.000 ve çalışma bütçesi 1.000 ms'dir. Süre/limit aşımı kısmi placement sonucu döndürmez.

## 9.2. Gelecek backend sınırı (Aşama 6 kapsamında değil)

Planlanan FastAPI sorumlulukları:

- Komut ve izinli malzeme şemasını doğrulama
- Yapay zekâ sağlayıcısına yapılandırılmış çıktı isteği gönderme
- Sağlayıcı çıktısını kanonik öneri şemasına çevirme
- Sunucu tarafında aynı iş kurallarını uygulama veya paylaşılan uyumluluk testleriyle eşdeğer Python doğrulayıcı kullanma
- Hata, zaman aşımı ve oran sınırı yönetimi

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
- **Entegrasyon:** Ekle/taşı/döndür/reddet, çoklu seçim, kopyalama, grup, hizalama, toplu undo/redo ve katalog güvenlik kuralları.
- **Görsel/duman:** Üç panel düzeni, ızgara/cetvel ve JPEG önizleme.
- **Dosya/çıktı:** JSON turu, bozuk dosyada atomiklik, kimlik yeniden eşleme, döndürülmüş sınırlar, DPI/bellek ve CSV adetleri.
- **Uyumluluk (ileri):** TypeScript ve Python doğrulayıcılarına aynı altın test vakaları.

## 12. Hata yönetimi ve güvenlik

- `NaN`, `Infinity`, negatif boyut ve eksik kimlik şema sınırında reddedilir.
- Dosya boyutu, görsel türü ve veri URI uzunluğu için limitler tanımlanır.
- Kullanıcıya teknik yığın izi yerine eyleme dönük Türkçe hata gösterilir.
- Yapay zekâ istemleri ve dosya içerikleri güvenilmeyen girdidir; yapılandırılmış şema dışında çalıştırılmaz.
- API anahtarları frontend paketine konmaz.

## 13. Dağıtım evrimi

- Aşama 1–6: Statik frontend, yerel JSON/JPEG ve yerel deterministik motif üretimi.
- Aşama 7: Referans görsel araştırması; harici servis gerekiyorsa ayrıca onaylanan FastAPI sınırı.
- Aşama 8: Kimlik, proje depolama ve ticari servisler; bu ihtiyaçlar kanıtlanmadan önce altyapı eklenmez.

