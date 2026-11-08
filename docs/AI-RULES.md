# Yapay Zekâ Tasarım Kuralları

## 1. Rol ve sınır

Yapay zekâ bir görsel üretici değil, kısıtlı bir yerleşim önericisi olarak kullanılacaktır. Otoriter karar mercii yapay zekâ değil, sürümlü şema ve deterministik geometri doğrulayıcısıdır.

Bu özellik Aşama 5'ten önce uygulanmayacaktır.

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
  workspace: {
    widthMm: number;
    heightMm: number;
    minimumGapMm: number;
  };
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

Komut metninde geçen ölçüler ile yapılandırılmış alan çelişirse sistem kullanıcıya çelişkiyi açıklar; sessizce rastgele seçim yapmaz. Güvenlik ve maliyet için komut uzunluğu ve azami nesne sayısı sınırlandırılır.

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

## 8. Referans görsel kuralları (Aşama 6)

- JPEG/PNG yalnız motifin siluet, yön, yoğunluk ve renk bölgeleri gibi özelliklerini çıkarmak için kullanılır.
- Görseldeki boncuğun piksel boyutu gerçek fiziksel ölçü sayılmaz.
- Kullanıcı hedef çalışma alanını ve izinli malzemeleri ayrıca seçer.
- Sistem, görseli birebir kopyalama veya kusursuz dönüşüm garantisi vermez.
- Çıktı yine `DesignProposal` benzeri yapılandırılmış yerleşimdir ve aynı geometri hattından geçer.
- Yüklenen görselin türü, boyutu, çözünürlüğü ve gizlilik koşulları çağrıdan önce doğrulanır.
- Model güven puanı varsa yalnız bilgilendirme amaçlıdır; geometrik doğrulamanın yerine geçmez.

## 9. Güvenlik ve gizlilik

- API anahtarları yalnız backend'de saklanır.
- Kullanıcı metni ve görseli güvenilmeyen girdidir; istem enjeksiyonu veri kısıtlarını değiştiremez.
- Sağlayıcıya yalnız görev için gerekli malzeme ve çalışma alanı verisi gönderilir.
- Sağlayıcı, saklama süresi ve kullanıcı onayı ticari sürümden önce belgelenir.
- Hassas içerik loglarda maskelenir; ham görseller varsayılan olarak kalıcı tutulmaz.
- Zaman aşımı, maliyet, hız ve azami çıktı nesnesi limitleri sunucuda uygulanır.

## 10. Sağlayıcı bağımsızlığı

Uygulama, sağlayıcıya özgü yanıtı alan modeline taşımayan bir `DesignGenerator` arayüzü kullanır. Sağlayıcı değişikliği editör ve geometri çekirdeğini etkilememelidir. Yapılandırılmış çıktı desteği, maliyet, gecikme ve veri politikası Aşama 5'te değerlendirilir.

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

