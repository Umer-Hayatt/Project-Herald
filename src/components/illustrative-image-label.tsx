import { isIllustrativeImage } from "@/lib/edition/images";

/** Shown over a category stock photo so it is never mistaken for a picture of the reported event. */
export function IllustrativeImageLabel({ imageUrl }: { imageUrl?: string | null }) {
  if (!isIllustrativeImage(imageUrl)) return null;
  return <span className="illustrative-image-label">Illustrative image</span>;
}
