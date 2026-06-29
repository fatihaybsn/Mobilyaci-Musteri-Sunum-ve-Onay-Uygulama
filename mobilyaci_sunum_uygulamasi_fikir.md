# Mobilyacı Müşteri Sunum ve Onay Uygulaması

## Tek Cümleyle Proje Nedir?

Mobilyacıların müşteri evinde çektiği fotoğraf üzerine, nesne tabanlı modüller aracılığıyla dolap, kapak, kulp, renk ve yerleşim seçeneklerini interaktif olarak uygulayıp; sonunda paylaşılabilir bir görsel çıktı üretmesini sağlayan mobil uygulama.
Mobilyacının müşteri evinde 5–10 dakikada fotoğraf üstüne dolap/kapak/kulp/renk alternatifi gösterip WhatsApp/PDF ile onay almasını sağlayan saha satış uygulaması.

---

## Çözülen Problem

Küçük ve orta ölçekli mobilyacılar, müşteriyle ölçü alma ziyaretinde yüzeysel konuşur. Kapak deseni, kulp modeli, dolap rengi, üst/alt dolap yerleşimi gibi kararlar sözel olarak alınır. Müşterinin zihninde "mutfağım nasıl görünecek?" sorusunun somut yanıtı oluşmaz. Bu durum üç somut soruna yol açar:

- **Uzun karar süreci:** Müşteri isteklerini anlatmakta zorlanır; aynı konuyu birden fazla görüşmede tekrar eder.
- **Üretim sürecinde anlaşmazlıklar:** "Ben bunu istememiştim" itirazları sık yaşanır.
- **Teslimatta düşük memnuniyet:** Müşteri hayal ettiği ile teslim edilen arasında fark hisseder.

Uygulama bu üç sorunu, müşteri evinden ayrılmadan görsel onay alarak çözer.

---

## Kullanıcı Kimdir?

**Birincil kullanıcı:** Mobilyacı (marangoz, modüler mutfak/dolap üreticisi, vestiyer imalatçısı). Uygulama sahada, müşterinin evinde kullanılır. Mobilyacı uygulamayı çalıştırır; müşteriye ekranı gösterir.

**İkincil kullanıcı:** Müşteri. Uygulamayı bizzat kullanmaz; mobilyacının elindeki ekranı izler, kararlarını söyler, sonunda görsel çıktıyı alır.

NOT: Hedef kitle esnaf olduğu için uygulamanın başarısı teknik derinliğinin yanında UI/UX (kullanıcı arayüzü) basitliğine ve marangozun hantal parmaklarıyla ekranda ne kadar hızlı işlem yapabildiğine bağlı olacaktır.

---

## Uygulamanın Çalışma Mantığı (Kullanım Akışı)

### Adım 1 — Fotoğraf Çek
Mobilyacı, ölçü almaya gittiğinde müşterinin mutfağının, odasının ya da istenen alanın fotoğrafını uygulama üzerinden çeker. Galeriden de mevcut fotoğraf seçilebilir.

### Adım 2 — Modülleri Yerleştir
Mobilyacı fotoğraf üzerine modülleri yerleştirir. Her modül bağımsız bir nesne olarak çalışır. Örneğin:

- Üst dolap modülü → fotoğrafın üst bölgesine yerleştirilir
- Alt dolap modülü → tezgah altı bölgeye yerleştirilir
- Vestiyer modülü → ilgili alana yerleştirilir
- Tek kapak modülü → tekil bir dolap kapısı için kullanılır

Her modülün boyutu sürükleme ya da manuel ölçü girişiyle ayarlanır; fotoğraftaki gerçek alana oranlanarak hizalanır.

### Adım 3 — Modüle Tıkla, Özelliğini Değiştir
Yerleştirilen herhangi bir modüle tıklandığında o modüle ait özellik paneli açılır. Modüllerin değiştirilebilir özellikleri şunlardır:

**Kapak**
- Kapak türü (mat lake, parlak lake, membran, cam, doğal ahşap görünümlü, vb.)
- Kapak deseni (düz, çizgili, karelaj, oluklu, çerçeveli, vb.)
- Kapak rengi (renk paleti ya da özel hex kodu)

**Kulp**
- Kulp modeli (uzun bar, küçük silindir, gömülü, kulpsuz/gizli kapak, vb.)
- Kulp rengi / malzeme görünümü (mat siyah, krom, altın, paslanmaz, vb.)
- Kulp konumu (üst, alt, orta, sağ, sol)

**Gövde / Kasa**
- Renk / desen (beyaz, antrasit, ceviz, meşe, vb.)

**Ölçü**
- Genişlik, yükseklik, derinlik (manuel giriş; fotoğraf üzerindeki görsele orantılı yansır)

Özellik seçiminin ardından modülün görünümü fotoğraf üzerinde anında güncellenir.

### Adım 4 — Görsel Çıktı Al
Tüm modüller yapılandırıldıktan sonra "Tamamla" ile son görsel oluşturulur. Bu görsel:

- Fotoğraf üzerine yerleştirilmiş tüm modüllerin son halini içerir
- Seçilen kapak, kulp, renk bilgilerini görsel altında özet olarak listeler (isteğe bağlı)
- PDF veya JPG olarak kaydedilebilir
- WhatsApp, e-posta gibi kanallarla müşteriyle paylaşılabilir

---

## Temel Teknik Kavram: Nesne Tabanlı Modül Mantığı

Bu uygulama bir **fotoğraf düzenleme aracı değildir.** Kullanıcı fotoğrafa el ile boya sürmez, piksel boyamaz.

Uygulama bir **nesne tabanlı mobilya modülleyicisidir.**

Her dolap bölümü (üst dolap, alt dolap, vestiyer, tekil kapak) bağımsız bir nesne/katman olarak var olur. Bu nesneler:

- Fotoğrafın üzerinde bağımsız katmanlar olarak konumlandırılır
- Birbirinden bağımsız biçimde seçilip düzenlenir
- Seçili nesneye ait özellik paneli ayrı ayrı açılır

Bu model şu kullanım senaryolarını mümkün kılar:
- Sadece üst dolap kapağının rengini değiştir, alt dolap aynı kalsın
- Sol taraftaki modülün kulbunu değiştir, sağdaki farklı kalsın
- Sadece vestiyerin kapak desenini güncelle

---

## Modül Türleri (İlk Sürüm Kapsamı Önerisi)

| Modül Adı        | Açıklama                                      |
|------------------|-----------------------------------------------|
| Üst Dolap        | Mutfak ya da oda üst bölmesi                  |
| Alt Dolap        | Tezgah altı ya da zemin seviyesi bölmesi      |
| Vestiyer Bölümü  | Giysi/elbise dolabı bölümü                    |
| Tekil Kapak      | Bağımsız tek dolap kapısı                     |
| Dolap Gövdesi    | İç gövde/kasa alanı (renk/malzeme seçimi)     |

---

## Özellik Kataloğu (İlk Sürüm Kapsamı Önerisi)

Her özellik tipi için uygulama içinde tanımlı, görsellerle desteklenmiş seçenekler (thumbnail grid) sunulur. Kullanıcı metin okumaz; küçük görsel önizlemelere tıklar.

**Kapak Türleri:** Mat Lake, Parlak Lake, Membran, Cam, Doğal Ahşap, Folyo

**Kapak Desenleri:** Düz, Yatay Oluklu, Dikey Oluklu, Çerçeveli, Karelaj, Geometrik

**Kulp Modelleri:** Gizli (Kulpsuz), Uzun Bar, Kısa Bar, Silindir, Düğme, Tırnakaltı

**Renkler:** Standart palet (en az 20 renk, mat/parlak varyantlı) + özel renk seçici

---

## Bu Uygulama Ne Değildir?

Aşağıdakilerden **hiçbirinin rakibi değildir** ve bu özellikleri içermez:

- **CAD / teknik çizim aracı değildir.** Adeko, KitchenDraw, Pera3D gibi profesyonel ölçekli çizim programlarıyla rekabet etmez.
- **3D modelleme / render motoru değildir.** SketchUp, 3ds Max gibi araçların yaptığını yapmaz.
- **AR (Artırılmış Gerçeklik) uygulaması değildir.** Canlı kamera görüntüsü üzerine 3D nesne yansıtmaz.
- **Üretim yazılımı değildir.** Kesim optimizasyonu, CNC çıktısı, malzeme listesi gibi üretim süreçleri kapsam dışıdır.
- **E-ticaret platformu değildir.** Fiyat teklifi, sipariş yönetimi, stok takibi içermez.

---

## Başarı Kriteri

Bir mobilyacı, müşterinin evinde ölçü aldıktan sonra **5-10 dakika içinde** müşteriye "mutfağın böyle görünecek" diyebileceği bir görseli oluşturabilmeli ve WhatsApp ile paylaşabilmelidir.

---

## Hedef Pazar

Türkiye'de faaliyet gösteren küçük ve orta ölçekli bağımsız mobilyacılar, marangozlar ve modüler mutfak/dolap üreticileri. Öncelikli hedef: büyük marka yazılımlarına erişimi ya da teknik bilgisi olmayan, müşteri iletişimini yüz yüze kuran esnaf kesimidir.

---

## Platformlar

Mobil öncelikli. İlk sürüm: Android ve iOS.

Tablet kullanımına da optimize edilmeli; sahada müşteriyle birlikte bakılacağı için ekran alanı önemlidir.

---

## Gelir Modeli (Öngörü)

Mobilyacı başına aylık sabit abonelik (SaaS). Freemium başlangıç (sınırlı modül/proje) → ücretli plan (sınırsız kullanım). Yayın öncesi pilot aşamada seçili mobilyacılara ücretsiz sunularak ürün olgunlaştırılır ve referans vaka oluşturulur.

**Önerilen fiyat aralığı (pazar araştırmasına dayalı):**

| Katman | Fiyat | İçerik |
|--------|-------|--------|
| Ücretsiz (Çırak) | 0₺/ay | 3 proje, sınırlı katalog |
| Usta | 200-300₺/ay | Sınırsız proje, tam katalog, PDF export |
| Atölye | 400-500₺/ay | Çoklu kullanıcı, bulut yedekleme, öncelikli destek |

Referans: ADeko tek seferlik 45.000₺, Remodel AI $29-99/ay. Usta planı yıllık 2.400-3.600₺ ile ADeko'ya göre ~%92-95 daha uygun fiyatlı.


Geliştirmede düşünceler: 

* AR ya da perspektif hesaplama yoluna girmeyin — dürüst sticker modeli müşteriyi ikna etmek için yeterli ve kanıtlanmış. Renoworks Pro bu yaklaşımı dış cephe görselleştirmede (çatı, dış kaplama) başarıyla uyguluyor ve satış kapama oranını ikiye katlıyor. İç mekanda benzer prensibi uygulayan Remodel AI ve Cabinet AI de fotoğraf-üstü overlay konseptini doğruluyor — ancak bunlar AI tabanlı olup jenerik mobilya gösterir; bu uygulama ise mobilyacının kendi ürünlerini gösterecektir.

* Teknik mimari sekmesindeki yığın doğrudan uygulanabilir, piyasada çalışıyor. @shopify/react-native-skia bu projenin kalbi — onsuz texture blend ve color filter yönetimi çok zorlaşır.

* “Asset üretimi yazılımla paralel başlamalı”:

Uygulamanın kodu yazılırken aynı anda görsel malzemeler de üretilmeye başlamalı.

Buradaki asset şunlar:

Kapak görselleri
Ahşap/lake/membran texture’ları
Kulp PNG’leri
Renk/desen örnekleri
Thumbnail görselleri
PDF/JPG çıktıda görünecek katalog görselleri

Yani sadece yazılımcı uygulamayı yapmayacak. Aynı anda bir tasarımcı/CGI kişi/stüdyo da “uygulamada seçilecek mobilya görsellerini” hazırlayacak.