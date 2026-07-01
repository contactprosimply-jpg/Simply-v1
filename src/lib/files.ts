/** Lecture fichier image/PDF en data URL avec compression image */
export function readFileAsDataUrl(file: File, maxWidth = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("Image invalide"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("Lecture impossible"));
      reader.readAsDataURL(file);
      return;
    }

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      if (file.size > 4_000_000) {
        reject(new Error("PDF trop volumineux (max 4 Mo)"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Lecture PDF impossible"));
      reader.readAsDataURL(file);
      return;
    }

    reject(new Error("Format non supporté"));
  });
}
