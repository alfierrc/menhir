import { openModalForItem } from "../../modal/index.js";
import { createCardHeader } from "./CardHeader.js";

export function createProductCard(item) {
  // define wrapper
  const wrap = document.createElement("div");
  wrap.dataset.key = `${(item.type || "unknown").toLowerCase()}:${
    item.slug || item.title || Math.random().toString(36).slice(2)
  }`;
  wrap.dataset.type = (item.type || "").toLowerCase();
  wrap.className = "wrapper";

  // cursor hover
  wrap.style.cursor = "pointer"; // nice affordance
  wrap.dataset.item = JSON.stringify(item); // stash for click handler

  // create header
  const header = createCardHeader(item);
  wrap.appendChild(header);

  // create image card
  const card = document.createElement("article");
  card.className = "card";
  const media = document.createElement("div");
  media.className = "card-media";
  const img = document.createElement("img");

  media.appendChild(img);

  // Create and add the price box if a price exists
  // Get currency symbol
  function getCurrencySymbol(currencyInput, locale = "en-US") {
    // Use a regular expression to check if the input is a three-letter code.
    // /^[A-Z]{3}$/ checks for exactly 3 uppercase alphabetic characters from the start (^) to the end ($) of the string.
    const isCurrencyCode = /^[A-Z]{3}$/.test(currencyInput);

    if (isCurrencyCode) {
      try {
        const formatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currencyInput,
          currencyDisplay: "symbol",
        });

        const parts = formatter.formatToParts(0);
        const currencyPart = parts.find((part) => part.type === "currency");

        // Return the symbol or the original code as a fallback if the symbol is not found
        return currencyPart ? currencyPart.value : currencyInput;
      } catch (e) {
        // Return the original code if Intl.NumberFormat throws an error (e.g., for an invalid code)
        console.error("Invalid currency code:", e);
        return currencyInput;
      }
    } else {
      // Return the input as-is if it's not a three-letter code
      return currencyInput;
    }
  }

  // only add price box if price exists
  if (item.price) {
    const priceBox = document.createElement("div");
    const currencySymbol = getCurrencySymbol(item.currency || "USD");
    priceBox.className = "price-box";
    priceBox.textContent = `${currencySymbol}${item.price}`;
    media.appendChild(priceBox);
  }

  card.appendChild(media);
  wrap.appendChild(card);

  if (item.image && window.api?.getImagePath) {
    const markLoaded = () => img.classList.add("is-loaded");
    img.onload = markLoaded;
    img.onerror = markLoaded;
    window.api
      .getImagePath(item.folder, item.thumbnail || item.image)
      .then((src) => {
        img.src = src;
        if (img.complete)
          "decode" in img
            ? img.decode().then(markLoaded).catch(markLoaded)
            : markLoaded();
      });
  }

  // listen for click
  wrap.addEventListener("click", () => openModalForItem(item));
  wrap.dataset.type = "product";

  return wrap;
}
