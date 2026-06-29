# AI Render Pipeline — Teknik Taslak

Bu belge gelecekte eklenecek online fotogerçekçi render akışının sağlayıcıdan bağımsız ilk sözleşmesini tanımlar. Mevcut prototipte backend, ağ çağrısı veya AI entegrasyonu bulunmaz.

## Akış özeti

1. Kullanıcı offline editörde fotoğrafı, hedef alanı ve ürün seçeneklerini hazırlar.
2. Uygulama orijinal fotoğraf çözünürlüğünde maske ve kaba önizleme üretir.
3. Kullanıcı **Gerçekçi Görsel Oluştur** eylemini açıkça başlatır.
4. Mobil uygulama render paketini backend/API proxy'ye gönderir.
5. Backend girdileri doğrular, prompt'u oluşturur ve seçilen görsel düzenleme sağlayıcısına sunucu tarafında çağrı yapar.
6. İş uzun sürerse backend bir job kimliği döndürür; mobil uygulama durum sorgular.
7. Tamamlanan görsel, seçim özeti ve üretim metadatası ayrı sonuç ekranında gösterilir.

## Inputlar

Bir render isteğinin minimum girdileri:

- `originalImage`: Kullanıcının seçtiği, yön bilgisi normalize edilmiş orijinal JPEG veya PNG
- `maskImage`: Düzenlenebilir alanı gösteren PNG maske
- `previewImage`: Offline editörün ürettiği kaba kompozit JPEG veya PNG
- `selection`: Renk, desen, kapak ve kulp tercihlerini içeren sürümlenmiş JSON
- `clientRequestId`: Tekrarlanan gönderimleri ayırt etmek için cihazda üretilen idempotency kimliği

Dosyalar ilk taslakta `multipart/form-data` ile gönderilebilir. Büyük dosya ve kuyruk ihtiyacı doğrulanırsa sonraki sürümde imzalı upload URL + asenkron render job modeline geçilebilir.

## Mask formatı

- Format: Kayıpsız PNG
- Boyut: `originalImage` ile birebir aynı piksel genişliği ve yüksekliği
- Renk uzayı: Tek kanallı gri tonlama veya eşdeğer RGB
- Düzenlenecek alan: Beyaz (`255`)
- Korunacak alan: Siyah (`0`)
- İlk sürüm kenarı: Sert sınır; backend gerekirse küçük ve kontrollü bir feather uygular
- Alpha kanalı: Zorunlu değildir ve maske anlamı için kullanılmaz

Mevcut canvas köşeleri ekran koordinatlarındadır. Maske üretilmeden önce fotoğrafın canvas içindeki `contain` dönüşümü tersine çevrilerek dört nokta orijinal piksel koordinatlarına taşınmalıdır. EXIF yönü normalize edildikten sonra maske ve orijinal görsel aynı koordinat sistemini kullanmalıdır.

İlk sürüm dörtgen maske kullanır. Daha sonra çokgen seçim veya fırça ile düzeltme eklense bile çıktı formatı aynı kalır.

## Preview image

`previewImage`, kullanıcının offline editörde gördüğü renk/desen/kulp yerleşiminin tutamaçlar, seçim çizgileri ve uygulama UI'ı olmadan alınmış kaba kompozitidir.

Tercih edilen özellikler:

- Orijinal fotoğrafla aynı aspect ratio
- Mümkünse orijinal çözünürlük; cihaz sınırında kontrollü downsample
- JPEG için yaklaşık `%90` kalite veya kayıpsız PNG
- Sadece hedef görünümü anlatan görsel; debug overlay içermemeli

Preview nihai çıktı değildir. AI modeline renk, yaklaşık yerleşim ve tasarım niyeti için ek görsel referans sağlar.

## Selection JSON

Önerilen ilk şema:

```json
{
  "schemaVersion": 1,
  "clientRequestId": "uuid",
  "source": {
    "width": 3024,
    "height": 4032,
    "orientationNormalized": true
  },
  "area": {
    "type": "quad",
    "pointsNormalized": [
      { "x": 0.18, "y": 0.24 },
      { "x": 0.76, "y": 0.22 },
      { "x": 0.79, "y": 0.71 },
      { "x": 0.16, "y": 0.73 }
    ]
  },
  "door": {
    "styleId": "flat",
    "colorId": "anthracite",
    "colorHex": "#42474A",
    "textureId": "matte"
  },
  "handle": {
    "modelId": "long-bar",
    "finishId": "matte-black",
    "placement": "vertical-right"
  },
  "locale": "tr-TR"
}
```

Kimlikler ekranda gösterilen Türkçe etiketlerden bağımsız, kararlı katalog kimlikleri olmalıdır. Backend prompt'u bu yapılandırılmış veriden üretmeli; mobil uygulamadan gelen serbest metni doğrudan sistem talimatı olarak kullanmamalıdır.

## Backend/proxy ihtiyacı

Mobil uygulama görsel model sağlayıcısını doğrudan çağırmayacaktır. Arada kontrol edilen bir backend/API proxy bulunmalıdır.

Proxy'nin sorumlulukları:

- Mobil isteğin kimliğini ve yetkisini doğrulamak
- Dosya türü, çözünürlük, boyut ve mask/orijinal eşleşmesini kontrol etmek
- `selection.json` verisini şemaya göre doğrulamak
- Sağlayıcıya uygun prompt ve istek formatını üretmek
- API anahtarı, model seçimi ve sağlayıcı detayını istemciden gizlemek
- Rate limit, kota, maliyet sınırı, idempotency, timeout ve retry uygulamak
- Render iş durumunu `queued`, `processing`, `succeeded` veya `failed` olarak yönetmek
- Sonucu kısa süreli güvenli URL veya yetkili indirme cevabı olarak sunmak
- Orijinal ve üretilen müşteri fotoğrafları için açık bir saklama/silme politikası uygulamak

Sağlayıcı değişikliği mobil API sözleşmesini bozmamalıdır. Mobil istemci yalnızca ürünün kendi render job sözleşmesini bilmelidir.

## Güvenlik notu: API key mobilde tutulmayacak

- Görsel servisinin API anahtarı kaynak koduna, `app.json` içine, public Expo environment değişkenine veya cihaz storage'ına yazılmayacaktır.
- Anahtar yalnızca backend'in secret yönetiminde tutulacaktır.
- Uygulama paketinden çıkarılabilecek hiçbir değer gizli kabul edilmeyecektir.
- Upload ve sonuç URL'leri kısa ömürlü ve yetkilendirilmiş olmalıdır.
- Loglarda müşteri fotoğrafı, erişim anahtarı veya tam kişisel veri tutulmamalıdır.
- Dosyalar zararlı içerik, beklenmeyen MIME türü ve aşırı boyuta karşı doğrulanmalıdır.

## Örnek prompt

Backend, yapılandırılmış seçimleri sağlayıcının görsel düzenleme formatına dönüştürürken aşağıdakine benzer bir talimat üretebilir:

> Yalnızca beyaz maskeyle belirtilen mevcut mutfak dolabı kapaklarını düzenle. Seçili alana düz, mat antrasit kapak yüzeyi ve sağ kenarda dikey mat siyah uzun bar kulp uygula. Orijinal fotoğrafın kamera açısını, dolap geometrisini, tezgâhı, duvarı, zemini ve maskenin dışındaki tüm alanları koru. Yeni dolap veya eşya ekleme. Malzemenin ışık, gölge, yansıma ve perspektifini mevcut ortamla doğal biçimde eşleştir. Fotogerçekçi bir müşteri sunum görseli üret.

Prompt'taki renk, desen ve kulp değerleri `selection.json` üzerinden backend tarafından oluşturulur. Preview image yerleşim referansı, mask ise düzenleme sınırı olarak kullanılır.

## Hata durumları

Mobil uygulama ve backend en az şu durumları ayırt etmelidir:

| Durum | Beklenen davranış |
|---|---|
| İnternet yok | Offline editör çalışmaya devam eder; render gönderimi bekletilir veya kullanıcıya tekrar deneme sunulur. |
| İstek zaman aşımı | Aynı `clientRequestId` ile iş durumu sorgulanır; kontrolsüz yeni iş oluşturulmaz. |
| Dosya çok büyük | İstemci kontrollü küçültme önerir veya backend açık boyut limiti hatası döndürür. |
| Desteklenmeyen dosya | Kullanıcıdan farklı fotoğraf seçmesi istenir; dosya sessizce dönüştürülmez. |
| Maske boyutu uyuşmuyor | İstek sağlayıcıya gitmeden doğrulama hatasıyla reddedilir. |
| Boş veya tamamen dolu maske | Kullanıcı alan seçimine geri yönlendirilir. |
| Geçersiz selection JSON | Şema sürümü ve hatalı alan adıyla açıklanabilir doğrulama hatası döndürülür. |
| Yetkisiz/kota dolu | Offline çalışma korunur; kullanıcıya yeniden giriş, kota veya plan mesajı gösterilir. |
| Sağlayıcı reddi/moderasyon | Güvenli, kullanıcıya uygun hata gösterilir; hassas sağlayıcı detayı açığa çıkarılmaz. |
| Sağlayıcı geçici hatası | Sınırlı exponential backoff uygulanır; sonsuz retry yapılmaz. |
| Sonuç seçimlerle uyuşmuyor | Kullanıcı sonucu reddedebilir ve yeniden üretim geri bildirimi verebilir. |
| Uygulama kapanıyor | Render job kimliği saklanır; uygulama açıldığında durum kaldığı yerden sorgulanır. |

AI sonucu hiçbir zaman offline projenin veya kullanıcının seçimlerinin üzerine sessizce yazılmamalıdır. Orijinal fotoğraf, kaba önizleme ve AI sonucu ayrı varlıklar olarak korunmalıdır.
