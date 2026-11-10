# Malzeme ve Yerleşim Veri Modeli

## 1. Amaç

Bu belge, malzeme kataloğunun ve sonsuz tasarım düzlemine yerleştirilen boncuk nesnelerinin kanonik modelini tanımlar. Örnekler TypeScript gösterimidir; kaydedilen JSON aynı alan adlarını kullanır.

## 2. Temel türler

```ts
type MaterialId = string;
type PlacementId = string;

type MaterialShape = "square" | "rectangle" | "circle" | "ring";

interface Material {
  id: MaterialId;
  name: string;
  widthMm: number;
  heightMm: number;
  shape: MaterialShape;
  color: string;             // #RRGGBB biçiminde sRGB
  holeDiameterMm?: number;   // yalnız ring; dış çaptan küçük pozitif mm
  active: boolean;
  createdAt: string;         // ISO 8601 UTC
  updatedAt: string;         // ISO 8601 UTC
}

interface Placement {
  id: PlacementId;
  materialId: MaterialId;
  xMm: number;               // nesne merkezi, dünya orijininden yatay uzaklık
  yMm: number;               // nesne merkezi, dünya orijininden dikey uzaklık
  rotationDeg: number;       // saat yönü, kayıtta [0, 360)
  colorOverride?: string;    // yoksa malzemenin rengi
}
```

Bir yerleşim `widthMm`, `heightMm` veya `shape` değerini kopyalamaz. Böylece aynı malzemeye bağlı bütün nesneler her zaman aynı fiziksel geometriyi kullanır. Bir malzemenin ölçüsü değişirse o malzemeye bağlı tüm yerleşimler yeniden doğrulanır.

## 3. Başlangıç malzemeleri

| Kimlik | Ad | Genişlik | Yükseklik | Delik çapı | Geometri | Örnek renk |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `mat-seed-bead` | Kum boncuk | 2,5 mm | 2,5 mm | — | `square` | `#C99A45` |
| `mat-bugle-bead` | Boru boncuk | 2,5 mm | 4 mm | — | `rectangle` | `#6B8EAD` |
| `mat-pearl` | İnci | 4 mm | 4 mm | — | `circle` | `#F2EEE3` |
| `mat-sequin` | Pul | 5 mm | 5 mm | 1,5 mm | `ring` | `#D7A2C8` |

Kullanıcı malzemeleri tarayıcının `crypto.randomUUID()` işleviyle üretilen `mat-` önekli kimlikler kullanır; çalışma zamanında mevcut kimliklere karşı ayrıca çakışma denetimi yapılır. Yukarıdaki okunabilir kimlikler yalnız başlangıç verisini kararlı tutar. Malzeme adları benzersiz olmak zorunda değildir.

## 4. Geometri anlamı

- `square`: Genişlik ve yükseklik eşit olmalıdır; döndürülmüş kare çokgen olarak hesaplanır.
- `rectangle`: Merkezi etrafında dönen dikdörtgendir.
- `circle`: `widthMm === heightMm`; dış çap bu değerdir. Dönüş geometrisini değiştirmez fakat kullanıcı verisi olarak korunabilir.
- `ring`: Pulun dış sınırı `widthMm === heightMm` olan dairedir. `holeDiameterMm` pozitif ve dış çaptan küçüktür. Delik önizlemede gerçek oranıyla gösterilir; çarpışmada güvenli tarafta kalmak için malzeme yine dolu dış disk kullanılır.

Gelecekte oval veya düzensiz geometri eklemek, `MaterialShape` ve buna karşılık gelen açık çarpışma stratejisi için şema sürümü değişikliği gerektirir.

## 5. Motif hedefi, tasarım ayarları ve proje

```ts
interface MotifTarget {
  widthMm: number;
  heightMm: number;
}

interface DesignSettings {
  minimumGapMm: number;
  keyboardStepMm: number;
  keyboardShiftStepMm: number;
}

interface PlacementGroup {
  id: string;
  placementIds: string[];
}

interface DesignProjectV1_1 {
  schemaVersion: "1.1";
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  motif: MotifTarget;
  settings: DesignSettings;
  materials: Material[];
  placements: Placement[];
  groups: PlacementGroup[];
}
```

Tasarım düzlemi sonsuzdur ve genişlik/yükseklik taşımaz. Motif hedefi orijinde merkezlenir. Görünüm merkezi, piksel/mm ölçeği, imleç, ızgara ve kılavuz görünürlüğü proje geometrisi değildir ve kaydedilmez. Minimum aralık, grup üyelikleri ve klavye taşıma adımları düzenleme sonucunu etkilediği için projede tutulur.

## 6. Örnek proje JSON'u

```json
{
  "schemaVersion": "1.1",
  "id": "project-01",
  "name": "İnci Çiçeği",
  "createdAt": "2026-11-08T09:00:00.000Z",
  "updatedAt": "2026-11-08T09:00:00.000Z",
  "motif": {
    "widthMm": 200,
    "heightMm": 250
  },
  "settings": {
    "minimumGapMm": 0.5,
    "keyboardStepMm": 0.5,
    "keyboardShiftStepMm": 5
  },
  "materials": [
    {
      "id": "mat-pearl",
      "name": "İnci",
      "widthMm": 4,
      "heightMm": 4,
      "shape": "circle",
      "color": "#F2EEE3",
      "active": true,
      "createdAt": "2026-11-08T09:00:00.000Z",
      "updatedAt": "2026-11-08T09:00:00.000Z"
    }
  ],
  "placements": [
    {
      "id": "place-01",
      "materialId": "mat-pearl",
      "xMm": 0,
      "yMm": 0,
      "rotationDeg": 0
    }
  ],
  "groups": []
}
```

## 7. Doğrulama kuralları

### Malzeme

- `id` proje içinde benzersiz ve boş olmayan bir dizedir.
- `name` kırpıldıktan sonra boş olamaz; önerilen üst sınır 100 karakterdir.
- Boyutlar sonlu, sıfırdan büyük ve tanımlanacak makul üst sınırın altındadır.
- `square`, `circle` ve `ring` için genişlik/yükseklik eşitliği geometri toleransı içinde sağlanır.
- `ring` için `holeDiameterMm > 0` ve `holeDiameterMm < widthMm` olmalıdır; diğer geometriler bu alanı saklamaz.
- `color` kanonik `#RRGGBB` biçimindedir.
- Aşama 2 önizlemesi katalog geometrisi, ölçü oranı ve renkten üretilir; ayrıca yüklenen raster görsel saklanmaz.
- `active: false` malzemeyi yeni yerleşime kapatır; mevcut nesneleri silmez.

### Yerleşim

- `id` proje içinde benzersizdir.
- `materialId` var olan bir malzemeyi gösterir.
- X, Y ve açı sonlu sayıdır.
- Açı kayıttan önce `[0, 360)` aralığına normalize edilir.
- Etkin olmayan malzeme ile yeni yerleşim yapılamaz; eski proje nesneleri okunabilir ve uyarı alabilir.
- Geometri başka nesneyle çakışmamalı ve minimum aralığa uymalıdır.
- Motif sınır zorunluluğu etkinse geometri merkezli hedef motif içinde kalmalıdır; aksi halde negatif/pozitif tüm düzlem koordinatları geçerlidir.

### Grup

- Grup kimliği proje içinde benzersiz ve boş olmayan bir dizedir.
- Grup en az iki benzersiz, var olan yerleşim kimliği taşır.
- Bir yerleşim en fazla bir grupta bulunur; iç içe grup desteklenmez.
- Grup fiziksel ölçüyü kopyalamaz; üyelerin gerçek `xMm`, `yMm` ve `rotationDeg` değerleri otoriter kalır.
- `1.0` proje dosyaları boş grup ve varsayılan `0,5/5 mm` klavye adımlarıyla `1.1` modeline taşınır.

### Motif hedefi ve tasarım ayarları

- Motif genişliği/yüksekliği sonlu ve sıfırdan büyüktür.
- Izgara adımı sonlu ve sıfırdan büyüktür.
- Minimum aralık sonlu ve negatif değildir.
- Kesin ürün sınırları kullanıcı araştırmasıyla belirlenecek; başlangıç önerisi motif boyutları için `1–5000 mm`, aralık için `0–100 mm` değeridir.

## 8. Renk davranışı

Malzeme `color` değeri varsayılan katalog rengidir. Tek bir yerleşimin rengi değiştirildiğinde malzeme kaydı çoğaltılmaz; `colorOverride` yazılır. Etkin renk:

```ts
const effectiveColor = placement.colorOverride ?? material.color;
```

Katalog rengi değişirse yalnız renk geçersiz kılması olmayan yerleşimler yeni rengi alır. Bu ayrım, malzeme fiziksel ölçülerini tutarlı tutarken tasarımın renk düzenlemesine izin verir.

## 9. Malzeme silme politikası

- Bağlı yerleşimi olmayan malzeme kalıcı olarak silinebilir.
- Bağlı yerleşimi olan malzeme için varsayılan işlem silmek değil, devre dışı bırakmaktır.
- Kullanıcı kalıcı silmeyi seçerse etkilenecek yerleşim sayısı gösterilir ve açıkça şu seçeneklerden biri uygulanır: işlemi iptal et veya malzemeyle birlikte yerleşimleri sil.
- Yerleşimleri sahipsiz bırakmak yasaktır.
- Bu toplu işlem geri alınabilir tek bir komut olmalıdır.

## 10. Adet türetme

Adetler JSON içinde otoriter alan olarak saklanmaz:

```ts
function countMaterials(placements: Placement[]): Map<MaterialId, number> {
  const counts = new Map<MaterialId, number>();
  for (const item of placements) {
    counts.set(item.materialId, (counts.get(item.materialId) ?? 0) + 1);
  }
  return counts;
}
```

Gerekirse dışa aktarımda kolaylık için türetilmiş özet üretilebilir; proje açılırken her zaman yeniden hesaplanır.

### Aşama 6 üretim sonuçları

Motif üreticisi de normal `Placement` nesneleri oluşturur. Üretilen nesne genişlik, yükseklik, şekil, katalog rengi, üretim türü veya seed kopyalamaz; fiziksel geometri yine bağlı `Material` kaydından okunur. Önizleme kimlikleri geçicidir, uygulama sırasında proje genelinde benzersiz `PlacementId` değerleri üretilir.

Motif türü, yoğunluk, simetri, göreli malzeme oranı ve seed Aşama 6'da geçici araç ayarıdır. Bunlar tekrar üretilebilir tarif olarak saklanmadığından proje şeması `1.1` kalır. Uygulanmış placement nesneleri mevcut JSON kaydet/aç akışında eksiksiz korunur.

### Aşama 7A AI malzeme yetkisi

- **Malzemeleri ben seçeyim:** İzin kümesi kullanıcının işaretlediği etkin katalog kimlikleridir; tasarım bu kümenin dışına çıkamaz.
- **Yapay zekâ seçsin:** Kullanıcı bu modu seçerek etkin kataloğun tamamını aday küme olarak yetkilendirir; katalog dışı kimlik yine yasaktır.
- **Birlikte seçelim:** İşaretlenen kimlikler zorunludur; diğer etkin katalog kayıtları tamamlayıcı adaydır.

Planın `materialIds` alanı ve her bileşenin yerleşim talimatı bu izin kümesine karşı doğrulanır. AI placement önerisi ayrıca planın malzeme kümesine karşı sınanır. Malzeme boyutu/şekli hiçbir AI çıktısından okunmaz; her zaman katalog kaydından alınır.

### Aşama 7B backend katalog aktarımı

Frontend yalnız görev için gerekli katalog alanlarını gönderir: `id`, ad, şekil, `widthMm`, `heightMm`, renk, isteğe bağlı pul delik çapı ve etkinlik. Oluşturma/güncelleme zamanları ve yerel saklama ayrıntıları sağlayıcı isteğine girmez.

Backend kataloğu bağımsız Pydantic modeliyle yeniden doğrular. `user-only` yalnız seçilen etkin kimlikleri; `ai-selects` etkin kataloğun tamamını; `collaborative` etkin kataloğu izinli, kullanıcının seçtiklerini zorunlu sayar. Sağlayıcı planı bilinmeyen, devre dışı veya modun izin vermediği kimliği içerirse bütün plan reddedilir. Placement boyutları yine AI çıktısından değil bu katalog kayıtlarından okunur.

## 11. Şema sürümleme

- `schemaVersion` anlamsal `major.minor` biçimindedir.
- Geriye uyumsuz alan/anlam değişikliği ana sürümü yükseltir.
- Ek, varsayılanlanabilir alan küçük sürümü yükseltebilir.
- Her desteklenen eski sürümden güncele saf bir göç fonksiyonu ve sabit test örneği bulunur.
- Bilinmeyen ana sürüm veri kaybı riski nedeniyle açılmaz.

## 12. Yerel katalog saklama

Aşama 2'de katalog backend veya veritabanı olmadan, altyapı katmanındaki `materialStorage.ts` servisi üzerinden saklanır.

- LocalStorage anahtarı: `ai-boncuk-tasarim.materials.v1`
- Kayıt zarfı: `{ schemaVersion: "1.0", materials: Material[] }`
- Okuma sırasında JSON sözdizimi, şema sürümü, alan kuralları ve yinelenen kimlikler doğrulanır.
- Karışık bir kayıtta yalnız geçerli ve benzersiz malzemeler yüklenir; kullanıcı Türkçe bir uyarı görür.
- Kayıt bütünüyle bozuksa uygulama çökmez ve dört başlangıç malzemesine döner.
- Boş malzeme dizisi geçerli kullanıcı tercihi olarak korunur; başlangıç kataloğu yalnız eksik veya kullanılamaz kayıt için yüklenir.

Bu zarf proje JSON'unun yerine geçmez. Aşama 4 proje dosyası yalnız kullanılan kanonik `Material[]` kayıtlarını kendi içinde taşır. Açma sırasında aynı kimlikli yerel kayıt aynı tanımdaysa yeniden kullanılır; tanımı farklıysa yerel kayıt ezilmeden proje malzemesine yeni kimlik verilir ve bağlı yerleşimler atomik olarak yeniden eşlenir.

