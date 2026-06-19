const TARGET_IMAGE_BYTES = 950 * 1024;
const STARTING_MAX_SIDE = 1800;
const MIN_QUALITY = 0.58;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image illisible."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Compression impossible."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function compressImageForOcr(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= TARGET_IMAGE_BYTES) {
    return file;
  }

  const image = await loadImage(file);
  let maxSide = STARTING_MAX_SIDE;
  let quality = 0.82;
  let lastBlob: Blob | null = null;

  while (maxSide >= 900) {
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Compression image non disponible sur ce navigateur.");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    while (quality >= MIN_QUALITY) {
      const blob = await canvasToBlob(canvas, quality);
      lastBlob = blob;

      if (blob.size <= TARGET_IMAGE_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }

      quality -= 0.08;
    }

    maxSide -= 300;
    quality = 0.78;
  }

  if (lastBlob) {
    return new File([lastBlob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  return file;
}
