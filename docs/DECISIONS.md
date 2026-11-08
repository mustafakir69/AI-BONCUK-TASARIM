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
- **Durum:** Değiştirildi — bkz. D-018
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
- **Karar:** Aşama 1–5 tarayıcı tabanlı çalışacak; Python/FastAPI yapay zekâ aşamasında eklenecek.
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
- **Sonuç:** Aşama 5'te koleksiyon Shift, alan seçimi ve Ctrl+A ile çoklu kullanılmaya başlanmıştır; grup üyeleri seçimde birlikte genişletilir.

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

## D-018 — Sonsuz düzlem ve sabit dünya orijini

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Fiziksel tasarım yüzeyi genişlik/yükseklik sınırı taşımayan sonsuz bir düzlem olacak. Dünya orijini sabit `(0,0)` noktasıdır; başlangıçta ekran merkezinde görünür ve negatif koordinatlar desteklenir.
- **Gerekçe:** Nakış tasarım programlarındaki teknik cetvel/pan çalışma biçimini sağlamak ve görünüm boyutunu üretim hedefinden ayırmak.
- **Sonuç:** Görünüm `viewCenterMm + pixelsPerMm` ile tanımlanır. Cetvel, ızgara, imleç ve motif kılavuzu `domain/coordinates.ts` içindeki aynı saf dönüşümleri kullanır. Eski sol-üst kökenli D-003 görünüm kararı geçersizdir; yerleşimler yine geometrik merkez koordinatı taşır.

## D-019 — Motif hedefinin görünüm düzleminden ayrılması

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Sağ paneldeki genişlik/yükseklik, sonsuz yüzeyin değil orijinde merkezlenen hedef motifin fiziksel boyutudur.
- **Gerekçe:** Üretim hedefini saklarken kullanıcıya sınırlandırılmamış bir düzenleme düzlemi sunmak.
- **Sonuç:** `motif.widthMm` ve `motif.heightMm` proje verisidir. Kılavuz görünürlüğü geçici görünüm durumudur; ölçü değişikliği arka planı yeniden boyutlandırmaz. Zorunlu motif sınır doğrulaması ancak ayrı bir proje ayarı tanımlandığında aynı boyutları kullanacaktır; Aşama 3 politikası için bkz. D-025.

## D-020 — Malzeme kataloğunun sürümlü LocalStorage zarfında tutulması

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Aşama 2 kataloğu `ai-boncuk-tasarim.materials.v1` anahtarında, `schemaVersion: "1.0"` taşıyan bir zarfla ve ayrı altyapı servisi üzerinden saklanacak.
- **Gerekçe:** Backend eklemeden yenilemeler arasında kalıcılık sağlamak; tarayıcı API'sini alan modelinden ayırmak ve ileride proje JSON'una geçişi kolaylaştırmak.
- **Sonuç:** Yükleme her kaydı alan kuralları ve benzersiz kimlik açısından doğrular. Bozuk kayıt uygulamayı çökertmez; geçerli kayıtlar kurtarılır veya başlangıç kataloğuna dönülür.

## D-021 — Malzeme önizlemesinin kanonik geometriden üretilmesi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Aşama 2'de ayrı raster malzeme görseli yüklenmeyecek; kart ve form önizlemeleri şekil, renk, genişlik/yükseklik ve pul delik çapından SVG olarak üretilecek.
- **Gerekçe:** İstenen dört geometriyi gerçek oranlarıyla göstermek için ek dosya depolama ve MIME/boyut yönetimi gerekmiyor.
- **Sonuç:** CSS/SVG pikseli yalnız sunum ölçeğidir; fiziksel ölçü kaynağı `Material` kaydındaki mm alanlarıdır. Görsel dosya gereksinimi ileride ayrıca doğrulanacaktır.

## D-022 — Silme politikasında kullanım sayısı kapısı

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Malzeme silme alan işlemi bir `usageCount` alacak; değer sıfırdan büyükse `MATERIAL_IN_USE` ile kaydı koruyacak.
- **Gerekçe:** Aşama 2'de henüz yerleşim bulunmasa da Aşama 3'te kullanılan bir katalog kaydının yanlışlıkla silinmesini önlemek.
- **Sonuç:** Arayüz bugün onaydan sonra kullanılmayan kaydı silebilir. Yerleşim modeli bağlandığında aynı servis sınırı, hesaplanan kullanım sayısıyla çalışacaktır.

## D-023 — Terslenebilir ve sınırlı yerleşim komut geçmişi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Aşama 3 geri al/yinele geçmişi, tam proje anlık görüntüleri yerine `placement.add`, `placement.remove` ve önce/sonra taşıyan `placement.update` komutlarından oluşacak; son 100 komut korunacak.
- **Gerekçe:** Yüzlerce/binlerce yerleşimde her işlem için bütün diziyi geçmişte çoğaltmadan deterministik geri alma sağlamak.
- **Sonuç:** Ekleme, taşıma, döndürme, panel koordinat düzenleme ve silme geri alınabilir. Geçersiz adaylar hiçbir zaman geçmişe girmez; yeni komut yineleme kuyruğunu temizler. Katalog ölçüsü veya minimum aralık değiştiyse undo/redo adayı güncel kurallarla tekrar doğrulanır ve geçersiz olacak işlem uygulanmaz.

## D-024 — AABB ön elemesi ve memoize Konva yerleşimleri

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Etkileşim doğrulaması, kesin SAT/daire testinden önce AABB uzaklığıyla adayları eleyecek. Konva yerleşim listesi imleç önizlemesinden ayrı memoize edilecek.
- **Gerekçe:** Geometri doğruluğunu değiştirmeden binlerce uzak nesnede gereksiz kesin testleri ve imleç hareketinde React düğüm yeniden üretimini azaltmak.
- **Sonuç:** 5.000 uzak yerleşimli aday testi otomatik test kapsamındadır. Ek uzamsal indeks ancak gerçek proje ölçümü doğrusal aday taramasını yetersiz gösterirse eklenecektir.

## D-025 — Aşama 3'te motif kılavuzunun görsel kalması

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Manuel editörde motif sınır kılavuzu yerleştirmeyi kısıtlamayacak; negatif ve motif dışı koordinatlar geçerli olmaya devam edecek.
- **Gerekçe:** Kullanıcı talebi sonsuz düzlemin korunması ve kılavuzun yalnız görsel rehber olması yönündedir; zorunlu sınır için ayrı bir proje ayarı henüz tanımlanmamıştır.
- **Sonuç:** Aşama 3 doğrulama hattı çakışma, minimum aralık, malzeme başvurusu ve sayısal geçerliliği uygular. Motif sınır zorunluluğu ileride açık ayarla eklenecektir.

## D-026 — Proje dosyasının kullanılan malzemeleri kendi içinde taşıması

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** JSON V1 yalnız yerleşimlerin başvurduğu tam katalog kayıtlarını proje içinde taşır; adet özeti saklanmaz.
- **Gerekçe:** Proje farklı tarayıcıdaki LocalStorage kataloğundan bağımsız açılabilmeli ve adet tek kaynaktan türetilmelidir.
- **Sonuç:** Açma önce dosya içi malzemelerle tüm geometriyi doğrular. Yerel katalogdaki aynı kimlik farklı tanımsa yerel kayıt korunur, proje malzemesine yeni kimlik verilir ve yerleşimler atomik eşlenir.

## D-027 — Kaydedilmemiş durumun içerik parmak iziyle izlenmesi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Değişiklik durumu, proje adını, motifi, minimum aralığı, kullanılan malzeme tanımlarını ve yerleşimleri içeren kanonik parmak izinin son kayıt/açma anıyla karşılaştırılmasından türetilir.
- **Gerekçe:** Basit bir değişti bayrağı, kullanıcı undo ile kayıt anına döndüğünde yanlış kalır.
- **Sonuç:** Kaydetme ve geçerli açma yeni tabanı kurar; undo/redo içerik gerçekten kayıt anına dönerse gösterge otomatik temizlenir. Kimlik ve tarih üst bilgileri parmak izine dahil edilmez.

## D-028 — Görsel çıktının ekran görüntüsü yerine kanonik geometriden çizilmesi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** PNG/JPEG çıktısı Konva sahnesinin ekran görüntüsü olmayacak; yerleşimler mm koordinatları, katalog ölçüleri ve dönüşleriyle ayrı Canvas'a çizilecek.
- **Gerekçe:** Zoom/pan, cetvel, ızgara, seçim ve önizleme çıktı içeriğini veya çözünürlüğünü etkilememelidir.
- **Sonuç:** Alan motif kılavuzu ya da döndürülmüş gerçek geometri sınırlarından seçilir; piksel boyutu `mm × DPI / 25,4` olur. PNG şeffaf olabilir, JPEG zemin/kalite kullanır; DPI metadata yazımı garanti edilmez.

## D-029 — Tarayıcı çıktı ve dosya güvenlik sınırları

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Proje okuma 10 MB; görsel çıktı tek kenarda 16.384 piksel ve toplamda 64 milyon piksel ile sınırlanacak.
- **Gerekçe:** Büyük veya kötü niyetli girdilerin tarayıcı belleğini tüketmesini ve Canvas oluşturma hatalarını öngörülebilir biçimde önlemek.
- **Sonuç:** Aşan işlem başlamadan Türkçe uyarıyla reddedilir. Tahmini RGBA bellek kullanıcıya gösterilir.

## D-030 — Alan seçiminde pozitif gerçek geometri kesişimi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Seçim dikdörtgeniyle gerçek daire/çokgen geometrisi pozitif alanda kesişen boncuk seçilecek; yalnız sınır teması seçilmeyecek.
- **Gerekçe:** Kısmi seçim için tutarlı davranış sağlamak ve döndürülmüş nesnelerde yalnız merkez/AABB yaklaşımının yanlış seçimlerini önlemek.
- **Sonuç:** Ekran dikdörtgeni önce dünya mm koordinatına çevrilir; zoom/pan sonucu etkilemez. Bir grup üyesinin seçimi bütün gruba genişler.

## D-031 — Toplu işlemlerde delta komutu ve atomik doğrulama

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Toplu ekleme/silme/güncelleme yalnız etkilenen önce/sonra dizilerini komutta taşıyacak; bütün aday proje geçmeden komut uygulanmayacak.
- **Gerekçe:** Tam proje anlık görüntülerinin bellek maliyetini önlerken tek adımlı undo/redo ve kısmi uygulamama garantisi sağlamak.
- **Sonuç:** Taşıma, döndürme, çoğaltma, hizalama ve dağıtma tek geçmiş adımıdır. Tek bir çakışma bütün işlemi reddeder.

## D-032 — İç içe olmayan kalıcı gruplar ve JSON 1.1

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Grup, benzersiz kimlik ve en az iki `placementId` taşıyacak; yerleşim en fazla bir gruba üye olacak. Gruplar ve klavye adımları proje şeması `1.1` içinde saklanacak.
- **Gerekçe:** Grup davranışının yalnız görsel kalmaması ve proje turunda kaybolmaması.
- **Sonuç:** `1.0` dosyaları boş grup ve `0,5/5 mm` adımlarıyla `1.1` modeline taşınır. Bilinmeyen sürüm veya çakışan grup üyeliği reddedilir.

## D-033 — Tam-proje doğrulamasında sıralı AABB etkin kümesi

- **Tarih:** 2026-11-08
- **Durum:** Kabul
- **Karar:** Bütün proje doğrulaması geometrileri bir kez üretip AABB `minX` değerine göre sıralayacak; yalnız X aralığı minimum boşluk içinde kalan etkin adaylar kesin teste girecek.
- **Gerekçe:** Toplu işlemlerde binlerce uzak nesne için karesel çift taramasını azaltmak.
- **Sonuç:** Kesin SAT/daire/uzaklık kararları değişmez. 5.000 uzak nesneli bütün proje otomatik testle doğrulanır.

## Açık kararlar

- Aşama 6: AI sağlayıcısı ve yapılandırılmış çıktı yöntemi

