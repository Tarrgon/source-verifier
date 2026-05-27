export function getCSRFToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function waitForSelector<T extends Element>(selector, timeout = 5000): Promise<T | null> {
  return new Promise(async (resolve) => {
    let waited = 0;
    while (true) {
      const ele = document.querySelector<T>(selector);
      if (ele) return resolve(ele);
      await wait(100);
      waited += 100;
      if (waited >= timeout) return resolve(null);
    }
  });
}

export function getImageBlob(fileUrl): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      const container = document.getElementById('image-container')!;
      const image = new Image();

      const width = Number(container.getAttribute('data-width'));
      const height = Number(container.getAttribute('data-height'));
      const ratio = width < height ? 256 / width : 256 / height;
      const calculatedWidth = Math.floor(width * ratio);
      const calculatedHeight = Math.floor(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = calculatedWidth;
      canvas.height = calculatedHeight;

      image.onload = () => {
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, calculatedWidth, calculatedHeight);
        setTimeout(() => { canvas.toBlob(resolve, 'image/png'); });
      };

      image.crossOrigin = '';
      image.src = fileUrl;
    } catch (e) {
      reject(e);
    }
  });
}