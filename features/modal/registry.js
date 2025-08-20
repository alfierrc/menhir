import { renderImageView } from "./views/image.js";
import { renderNoteView } from "./views/note.js";
import { renderProductView } from "./views/product.js";

export const MODAL_VIEWS = {
  image: renderImageView,
  note: renderNoteView,
  product: renderProductView,
  webpage: renderWebpageView,
  _: renderNoteView, // fallback for unknown types
};
