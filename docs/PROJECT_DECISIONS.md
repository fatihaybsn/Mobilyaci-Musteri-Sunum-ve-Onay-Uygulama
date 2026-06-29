# Proje Kararları

## İlk prototipte test edilenler

İlk teknik prototip Android EAS development build üzerinde gerçek cihazda test edildi. Aşağıdaki çekirdek akışların çalıştığı doğrulandı:

- Galeriden fotoğraf seçme ve fotoğrafı Skia Canvas içinde gösterme
- Dört bağımsız köşe tutamacıyla hedef alanı belirleme
- Köşe koordinatlarını Zustand store içinde yönetme
- Beyaz, antrasit ve ceviz renkleri arasında geçiş yapma
- Canvas görüntüsünü JPG olarak dışa aktarma ve Android paylaşım ekranını açma
- Expo Go veya yerel Android geliştirme ortamına ihtiyaç duymadan EAS development build kullanma

Bu test, mobil etkileşim modelinin ve offline teknik temelin uygulanabilir olduğunu gösterdi. Test fotogerçekçilik iddiasını doğrulamadı; görsel kalite ayrı bir ürün riski olarak ortaya çıktı.

## Gözlenen problem: sticker etkisi

Kapak katmanı fotoğraf üzerinde doğru alanı takip etse de ışık, gölge, malzeme davranışı, çevresel yansıma, perspektif ayrıntısı ve fotoğrafın mevcut dokusuyla yeterince bütünleşmiyor. Sonuç müşteriye “bu mutfak gerçekten böyle olabilir” hissi vermek yerine fotoğrafın üzerine eklenmiş bir sticker/overlay gibi görünüyor.

Gerçek homografi, daha kaliteli texture ve blend mode çalışmaları bu etkiyi azaltabilir; ancak tek başına fotogerçekçi sonuç garantilemez. Final sunum kalitesini yalnızca istemci tarafındaki 2D overlay motoruna bağlamak ürünün satış vaadi açısından yüksek risklidir.

## Yeni ürün kararı: hibrit sistem

Ürün iki tamamlayıcı çalışma moduna ayrılacaktır:

1. **Offline editör ve hızlı önizleme:** Her zaman erişilebilir, hızlı, deterministik ve saha bağlantısından bağımsızdır.
2. **Online AI gerçekçi render:** Kullanıcının açıkça başlattığı, daha uzun sürebilen ve gerçekçi müşteri sunumu üretmeyi hedefleyen isteğe bağlı bir işlemdir.

AI sonucu ayrı bir sonuç ekranında gösterilecek ve kullanılan renk, desen, kulp ile diğer seçimlerin özeti çıktıyla birlikte sunulacaktır. AI başarısız olduğunda offline düzenleme ve kaba önizleme kaybolmayacaktır.

## Offline editörün yeni rolü

Skia tabanlı editör korunacak; fakat final fotogerçekçi render motoru olarak konumlandırılmayacaktır. Yeni sorumlulukları şunlardır:

- Orijinal fotoğrafı ve düzenleme koordinat sistemini yönetmek
- Kullanıcının dört köşe veya ileride geliştirilecek çokgen seçimlerini toplamak
- Renk, desen ve kulp tercihlerini hızlı biçimde önizlemek
- Seçili alanı orijinal fotoğraf çözünürlüğüne eşleyerek maske üretmek
- AI isteğine girecek kaba kompozit önizlemeyi hazırlamak
- İnternet yokken JPG/PDF sunum ve paylaşım akışını sürdürmek
- AI isteği başarısız olduğunda kullanılabilir bir fallback sağlamak

Offline editörün öncelikleri gerçek zamanlı etkileşim, veri doğruluğu, anlaşılır UX ve güvenilir export olacaktır; fotogerçekçilik olmayacaktır.

## AI render pipeline'ın rolü

Online pipeline, offline editörün ürettiği yapılandırılmış girdileri kullanarak fotoğrafla görsel olarak bütünleşen bir sonuç üretmekten sorumlu olacaktır. Pipeline:

- Düzenlemeyi yalnızca maskelenmiş alana sınırlar.
- Orijinal mutfağın mimarisini, perspektifini ve maskenin dışındaki bölgeleri mümkün olduğunca korur.
- Seçilen renk, desen ve kulp bilgisini görsel talimata dönüştürür.
- Üretilen görseli seçim özeti ve iş durumu bilgisiyle mobil uygulamaya döndürür.
- Harici model sağlayıcısını mobil istemciden soyutlar; sağlayıcı daha sonra değiştirilebilir.

Teknik veri sözleşmesinin ilk taslağı [AI_RENDER_PIPELINE.md](AI_RENDER_PIPELINE.md) dosyasındadır.

## Neden sadece AI değil?

- Müşteri evinde internet kalitesi güvenilir değildir; çekirdek satış akışı ağ bağlantısına bağlı kalmamalıdır.
- AI üretimi gecikebilir, hata verebilir, maliyet oluşturabilir veya beklenmeyen görsel ayrıntılar üretebilir.
- Kullanıcının hangi alanı ve hangi ürünü seçtiğini deterministik olarak tanımlayacak bir editör yine gereklidir.
- Mobilyacı, AI sonucu beklerken müşteriye hızlı alternatifler gösterebilmelidir.
- Offline önizleme; maskeyi, seçim datasını ve AI için gerekli kontrol sinyallerini üretir.

## Neden sadece offline overlay değil?

- İlk cihaz testi, overlay yaklaşımının fotogerçekçi müşteri sunumu için yetersiz kaldığını gösterdi.
- Işık, gölge, malzeme, yansıma ve çevresel uyum yalnızca basit texture/blend işlemleriyle güvenilir şekilde çözülemiyor.
- Çok sayıda kapak/desen/kulp kombinasyonu için elle fotogerçekçi asset üretmek pahalı ve ölçeklenmesi zordur.
- Ürünün satış değeri yalnızca doğru alan seçimi değil, müşteriye ikna edici bir nihai görünüm sunabilmesidir.

Offline overlay yine değerlidir; ancak görevi hızlı karar desteği ve AI girdisi hazırlamaktır.

## Yeni faz planı

### Faz 1 — AI girdisi hazırlayan offline editör

- Canvas koordinatlarını orijinal fotoğraf piksel koordinatlarına dönüştürme
- Seçili alandan siyah-beyaz PNG maske üretme
- Kaba önizlemeyi tutamaçlar ve UI olmadan export etme
- Renk, desen ve kulp tercihleri için sürümlenmiş `selection.json` şeması tanımlama
- Orijinal fotoğraf + maske + preview + seçim JSON'unu tek bir render isteği paketi olarak hazırlama
- Ağ çağrısı yapmadan paketi cihazda incelemeye/test etmeye imkân verme

### Faz 2 — Backend/proxy sözleşmesi ve sahte servis

- Render işi oluşturma ve durum sorgulama API sözleşmesini tanımlama
- Mobil uygulamada “Gerçekçi Görsel Oluştur” ve ayrı sonuç ekranı akışını sahte cevaplarla test etme
- Kuyruk, idempotency, timeout, retry ve hata durumlarını netleştirme

### Faz 3 — Güvenli AI sağlayıcı entegrasyonu

- API anahtarını yalnızca sunucu tarafında saklayan backend/proxy kurma
- Görsel düzenleme sağlayıcısını proxy arkasında entegre etme
- Girdi doğrulama, oran sınırlama, maliyet kontrolü ve geçici dosya saklama politikası ekleme
- Prompt ve maske davranışını gerçek mutfak fotoğraflarıyla değerlendirme

### Faz 4 — Sonuç, özet ve paylaşım deneyimi

- AI sonucunu ayrı ekranda gösterme
- Seçim özetini görselin yanında ve export çıktısında sunma
- Orijinal, kaba önizleme ve AI sonucu arasında karşılaştırma
- AI sonucunu JPG/PDF olarak paylaşma ve offline fallback'e dönüş

### Faz 5 — Pilot ve kalite ölçümü

- Farklı ışık, açı, telefon ve mutfak tipleriyle pilot test
- Sonuç doğruluğu, bekleme süresi, maliyet ve kullanıcı güvenini ölçme
- Model sağlayıcısı ve prompt stratejisini ölçümlere göre güncelleme
