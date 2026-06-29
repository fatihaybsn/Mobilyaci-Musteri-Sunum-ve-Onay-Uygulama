# Mobilyacı Sunum Uygulaması — Teknoloji Mimarisi Kararı

*Senior mobile architect / grafik-rendering uzmanı / MVP teknik danışmanı bakış açısıyla hazırlanmıştır.*
*Son güncelleme: Haziran 2026 — güncel teknoloji verileri ve pazar araştırmasıyla revize edildi.*

---

## 1. Tek Cümlelik Teknik Karar

Bu projeyi şu teknoloji kombinasyonuyla geliştirmelisin: **Expo (React Native + TypeScript, New Architecture — RN 0.82'den itibaren zorunlu) üzerine kurulu, merkezinde @shopify/react-native-skia canvas motoru olan; react-native-gesture-handler + react-native-reanimated ile sürüklenen 4 köşeden homografi (corner-pin) dönüşümüyle texture'ları fotoğrafa "yapıştıran"; Zustand + MMKV + expo-file-system ile tamamen offline çalışan; backend'i (Supabase) ilk teknik prototipe değil, ilk gerçek pilot sürüme eklenen sade bir mimari.**

AR, 3D engine ve native-heavy çözümler bilinçli olarak dışarıda bırakılmıştır — gerekçeleri aşağıda.

---

## 2. Önerilen Temel Teknoloji Yığını

| Alan | Teknoloji |
|---|---|
| Mobil framework | React Native (Expo, Continuous Native Generation / dev client) |
| Dil | TypeScript (strict mode) |
| Grafik/canvas/rendering | @shopify/react-native-skia |
| Gesture / drag-resize / transform | react-native-gesture-handler + react-native-reanimated |
| State management | Zustand |
| Navigasyon/routing | Expo Router (v56+, dosya tabanlı routing) |
| Local/offline data storage | react-native-mmkv (ayar/küçük state) + expo-file-system (proje JSON + fotoğraflar) |
| Backend | Supabase (Postgres + Auth + Storage) — **MVP v0'da yok, pilot sürümde eklenir** |
| Auth | Supabase Auth (telefon OTP) — pilot sürümde |
| File/image storage | Yerelde expo-file-system; bulutta (v1) Supabase Storage |
| Image/PDF export | Skia `makeImageSnapshot()` → JPEG; expo-print (HTML→PDF) + expo-sharing |
| Asset pipeline | MVP'de bundled (uygulama içine gömülü) PNG/texture + catalog.json; v1.1'de Supabase Storage üzerinden uzaktan güncellenebilir katalog |
| Analytics/crash reporting | Sentry (crash, MVP'de zorunlu) + PostHog (kullanım analitiği, sonraya bırakılabilir) |
| Deployment/build | EAS Build + EAS Update (OTA) + EAS Submit |

---

## 3. Her Teknoloji İçin Neden Seçildi?

**Mobil framework — React Native (Expo / CNG):** Tek kod tabanıyla Android+iOS'a aynı anda hizmet eder; Expo'nun build/OTA-update altyapısı MVP iterasyon hızını native geliştirmeye göre kat kat artırır. Alternatifler Flutter ve ayrı Swift/Kotlin kod tabanlarıdır. Flutter teknik olarak yeterlidir ama RN+Skia kombinasyonunun bu tür "fotoğraf üstü canvas" uygulamalarında daha geniş örnek/kütüphane/işe alım havuzu vardır; native ayrı kod tabanları ise MVP hızı hedefiyle doğrudan çelişir (iki kat işçilik). MVP için gerekli: evet, gün 1'den.

**Dil — TypeScript:** Modül/özellik şemaları (kapak türü, kulp modeli, renk) gibi yapılandırılmış veri modelleri için statik tipleme hata oranını düşürür, ekip büyüdükçe bakım kolaylaştırır. Alternatif JavaScript'tir; tip güvenliği olmadan canvas/transform matematiğinde sessiz hatalar üretme riski yüksektir, bu yüzden seçilmez. MVP için gerekli: evet.

**Grafik/canvas/rendering katmanı — @shopify/react-native-skia:** Bu projenin kalbi budur. Fotoğraf üstü katman, maske, blend mode (multiply/hard-light ile dokuyu koruyarak renk değiştirme), color filter (color matrix) ve quad-warp (4 köşeye oturtma) gibi işlemlerin **hepsini tek bir GPU-hızlandırmalı canvas üzerinde** gerçek zamanlı, 60fps hedefiyle yapabilen tek pratik React Native çözümüdür. Skia v2.6.4 (Mayıs 2026), React Native New Architecture (Fabric/JSI) üzerine kuruludur; RN 0.82'den beri bu mimari zorunludur. Expo SDK 56 ile tam uyumludur, entegrasyon riski düşüktür. Alternatifler: düz `<Image>` + Reanimated transform (sadece affine dönüşüm yapabilir, gerçek perspektif/quad-warp yapamaz — bu proje için yetersiz), react-native-svg (vektör odaklı, piksel blend/texture işlemlerinde zayıf), WebView+Canvas2D (performans ve native entegrasyon açısından dezavantajlı). MVP için gerekli: evet, mimarinin merkezi.

**Gesture/drag-resize/transform yönetimi — react-native-gesture-handler (v3+) + react-native-reanimated (v4+, yalnızca New Architecture):** Köşe handle'larının sürüklenmesi, modül taşıma/boyutlandırma gibi etkileşimlerin JS thread'i bloklamadan, UI thread'de (worklet) 60fps çalışmasını sağlar — kalın parmaklı kullanıcı senaryosunda akıcılık kritik. Skia ile birlikte en olgun, en çok belgelenmiş kombinasyondur. Alternatif olan çıplak React Native `PanResponder` API'si daha düşük seviyeli, daha kırılgan ve JS-thread bağımlıdır; tercih edilmez. MVP için gerekli: evet.

**State management — Zustand:** Canvas üzerindeki modül listesi, seçili modül, özellik değerleri gibi sık güncellenen state için minimal boilerplate ile yüksek performans sunar; gereksiz re-render'ları önler. Alternatifler Redux Toolkit (bu proje ölçeği için fazla yapı/boilerplate getirir) ve sade React Context (canvas gibi yüksek frekanslı güncellemelerde performans sorunu yaratır). MVP için gerekli: evet.

**Local/offline data storage — react-native-mmkv + expo-file-system:** MMKV v4.3+ (MIT lisanslı, Nitro Modules üzerine kurulu, AsyncStorage'a göre ~30x hızlı; **DİKKAT:** v4'te başlatma API'si değişti — artık createMMKV() kullanılır, eski new MMKV() çalışmaz; Nitro Modules versiyon uyumsuzlukları crash riski taşır, versiyonlar hizalı tutulmalı) ayarlar ve küçük state için; her "proje" (müşteri ziyareti) ise bir JSON dosyası + ilişkili fotoğraflar olarak expo-file-system ile diskte tutulur. Bu, saha kullanımında internet olmadan tam fonksiyonelliği garantiler. Alternatif AsyncStorage (yavaş, büyük veri için uygun değil) ve SQLite/WatermelonDB (MVP'deki sınırlı proje/modül sayısı için gereksiz şema karmaşıklığı getirir, ancak çoklu proje sorgulama ihtiyacı büyürse v1.1'de SQLite'a geçiş makul bir yol haritası adımıdır). MVP için gerekli: evet.

**Backend — Supabase (Postgres + Auth + Storage):** Abonelik/SaaS modeli, kullanıcı doğrulama ve ileride katalog asset'lerinin uzaktan güncellenmesi için gereklidir; ancak temel "fotoğraf çek → düzenle → paylaş" akışı backend'e ihtiyaç duymaz. Supabase'in ilişkisel veri modeli (mobilyacı, proje, katalog öğesi) bu projenin yapısına Firebase'in NoSQL modelinden biraz daha iyi oturur; Firebase de teknik olarak geçerli bir alternatiftir, ekip aşinalığı varsa tercih edilebilir. Kendi backend'ini sıfırdan yazmak (Node/Express + ayrı DB) MVP hızı ve kırılganlık açısından gereksiz risktir. **⚠️ ÖNEMLİ: Supabase'in Haziran 2026 itibarıyla native offline persistence/sync desteği yoktur.** Bu uygulama offline-first olduğundan, backend eklendiğinde sync stratejisi belirlenmelidir: (a) Supabase + manuel sync mantığı, (b) Supabase + PowerSync entegrasyonu, veya (c) built-in offline desteği olan Firebase Firestore (NoSQL dezavantajıyla). Bu karar pilota kadar ertelenebilir ama farkındalık şimdiden olmalı. MVP için gerekli: **hayır, ilk teknik prototipte yok**; pilot/lansman sürümünde eklenir.

**Auth — Supabase Auth (telefon OTP):** Hedef kullanıcı kitlesi (esnaf/marangoz) e-posta yerine telefon numarasıyla daha doğal etkileşir; OTP akışı şifre yönetimi yükünü ortadan kaldırır. Alternatif e-posta/şifre akışı bu kullanıcı profili için sürtünme yaratır. MVP için gerekli: hayır, pilot sürümde.

**File/image storage — expo-file-system (yerel) + Supabase Storage (bulut, v1):** Çekilen fotoğraflar ve üretilen çıktılar öncelikle cihazda tutulur (offline-first); bulut yedekleme/çoklu cihaz senkronizasyonu gerçek bir ihtiyaç haline geldiğinde Supabase Storage eklenir. MVP için gerekli: yerel kısım evet, bulut kısmı hayır.

**Image/PDF export — Skia snapshot + expo-print + expo-sharing:** Canvas'ın son hali `makeImageSnapshot()` ile JPEG'e dönüştürülür; PDF gerekiyorsa bu JPEG, expo-print'in HTML→PDF dönüştürücüsüne (basit bir HTML şablonu + base64 görsel + seçim özeti metni) verilir — ek native bağımlılık gerektirmeden, Expo ekibi tarafından resmi olarak sürdürülen, olgun bir yoldur. Son adımda expo-sharing ile WhatsApp/e-posta paylaşım sheet'i açılır. Alternatif olan ayrı native PDF kütüphaneleri (örn. react-native-pdf-lib) daha fazla native bağımlılık ve kırılganlık getirir; tercih edilmez. MVP için gerekli: JPEG export evet (zorunlu), PDF export "olsa iyi olur" seviyesinde, ilk prototipte JPEG yeterlidir.

**Asset pipeline — bundled assets + catalog.json (MVP), Supabase Storage + remote manifest (v1.1):** İlk sürümde tüm kapak/kulp/renk/texture görselleri uygulama içine gömülür; bu, backend bağımlılığı olmadan hızlı MVP'ye imkân tanır. Katalog büyüdükçe/sık güncellendikçe, uygulama mağazası onayı beklemeden yeni ürün eklemek için uzaktan yüklenen bir manifest + CDN modeline geçilir. MVP için gerekli: bundled yaklaşım evet; remote katalog hayır, sonraya bırakılır.

**Analytics/crash reporting — Sentry (+ PostHog opsiyonel):** Sahada çalışan bir uygulamada çökme/hata görünürlüğü olmadan kör uçuş yapılır; Sentry'nin React Native SDK'sı olgun ve düşük entegrasyon riskine sahiptir. Kullanım analitiği (PostHog/Amplitude) ürün kararları için değerlidir ama hayatta kalma için şart değildir. MVP için gerekli: Sentry evet, PostHog sonraya bırakılabilir.

**Deployment/build sistemi — EAS Build + EAS Update + EAS Submit:** Mac olmadan iOS build alabilme, JS/asset düzeltmelerini mağaza incelemesi beklemeden OTA göndermek (saha hatalarını hızlı kapatmak için kritik) ve store gönderimini otomatikleştirmek MVP hızını doğrudan besler. Alternatif olan manuel Xcode/Android Studio build süreci ekip/altyapı yükünü artırır. MVP için gerekli: evet.

---

## 4. En Kritik Teknik Kararlar

**React Native mi, Flutter mı, native mi?** React Native + Skia. Flutter de teknik olarak yeterlidir (o da Skia/Impeller tabanlıdır, CustomPainter ile benzer güç sunar) ve gerçek bir alternatif olarak göz ardı edilmemeli; ancak bu projeye en yakın emsal uygulamalar (foto-üstü filtre/konfigüratör tipi tüketici uygulamaları) RN+Skia ekosisteminde daha yoğun biçimde belgelenmiş durumda, bu da MVP hızını ve işe alım/danışmanlık bulma kolaylığını artırıyor. Ayrı Swift/Kotlin kod tabanları MVP hedefiyle doğrudan çelişiyor; bu proje native'in sunduğu mutlak performans tavanına ihtiyaç duymuyor.

**Expo mu, bare React Native mi?** Expo — ama "yalnızca JS, native kod yasak" anlamındaki klasik yönetilen iş akışı değil, **Continuous Native Generation (prebuild) + dev client** modeliyle. Bu, gerekirse özel native modül eklemeye izin verirken Expo'nun build/update/asset tooling'ini korur. Expo SDK 56 (Mayıs 2026; React Native 0.85, React 19.2) itibarıyla react-native-skia, reanimated v4, gesture-handler v3, mmkv v4, file-system, sharing, print gibi bu proje için gereken tüm kütüphaneler Expo uyumlu; "bare RN'e geçmek" için teknik bir zorunluluk yok, sadece gereksiz bakım yükü eklenmiş olur.

**React Native Skia kullanılmalı mı?** Evet, kesinlikle, ve mimarinin merkezinde olmalı. Skia'sız bir mimaride (sadece View/Image/Animated katmanlarıyla) gerçek perspektif/quad-warp ve piksel-doğru blend mode/color filter işlemleri ya imkânsız ya da çok kırılgan hack'lerle yapılabilir hale gelir.

**4 köşe perspektif transform için yaklaşım:** Burada teknik olarak doğru terim "perspektif" değil, **homografi / corner-pin (köşe-sabitleme) dönüşümü**dür — video kompozitingdeki "Corner Pin Effect"in matematiğiyle aynıdır. Yaklaşım: birim kareden ((0,0)-(1,0)-(1,1)-(0,1)) kullanıcının sürüklediği 4 noktaya kapalı-formlu bir projektif (3×3) matris hesaplanır; bu matris, Skia'nın texture'ı çizerken kullandığı local matrix olarak uygulanır. Hesaplama, react-native-reanimated worklet'i içinde her gesture frame'inde çalıştırılacak kadar hafiftir; bu sayede gerçek 3D motor veya AR olmadan, "duvara yapışmış kapak" hissi piksel-doğru biçimde üretilir.

**⚠️ Kritik Not — Hazır Kütüphane Yok:** Haziran 2026 itibarıyla bu corner-pin dönüşümü için hazır bir NPM paketi veya Skia helper kütüphanesi bulunmamaktadır. İki implementasyon yolu mevcuttur:
- **(a) Custom SkSL Shader (önerilen):** Skia.RuntimeEffect ile özel bir homografi shader'ı yazılır; 4 köşe koordinatı uniform olarak geçirilir, shader texture koordinatlarını hedef dörtgene map eder. GPU-hızlandırmalı ve performanslı.
- **(b) Manuel 3×3 matris:** Kaynak dikdörtgenden hedef dörtgene projektif matrisi hesaplayıp Skia'nın concat/Matrix4 API'siyle uygulamak. Daha basit ama standart Matrix4 bağımsız köşe sabitlemeyi tam desteklemeyebilir.

Bu projenin **en zorlu teknik parçasıdır** ve ilk 2 haftalık spike'ta her iki yaklaşım da denenmelidir.

**Texture blend ve color filter nasıl yönetilmeli?** Texture'lar (ahşap/lake/membran) gri tonlamalı ışık-gölge bilgisi içerecek şekilde tasarımcı tarafından üretilmeli; kullanıcı bir renk seçtiğinde bu renk, Skia'nın `multiply` veya `hard-light` blend mode'u ile texture üzerine bindirilerek doku/gölge detayı korunarak yeniden renklendirilir. İnce ton/doygunluk ayarları için Skia ColorMatrix filtreleri kullanılır. Desenli kapaklar (oluklu, karelaj vb.) için texture, `TileMode` ile tekrarlanır ve aynı corner-pin matrisiyle ana panelle birlikte warp edilir.

**Export pipeline nasıl kurulmalı?** Canvas → `makeImageSnapshot()` → JPEG byte'ları → expo-file-system ile cihaza yaz → (PDF isteniyorsa) expo-print ile basit bir HTML şablonuna göm → expo-sharing ile WhatsApp/e-posta paylaşım sheet'i aç. Bu zincirin tamamı ek native bağımlılık gerektirmez, Expo ekosistemiyle tam uyumludur.

**Backend ilk sürümde şart mı?** Hayır. Çekirdek değer önerisi (saha onayı) tamamen cihaz-içi çalışabilir. Backend, abonelik/lisans doğrulaması ve katalog dağıtımı gerçek bir operasyonel ihtiyaç haline geldiğinde (pilot sonrası ilk ücretli lansman) eklenmelidir.

**Offline-first gerekli mi?** Evet, zorunlu. Müşteri evinde zayıf/yok wifi senaryosu istisna değil, normal kullanım koşuludur. Yalnızca abonelik doğrulama ve (varsa) bulut yedekleme "iyi internet varsa senkronize ol, yoksa sessizce bekle" mantığıyla çalışmalı; çekirdek foto-düzenle-paylaş akışı asla ağ bağımlı olmamalı.

**AI/segmentation ilk sürüme girmeli mi?** Hayır. Belgenin kendisinde de belirtildiği gibi, manuel "sticker model" (Renoworks Pro emsali) zaten kanıtlanmış bir ikna gücüne sahip. Otomatik yüzey/duvar segmentasyonu önemli karmaşıklık, model boyutu ve düşük ışıkta hatalı tahmin riski getirir — bu da güven inşa etmesi gereken bir saha aracında güveni zedeler. Bu, ancak manuel akış pilotla doğrulandıktan sonra, "yerleştirmeyi öner ama kullanıcı her zaman elle düzeltebilsin" şeklinde bir 2. faz iyileştirmesi olarak değerlendirilmeli.

---

## 5. MVP'de Kesin Kullanılacaklar

Expo SDK 56+ (React Native 0.85+, TypeScript, New Architecture/CNG), @shopify/react-native-skia (v2.6+), react-native-gesture-handler (v3+), react-native-reanimated (v4+), Expo Router (v56+), Zustand, react-native-mmkv (v4+), expo-file-system, expo-image-picker, expo-print, expo-sharing, Sentry, EAS Build/Update.

---

## 6. MVP'de Kesin Kaçınılacaklar

**Backend/veritabanı (Supabase/Firebase dahil):** Çekirdek akış ihtiyaç duymuyor; erken eklemek gereksiz altyapı/operasyon yükü ve internet bağımlılığı riski getirir.

**Auth/abonelik sistemi:** Pilot aşamasında "seçili mobilyacılara ücretsiz" deniyor zaten; doğrulama mekanizması olmadan da pilot çalıştırılabilir.

**AI tabanlı segmentasyon/otomatik yerleştirme:** Yukarıda açıklandığı gibi karmaşıklık/güven riski MVP'nin kanıtlamaya çalıştığı temel hipotezle orantısız.

**AR / kamera üstü canlı yansıtma:** Belgenin kendi stratejisiyle de çelişir; "dürüst sticker modeli" yeterli kanıtlanmış yaklaşımdır.

**3D engine (Unity/Unreal) veya custom native render motoru:** Bu iş 2D katmanlı kompozisyon işidir; 3D motor kurmak yanlış araç-iş eşleşmesidir, build/store onay/kırılganlık riskini gereksiz yere artırır.

**Redux/Redux Toolkit, SQLite/WatermelonDB, çoklu state/DB kütüphanesi:** Bu ölçekteki MVP state ve veri hacmi için aşırı mühendisliktir; Zustand + MMKV/dosya yeterlidir.

**Native ayrı iOS/Android kod tabanları:** MVP hızı hedefiyle doğrudan çelişir.

---

## 7. Risk Tablosu

| Teknoloji/Karar | Risk | Risk Seviyesi | Neden Riskli? | Nasıl Azaltılır? |
|---|---|---|---|---|
| 4 köşe homografi (corner-pin) UX'i | Kalın parmaklı kullanıcı handle'ları doğru sürükleyemeyebilir | Orta | Küçük dokunma hedefleri sahada kullanılabilirliği düşürür | Büyük touch-target'lı handle tasarımı + erken esnaf kullanıcı testi |
| Düşük/orta segment Android cihazlarda Skia performansı | Esnaf bütçe telefon kullanıyor olabilir, hedeflenen 60fps tutmayabilir | Orta | GPU/RAM kısıtlı cihazlarda canvas re-render maliyeti artar | İlk 2 haftada gerçek orta-alt segment cihazda perf testi; gerekirse handle sürüklerken çözünürlük düşürme (downsample) stratejisi |
| Asset/tasarım üretimi yazılımla paralel ilerlemiyor | Kod bitse de gerçekçi texture/kulp görselleri hazır olmazsa MVP test edilemez | Yüksek | Bu bir tasarımcı/CGI kaynak ve zamanlama riski, teknik değil | Tasarım üretimini gün 1'de başlatmak, minimum uygulanabilir katalog (3-5 kapak, 3-5 kulp, 10 renk) ile başlamak |
| Abonelik doğrulamasının offline saha kullanımıyla çakışması | İnternet yoksa lisans/abonelik kontrolü nasıl yapılacağı net değil | Orta | Saha kullanımı esasen düşük/yok bağlantı senaryosu | Cache'lenmiş token ile "X gün offline grace period" mantığı; pilotta tamamen es geçilebilir |
| Ekibin Skia/matris aşinalığı + hazır kütüphane yokluğu | Corner-pin için hazır NPM paketi yok; custom SkSL shader veya matris kodu gerekiyor; blend mode/shader kavramları RN'in tipik UI işlerinden farklı | **Orta-Yüksek** | Öğrenme eğrisi + sıfırdan implementasyon prototip süresini uzatabilir | İlk 2 hafta izole teknik spike; SkSL shader ve manuel matris yaklaşımlarını paralel dene (bkz. Bölüm 15) |
| WhatsApp paylaşım entegrasyonu platform farkları | iOS/Android paylaşım sheet davranışı ve dosya boyutu/format kısıtları farklılaşabilir | Düşük | expo-sharing katman soyutlasa da uç davranışlar platforma göre değişir | Her iki platformda erken manuel test |
| Bundled asset boyutunun büyümesi | Katalog büyüdükçe uygulama indirme boyutu şişer | Düşük (MVP'de) | Çok sayıda yüksek çözünürlüklü texture uygulama paketini büyütür | v1.1'de remote katalog/CDN'e geçiş yol haritası |
| Supabase offline sync eksikliği | Supabase'in native offline persistence/sync desteği yok (Haziran 2026) | Orta | Backend eklendiğinde offline-first mimariye sync entegrasyonu gerekecek | PowerSync entegrasyonu veya manuel sync; alternatif olarak Firebase Firestore değerlendirilmeli |
| AI tabanlı rakiplerin hızlı gelişimi | Remodel AI, Cabinet AI gibi araçlar saniyeler içinde dolap stili değiştirebiliyor | Düşük-Orta | Hız avantajı AI'da, ürün doğruluğu avantajı bizde — ama fark kapanabilir | v2'de AI'ı yardımcı olarak entegre et; "kendi ürününü göster" avantajını koru |

---

## 8. Alternatif Teknoloji Karşılaştırması

| Yaklaşım | Performans | Geliştirme Hızı | Kırılganlık | Grafik İşlemlerine Uygunluk | Bu Proje İçin Uygunluk |
|---|---|---|---|---|---|
| React Native + Skia | 9/10 | 9/10 | Düşük | 10/10 — blend/filter/matrix tam ihtiyaca uygun | **9.5/10** |
| Flutter + CustomPainter/Canvas | 9/10 | 7/10 | Düşük-Orta | 9/10 — teknik olarak güçlü, aynı Skia temeline dayanıyor | 8/10 |
| Native Swift/Kotlin (ayrı kod tabanları) | 10/10 | 3/10 | Orta-Yüksek (iki kod tabanını eşzamanlı sürdürme) | 10/10 | 4/10 |
| Unity/3D engine | 8/10 | 3/10 | Yüksek (binary boyutu, build/store karmaşıklığı) | 6/10 — 3D iş yükleri için güçlü, 2D foto-kompozisyon için yanlış araç | 2/10 |
| Web/PWA | 6/10 | 8/10 | Orta (iOS PWA kısıtları, native kamera/paylaşım zayıflığı) | 7/10 | 4/10 |

---

## 9. Rekabet Analizi ve Pazar Konumlandırması

Türkiye mobilya sektörü ~€11,9 milyar büyüklüğünde, 40.000'den fazla işletme barındırıyor:

| Segment | Araçlar | Fiyat | Bu Projeye Göre Konum |
|---------|---------|-------|----------------------|
| Profesyonel CAD/CAM | ADeko (45.000₺), SmartCabinet, Cabinet Vision | Çok yüksek (tek seferlik) | Farklı segment — üretim odaklı, masaüstü, pahalı |
| Masaüstü tasarım | Pera3D, ArCon, Flatma, SketchList 3D | Orta-yüksek | Sahada mobil kullanıma uygun değil |
| AI görselleştirme | Remodel AI ($29-99/ay), Cabinet AI, Interior AI | Orta | Jenerik mobilya gösteriyor, üreticinin kendi ürünlerini yansıtmıyor |
| **Mobil saha sunum aracı** | **Bu segmentte araç yok** | — | **Bu boşluk bizim hedefimiz** |

**Kritik fark:** AI araçları jenerik mobilya gösterir. Bu uygulama ise mobilyacının **kendi ürün kataloğunu** gösterir — "ben sana tam bunu yapacağım" güvencesi verir.

**Türkiye'deki en yakın rakipler:** Cadli (tablet dostu tasarım aracı) ve Dolap Ustam (sezgisel arayüz). Her ikisi de masaüstü/web tabanlı; sahada fotoğraf üzerine overlay yapmıyor.

---

## 10. Fiyatlandırma Stratejisi

| Katman | Fiyat | İçerik |
|--------|-------|--------|
| **Ücretsiz (Çırak)** | 0₺/ay | 3 proje, sınırlı katalog (3 kapak, 3 kulp, 10 renk) |
| **Usta** | 200-300₺/ay | Sınırsız proje, tam katalog, PDF export |
| **Atölye** | 400-500₺/ay | Çoklu kullanıcı, bulut yedekleme, öncelikli destek |

Usta planı yıllık 2.400-3.600₺ — ADeko'nun 45.000₺'sine karşı ~%92-95 daha ucuz. Global emsaller: Remodel AI $29-99/ay, Interior AI $39-399/ay.

---

## 11. AI Stratejisi — Tehdit Değil Fırsat

**Mevcut durum (Haziran 2026):** Remodel AI, Cabinet AI gibi araçlar fotoğraf üzerinde saniyeler içinde dolap stili değiştirebiliyor.

**Neden şu an doğrudan tehdit değil:** AI araçları jenerik mobilya gösteriyor (mobilyacının kendi ürünlerini yansıtmıyor), "tam bunu yapacağım" güvencesi veremiyor, düşük/yok internet ortamında çalışamıyor (cloud-dependent), Türkçe arayüz ve yerel katalog desteği yok.

**v2 yol haritası — AI'ı yardımcı olarak kullan (rakip olarak değil):**
1. Fotoğraftan duvar/tezgah alanını otomatik algılama → modül yerleştirmeyi hızlandırma
2. Overlay'ın ışık/perspektif uyumunu AI ile iyileştirme → daha gerçekçi görüntü
3. Manuel modül yerleştirme her zaman korunsun → ürün doğruluğu avantajı bozulmasın

---

## 12. Cihaz Minimum Gereksinimleri (Device Floor)

Hedef kullanıcı kitlesi bütçe-orta segment telefon kullanıyor. Skia, GPU kısıtlı cihazlarda CPU rendering'e düşebilir:

| Özellik | Minimum Gereksinim |
|---------|-------------------|
| İşletim sistemi | Android 10+ / iOS 14+ |
| RAM | 3 GB+ |
| GPU/İşlemci | Snapdragon 665 dengi (Adreno 610+) |
| Ekran | 5.5"+ (tablet tercih edilir) |
| Depolama | 500 MB boş alan |

**Performans stratejileri:** Handle sürüklerken canvas çözünürlüğünü geçici düşürme (downsample), Reanimated SharedValues ile batch drawing, release build'de test etme (debug build performans yansıtmaz).

---

## 13. Nihai Öneri

**Hangi stack ile başlamalıyım?** Bölüm 2'deki yığınla, backend olmadan, tamamen yerel/offline bir teknik prototipten başla.

**İlk teknik prototip ne olmalı?** Tek ekranlı bir "fotoğraf seç → kapak ekle → 4 köşeden sürükle → renk/texture uygula → JPG olarak paylaş" akışı (görev tanımı Bölüm 15'te).

**İlk 2 haftada hangi teknolojileri test etmeliyim?** (1) Skia + Reanimated + Gesture Handler kombinasyonunun gerçek orta-alt segment bir Android cihazda 60fps'e yakın kalıp kalmadığı; (2) tasarımcının üreteceği örnek texture'ların blend mode ile gerçekçi/ikna edici sonuç verip vermediği; (3) köşe handle boyutunun/touch-target'ının gerçek bir esnaf kullanıcı testinde işe yarayıp yaramadığı; (4) Skia snapshot → expo-print PDF zincirinin görsel kalite ve dosya boyutu açısından kabul edilebilir olup olmadığı.

**Hangi kararları test etmeden kesinleştirmemeliyim?** Supabase mi Firebase mi (pilota kadar ertelenebilir, MVP v0'da hiç gerekmez), local storage'ın MMKV+dosya mı yoksa SQLite'a mı evrileceği (proje/modül hacmi pilotla netleşir), kataloğun ne zaman bundled'dan remote'a geçeceği (tasarım üretim hızına bağlı), ve abonelik/fiyatlama akışının teknik detayları.

---

## 14. Uygulama Mimarisi Önerisi (Klasör Yapısı)

```
src/
├── app/                       # Expo Router ekranları (rotalar)
│   ├── (tabs)/
│   ├── project/[id].tsx
│   └── camera.tsx
├── canvas/                    # Skia tabanlı kompozisyon motoru — mimarinin kalbi
│   ├── engine/                  # homography.ts, matrixUtils.ts
│   ├── layers/                  # ModuleLayer, TextureLayer, ColorLayer bileşenleri
│   ├── gestures/                 # köşe sürükleme, taşıma, boyutlandırma handler'ları
│   └── filters/                   # blend mode / color filter tanımları
├── modules/                   # Domain mantığı: ÜstDolap, AltDolap, Vestiyer, TekilKapak
│   ├── moduleTypes.ts
│   └── modulePropertiesSchema.ts
├── assets/                    # Bundled kapak/kulp/renk/texture görselleri
│   ├── kapaklar/
│   ├── kulplar/
│   ├── texture/
│   └── catalog.json
├── export/                    # JPG/PDF export ve paylaşım mantığı
│   ├── snapshotExporter.ts
│   ├── pdfBuilder.ts
│   └── shareSheet.ts
├── projects/                  # Proje (müşteri ziyareti) CRUD mantığı
│   ├── projectStore.ts          # Zustand store
│   └── projectRepository.ts     # MMKV/dosya sistemi okuma-yazma
├── storage/                   # Persistans katmanı soyutlaması (ileride SQLite/Supabase'e geçişi kolaylaştırır)
│   ├── mmkvClient.ts
│   └── fileSystemClient.ts
├── ui/                        # Paylaşılan UI bileşenleri (büyük dokunma hedefli, esnaf-dostu)
│   ├── components/
│   └── theme/
└── lib/                       # Genel yardımcılar (sentry init, analytics, config)
```

`canvas/` ve `export/` katmanlarının birbirinden bağımsız tutulması önemli: canvas yalnızca "ekranda göster", export yalnızca "son hali dosyaya/paylaşıma dönüştür" sorumluluğunu taşımalı — ileride PDF şablonu veya export formatı değiştiğinde canvas mantığına dokunmadan değişiklik yapılabilsin diye.

---

## 15. İlk Teknik Prototip Görevi (Codex / Claude Code / Antigravity Promptu)

Aşağıdaki promptu doğrudan Codex, Claude Code veya Antigravity'ye verebilirsin:

```
Görev: React Native (Expo, TypeScript, New Architecture aktif) ile "fotoğraf üstü modül
yerleştirme" teknik prototipi oluştur.

Kapsam (sadece bunlar, başka hiçbir şey eklenmeyecek):
1. Kullanıcı galeriden bir fotoğraf seçsin (expo-image-picker).
2. Seçilen fotoğraf @shopify/react-native-skia <Canvas> içinde tam ekran arka plan
   olarak render edilsin.
3. "Kapak Ekle" butonuna basıldığında, fotoğrafın üzerine sabit boyutlu dikdörtgen
   bir görsel (assets klasöründen örnek bir kapak texture PNG'si) eklensin.
4. Eklenen görselin 4 köşesinde, react-native-gesture-handler ile bağımsız olarak
   sürüklenebilen 4 adet daire (handle) bulunsun.
5. 4 köşenin güncel pozisyonlarından "birim kareden quad'a projektif dönüşüm"
   (homography / corner-pin) matrisini hesaplayan saf bir TypeScript fonksiyonu yaz
   (src/canvas/engine/homography.ts). Bunu react-native-reanimated worklet içinde her
   frame'de çalıştır ve sonucu Skia'nın local matrix'i olarak kapak görseline uygula —
   böylece görsel 4 köşeye gerçek zamanlı "yapışsın".
6. Ekranın altında 3 renk dairesi olsun (örnek: beyaz, antrasit, ceviz). Birine
   dokunulduğunda Skia ColorFilter (color matrix veya multiply blend mode) ile kapak
   texture'ının rengi değiştirilsin; texture'ın gölge/doku detayı korunsun.
7. "Dışa Aktar" butonuna basıldığında mevcut Skia Canvas'ı makeImageSnapshot() ile
   JPEG'e dönüştür, expo-file-system ile cihaza kaydet, sonra expo-sharing ile
   paylaşım sheet'ini aç.

Teknik kısıtlar:
- TypeScript strict mode.
- State yönetimi için Zustand kullan, ekstra state kütüphanesi ekleme.
- Backend, auth, veritabanı ekleme — bu tamamen offline, tek ekranlı bir prototip.
- Expo + dev client kullan (gerekirse `npx expo prebuild`); Expo Go'da çalışması
  gerekmiyor çünkü react-native-skia native kod içeriyor.
- Gerçek bir texture yoksa düz renkli + basit desenli bir placeholder PNG/SVG
  üret veya kullan.
- Kod yorumlarını Türkçe yazabilirsin, değişken/fonksiyon isimlerini İngilizce tut.

Çıktı: Çalışır durumda bir Expo projesi + yukarıdaki 7 maddenin tamamının tek bir
ekranda gösterildiği bir prototip + kısa bir README (nasıl çalıştırılır, hangi
cihazda test edilmesi önerilir).
```
