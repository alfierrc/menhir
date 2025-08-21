import { createGenericView } from "./GenericView.js";

export const renderNoteView = createGenericView({
  leftPane: "editor",
  showOtherMetadata: false,
  showNotesField: false,
});
