// Shared helper for capturing a photo either via the device camera or the
// gallery/file picker. On native Android, uses @capacitor/camera (handles
// CAMERA / READ_MEDIA_IMAGES permissions). On the web, falls back to a
// hidden <input type="file"> with the appropriate `capture` attribute.
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

/**
 * Convert a data: or blob: URI returned by Capacitor Camera into a File
 * object so it can be reused exactly like a file-input result.
 */
async function uriToFile(uri, format = "jpeg") {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new File([blob], `photo-${Date.now()}.${format}`, { type: blob.type || `image/${format}` });
}

/**
 * Take a photo with the device camera or pick one from the gallery.
 * Returns { ok, file } on success, or { ok: false, message, cancelled }.
 *
 * @param {"camera"|"gallery"} source
 */
export async function capturePhoto(source) {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      });
      const file = await uriToFile(photo.webPath, photo.format);
      return { ok: true, file };
    } catch (err) {
      const msg = String(err?.message || err || "");
      if (/cancel/i.test(msg)) {
        return { ok: false, cancelled: true, message: "Sélection annulée." };
      }
      return {
        ok: false,
        message: "Impossible d'accéder à l'appareil photo / la galerie. Vérifiez les autorisations de l'application dans les paramètres Android.",
      };
    }
  }

  // Web fallback: trigger a hidden file input.
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (source === "camera") input.capture = "environment";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) resolve({ ok: true, file });
      else resolve({ ok: false, cancelled: true, message: "Sélection annulée." });
    };
    input.click();
  });
}
