# AI Boncuk Tasarım

AI Boncuk Tasarım; nakış desinatörleri, boncuk/pul işleme atölyeleri, tekstil üreticileri ve moda tasarımcıları için gerçek malzemelerle üretilebilir boncuk yerleşimleri hazırlamayı amaçlayan profesyonel bir tasarım uygulamasıdır.

Temel ilke şudur: Sistem yalnızca güzel bir görüntü değil, gerçek fiziksel ölçülere ve doğrulanmış geometrik kurallara dayanan düzenlenebilir bir yerleşim planı üretir.

## Proje durumu

**Aşama 6 — Akıllı motif üretim motoru tamamlandı.** Uygulama; seçili gerçek malzemelerden seed tabanlı altı geometrik motif, beş simetri modu, projeyi değiştirmeyen önizleme, gerçek üretim raporu ve atomik uygulama sunmaktadır. Gerçek AI servisi veya backend eklenmemiştir; Aşama 7 için kullanıcı onayı beklenmektedir.

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

Python/FastAPI manuel editör ve deterministik Aşama 6 motoru için gerekli değildir; çalışma zamanına eklenmemiştir. Konva koordinatları ekran içindir; alan modelinin tek fiziksel birimi milimetredir.

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
    ├── app/                 # İleri aşama FastAPI uygulaması
    └── tests/
```

Frontend uygulaması bu katman sınırlarına göre kurulmuştur. Backend dizini Aşama 6'da da uygulama kodu içermez.

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
- Birim ve bileşen testleri, sıkı TypeScript, lint ve üretim derlemesi

## Aşama 7'ye geçiş

Aşama 7 referans görsel analizi kullanıcı onayı olmadan başlatılmayacaktır. Aşama 6 gerçek LLM, bulut AI sağlayıcısı, Python/FastAPI backend veya görsel analizi içermez.

