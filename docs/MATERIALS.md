# Malzeme ve Yerleşim Veri Modeli

## 1. Amaç

Bu belge, malzeme kataloğunun ve çalışma alanına yerleştirilen boncuk nesnelerinin kanonik modelini tanımlar. Örnekler TypeScript gösterimidir; kaydedilen JSON aynı alan adlarını kullanır.

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
  image?: MaterialImage;
  active: boolean;
  createdAt: string;         // ISO 8601 UTC
  updatedAt: string;         // ISO 8601 UTC
}

interface MaterialImage {
  kind: "data-url" | "asset-ref";
  value: string;
  alt?: string;
}

interface Placement {
  id: PlacementId;
  materialId: MaterialId;
  xMm: number;               // nesne merkezi, sol kenardan
  yMm: number;               // nesne merkezi, üst kenardan
  rotationDeg: number;       // saat yönü, kayıtta [0, 360)
  colorOverride?: string;    // yoksa malzemenin rengi
}
```

Bir yerleşim `widthMm`, `heightMm` veya `shape` değerini kopyalamaz. Böylece aynı malzemeye bağlı bütün nesneler her zaman aynı fiziksel geometriyi kullanır. Bir malzemenin ölçüsü değişirse o malzemeye bağlı tüm yerleşimler yeniden doğrulanır.

## 3. Başlangıç malzemeleri

| Kimlik | Ad | Genişlik | Yükseklik | Geometri | Örnek renk |
| --- | --- | ---: | ---: | --- | --- |
| `mat-seed-bead` | Kum boncuk | 2,5 mm | 2,5 mm | `square` | `#C99A45` |
| `mat-bugle-bead` | Boru boncuk | 2,5 mm | 4 mm | `rectangle` | `#6B8EAD` |
| `mat-pearl` | İnci | 4 mm | 4 mm | `circle` | `#F2EEE3` |
| `mat-sequin` | Pul | 5 mm | 5 mm | `ring` | `#D7A2C8` |

Üretimde kimlikler UUID/ULID gibi çakışma olasılığı ihmal edilebilir değerler olacaktır. Yukarıdaki okunabilir kimlikler yalnız başlangıç verisini kararlı tutar.

## 4. Geometri anlamı

- `square`: Genişlik ve yükseklik eşit olmalıdır; döndürülmüş kare çokgen olarak hesaplanır.
- `rectangle`: Merkezi etrafında dönen dikdörtgendir.
- `circle`: `widthMm === heightMm`; dış çap bu değerdir. Dönüş geometrisini değiştirmez fakat kullanıcı verisi olarak korunabilir.
- `ring`: Pulun dış sınırı `widthMm === heightMm` olan dairedir. Delik ilk sürümde görsel ayrıntıdır; çarpışmada güvenli tarafta kalmak için dolu dış disk kullanılır.

Gelecekte oval veya düzensiz geometri eklemek, `MaterialShape` ve buna karşılık gelen açık çarpışma stratejisi için şema sürümü değişikliği gerektirir.

## 5. Çalışma alanı ve proje

```ts
interface Workspace {
  widthMm: number;
  heightMm: number;
  grid: {
    visible: boolean;
    stepMm: number;
    snapEnabled: boolean;
  };
  minimumGapMm: number;
}

interface DesignProjectV1 {
  schemaVersion: "1.0";
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workspace: Workspace;
  materials: Material[];
  placements: Placement[];
}
```

Görünüm yakınlaştırması ve kaydırma konumu proje geometrisi değildir. İlk şemada kaydedilmez. Izgara adımı ve minimum aralık, kullanıcı davranışını ve yerleşim sonucunu etkilediği için projede tutulur.

## 6. Örnek proje JSON'u

```json
{
  "schemaVersion": "1.0",
  "id": "project-01",
  "name": "İnci Çiçeği",
  "createdAt": "2026-11-08T09:00:00.000Z",
  "updatedAt": "2026-11-08T09:00:00.000Z",
  "workspace": {
    "widthMm": 200,
    "heightMm": 250,
    "grid": { "visible": true, "stepMm": 5, "snapEnabled": false },
    "minimumGapMm": 0.5
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
      "xMm": 100,
      "yMm": 125,
      "rotationDeg": 0
    }
  ]
}
```

## 7. Doğrulama kuralları

### Malzeme

- `id` proje içinde benzersiz ve boş olmayan bir dizedir.
- `name` kırpıldıktan sonra boş olamaz; önerilen üst sınır 100 karakterdir.
- Boyutlar sonlu, sıfırdan büyük ve tanımlanacak makul üst sınırın altındadır.
- `square`, `circle` ve `ring` için genişlik/yükseklik eşitliği geometri toleransı içinde sağlanır.
- `color` kanonik `#RRGGBB` biçimindedir.
- Görsel isteğe bağlıdır; desteklenen MIME türü ve dosya boyutu Aşama 2'de sınırlandırılır.
- `active: false` malzemeyi yeni yerleşime kapatır; mevcut nesneleri silmez.

### Yerleşim

- `id` proje içinde benzersizdir.
- `materialId` var olan bir malzemeyi gösterir.
- X, Y ve açı sonlu sayıdır.
- Açı kayıttan önce `[0, 360)` aralığına normalize edilir.
- Etkin olmayan malzeme ile yeni yerleşim yapılamaz; eski proje nesneleri okunabilir ve uyarı alabilir.
- Geometri çalışma alanında kalmalı, başka nesneyle çakışmamalı ve minimum aralığa uymalıdır.

### Çalışma alanı

- Genişlik/yükseklik sonlu ve sıfırdan büyüktür.
- Izgara adımı sonlu ve sıfırdan büyüktür.
- Minimum aralık sonlu ve negatif değildir.
- Kesin ürün sınırları kullanıcı araştırmasıyla belirlenecek; başlangıç önerisi boyutlar için `1–5000 mm`, aralık için `0–100 mm` değeridir.

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

## 11. Şema sürümleme

- `schemaVersion` anlamsal `major.minor` biçimindedir.
- Geriye uyumsuz alan/anlam değişikliği ana sürümü yükseltir.
- Ek, varsayılanlanabilir alan küçük sürümü yükseltebilir.
- Her desteklenen eski sürümden güncele saf bir göç fonksiyonu ve sabit test örneği bulunur.
- Bilinmeyen ana sürüm veri kaybı riski nedeniyle açılmaz.

