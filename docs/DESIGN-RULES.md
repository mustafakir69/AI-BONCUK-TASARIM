# Geometri ve Yerleşim Kuralları

## 1. Kapsam

Bu belge, bir boncuk yerleşiminin kabul edilip edilmeyeceğini belirleyen deterministik kuralları tanımlar. Kurallar manuel düzenlemeye, JSON içe aktarmaya ve yapay zekâ önerilerine aynı şekilde uygulanır.

## 2. Temel kabuller

- Bütün hesaplar milimetre cinsinden yapılır.
- Koordinatlar nesnenin merkezidir; orijin alanın sol üstüdür.
- Açı saat yönünde derece olarak saklanır. Matematik işlevine girerken radyana çevrilir.
- `EPSILON_MM = 1e-7` başlangıç sayısal toleransıdır; test ve gerçek veriyle ayarlanabilir.
- İki malzemenin yalnızca sınırlarının birbirine değmesi, minimum aralık `0` ise çakışma sayılmaz.
- Pozitif alan kesişimi çakışmadır.
- `minimumGapMm > 0` ise sınırlar arasındaki Öklid uzaklığı en az bu değer olmalıdır.

## 3. Şekil üretimi

### Döndürülmüş kare/dikdörtgen

Merkezi `(cx, cy)`, yarı genişliği `hw`, yarı yüksekliği `hh` olan yerel köşeler:

```text
(-hw,-hh), (hw,-hh), (hw,hh), (-hw,hh)
```

Her köşe merkez etrafında döndürülür ve dünya koordinatına taşınır:

```text
x' = cx + x·cos(θ) - y·sin(θ)
y' = cy + x·sin(θ) + y·cos(θ)
```

Ekran Y ekseni aşağı doğru olduğundan pozitif açı görsel olarak saat yönünde görünür.

### Daire ve pul

Dairenin merkezi yerleşim koordinatı, yarıçapı `widthMm / 2` değeridir. Pul çarpışma hesabında dış yarıçaplı dolu daire kabul edilir. Delik, başka bir boncuğu içinden geçirmeye izin veren boş alan sayılmaz.

## 4. Doğrulama sırası

Bir ekleme, taşıma veya döndürme adayı için:

1. Sayıların sonlu ve malzeme başvurusunun geçerli olduğunu denetle.
2. Malzeme geometrisini üret.
3. Adayın çalışma alanında bütünüyle kaldığını denetle.
4. Minimum aralığı hesaba katan AABB üret.
5. AABB kesişmeyen nesneleri hızlıca ele.
6. Kalan her nesne çifti için kesin şekil testini çalıştır.
7. Sorun yoksa komutu kalıcı duruma ve geri alma geçmişine ekle.
8. Sorun varsa adayı reddet; kalıcı projeyi ve adetleri değiştirme.

Bu sıra ucuz hataları önce bulur ve pahalı kesin test sayısını azaltır.

## 5. Çalışma alanı sınırı

Alan kapalı dikdörtgendir: `[0, widthMm] × [0, heightMm]`.

- Daire: `cx - r >= -ε`, `cy - r >= -ε`, `cx + r <= W + ε`, `cy + r <= H + ε`.
- Çokgen: Her döndürülmüş köşe aynı sınırlar içinde olmalıdır.

Malzemenin sınır çizgisine değmesine izin verilir. Minimum malzeme aralığı, çalışma alanı kenarına uygulanmaz; ileride ayrı bir `edgeGapMm` gereksinimi eklenebilir.

## 6. Kesin çakışma testleri

### Daire–daire

Merkezler arası karesel uzaklık ile yarıçap toplamı karşılaştırılır:

```text
d² = (ax-bx)² + (ay-by)²
limit = ra + rb + minimumGapMm
çakışma/aralık ihlali ⇔ d² < (limit - ε)²
```

Eşitlik teğetliktir ve geçerlidir.

### Dikdörtgen–dikdörtgen (döndürülmüş dahil)

Ayıran Eksen Teoremi (SAT) kullanılır:

1. İki dikdörtgenin kenar normallerinden en fazla dört benzersiz eksen alınır.
2. Her çokgenin köşeleri her eksene izdüşürülür.
3. Herhangi bir eksende aralıklar ayrılıyorsa şekiller çakışmaz.
4. Bütün eksenlerde pozitif iç içe geçme varsa çakışırlar.

Sıfır aralıkta yalnız sınır teması çakışma değildir. Pozitif minimum aralık için salt ölçek büyütme, köşelerde yanlış mesafe üretebilir. Bu nedenle kesin kural, önce kesişimi SAT ile sınamak, ayrık çokgenlerde sonra en küçük kenar/tepe uzaklığını hesaplayıp `minimumGapMm` ile karşılaştırmaktır.

### Daire–dikdörtgen

Dairenin merkezi, dikdörtgen merkezine göre `-rotationDeg` ile yerel koordinata döndürülür. Yerel merkez en yakın dikdörtgen noktasına sıkıştırılır:

```text
nearestX = clamp(localX, -halfWidth, halfWidth)
nearestY = clamp(localY, -halfHeight, halfHeight)
distance² = (localX-nearestX)² + (localY-nearestY)²
```

`distance² < (radius - ε)²` ise çakışma vardır. Minimum aralık için karşılaştırma yarıçapı `radius + minimumGapMm` olur. Bu yöntem dikdörtgenin dönüşünü doğru biçimde hesaba katar.

### Kare

Kare, eşit genişlik/yüksekliğe sahip döndürülmüş dikdörtgen olarak değerlendirilir.

### Pul

Pul, dış diski üzerinden daire kurallarını kullanır. Bu korumacı yaklaşım üretimde malzemenin üst üste binmesini önler.

## 7. Minimum aralık

`minimumGapMm`, iki malzemenin fiziksel dış sınırları arasındaki en küçük uzaklıktır. Çift başına yalnız bir kez uygulanır; her nesneye tam aralık eklenmez.

- Daire–daire: merkez sınırı `ra + rb + gap`.
- Daire–dikdörtgen: dikdörtgene en yakın nokta ile merkez uzaklığı `radius + gap`.
- Çokgen–çokgen: Kesişim yoksa tüm kenar çiftleri ve ilgili uç noktalar üzerinden en küçük Öklid uzaklığı hesaplanır; `distance + ε < gap` ise ihlal vardır.

Hızlı AABB, güvenli eleme için her şeklin kutusunu `gap / 2` kadar her yönde genişletebilir. AABB yalnız ön elemedir; kesin karar vermez.

## 8. Sürükleme ve döndürme davranışı

- İşaretçi hareketi boyunca aday konum ayrı etkileşim durumunda tutulur.
- Geçerli aday normal önizlenir; geçersiz aday kırmızı/anlamlı bir durum göstergesi ve hata nedeni alır.
- Bırakmada yalnız geçerli aday kaydedilir.
- Geçersiz bırakmada nesne son geçerli konumuna döner.
- Seçili nesne, çakışma taramasında kendi kimliğiyle eşleşen mevcut nesneyi atlar.
- Izgaraya yapışma açıksa önce aday koordinat yapışır, sonra geometri doğrulanır.
- Döndürme değeri görsel kolaylık için belirli adımlara yapışabilir; kanonik model keyfi açıyı destekler.

## 9. Malzeme ölçüsü değişikliği

Bir katalog malzemesinin ölçüsü/geometrisi değiştiğinde bağlı bütün yerleşimler etkilenir. İşlem şu şekilde yapılır:

1. Değişiklik geçici kopyaya uygulanır.
2. Bütün proje yeniden doğrulanır.
3. Hata varsa kullanıcıya etkilenen nesneler gösterilir ve değişiklik varsayılan olarak kaydedilmez.
4. İlk sürüm, geçersiz tasarımı zorla kaydetmeye izin vermez.

Renk veya ad değişikliği geometriyi yeniden doğrulamayı gerektirmez.

## 10. Geometri modülü taslağı

```text
domain/geometry/
├── primitives.ts       Point, AABB, Circle, Polygon
├── transforms.ts       derece/radyan, döndürme, köşe üretimi
├── bounds.ts           çalışma alanı kontrolleri
├── intersections.ts    SAT, circle-circle, circle-polygon
├── distance.ts         şekiller arası minimum uzaklık
├── validation.ts       proje/aday doğrulama orkestrasyonu
└── geometry.test.ts    tablo ve özellik tabanlı testler
```

Fonksiyonlar saf olmalı, girdi nesnelerini değiştirmemeli ve çizim kütüphanesi tiplerini kullanmamalıdır.

## 11. Zorunlu test matrisi

| Kimlik | Senaryo | Beklenen |
| --- | --- | --- |
| G-01 | Birbirinden uzak iki daire | Geçerli |
| G-02 | Teğet iki daire, aralık 0 | Geçerli |
| G-03 | Örtüşen iki daire | `OVERLAP` |
| G-04 | 45° dönen iki dikdörtgen, AABB kesişiyor ama şekiller ayrık | Geçerli |
| G-05 | 45° dönen dikdörtgenler gerçekten kesişiyor | `OVERLAP` |
| G-06 | Daire döndürülmüş dikdörtgenin köşesine değiyor | Geçerli |
| G-07 | Daire döndürülmüş dikdörtgenin içine giriyor | `OVERLAP` |
| G-08 | Daire alan kenarına teğet | Geçerli |
| G-09 | Dairenin bir bölümü alan dışında | `OUT_OF_BOUNDS` |
| G-10 | Döndürülmüş dikdörtgenin tek köşesi dışarıda | `OUT_OF_BOUNDS` |
| G-11 | Şekiller ayrık fakat 0,5 mm aralığın altında | `MIN_GAP_VIOLATION` |
| G-12 | Şekiller tam 0,5 mm aralıklı | Geçerli |
| G-13 | Aday mevcut kayıtta kendi kimliğiyle karşılaştırılıyor | Kendisi atlanır |
| G-14 | `NaN`, `Infinity` veya negatif boyut | `INVALID_NUMBER`/şema hatası |
| G-15 | Çakışma fonksiyonunda A/B sırası değişiyor | Sonuç aynı |
| G-16 | Açıya 360° ekleniyor | Geometri aynı |

## 12. Kabul ilkesi

Ekrandaki görünüş ile çekirdek hesabı çelişirse çekirdek kararı esastır; ardından çizim dönüşümündeki hata araştırılır. Piksel yuvarlama hiçbir zaman fiziksel geçerlilik hesabına girdi olmaz.

