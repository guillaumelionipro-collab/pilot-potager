import { Camera as CameraIcon, Image as ImageIcon } from "lucide-react";
import { capturePhoto } from "../../utils/photoCapture";

/**
 * Two buttons — "Prendre une photo" / "Importer depuis la galerie" — that
 * call onFile(file) with the chosen image. Used everywhere a photo can be
 * supplied (analyse IA, ajout de culture, diagnostic, journal photo...).
 */
export default function PhotoSourceButtons({ onFile, onError, className = "" }) {
  async function pick(source) {
    const res = await capturePhoto(source);
    if (res.ok) {
      onFile?.(res.file);
    } else if (!res.cancelled) {
      onError?.(res.message);
    }
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); pick("camera"); }}
        className="inline-flex items-center gap-1.5 rounded-xl bg-garden-pine px-4 py-2 text-sm font-bold text-white hover:bg-garden-leaf transition"
      >
        <CameraIcon size={16} /> Prendre une photo
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); pick("gallery"); }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-garden-moss px-4 py-2 text-sm font-bold text-garden-pine hover:bg-garden-moss/40 transition"
      >
        <ImageIcon size={16} /> Importer depuis la galerie
      </button>
    </div>
  );
}
