import { createGenericView } from "./GenericView.js";

export const renderArticleView = createGenericView({
  leftPane: "reader", // Use a new 'reader' type for the left pane
  showNotesField: false,
});
