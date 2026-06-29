# Mobilyacı Sunum Prototipi

Mobilyacının galeriden seçtiği mekân fotoğrafı üzerine dört köşeden ayarlanabilen örnek bir kapak katmanı ekleyen, tamamen cihaz içinde çalışan Expo/React Native teknik prototipidir.

## Bu sürümde neler var?

- Expo SDK 56, React Native 0.85 ve strict TypeScript
- Skia Canvas içinde aspect ratio korunarak gösterilen galeri fotoğrafı
- Zustand store'da tutulan dört bağımsız köşe koordinatı
- 64×64 dokunma alanlı, Reanimated + Gesture Handler tabanlı köşe tutamaçları
- Beyaz, antrasit ve ceviz için blend-mode tabanlı örnek kapak dokusu
- Canvas snapshot'ını JPEG'e çevirip cihaz cache dizinine yazma
- Sistem paylaşım ekranını `expo-sharing` ile açma

Backend, auth, veritabanı, proje kaydı, AI, AR, 3D, PDF ve gerçek homografi/texture warp bu spike'ın kapsamı dışındadır.

## Strateji Güncellemesi: Hibrit Offline + AI Render

Android development build üzerinde yapılan ilk saha testi; fotoğraf seçme, Skia Canvas, dört köşe alan seçimi, renk değiştirme ve JPG export akışlarının çalıştığını doğruladı. Bununla birlikte Skia üzerindeki kapak katmanı gerçekçi bir nihai sunum yerine belirgin bir sticker/overlay etkisi üretiyor.

Bu gözlemden sonra ürünün hedef mimarisi hibrit olarak güncellendi:

- **Offline hızlı önizleme:** Fotoğraf seçme, dört köşe alan seçimi, renk/desen/kulp tercihleri, kaba önizleme ve JPG/PDF paylaşımı internet olmadan çalışacak.
- **Online AI gerçekçi render:** Kullanıcı isterse “Gerçekçi Görsel Oluştur” akışını başlatacak. Orijinal fotoğraf, seçili alan maskesi, kaba önizleme ve seçim verileri güvenli bir backend/API proxy üzerinden bir görsel düzenleme servisine gönderilecek.
- **Skia'nın yeni rolü:** Skia final fotogerçekçi render motoru değil; alan seçimi, hızlı geri bildirim, maske üretimi ve export hazırlama katmanı olacak.
- **Güvenlik sınırı:** Harici görsel servisinin API anahtarı mobil uygulamada tutulmayacak. Backend/proxy ve gerçek AI entegrasyonu sonraki fazda kurulacak.

Kararın gerekçeleri ve faz planı [PROJECT_DECISIONS.md](docs/PROJECT_DECISIONS.md), gelecekteki teknik veri akışı ise [AI_RENDER_PIPELINE.md](docs/AI_RENDER_PIPELINE.md) içinde tanımlanmıştır.

## AI render paketi debug üretimi

Faz 1 offline editörü, gelecekte backend/proxy'ye gönderilecek girdileri şimdilik yalnızca cihazın cache dizininde hazırlar. Herhangi bir backend, OpenAI API, Supabase, auth veya ağ isteği kullanılmaz.

Fotoğraf ve kapak seçildikten sonra ekranda **AI Paketi Hazırla** düğmesi görünür. Düğme aşağıdaki klasörü oluşturur:

```text
render-package-{timestamp}/
├── original.jpg
├── mask.png
├── preview.jpg
└── selection.json
```

Dosyaların görevleri:

- `original.jpg`: Galeriden seçilen fotoğrafın yönü ve ölçüleri doğrulanmış, yeniden kodlanmış JPEG kopyasıdır.
- `mask.png`: Orijinal fotoğrafla birebir aynı piksel boyutunda siyah-beyaz maskedir. Düzenlenecek dörtgen beyaz, korunacak alan siyahtır.
- `preview.jpg`: Orijinal çözünürlükte kaba kapak kompozitidir. Tutamaçlar, sarı seçim çizgisi, butonlar ve uygulama UI'ı içermez.
- `selection.json`: Şema sürümü, istek kimliği, kaynak ölçüleri, normalize/piksel alan noktaları ve stabil kapak-renk-desen-kulp kimliklerini içerir.

Başarılı üretimden sonra uygulama **“AI render paketi hazırlandı.”** mesajını ve dört debug paylaşım düğmesini gösterir:

- **Preview Paylaş** → `preview.jpg`
- **Maskeyi Paylaş** → `mask.png`
- **Selection JSON Paylaş** → `selection.json`
- **Orijinali Paylaş** → `original.jpg`

Her düğme yalnızca ilgili yerel dosyayı Android paylaşım ekranına gönderir. Fotoğraf, köşeler veya renk değiştirildiğinde eski paketin debug düğmeleri gizlenir ve yeni paket hazırlanması gerekir. Paket cache dizinindedir ve işletim sistemi tarafından daha sonra temizlenebilir.

### Debug paketini test etme

1. Development APK'yı açıp galeriden bir fotoğraf seçin.
2. **Kapak Ekle** düğmesine basın ve dört köşeyi fotoğraf üzerinde ayarlayın.
3. Bir renk seçin ve **AI Paketi Hazırla** düğmesine basın.
4. Başarı mesajında dört dosyanın oluşturulduğunu doğrulayın.
5. Dört debug paylaşım düğmesini sırayla kullanarak `preview.jpg`, `mask.png`, `selection.json` ve `original.jpg` dosyalarını inceleyin.
6. Preview görselinde handle, sarı çizgi veya UI bulunmadığını; maskenin siyah-beyaz olduğunu ve JSON dosyasının seçim verilerini içerdiğini doğrulayın.
7. Çok küçük veya kendi üzerine kesişen bir dörtgenle tekrar deneyin; paket üretimi Türkçe doğrulama hatası vermelidir.

Gerçek AI çağrısı, upload, job takibi ve sonuç ekranı bu fazda bilinçli olarak bulunmaz.

## Gereksinimler

- Node.js 22 LTS önerilir (Expo 56 için en az Node 20.19.4)
- npm
- Ücretsiz bir Expo hesabı
- EAS CLI
- APK'yı indirebilen bir Android telefon

> Windows'ta çok uzun proje yolları native paket kurulumlarını zorlayabilir. Sorun yaşanırsa projeyi daha kısa bir dizine taşıyın ve Node.js 22 LTS kullanın.

## Kurulum

```bash
npm install
npm run check
```

Expo'nun SDK ile eşleştirdiği native paket sürümlerini değiştirmek gerekirse doğrudan `npm install <paket>` yerine `npx expo install <paket>` kullanın.

## Android Studio olmadan EAS cloud development build

Bu proje Expo Go ile çalıştırılmaz. Android development client, EAS sunucularında doğrudan telefona kurulabilen APK olarak üretilir. Yerel Android SDK, Android Studio ve USB debugging gerekmez.

### 1. Bağımlılıkları ve EAS CLI'ı kurun

```bash
npm install
npm install -g eas-cli
```

### 2. Expo hesabına giriş yapın

```bash
eas login
```

### 3. Projeyi EAS'e bağlayın

```bash
eas build:configure
```

İlk çalıştırmada proje oluşturma veya mevcut bir Expo projesine bağlama sorusu gelirse hesabınız altında yeni proje oluşturmayı seçin. Bu işlem `app.json` içine EAS `projectId` değeri ekleyebilir; mevcut Android package ID `com.mobilyaci.sunumprototipi` olarak korunmalıdır.

### 4. Telefona kurulabilir development APK üretin

```bash
eas build --platform android --profile development
```

`development` profili `expo-dev-client` içerir, internal dağıtım kullanır ve Android çıktısını APK olarak üretir. Derleme EAS bulutunda yapılır.

### 5. APK'yı telefona kurun

1. Build tamamlandığında terminalde verilen EAS build bağlantısını açın veya Expo hesabınızın build sayfasına gidin.
2. Bağlantıyı Android telefonda açın ve **Install** / **Download** ile APK'yı indirin.
3. Android isterse APK'yı açtığınız tarayıcıya veya Dosyalar uygulamasına **Bilinmeyen uygulamaları yükleme** iznini yalnızca bu kurulum için verin.
4. APK'yı kurun ve **Mobilyacı Sunum** uygulamasını açın.

### 6. Metro geliştirme sunucusunu açın

Bilgisayar ve telefon aynı yerel ağdayken proje dizininde çalıştırın:

```bash
npm start
```

Telefondaki kurulu **Mobilyacı Sunum** development client'ını açın. Geliştirme sunucusu otomatik görünür; görünmezse terminaldeki QR kodunu development client içinden tarayın. Bu adımda Expo Go kullanılmaz.

## Statik ve bundle kontrolleri

```bash
npm run typecheck
npm run doctor
npm run bundle:android
npm run bundle:ios
```

Bundle çıktıları `dist/` altında üretilir ve Git'e dahil edilmez.

## Manuel kabul testi

1. Uygulamayı açın; fotoğraf yokken **Kapak Ekle**, renkler ve **Dışa Aktar** pasif olmalıdır.
2. **Fotoğraf Seç** ile galeriden yatay veya dikey bir fotoğraf seçin. Fotoğraf kırpılmadan canvas'a sığmalıdır.
3. **Kapak Ekle** düğmesine basın. Dört sarı/beyaz köşe tutamacı görünmelidir.
4. Her tutamacı ayrı ayrı sürükleyin. Dörtgen anlık güncellenmeli ve tutamaç fotoğraf alanının dışına çıkmamalıdır.
5. Beyaz, antrasit ve ceviz seçeneklerine dokunup kapak renginin değiştiğini doğrulayın.
6. **Dışa Aktar** düğmesine basın. Paylaşım ekranı açılmalı; oluşan JPEG fotoğrafı ve kapağı içermeli, tutamaçları veya uygulama kontrollerini içermemelidir.
7. Yeni bir fotoğraf seçin. Önceki kapak ve renk seçimi sıfırlanmalıdır.

Galeri iznini reddetme ve fotoğraf seçiciyi iptal etme akışlarında uygulama çökmemeli, Türkçe durum mesajı göstermelidir.

## Teknik notlar

- Canvas koordinatları `src/store/editorStore.ts` içindeki Zustand store'da tutulur. Ekran yönü veya canvas ölçüsü değiştiğinde noktalar fotoğraf alanına oransal olarak yeniden eşlenir.
- Tutamaçlar React Native overlay olarak canvas'ın üstündedir. Bu sayede büyük touch target kullanılır ve dışa aktarılan Skia snapshot'ına girmezler.
- `src/canvas/engine/homography.ts` gelecekteki projektif dönüşüm için kararlı bir saf TypeScript arayüzü bırakır ve bu sürümde bilinçli olarak `null` döndürür.
- JPEG geçici uygulama cache dizinine yazılır; galeriye kalıcı kayıt yapılmaz.
