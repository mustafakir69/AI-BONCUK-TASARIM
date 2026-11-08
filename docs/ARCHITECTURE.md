# Teknik Mimari

## 1. Mimari hedefler

- Fiziksel ölçüleri görüntüleme ayrıntılarından ayırmak
- Geometriyi deterministik ve bağımsız test edilebilir tutmak
- Manuel editörü backend olmadan çalıştırmak
- Yapay zekâ ve görsel analizini daha sonra sınırları belli servisler olarak eklemek
- JSON şemasını sürümleyerek eski projelerin taşınabilmesini sağlamak
- Gelecekte çoklu seçimi mevcut nesne modelini bozmadan eklemek

## 2. Sistem bağlamı

```text
Kullanıcı
   │
   ▼
React editörü ──► Alan modeli + geometri çekirdeği
   │                         │
   ├──► JSON/JPEG uyarlayıcıları
   │
   └──► (Aşama 5+) FastAPI ──► AI/görsel analiz sağlayıcıları
                               │
                               └──► Yapısal öneri
                                        │
                                        ▼
                              Aynı geometri doğrulayıcısı
```

Manuel ilk sürüm tarayıcı içinde ve yerel dosyalarla çalışır. Backend, ileride gizli anahtarları korumak, uzun süren işleri yönetmek ve yapay zekâ sağlayıcılarını soyutlamak için eklenir.

## 3. Katmanlar ve bağımlılık yönü

### Alan (`frontend/src/domain`)

- Malzeme, yerleşim, çalışma alanı ve proje tipleri
- mm/cm dönüşümleri
- Dönüşüm matrisi yardımcıları
- Sınır, çakışma, minimum aralık ve proje doğrulaması
- Adet türetme

Bu katman React, Konva, tarayıcı API'si veya ağ istemcisi bilmez.

### Uygulama (`frontend/src/features`)

- Editör komutları: ekle, taşı, döndür, sil, renk değiştir
- Seçim modeli (`selectedIds: Set<PlacementId>`) — ilk sürüm tek seçim kullansa da çoklu seçime hazırdır
- Geri al/yinele geçmişi
- Malzeme kataloğu ve proje iş akışları
- Doğrulama sonucunu kullanıcı eylemine çevirme

### Sunum (`frontend/src/app` ve özellik bileşenleri)

- Üst araç çubuğu
- Sol malzeme paneli
- Orta çalışma alanı, cetvel ve ızgara
- Sağ ayarlar, sayım ve nesne özellikleri paneli
- Türkçe bildirimler, iletişim kutuları ve klavye etkileşimi

### Altyapı (`frontend/src/infrastructure`)

- Konva sahne uyarlayıcısı
- JSON dosya okuma/yazma
- JPEG dışa aktarma
- Tarayıcı saklama/indirme API'leri
- İleride HTTP istemcisi

Bağımlılıklar dıştan içe akar: `sunum → uygulama → alan`. Altyapı, uygulamanın tanımladığı arayüzleri uygular; alan altyapıya bağımlı olmaz.

## 4. Koordinat ve ölçü sistemi

- Alan modeli birimi: **mm**.
- Orijin: çalışma alanının sol üst köşesi `(0, 0)`.
- Pozitif X sağa, pozitif Y aşağıya gider.
- Yerleşimin `xMm`/`yMm` değeri geometrik merkezidir.
- Açı derece cinsindedir, saat yönünde artar ve kayıtta `[0, 360)` aralığına normalize edilir.
- Ekran dönüşümü: `screenPx = viewportOffsetPx + modelMm × pixelsPerMm × zoom`.
- Kaydırma ve yakınlaştırma görünüm durumudur; JSON proje geometrisini değiştirmez.
- Kullanıcı cm girerse sınırda `mm = cm × 10` dönüşümü yapılır.

Model koordinatlarını merkez tabanlı seçmek, döndürme ve farklı geometriler için tutarlı çarpışma hesabı sağlar.

## 5. Durum modeli

```text
EditorState
├── project                 Kalıcı ve dışa aktarılabilir veri
│   ├── workspace
│   ├── materials
│   └── placements
├── selection.selectedIds   Geçici seçim durumu
├── viewport                zoom, pan, grid görünürlüğü
├── history                 undo/redo komutları veya anlık görüntüleri
└── interaction             sürükleme önizlemesi ve doğrulama mesajı
```

`project` dışındaki görünüm/etkileşim durumu ilk JSON şemasına yazılmaz. Izgara ve minimum aralık gibi proje davranışını etkileyen ayarlar proje içine yazılır; zoom/pan tercihi daha sonra isteğe bağlı kullanıcı ayarı olabilir.

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

İlk uygulamada küçük projeler için sınırlı, değişmez anlık görüntüler veya terslenebilir komutlar değerlendirilebilir. Tercih Aşama 3 performans ölçümüyle kesinleştirilir; dış API komut anlamını korur.

## 7. Geometri çekirdeği API taslağı

```ts
type ValidationIssueCode =
  | "OUT_OF_BOUNDS"
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

## 8. Proje dosyası sınırı

- JSON dosyası açılırken önce sözdizimi, sonra sürüm/şema, ardından alan kuralları doğrulanır.
- Bilinmeyen ana sürüm reddedilir; bilinen eski sürüm açık bir göç fonksiyonuyla yükseltilir.
- Yükleme atomiktir: herhangi bir zorunlu hata mevcut projeyi kısmen değiştirmez.
- JPEG yalnız sunum çıktısıdır; tekrar içe aktarılıp düzenlenebilir veri sayılmaz.
- Malzeme görseli ilk sürümde isteğe bağlı bir proje içi `data:` değeri veya güvenli yerel varlık başvurusu olarak ele alınır; kesin depolama kararı Aşama 2'de boyut testinden sonra verilir.

## 9. Backend sınırı (Aşama 5+)

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
3. Ölçümde ihtiyaç görülürse üniform ızgara veya R-tree uzamsal indeksi eklenir.
4. Konva katmanları; zemin/ızgara, malzemeler ve etkileşim kaplaması olarak ayrılır.
5. Cetvel/ızgara görünüm ölçeğine göre seyreltilir; model nesnesi olarak saklanmaz.
6. Performans hedefi sentetik 1.000 ve 5.000 nesne senaryolarıyla ölçülür.

## 11. Test stratejisi

- **Birim:** Birim dönüşümü, açı normalizasyonu, SAT, daire/çokgen, sınır, aralık, sayım.
- **Özellik tabanlı:** Simetri (`intersects(a,b) === intersects(b,a)`), dönüş periyodu, sonlu sayı değişmezleri.
- **Bileşen:** Panel etkileşimleri, form doğrulaması, araç durumları.
- **Entegrasyon:** Ekle/taşı/döndür/reddet, geri al/yinele, kaydet/aç turu.
- **Görsel/duman:** Üç panel düzeni, ızgara/cetvel ve JPEG önizleme.
- **Uyumluluk (ileri):** TypeScript ve Python doğrulayıcılarına aynı altın test vakaları.

## 12. Hata yönetimi ve güvenlik

- `NaN`, `Infinity`, negatif boyut ve eksik kimlik şema sınırında reddedilir.
- Dosya boyutu, görsel türü ve veri URI uzunluğu için limitler tanımlanır.
- Kullanıcıya teknik yığın izi yerine eyleme dönük Türkçe hata gösterilir.
- Yapay zekâ istemleri ve dosya içerikleri güvenilmeyen girdidir; yapılandırılmış şema dışında çalıştırılmaz.
- API anahtarları frontend paketine konmaz.

## 13. Dağıtım evrimi

- Aşama 1–4: Statik frontend, yerel JSON/JPEG.
- Aşama 5–6: Ayrı dağıtılan FastAPI servisi ve yapılandırılabilir API tabanı.
- Aşama 7: Kimlik, proje depolama ve ticari servisler; bu ihtiyaçlar kanıtlanmadan önce altyapı eklenmez.

