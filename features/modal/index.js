import { createShell } from "./shell.js";
import { MODAL_VIEWS } from "./registry.js";

export function openModalForItem(item) {
  const { slots, close } = createShell();
  const view = MODAL_VIEWS[item.type] || MODAL_VIEWS._;
  view({ item, slots, close });
}
