# AI Boncuk Tasarım

AI Boncuk Tasarım; nakış desinatörleri, boncuk/pul işleme atölyeleri, tekstil üreticileri ve moda tasarımcıları için gerçek malzemelerle üretilebilir boncuk yerleşimleri hazırlamayı amaçlayan profesyonel bir tasarım uygulamasıdır.

Temel ilke şudur: Sistem yalnızca güzel bir görüntü değil, gerçek fiziksel ölçülere ve doğrulanmış geometrik kurallara dayanan düzenlenebilir bir yerleşim planı üretir.

## Proje durumu

**Aşama 1 — Temel uygulama ve arayüz tamamlandı.** React/Vite uygulaması; Türkçe üç panelli arayüz, Konva tabanlı boş çalışma alanı, gerçek ölçü girişi, mm/cm dönüşümü, ızgara ve zoom/pan görünümüyle çalışmaktadır. Aşama 2 için kullanıcı onayı beklenmektedir.

## Planlanan teknoloji seçimi

| Katman | Seçim | Gerekçe |
| --- | --- | --- |
| Web arayüzü | React + TypeScript + Vite | Bileşen tabanlı arayüz, sıkı veri tipleri ve hızlı/yalın geliştirme ortamı |
| Tuval | Konva.js + react-konva | Seçim, sürükleme, dönüşüm ve katmanlı 2B sahne yönetimini Canvas üzerinde kolaylaştırması |
| Stil | Modüler düz CSS | İlk sürümde tema bağımlılığı oluşturmadan küçük ve denetlenebilir bir stil katmanı sağlaması |
| Durum | React tabanlı uygulama durumu; ihtiyaç kanıtlanırsa hafif bir mağaza | Başlangıçta gereksiz bağımlılığı önleme; komut geçmişini alan mantığında tutma |
| Test | Vitest + Testing Library | Vite/TypeScript ile uyumlu hızlı birim ve bileşen testleri |
| Gelecek API | Python + FastAPI | Görüntü işleme ve yapay zekâ ekosistemiyle uyumlu, açık şemalı API geliştirme |
| Kalıcı proje | Sürümlü JSON | Düzenlenebilir verinin taşınabilir, okunabilir ve doğrulanabilir olması |

Python/FastAPI ilk manuel editör için gerekli değildir ve Aşama 5'e kadar çalışma zamanına eklenmeyecektir. Konva koordinatları ekran içindir; alan modelinin tek fiziksel birimi milimetredir.

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
│   │   ├── infrastructure/  # Tarayıcı dosya/Canvas uyarlayıcıları
│   │   └── shared/          # Ortak, alan bağımsız parçalar
│   └── tests/
└── backend/
    ├── app/                 # İleri aşama FastAPI uygulaması
    └── tests/
```

Frontend uygulaması bu katman sınırlarına göre kurulmuştur. Backend dizini, Aşama 5'e kadar uygulama kodu içermez.

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

```powershell
cd frontend
npm ci
npm run dev
```

Vite geliştirme sunucusu varsayılan olarak `http://127.0.0.1:5173` adresinde açılır.

### Kalite ve üretim komutları

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Üretim çıktısı `frontend/dist/` dizininde oluşturulur. `package-lock.json` sürüm kontrolüne alınır; bağımlılık kurulumu için tekrarlanabilir `npm ci` akışı kullanılır.

## Mevcut özellikler

- Modern ve responsive Türkçe uygulama kabuğu
- Sol tarafta Aşama 2 durumu açıkça belirtilen örnek malzeme kütüphanesi
- Konva tabanlı, fiziksel en-boy oranını koruyan boş çalışma alanı
- Milimetre/santimetre girişi; içeride yalnız milimetre saklama
- Görünüm ızgarası, yakınlaştırma, uzaklaştırma, ekrana sığdırma ve kaydırma
- Sağ tarafta çalışma alanı ayarları, sıfırdan türetilmiş sayaç ve gelecek nesne özellikleri alanı
- Aşama 3/4 işlemleri için açıkça devre dışı bırakılmış araçlar
- Birim ve bileşen testleri, sıkı TypeScript, lint ve üretim derlemesi

## Aşama 2'ye geçiş

Aşama 2; gerçek malzeme veri modeli, başlangıç kataloğu ve malzeme ekleme/düzenleme/silme akışlarını kapsar. Ayrıntılar [docs/ROADMAP.md](docs/ROADMAP.md) içindedir ve başlamadan önce kullanıcı onayı gerekir.

