import type { Matrix3, QuadCorners } from '../../types/editor';

/**
 * Bir kaynak dörtgeni hedef dörtgene eşleyecek 3×3 projektif matrisi hesaplar.
 *
 * İlk teknik spike gerçek perspektif dönüşümünü bilinçli olarak uygulamaz. `null`,
 * henüz matris üretilmediğini veya ileride geçersiz/dejenere bir quad algılandığını
 * ifade edecek kararlı API sözleşmesidir.
 */
export function computeHomography(
  source: QuadCorners,
  destination: QuadCorners,
): Matrix3 | null {
  void source;
  void destination;
  return null;
}
