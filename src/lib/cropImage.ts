/**
 * react-easy-crop → 정사각 500x500 JPEG Blob 추출 유틸 (profile.md §4)
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const OUTPUT_SIZE = 500;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function getCroppedJpegBlob(imageSrc: string, crop: CropArea): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context unavailable');
  ctx.drawImage(
    img,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob 실패'))),
      'image/jpeg',
      0.9
    );
  });
}
