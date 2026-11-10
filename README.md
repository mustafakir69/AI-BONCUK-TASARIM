# AI Boncuk Tasarım

AI Boncuk Tasarım; nakış desinatörleri, boncuk/pul işleme atölyeleri, tekstil üreticileri ve moda tasarımcıları için gerçek malzemelerle üretilebilir boncuk yerleşimleri hazırlamayı amaçlayan profesyonel bir tasarım uygulamasıdır.

Temel ilke şudur: Sistem yalnızca güzel bir görüntü değil, gerçek fiziksel ölçülere ve doğrulanmış geometrik kurallara dayanan düzenlenebilir bir yerleşim planı üretir.

## Proje durumu

**Aşama 7B.4 — kontrollü sağlık isteği yaşam döngüsü tamamlandı.** FastAPI backend, OpenAI Responses API ile 9Router'ın yerel OpenAI-uyumlu Chat Completions yolunu ortak sağlayıcı sözleşmesi arkasında sunar. Frontend geliştirmede aynı-origin `/api` yolunu Vite proxy üzerinden kullanır; sağlık kontrolü pencere açılışında bir kez ve kullanıcı yenilediğinde çalışır. Backend erişimi, kapalı AI çağrısı ve sağlayıcı/model durumu birbirinden ayrı gösterilir. Kullanıcı sağlayıcıyı arayüzden seçer; sessiz sağlayıcı geçişi yapılmaz. AI çağrıları varsayılan olarak kapalıdır.

## Planlanan teknoloji seçimi

| Katman | Seçim | Gerekçe |
| --- | --- | --- |
| Web arayüzü | React + TypeScript + Vite | Bileşen tabanlı arayüz, sıkı veri tipleri ve hızlı/yalın geliştirme ortamı |
| Tuval | Konva.js + react-konva | Seçim, sürükleme, dönüşüm ve katmanlı 2B sahne yönetimini Canvas üzerinde kolaylaştırması |
| Stil | Modüler düz CSS | İlk sürümde tema bağımlılığı oluşturmadan küçük ve denetlenebilir bir stil katmanı sağlaması |
| Durum | React tabanlı uygulama durumu; ihtiyaç kanıtlanırsa hafif bir mağaza | Başlangıçta gereksiz bağımlılığı önleme; komut geçmişini alan mantığında tutma |
| Test | Vitest + Testing Library | Vite/TypeScript ile uyumlu hızlı birim ve bileşen testleri |
| API | Python + FastAPI + Pydantic | Gizli anahtarın yalnız sunucuda kalması, sıkı istek/çıktı şeması ve test edilebilir sağlayıcı uyarlayıcısı |
| AI sağlayıcısı | OpenAI Responses API veya yerel 9Router | OpenAI'de Structured Outputs; 9Router'da doğrulanmış JSON + Pydantic ile aynı sürümlü plan sözleşmesi |
| Kalıcı proje | Sürümlü JSON | Düzenlenebilir verinin taşınabilir, okunabilir ve doğrulanabilir olması |

Python/FastAPI yalnız Aşama 7B bulut AI akışı için gereklidir; manuel editör ve deterministik motif motoru backend kapalıyken çalışmayı sürdürür. Konva koordinatları ekran içindir; alan modelinin tek fiziksel birimi milimetredir.

## Klasör yapısı

```text
.
├── AGENTS.md
├── CHANGELOG.md
├── README.md
├── docs/
│   ├── AI-RULES.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── DESIGN-RULES.md
│   ├── MATERIALS.md
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   └── TASKS.md
├── frontend/
│   ├── src/
│   │   ├── app/             # Uygulama kabuğu ve bileşim
│   │   ├── domain/          # Veri modeli ve saf geometri
│   │   ├── features/        # Malzemeler, editör, dosyalar vb.
│   │   ├── infrastructure/  # Yerel saklama, tarayıcı dosya/Canvas uyarlayıcıları
│   │   └── shared/          # Ortak, alan bağımsız parçalar
│   └── tests/
└── backend/
    ├── app/                 # FastAPI, güvenlik, Pydantic sözleşmeleri ve OpenAI uyarlayıcısı
    ├── tests/               # API, sözleşme ve güvenlik testleri
    ├── requirements.txt
    └── requirements-dev.txt
```

Frontend ve backend ortak `contracts/` örneğiyle `AiDesignPlan 1.0` uyumluluğunu ayrı ayrı doğrular.

## Belgeler

- [Ürün kapsamı ve gereksinimler](docs/PROJECT.md)
- [Teknik mimari](docs/ARCHITECTURE.md)
- [Malzeme ve boncuk veri modeli](docs/MATERIALS.md)
- [Geometri ve yerleşim kuralları](docs/DESIGN-RULES.md)
- [Yapay zekâ tasarım kuralları](docs/AI-RULES.md)
- [Geliştirme yol haritası](docs/ROADMAP.md)
- [Aktif ve tamamlanan görevler](docs/TASKS.md)
- [Teknik karar kaydı](docs/DECISIONS.md)
- [Değişiklik geçmişi](CHANGELOG.md)

## Kurulum

Gereksinimler:

- Node.js 24 veya üzeri
- npm 11 veya uyumlu daha yeni sürüm
- Python 3.10 veya üzeri
- `uv` (önerilen) veya eşdeğer sanal ortam/paket yöneticisi

```powershell
cd frontend
npm ci
npm run dev
```

Vite geliştirme sunucusu varsayılan olarak `http://127.0.0.1:5173` adresinde açılır.

### Backend kurulumu (PowerShell)

```powershell
uv venv backend/.venv
uv pip install --python backend/.venv/Scripts/python.exe -r backend/requirements.lock
Copy-Item backend/.env.example backend/.env
backend/.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

`backend/.env` sürüm kontrolüne alınmaz. `OPENAI_API_KEY` ve `NINEROUTER_API_KEY` birbirinden ayrı ve yalnız backend ortamındadır; frontend için `VITE_` önekli bir anahtar yoktur. `AI_PROVIDER=openai|9router` varsayılan arayüz seçimini belirler; iki sağlayıcı da yapılandırılmışsa kullanıcı arayüzden seçim yapabilir. `AI_CALLS_ENABLED=false` varsayılanı bütün model çağrılarını kapalı tutar.

9Router kurulumu yalnız sabit yerel kökü kabul eder:

```powershell
$models = Invoke-RestMethod http://127.0.0.1:20128/v1/models
$models.data | Select-Object id, capabilities
```

`NINEROUTER_MODEL`, bu listeden alınan tam ve büyük/küçük harfe duyarlı kimlik olmalıdır; kod tahmini model adı üretmez. Metin uyumluluğu ayrı, kullanıcı onaylı canlı testle doğrulandıktan sonra `NINEROUTER_MODEL_COMPATIBILITY_VERIFIED=true` yapılabilir. Görsel alanı ancak model kataloğu vision desteği bildiriyor ve ayrıca `NINEROUTER_VISION_VERIFIED=true` ayarlanmışsa etkinleşir. 9Router modeli yine uzak/ücretli bir sağlayıcıya yönlendirebilir; bu yönlendirme ve hesap politikası 9Router panelinde kullanıcı tarafından ayrıca denetlenmelidir.

| 9Router özelliği | Bu entegrasyondaki durum |
| --- | --- |
| Erişim / model kataloğu | `GET /v1/models`; prompt üretmeden sağlık kontrolü |
| Metin | Belgelenmiş `POST /v1/chat/completions`; adapter hazır, canlı model testi açık opt-in |
| Responses API | Bu adapter tarafından kullanılmıyor; uyumluluğu canlı doğrulanmadı |
| Yapılandırılmış plan | Native şema varsayılmıyor; JSON metni + katı Pydantic doğrulama |
| Görsel | Katalog vision metadatası + ayrı canlı doğrulama bayrağı zorunlu |
| İptal | Frontend isteği iptal/geç yanıt koruması var; 9Router sağlayıcı-tarafı iptal semantiği canlı doğrulanmadı |
| Zaman aşımı | İstemci ve backend `asyncio.wait_for` sınırları etkin |
| Kullanım | Chat Completions `usage` token alanları varsa ortak rapora çevrilir |

Canlı opt-in testleri, yalnız açık onaydan sonra geçici süreç ortamında `RUN_NINEROUTER_INTEGRATION_TESTS=1`, `NINEROUTER_LIVE_TEST_APPROVED=YES` ve listeden alınmış `NINEROUTER_MODEL` ile çalıştırılır. Görsel testi ayrıca `RUN_NINEROUTER_VISION_TESTS=1` ister. Bu değişkenler örnek `.env` içinde etkin verilmez.

Frontend geliştirmede varsayılan olarak aynı-origin `/api` yolunu kullanır; Vite bunu `http://127.0.0.1:8000` FastAPI sunucusuna yönlendirir. Böylece tarayıcı doğrudan ayrı origin'e istek göndermez. Ayrı barındırma gerektiğinde güvenli API kökü `frontend/.env` içindeki `VITE_AI_API_BASE_URL` ile açıkça değiştirilebilir; geliştirmede bu değer boş bırakılır. Sağlık yanıtı HTTP 200 ve `status=ok` olduğunda `providerState=disabled`, bağlantı hatası değil “AI çağrıları sunucu ayarlarında kapalı” durumudur.

### Kalite ve üretim komutları

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Backend kalite kapıları:

```powershell
backend/.venv/Scripts/python.exe -m ruff check backend/app backend/tests
backend/.venv/Scripts/python.exe -m mypy backend/app backend/tests
backend/.venv/Scripts/python.exe -m pytest backend/tests
```

Üretim çıktısı `frontend/dist/` dizininde oluşturulur. `package-lock.json` sürüm kontrolüne alınır; bağımlılık kurulumu için tekrarlanabilir `npm ci` akışı kullanılır.

## Mevcut özellikler

- Modern ve responsive Türkçe uygulama kabuğu
- Sol tarafta eklenebilen, düzenlenebilen ve onayla silinebilen gerçek malzeme kütüphanesi
- Kare, dikdörtgen, daire ve delikli daire için mm oranlı önizleme, renk ve pul delik çapı doğrulaması
- Sürümlü LocalStorage kaydı, yenilemede geri yükleme ve bozuk kayıtlar için güvenli kurtarma
- Dünya koordinatında boncuk yerleştirme, yarı saydam aday önizlemesi, seçim, taşıma, döndürme ve silme
- SAT, daire/çokgen ve minimum aralık kurallarını uygulayan bağımsız geometri çekirdeği
- Sağ panelden X/Y/açı düzenleme, gerçek malzeme sayacı ve 100 adımlı geri al/yinele
- Konva tabanlı, her yöne kaydırılabilen açık gri sonsuz tasarım düzlemi
- Sabit yatay/dikey cetvel, görünür `(0,0)` orijini ve negatif koordinatlar
- Motif hedefi için milimetre/santimetre girişi; içeride yalnız milimetre saklama
- Motif ölçüsünden bağımsız ızgara, yakınlaştırma, uzaklaştırma, motifi ekrana sığdırma ve kaydırma
- İsteğe bağlı, düzlemi sınırlamayan hedef motif sınır kılavuzu
- Sağ tarafta motif ayarları, sıfırdan türetilmiş sayaç ve gelecek nesne özellikleri alanı
- Sürümlü JSON proje indirme/açma, atomik doğrulama ve yerel katalog kimlik çakışmalarında güvenli yeniden eşleme
- Kayıt anına göre çalışan değişiklik göstergesi; yeni proje ve proje açmada kaydedilmemiş değişiklik onayı
- Motif veya gerçek döndürülmüş yerleşim sınırından, 150/300/600 DPI ile PNG/JPEG dışa aktarma
- Şeffaf PNG, JPEG kalite/zemin seçenekleri, boyut/bellek koruması ve UTF-8 BOM'lu CSV malzeme raporu
- Shift/alan/Ctrl+A ile çoklu seçim; seçili sayısı ve grup birlikte seçim davranışı
- Tek undo/redo adımlı toplu taşıma, ortak merkezde döndürme, geometrik hizalama ve eşit dağıtma
- Ctrl+C/V/D, hassas ofset/tekrar çoğaltma, atomik çakışma kontrolü ve işlem limitleri
- JSON `1.1` içinde kalıcı gruplar ve klavye adımları; `1.0` projeleri için sıkı geriye uyumluluk
- Düz çizgi, halka, spiral, dalga, çiçek ve tekrarlı geometrik desen için deterministik yerel motif motoru
- Seçili katalog malzemeleri, göreli oran, yoğunluk, seed ve yatay/dikey/dört yönlü/radyal simetri ayarları
- Yaklaşık üretim tahmini, geçici çalışma alanı önizlemesi ve gerçek placement nesnelerinden türetilen rapor
- Mevcut tasarıma atomik ekleme veya kaydedilmemiş değişiklik onaylı değiştirme; tek undo/redo adımı
- 5.000 sonuç, 40.000 aday ve 1.000 ms üretim güvenlik sınırları
- Kategori zorunluluğu olmayan serbest metinli “Yapay Zekâ ile Tasarla” arayüzü ve örnek tarifler
- JPEG/PNG/WebP referans seçme, yerel küçük önizleme, değiştirme/kaldırma ve dosya güvenlik sınırları
- Kullanıcı seçimi, AI seçimi ve birlikte seçim malzeme yetki modları; katalog dışı kaydı reddetme
- Hedef mm ölçüsü, güvenlik/hedef aralığı, yoğunluk, simetri ve maksimum boncuk kısıtları
- Sağlayıcıdan bağımsız istek/plan/placement portları ve sürümlü yapılandırılmış plan doğrulaması
- AI placement önerisi için motif sınırı, gerçek katalog ölçüsü, çakışma ve minimum aralık güvenlik kapısı
- “AI bağlantısı henüz yapılandırılmadı” doğru durumu; harici çağrı, sahte sonuç veya sahte ilerleme yok
- Açık kullanıcı onayından sonra çalışan FastAPI/OpenAI Responses API bağlantısı; anahtar yalnız backend ortamında
- OpenAI veya yerel 9Router sağlayıcı seçimi; erişilebilirlik/model/uyumluluk durumunu dürüstçe gösteren arayüz ve sessiz fallback yasağı
- 9Router Chat Completions yanıtını JSON/Pydantic sözleşmesiyle doğrulayan, yalnız `127.0.0.1:20128` adresine bağlanan backend adapter'ı
- JPEG/PNG/WebP dosyasını sunucuda bağımsız yeniden çözümleme, 8 MB / 8.192 px / 32 MP sınırı ve güvenli yeniden kodlama
- Structured Outputs/Pydantic planı, plan–istek katalog yetkisi ve frontend/backend ortak sözleşme testi
- Çizgi, çoklu çizgi, kübik Bézier, elips/dikdörtgen kenar veya dolgu ve nokta kümesini düzenlenebilir placement nesnelerine dönüştüren yerel yorumlayıcı
- Desteklenmeyen özgün biçim ve geometrik yaklaştırmalar için açık rapor; kabul olmadan projeye yazmama
- İptal, istemci/sunucu zaman aşımı, geç yanıt koruması, yinelenen tıklama, oran ve eşzamanlılık sınırları
- Birim ve bileşen testleri, sıkı TypeScript, lint ve üretim derlemesi

## Aşama 7B.2 güvenlik ve çalıştırma notları

Backend yalnız dosya yüklemesi kabul eder; uzak görsel URL’si almadığı için SSRF yüzeyi açmaz. Görsel içindeki talimatlar sistem talimatı sayılmaz. OpenAI çağrısı `store=False` ile stateless yapılır. 9Router adresi yalnız `http://127.0.0.1:20128/v1` olabilir ve yönlendirmeler izlenmez. 9Router yanıtı yerel ağ geçidinden gelse bile güvenilmeyen JSON'dur; Pydantic ve mevcut geometri kapılarından geçer. Fiyat kod içine yazılmaz ve yalnız sağlayıcının gerçek token kullanımı varsa gösterilir.

Gerçek OpenAI ve 9Router model entegrasyon testleri varsayılan test takımında atlanır. Bu teslimde API anahtarı kullanılmamış, 9Router'a prompt/model çağrısı gönderilmemiş ve ücretli çağrı çalıştırılmamıştır. Daha önce sohbet, ekran görüntüsü veya sürüm geçmişinde açığa çıkmış bir anahtar varsa iptal edilip yenisi oluşturulmalıdır. Aşama 7C’ye geçilmemiştir.

