# AI Boncuk Tasarım — Çalışma Kuralları

## Değişmezler

- Tüm fiziksel ölçüleri uygulama içinde milimetre olarak sakla; piksel yalnızca görüntüleme içindir.
- Boncuk ölçülerini nesneden değil bağlı olduğu malzemeden oku.
- Geçersiz veya çakışan yerleşimi kalıcı duruma alma; motif sınır zorunluluğu etkinse hedef motif dışına taşmaya da izin verme.
- Sonsuz görünüm düzlemini hedef motif ölçülerinden ayır; pan/zoom fiziksel koordinatları değiştirmemeli.
- Malzeme adetlerini yerleştirilmiş nesnelerden hesapla; tahmin etme.
- Geometri çekirdeğini arayüzden ve yapay zekâdan bağımsız, saf ve test edilebilir tut.
- Kullanıcının seçmediği malzemeyi yapay zekâ çıktısına ekleme.

## Çalışma biçimi

1. Yalnızca kullanıcının onayladığı aşamada çalış.
2. Bir görevi küçük ve doğrulanabilir değişikliklere ayır.
3. Önemli teknik kararları [docs/DECISIONS.md](docs/DECISIONS.md) dosyasına ekle.
4. Başlayan ve tamamlanan işleri [docs/TASKS.md](docs/TASKS.md) üzerinde güncelle.
5. Davranış değiştiğinde ilgili belgeyi ve testleri aynı değişiklikte güncelle.
6. Çalışan özelliği gerekçe olmadan yeniden yazma ve gereksiz bağımlılık ekleme.

## Kalite kapıları

- TypeScript için sıkı tip denetimi kullanılmalı.
- Geometri kuralları birim testleriyle; kullanıcı akışları uygun entegrasyon testleriyle doğrulanmalı.
- Kaydet/aç işlemleri sürümlü şemayı doğrulamalı.
- Bir aşama ancak kabul ölçütleri karşılanıp test yöntemi belgelendiğinde tamamlanmış sayılır.

## Başvuru belgeleri

- Ürün kapsamı: [docs/PROJECT.md](docs/PROJECT.md)
- Teknik mimari: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Veri modelleri: [docs/MATERIALS.md](docs/MATERIALS.md)
- Geometri kuralları: [docs/DESIGN-RULES.md](docs/DESIGN-RULES.md)
- Yapay zekâ sınırları: [docs/AI-RULES.md](docs/AI-RULES.md)
- Yol haritası ve görevler: [docs/ROADMAP.md](docs/ROADMAP.md), [docs/TASKS.md](docs/TASKS.md)

