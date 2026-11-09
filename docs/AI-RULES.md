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

