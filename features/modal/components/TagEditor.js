export function renderTags({ item, autosave, container }) {
  // --- Create the "tags" label ---
  const kTags = document.createElement("div");
  kTags.className = "k";
  kTags.textContent = "tags";

  const vTagsContainer = document.createElement("div");
  vTagsContainer.className = "v tag-pills-container";

  // Function to create a pill element
  const createPill = (tag) => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = tag;
    return pill;
  };

  // Get the initial list of tags
  let currentTags = Array.isArray(item.tags)
    ? item.tags
    : String(item.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  // Display the existing tags
  for (const tag of currentTags) {
    vTagsContainer.appendChild(createPill(tag));
  }

  // --- Create the "Add Tag" UI ---
  const addTagInput = document.createElement("input");
  addTagInput.type = "text";
  addTagInput.placeholder = "Add tag...";
  addTagInput.className = "add-tag-input";

  const addTagButton = document.createElement("button");
  addTagButton.className = "add-tag-button";
  addTagButton.textContent = "+";
  addTagButton.setAttribute("aria-label", "Add new tag");

  vTagsContainer.appendChild(addTagInput);
  vTagsContainer.appendChild(addTagButton);

  // --- Add event listeners ---
  addTagButton.addEventListener("click", () => {
    addTagButton.style.display = "none";
    addTagInput.style.display = "inline-block";
    addTagInput.focus();
  });

  const commitTag = () => {
    const newTag = addTagInput.value.trim();
    if (newTag && !currentTags.includes(newTag)) {
      const newTagsArray = [...currentTags, newTag];
      autosave({ tags: newTagsArray });
      vTagsContainer.insertBefore(createPill(newTag), addTagInput);
      currentTags = newTagsArray;
    }
    addTagInput.value = "";
    addTagInput.style.display = "none";
    addTagButton.style.display = "inline-flex";
  };

  addTagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTag();
    }
    if (e.key === "Escape") {
      addTagInput.value = "";
      addTagInput.style.display = "none";
      addTagButton.style.display = "inline-flex";
    }
  });

  addTagInput.addEventListener("blur", commitTag);

  // Add the new elements to the container that was passed in
  container.appendChild(kTags);
  container.appendChild(vTagsContainer);
}
