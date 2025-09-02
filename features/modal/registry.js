import { renderImageView } from "./views/image.js";
import { renderNoteView } from "./views/note.js";
import { renderProductView } from "./views/product.js";
import { renderWebpageView } from "./views/webpage.js";
import { renderArticleView } from "./views/article.js";

export const MODAL_VIEWS = {
  image: renderImageView,
  note: renderNoteView,
  product: renderProductView,
  webpage: renderWebpageView,
  article: renderArticleView,
  _: renderNoteView, // fallback for unknown types
};
