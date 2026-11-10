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
- **Karar:** Aşama 1–6 tarayıcı tabanlı çalışacak; Python/FastAPI yalnız gerçek harici sağlayıcı veya sunucu işi ayrıca onaylanırsa eklenecek.
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

## D-034 — Aşama 6'da yerel deterministik motif üretimi

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Akıllı motif aracı gerçek LLM, bulut servisi veya backend yerine React/Konva'dan bağımsız saf TypeScript üretici kullanacak.
- **Gerekçe:** Geometri, seed tekrarlanabilirliği ve hata davranışı dış sağlayıcı değişkenliği olmadan doğrulanabilmeli; kullanıcı yalnız düzenlenebilir placement nesneleri almalı.
- **Sonuç:** Altı geometrik motif aynı `Placement` modelini üretir. Gerçek sağlayıcı entegrasyonu Aşama 6 kapsamında değildir ve ayrıca onay gerektirir.

## D-035 — Seed, uzamsal indeks ve üretim güvenlik sınırları

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Üretim sabit seed karması/PRNG kullanacak; kabul edilmiş adaylar malzeme çapına göre hücrelenen uzamsal indekste tutulacak. Limitler 5.000 placement, 40.000 aday ve 1.000 ms olacaktır.
- **Gerekçe:** Aynı girdinin aynı geometrik sonucu vermesi ve yoğun motiflerin tarayıcıyı sınırsız çalıştırmaması gerekir.
- **Sonuç:** Hücre indeksi yalnız ön elemedir; kesin geometri çekirdeği değişmez. Limit veya süre aşımı kısmi motif döndürmez.

## D-036 — Geçici önizleme ve atomik motif uygulaması

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Motif önizlemesi proje/parmak izi/geçmiş dışında tutulacak. Ekleme `placements.add`, değiştirme önce/sonra belge durumlu `document.replace` komutuyla tek undo/redo adımı olacaktır.
- **Gerekçe:** Kullanıcı sonucu görmeden projeyi değiştirmemeli; uygulama anında mevcut tasarımla çakışma yeniden sınanmalı ve kısmi sonuç oluşmamalıdır.
- **Sonuç:** Önizleme ile uygulanan yerleşimlerin koordinat, malzeme ve açıları aynıdır; yalnız kalıcı benzersiz placement kimlikleri uygulama sınırında üretilir. Kaydedilmemiş tasarımı değiştirme açık onay ister.

## D-037 — Üretim ayarlarının proje şemasına yazılmaması

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Aşama 6 üretim türü, seed, yoğunluk, oran ve simetri ayarları geçici araç durumu olacak; uygulanan sonuç mevcut `Placement[]` olarak JSON `1.1` içinde saklanacak.
- **Gerekçe:** Düzenlenebilir projenin otoriter verisi gerçek placement nesneleridir; üretim tarifini tekrar çalıştırma gereksinimi henüz istenmemiştir.
- **Sonuç:** Şema yükselmez. Aşama 4 `1.0` ve Aşama 5 `1.1` projeleri mevcut sıkı geçiş/doğrulama hattıyla açılmaya devam eder.

## D-038 — Eğri motiflerde yay uzunluğu ve iki ayrı aralık

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Halka, spiral, dalga ve çiçek adayları eşit parametrik adım yerine yoğun bir poligon yaklaşımının kümülatif yay uzunluğu üzerinden yerleştirilecek. `targetGapMm` görsel yoğunluğu, `minimumGapMm` ise gevşetilemeyen kesin güvenlik kuralını temsil edecek.
- **Gerekçe:** Eğri parametresindeki eşit artış fiziksel mesafede eşit değildir; yoğunluğu rastgele aday atlayarak azaltmak da düzensiz delikler üretir.
- **Sonuç:** Merkez adımı, komşu malzemelerin katalog boyutları ve teğet açılarına göre hesaplanır. Düşük yoğunluk düzenli aralığı büyütür. Açık eğrinin artığı iki uca paylaştırılır; kapalı eğrinin kapanış artığı bütün komşu adımlarına ölçeklenir. Bir eğri adayı kesin testte çakışırsa önceki ve yeni komşu, teğetleri boyunca üç sınırlı deterministik adımda karşılıklı açılarak tekrar sınanır; bütün denemeler geçersizse aday reddedilir. Kesin çakışma ve minimum aralık doğrulaması değişmez; üretim ayarları geçici kaldığından proje şeması `1.1` olarak kalır.

## D-039 — Seçim modunda birincil boş-alan sürüklemesinin pan olması

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Seçim modunda boş arka plandaki normal sol sürükleme pan, Shift + sol sürükleme alan seçimi olacak. Space + sol, orta tuş ve dokunma pan olarak kalacak; yerleştirme modundaki normal sol tıklama boncuk eklemeyi sürdürecek.
- **Gerekçe:** Sonsuz düzlemde temel gezinme birincil işaretçiyle erişilebilir olmalı; alan seçimi açık bir değiştiriciyle çakışmadan ayrılmalıdır.
- **Sonuç:** Jest kararı saf bir yardımcıda test edilir. Boncuk düğümleri olayı durdurduğu için seçme/taşıma pan başlatmaz. Pan ve imleç merkezli zoom yalnız geçici görünüm dönüşümünü değiştirir.

## D-040 — AI sağlayıcısının port arkasında ve Aşama 7A'da yapılandırılmamış kalması

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Frontend yalnız `AiDesignProvider` ve `AiPlanPlacementGenerator` arayüzlerini tanımlar; gerçek sağlayıcı, HTTP istemcisi, backend veya API anahtarı eklemez.
- **Gerekçe:** Sağlayıcı, veri politikası, maliyet ve sunucu güvenliği kararlaştırılmadan istemciye gizli anahtar veya ücretli çağrı eklemek güvenli değildir.
- **Sonuç:** Arayüz isteği yerel doğrular ve bağlantının yapılandırılmadığını açıkça bildirir. Gerçek entegrasyon Aşama 7B için yeni kullanıcı onayı gerektirir.

## D-041 — AI planı ve placement önerisi için iki zorunlu doğrulama kapısı

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Sağlayıcı yanıtı önce sürümlü `AiDesignPlan 1.0` şemasına; yorumlayıcının sonucu sonra katalog, adet, motif sınırı ve mevcut kesin geometri kurallarına göre doğrulanacak.
- **Gerekçe:** Şeması geçerli bir plan yine de çakışan, sınır dışı veya izinsiz malzemeli placement üretebilir; sağlayıcı çıktısı hiçbir aşamada otoriter değildir.
- **Sonuç:** Bilinmeyen malzeme/koordinat/açı/boyut/limit planı reddeder. Placement dizisindeki tek zorunlu hata bütün önerinin projeye uygulanmasını engeller. Kabul ileride mevcut tek komutlu atomik editör hattından yapılacaktır.

## D-042 — Referans görselin geçici yerel girdi olması

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Aşama 7A referans görseli yalnız bileşen belleğinde tutacak; JPEG/PNG/WebP MIME ve imzası, 8 MB, 8.192 px ve 32 MP sınırlarıyla doğrulayacak.
- **Gerekçe:** Sağlayıcı ve açık aktarım izni yokken görseli saklamak ya da göndermek gereksiz gizlilik ve güvenlik riski yaratır.
- **Sonuç:** Önizleme analiz iddiası taşımaz. Dosya LocalStorage veya proje JSON'una girmez; kaldırma/kapatmada nesne URL'si geri alınır. Harici aktarım Aşama 7B'de açık kullanıcı onayına bağlıdır.

## D-043 — OpenAI Responses API ve FastAPI sunucu sınırı

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Gerçek sağlayıcı OpenAI Responses API olacak; model ortamdan seçilecek. Pydantic Structured Outputs isteyen uyarlayıcı Python/FastAPI backend içinde kalacak.
- **Gerekçe:** Gizli anahtarın tarayıcıya çıkmaması ve sağlayıcı yanıtının sürümlü sözleşmeyle doğrulanması gerekir.
- **Sonuç:** Assistants API kullanılmaz. Backend anahtarsız başlar; ücretli AI uç noktası etkinleştirme/anahtar/model eksikliğini dürüstçe bildirir.

## D-044 — Açık aktarım onayı ve stateless sağlayıcı isteği

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Metin/görsel aktarımı tam onay metnine bağlı olacak; sağlayıcı çağrısı `store=False` kullanacak ve ham içerik uygulamada kalıcı tutulmayacak.
- **Gerekçe:** Referans görsel ve tasarım tarifi kullanıcı verisidir; görev dışı saklama en aza indirilmelidir.
- **Sonuç:** Onaysız istek frontend ve backend tarafından reddedilir. Sağlayıcı kullanım politikası ayrıca geçerlidir; uygulama içinde sıfır saklama vaadi verilmez.

## D-045 — 1.0 planına geriye uyumlu parametrik geometri eklenmesi

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** `AiDesignPlan 1.0` bileşenine isteğe bağlı `geometry` alanı eklenecek; eski 1.0 planları kabul edilmeye devam edecek. Yeni backend planı alanı zorunlu ve katı üretir.
- **Gerekçe:** Semantik `path/region` etiketi tek başına düzenlenebilir koordinat üretmek için yeterli değildir.
- **Sonuç:** Line/polyline/Bézier/elips/dikdörtgen/nokta kümesi dönüştürülür; `unsupported` biçimler sessizce yaklaşık sayılmaz.

## D-046 — Ücretli çağrı ve kaynak limitlerinin varsayılan kapalı olması

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Ücretli çağrı `AI_CALLS_ENABLED=false` varsayımıyla başlayacak; model, zaman aşımı, çıktı tokenı, en fazla iki yeniden deneme, oran ve eşzamanlılık ortamdan sınırlanacak.
- **Gerekçe:** Yanlış yapılandırmanın kontrolsüz maliyet veya kaynak tüketimi üretmemesi gerekir.
- **Sonuç:** Fiyatlar kodda tutulmaz; gerçek kullanım alanları varsa token raporu gösterilir. Gerçek entegrasyon testi ayrıca açık opt-in ister.

## D-047 — Yüklenen görselin sunucuda yeniden çözülmesi

- **Tarih:** 2026-11-09
- **Durum:** Kabul
- **Karar:** Frontend kontrolüne güvenilmeyecek; backend dosyayı Pillow ile yeniden çözecek, boyut/format/üst veri eşleşmesini denetleyip küçültülmüş, üst verisiz JPEG olarak sağlayıcıya iletecek.
- **Gerekçe:** MIME etiketi tek başına güvenlik ve bellek sınırı sağlamaz; uzak URL kabulü SSRF yüzeyi açar.
- **Sonuç:** Yalnız dosya yüklemesi vardır. 8 MB, 8.192 px ve 32 MP sınırı backend'de zorunludur.

## D-048 — 9Router'ın ayrı ve yerel sağlayıcı adapter'ı olması

- **Tarih:** 2026-11-10
- **Durum:** Kabul
- **Karar:** OpenAI adapter'ı korunacak; 9Router yalnız `http://127.0.0.1:20128/v1` köküne bağlanan ayrı bir `DesignProvider` adapter'ı olacak. Kullanıcının seçtiği sağlayıcı açıkça backend'e iletilecek ve sağlayıcılar arasında sessiz fallback yapılmayacak.
- **Gerekçe:** Gizli anahtarı tarayıcıdan uzak tutarken yerel ağ geçidini kullanmak, hata/maliyet davranışını kullanıcı seçimiyle sınırlandırmak ve mevcut OpenAI yolunu bozmamak gerekir.
- **Sonuç:** 9Router adapter'ı belgelenmiş `/v1/chat/completions` yolunu kullanır. Native Structured Outputs bütün model yollarında varsayılmadığından yanıt JSON olarak ayrıştırılıp Pydantic ile doğrulanır. Tam model kimliği `/v1/models` kataloğunda bulunmalı; metin uyumluluğu ve görsel uyumluluğu ayrı açık doğrulama bayraklarıyla yönetilmelidir. Yerel URL dışına yapılandırma ve HTTP yönlendirmesi yasaktır.

## D-049 — Frontend sağlık kontrolünün geliştirmede aynı-origin proxy kullanması

- **Tarih:** 2026-11-10
- **Durum:** Kabul
- **Karar:** `HttpAiDesignProvider` geliştirmede sabit mutlak backend adresi yerine aynı-origin `/api` yolunu kullanacak; Vite proxy bunu `127.0.0.1:8000` adresine yönlendirecek. `VITE_AI_API_BASE_URL` yalnız ayrı barındırma için açık override olacak.
- **Gerekçe:** Tarayıcıda proxy sağlık yolu çalışırken istemcinin farklı mutlak origin'e gitmesi CORS/ağ davranışını değiştiriyor ve geçerli `disabled` yanıtının yanlışlıkla erişim hatası görünmesine yol açıyordu.
- **Sonuç:** HTTP 200 + `status=ok` + `providerState=disabled`, backend erişilebilir ve AI çağrıları kapalı olarak ayrıştırılır. Ağ/sözleşme hatası ayrı kalır; güvenli konsol kaydı, manuel durum yenileme, seçili sağlayıcıya bağlı ana mesaj ve pasif düğme gerekçesi sunulur.

## D-050 — Enjekte edilen fetch bağımlılığının global bağlamını korumak

- **Tarih:** 2026-11-10
- **Durum:** Kabul
- **Karar:** `HttpAiDesignProvider`, varsayılan veya enjekte edilmiş `fetch` fonksiyonunu constructor sırasında `globalThis` bağlamına bağlayacak.
- **Gerekçe:** Yerleşik `Window.fetch`, sınıf alanından `this.fetcher(...)` olarak çağrıldığında alıcı nesnesi `Window` yerine sağlayıcı örneği olur ve bazı gerçek tarayıcılarda Web IDL `Illegal invocation` hatası üretir.
- **Sonuç:** Gerçek tarayıcı çağrısı doğru bağlamda çalışır; Vitest mock'ları ve bağımlılık enjeksiyonu aynı port üzerinden korunur. Sağlık hataları gizlenmez, normal HTTP/sözleşme akışında ayrıştırılır.

## D-051 — Sağlık kontrolünün effect kimliğinden ayrılmış tek-uçuş yaşam döngüsü

- **Tarih:** 2026-11-10
- **Durum:** Kabul
- **Karar:** Sağlık kontrolü yalnız dialog açılışında ve açık kullanıcı yenilemesinde başlatılacak; callback prop kimlikleri effect bağımlılığı olmayacak. Aynı anda tek istek, sıra kimliği, iptal sinyali ve 10 saniyelik zaman aşımı kullanılacak.
- **Gerekçe:** `App` tarafından her render'da oluşturulan `onPreview` callback'i sağlık effect'ini yeniden kuruyor; cleanup içindeki `onPreview([])` parent state'ini değiştirerek özellikle React StrictMode altında sonsuz `/api/health` döngüsü oluşturuyordu.
- **Sonuç:** Önizleme callback'i kararlı hale getirildi ve dialog içinde ref ile takip edildi. Sağlık başlangıcının mikro-göreve ertelenmesi StrictMode deneme mount'unda ağ isteğini önler. Kapanan/eskimiş sağlık yanıtı state'i değiştiremez; otomatik retry/polling yapılmaz ve loading başarı, hata veya zaman aşımında sonlanır.

## Açık kararlar

- Canlı modelle estetik kalite eşiği ve uzman kullanıcı değerlendirmesi gerçek ücretli test izni sonrasında ölçülecektir.
- Üretim dağıtımında kimlik doğrulama, kullanıcı kotası, HTTPS, merkezi denetim kaydı ve dağıtık oran sınırı Aşama 8 kapsamındadır.

