# AI Boncuk Tasarım

AI Boncuk Tasarım; nakış desinatörleri, boncuk/pul işleme atölyeleri, tekstil üreticileri ve moda tasarımcıları için gerçek malzemelerle üretilebilir boncuk yerleşimleri hazırlamayı amaçlayan profesyonel bir tasarım uygulamasıdır.

Temel ilke şudur: Sistem yalnızca güzel bir görüntü değil, gerçek fiziksel ölçülere ve doğrulanmış geometrik kurallara dayanan düzenlenebilir bir yerleşim planı üretir.

## Proje durumu

**Aşama 0 — Planlama tamamlandı.** Henüz uygulama kodu veya kurulmuş bir paket yoktur. Aşama 1, kullanıcı onayı alındıktan sonra başlayacaktır.

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

Boş uygulama dizinleri Aşama 0'da yalnızca sınırları görünür kılmak için hazırlanmıştır.

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

Aşama 0 belge aşaması olduğu için kurulacak paket veya çalıştırılacak uygulama yoktur. Aşama 1'de kurulum ve geliştirme komutları bu bölümde belgelenecektir.

## Aşama 1'e geçiş

Aşama 1; Vite/React/TypeScript iskeleti, temel üç panelli Türkçe arayüz ve boş fakat fiziksel ölçülere bağlı çalışma alanını kapsar. Ayrıntılı kontrol listesi [docs/TASKS.md](docs/TASKS.md) içindedir ve başlamadan önce kullanıcı onayı gerekir.

