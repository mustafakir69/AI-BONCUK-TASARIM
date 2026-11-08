# Teknik Karar Kaydı

Bu dosya, mimariyi etkileyen kararları kısa ADR (Architecture Decision Record) biçiminde tutar. Durumlar: `Önerildi`, `Kabul`, `Değiştirildi`, `İptal`.

## D-001 — Aşamalı ve onay kapılı geliştirme

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Her geliştirme aşaması ayrı tamamlanacak; sonraki aşama kullanıcı onayı olmadan başlamayacak.
- **Gerekçe:** Geometri ve ürün kuralları erken doğrulanmalı, kapsam kontrol altında tutulmalı.
- **Sonuç:** Aşama 0'da uygulama kodu ve paket kurulumu yapılmaz. Her aşamanın çıkış ölçütü ve test yöntemi bulunur.

## D-002 — Alan modelinin tek birimi milimetre

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Bütün fiziksel boyut ve konumlar milimetre saklanacak; cm yalnız giriş/çıktı seçeneği, piksel yalnız görünüm birimi olacak.
- **Gerekçe:** Birim karışıklığını ve zoom kaynaklı fiziksel boyut hatalarını önlemek.
- **Sonuç:** Dönüşüm yalnız sistem sınırlarında yapılır; geometri çekirdeği piksel bilmez.

## D-003 — Merkez tabanlı yerleşim koordinatı

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** `xMm` ve `yMm`, nesnenin geometrik merkezini sol üst kökenli alanda gösterir; açı saat yönünde artar.
- **Gerekçe:** Daire ve döndürülmüş dikdörtgen işlemlerini ortak ve simetrik hale getirmek.
- **Sonuç:** Kullanıcı arayüzü/top-left gerektiren hesaplar sınırda dönüştürülür.

## D-004 — Malzeme geometrisi tek kaynak

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Yerleşimler boyut ve şekli kopyalamaz; yalnız `materialId`, konum, açı ve isteğe bağlı renk geçersiz kılması taşır.
- **Gerekçe:** Aynı malzeme türündeki bütün nesnelerin fiziksel ölçüsünü tutarlı tutmak.
- **Sonuç:** Malzeme ölçüsü değişince bağlı bütün yerleşimler yeniden doğrulanır.

## D-005 — Geometri çekirdeği UI'dan bağımsız saf TypeScript modülü

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Sınır, kesişim, uzaklık ve sayım fonksiyonları React/Konva/tarayıcı bağımlılığı olmadan yazılacak.
- **Gerekçe:** Birim testi, deterministik davranış ve ileride sunucu uyumluluğu.
- **Sonuç:** Konva yalnız çizim ve etkileşim uyarlayıcısıdır; doğruluk kararı vermez.

## D-006 — Kesin çakışma için şekle özel algoritmalar

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Daire–daire için uzaklık, döndürülmüş dikdörtgenler için SAT, daire–dikdörtgen için yerel koordinatta en yakın nokta kullanılacak; AABB yalnız hızlı ön elemedir.
- **Gerekçe:** Eksen hizalı kutu kontrolü döndürülmüş nesnelerde yanlış pozitif/negatif sonuç verebilir.
- **Sonuç:** Minimum aralık, kesin şekil uzaklığıyla ayrıca denetlenir.

## D-007 — Sınır teması geçerli, pozitif alan örtüşmesi geçersiz

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Minimum aralık sıfırken yalnız teğetlik kabul edilir; pozitif alan kesişimi reddedilir. Sayısal karşılaştırmalarda küçük epsilon kullanılır.
- **Gerekçe:** “Üst üste binmeme” şartını gereksiz boşluk dayatmadan karşılamak.
- **Sonuç:** Aralık istendiğinde ayrıca `minimumGapMm` kullanılır.

## D-008 — Pulun çarpışmada dış disk olarak ele alınması

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Pulun deliği görsel olarak çizilse de çarpışmada dış çaplı dolu daire kullanılacak.
- **Gerekçe:** Deliğin başka malzemeye fiziksel yer sağladığını varsaymak üretim açısından risklidir.
- **Sonuç:** Korumacı ve basit bir ilk sürüm kuralı elde edilir.

## D-009 — React + TypeScript + Vite ve react-konva

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Frontend React/TypeScript/Vite; sahne react-konva ile kurulacak.
- **Gerekçe:** Tip güvenliği, hızlı kurulum ve Canvas tabanlı seçim/sürükleme/dönüşüm desteği.
- **Alternatifler:** SVG çok büyük nesne sayısında DOM maliyeti yaratabilir; ham Canvas etkileşim altyapısını gereksiz yere yeniden yazdırır.
- **Sonuç:** Fiziksel/geometrik alan modeli Konva tiplerinden bağımsız kalmalıdır.

## D-010 — Backend'in manuel sürümden ertelenmesi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Aşama 1–4 tarayıcı tabanlı çalışacak; Python/FastAPI yapay zekâ aşamasında eklenecek.
- **Gerekçe:** Manuel editör için ağ servisi zorunlu değildir; erken backend işletim ve geliştirme yükü ekler.
- **Sonuç:** JSON/JPEG yerel dosya akışları frontend altyapı uyarlayıcılarında uygulanır.

## D-011 — Düzenlenebilir kaynağın sürümlü JSON olması

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Otoriter proje dosyası şema sürümlü JSON; JPEG yalnız görsel çıktıdır.
- **Gerekçe:** Kimlik, koordinat, açı ve katalog ilişkilerini kayıpsız saklamak.
- **Sonuç:** İçe aktarma şema + iş kuralı doğrulamasından atomik olarak geçer; adetler yeniden hesaplanır.

## D-012 — Renk değişikliğinin yerleşim geçersiz kılması olması

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Malzeme varsayılan rengi katalogda, tek nesne rengi `colorOverride` alanında tutulacak.
- **Gerekçe:** Fiziksel olarak aynı malzemeyi çoğaltmadan tasarım bazlı renk düzenlemesini desteklemek.
- **Sonuç:** Etkin renk `placement.colorOverride ?? material.color` ile türetilir.

## D-013 — Çoklu seçime hazır seçim modeli

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** İlk sürüm tekli seçim sunsa da uygulama durumu `selectedIds` koleksiyonu kullanacak.
- **Gerekçe:** İleride çoklu seçime geçerken yerleşim kimliklerini veya panel sözleşmesini kırmamak.
- **Sonuç:** UI ilk aşamada koleksiyonu en fazla bir kimlikle sınırlar.

## D-014 — Yapay zekânın yalnız yapılandırılmış öneri üretmesi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** AI yalnız izinli malzeme kimlikleriyle koordinat/açı önerir; istemci ve sunucu deterministik doğrulama yapar.
- **Gerekçe:** Görsel çıktı üretilebilirlik, adet doğruluğu ve düzenlenebilirlik sağlamaz.
- **Sonuç:** Geçersiz öneri projeye alınmaz; adetler kabul edilmiş nesnelerden türetilir.

## D-015 — Başlangıçta ek durum kütüphanesi kullanmama

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Aşama 1'de React'in yerleşik durum araçları kullanılacak; harici mağaza yalnız karmaşıklık/performance ihtiyacı ölçülürse eklenecek.
- **Gerekçe:** Gereksiz bağımlılık ve mimari yükü önlemek.
- **Sonuç:** Alan komutları UI durumundan ayrılarak olası mağaza geçişi kolay tutulur.

## D-016 — Node, npm ve TypeScript araç zinciri

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Frontend için Node.js alt sınırı 24, paket yöneticisi npm ve kilit dosyası `package-lock.json` olacak. TypeScript, kullanılan lint zincirinin desteklediği 6.0 hattında tutulacak.
- **Gerekçe:** Tekrarlanabilir `npm ci` kurulumu sağlamak ve TypeScript 7 ile `typescript-eslint` arasındaki doğrulanmış eş bağımlılık uyuşmazlığından kaçınmak.
- **Sonuç:** Geliştirme kurulumu `frontend` altında yapılır; bağımlılık yükseltmelerinde eş bağımlılıklar, testler ve güvenlik denetimi birlikte kontrol edilir.

## D-017 — Konva çalışma alanının tembel yüklenmesi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Konva tabanlı `DesignWorkspace`, React `lazy`/`Suspense` ile uygulama kabuğundan ayrı üretim parçası olarak yüklenir.
- **Gerekçe:** Canvas kitaplığının ilk JavaScript paketini 500 kB uyarı sınırının üzerine çıkarmasını önlemek.
- **Sonuç:** İlk kabuk hızlı yüklenir; çalışma alanı hazırlanırken açık bir Türkçe yükleme durumu gösterilir.

## Açık kararlar

- Aşama 2: Malzeme görselinin JSON'a gömülmesi veya ayrı varlık olarak paketlenmesi
- Aşama 3: Geri alma geçmişinde komut/diff/anlık görüntü tercihi ve üst sınır
- Aşama 3: Performans ölçümüne göre uzamsal indeks seçimi
- Aşama 5: AI sağlayıcısı ve yapılandırılmış çıktı yöntemi

