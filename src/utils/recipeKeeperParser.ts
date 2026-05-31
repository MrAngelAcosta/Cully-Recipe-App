import { Recipe, Ingredient } from "../types";
import JSZip from "jszip";

// Helper to clean up multiple spaces, line endings, and tabs inside strings
const cleanString = (str: string): string => {
  return str.replace(/\s+/g, " ").trim();
};

// Heuristic to split ingredient line into amount and name
export const parseIngredientLine = (line: string): Ingredient => {
  const trimmed = cleanString(line);
  if (!trimmed) {
    return { name: "Unknown Ingredient", amount: "As desired" };
  }

  // Regex to match leading amount structures including decimals, ranges, fractions, and standard units
  const unicodeFractions = "[\u00BC-\u00BE\u2150-\u2189]";
  const amountRegex = new RegExp(
    `^(` +
    `\\d+\\s+\\d+\\/\\d+` + // "1 1/2"
    `|\\d+\\/\\d+` +       // "1/2"
    `|\\d+\\s+` + unicodeFractions + // "1 ½"
    `|` + unicodeFractions + // "½"
    `|\\d+(?:\\.\\d+)?(?:\\s*-\\s*\\d+(?:\\.\\d+)?)?` + // "1", "1.5", "1-2"
    `)(?:\\s*` + 
    `(?:cups?|c\\.?|tbsps?|tb\\.?|tsps?|t\\.?|g|kg|ml|l|oz|lbs?|cloves?|slices?|cans?|pinches?|handfuls?|bunches?|grams?|milliliters?|liters?|ounces?|pounds?)` +
    `\\b)?`,
    "i"
  );

  const match = trimmed.match(amountRegex);
  if (match && match[0]) {
    const amountPart = match[0].trim();
    const namePart = trimmed.substring(match[0].length).trim();
    if (namePart) {
      return { 
        amount: amountPart, 
        name: namePart.replace(/^of\s+/i, "") // e.g. "1 cup of flour" -> name: "flour"
      };
    }
  }

  // Fallback: Simple check for leading digits or fractions
  const simpleNumMatch = trimmed.match(/^([\d\s\/\-\u00BC-\u00BE\u2150-\u2189]+)\s*(.*)/);
  if (simpleNumMatch) {
    const amt = simpleNumMatch[1].trim();
    const name = simpleNumMatch[2].trim();
    if (name) {
      return { amount: amt, name };
    }
  }

  return { amount: "As desired", name: trimmed };
};

// Parses elements contained between titles or within card elements
export const parseRecipeFromSiblings = async (title: string, elements: Element[], loadedZip: JSZip | null): Promise<Partial<Recipe>> => {
  const recipe: Partial<Recipe> = {
    id: `rk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: cleanString(title),
    description: "",
    time: "30m",
    category: "Quick Meals",
    ingredients: [],
    instructions: [],
    tags: ["Recipe Keeper"],
    bookmarked: false
  };

  let inIngredients = false;
  let inInstructions = false;
  let inNotes = false;
  
  const descriptions: string[] = [];

  for (const el of elements) {
    const textVal = cleanString(el.textContent || "");
    if (!textVal && el.tagName.toLowerCase() !== "img") continue;

    const lowerText = textVal.toLowerCase();
    const tagName = el.tagName.toLowerCase();

    // Catch structural layout title flags
    const isHeaderTag = ["h1", "h2", "h3", "h4", "h5", "h6", "strong", "b"].includes(tagName);
    const hasHeaderClass = el.className && typeof el.className === "string" && (
      el.className.toLowerCase().includes("heading") || 
      el.className.toLowerCase().includes("title") ||
      el.className.toLowerCase().includes("section")
    );

    if (isHeaderTag || hasHeaderClass) {
      if (lowerText === "ingredients" || (lowerText.includes("ingredients") && lowerText.length < 25)) {
        inIngredients = true;
        inInstructions = false;
        inNotes = false;
        continue;
      }
      if (
        lowerText === "directions" || 
        lowerText === "instructions" || 
        lowerText === "method" || 
        ((lowerText.includes("directions") || lowerText.includes("instructions") || lowerText.includes("method") || lowerText.includes("preparation")) && lowerText.length < 25)
      ) {
        inIngredients = false;
        inInstructions = true;
        inNotes = false;
        continue;
      }
      if (lowerText === "notes" || lowerText === "description" || ((lowerText.includes("notes") || lowerText.includes("history")) && lowerText.length < 25)) {
        inIngredients = false;
        inInstructions = false;
        inNotes = true;
        continue;
      }
    }

    // Extract embedded image tag
    if (tagName === "img") {
      const srcAttr = el.getAttribute("src") || "";
      if (srcAttr && !srcAttr.startsWith("data:")) {
        recipe.image = srcAttr;
      }
    } else {
      const embeddedImg = el.querySelector("img");
      if (embeddedImg) {
        const srcAttr = embeddedImg.getAttribute("src") || "";
        if (srcAttr && !srcAttr.startsWith("data:")) {
          recipe.image = srcAttr;
        }
      }
    }

    // Capture standard metadata
    if (lowerText.startsWith("prep time:") || lowerText.startsWith("prep:")) {
      const val = textVal.replace(/^(prep time:|prep:)/i, "").trim();
      if (val) recipe.time = val;
      continue;
    }
    if (lowerText.startsWith("cook time:") || lowerText.startsWith("cook:")) {
      const val = textVal.replace(/^(cook time:|cook:)/i, "").trim();
      if (val) {
        recipe.time = recipe.time ? `${recipe.time} (Cook: ${val})` : `${val}`;
      }
      continue;
    }
    if (lowerText.startsWith("total time:") || lowerText.startsWith("total:")) {
      const val = textVal.replace(/^(total time:|total:)/i, "").trim();
      if (val) recipe.time = val;
      continue;
    }
    if (lowerText.startsWith("category:") || lowerText.startsWith("course:")) {
      const val = textVal.replace(/^(category:|course:)/i, "").trim();
      if (val) recipe.category = val;
      continue;
    }
    if (lowerText.startsWith("rating:")) {
      const valStr = textVal.replace(/^rating:/i, "").replace(/\/5/, "").trim();
      const num = parseFloat(valStr);
      if (!isNaN(num)) recipe.rating = num;
      continue;
    }

    // Push lists based on the active structural state
    if (inIngredients) {
      if (tagName === "li") {
        recipe.ingredients?.push(parseIngredientLine(textVal));
      } else {
        const lis = el.querySelectorAll("li");
        if (lis.length > 0) {
          lis.forEach(li => {
            const liText = cleanString(li.textContent || "");
            if (liText) recipe.ingredients?.push(parseIngredientLine(liText));
          });
        } else if (tagName === "p" || tagName === "div") {
          // Fallback parsing for flat list lines (newline separated)
          const lines = textVal.split(/[\n,;]/);
          lines.forEach(line => {
            const l = cleanString(line);
            if (l) recipe.ingredients?.push(parseIngredientLine(l));
          });
        }
      }
    } else if (inInstructions) {
      if (tagName === "li") {
        recipe.instructions?.push(textVal);
      } else {
        const lis = el.querySelectorAll("li");
        if (lis.length > 0) {
          lis.forEach(li => {
            const liText = cleanString(li.textContent || "");
            if (liText) recipe.instructions?.push(liText);
          });
        } else if (tagName === "p") {
          recipe.instructions?.push(textVal);
        }
      }
    } else if (inNotes) {
      descriptions.push(textVal);
    } else {
      // General introductory text
      if (tagName === "p" && textVal.length > 10 && !textVal.toLowerCase().includes("servings") && !textVal.toLowerCase().includes("yield")) {
        descriptions.push(textVal);
      }
    }
  }

  // Deduplicate and filter empty elements
  if (recipe.ingredients) {
    recipe.ingredients = recipe.ingredients.filter((item, idx, self) => 
      item.name && idx === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
    );
  }
  if (recipe.instructions) {
    recipe.instructions = recipe.instructions.filter((item, idx, self) => 
      item && idx === self.findIndex(t => t.toLowerCase() === item.toLowerCase())
    );
  }

  if (descriptions.length > 0) {
    recipe.description = descriptions.join(" ");
  }

  // Resolve image inside the ZIP if relative src found
  if (recipe.image && loadedZip) {
    try {
      const decodedPath = decodeURIComponent(recipe.image).trim();
      const baseName = decodedPath.split(/[\\/]/).pop() || decodedPath;
      
      const searchPaths = [
        decodedPath,
        `images/${baseName}`,
        baseName,
        Object.keys(loadedZip.files).find(name => name.toLowerCase().endsWith(baseName.toLowerCase()))
      ].filter(Boolean);

      let imageFile = null;
      for (const p of searchPaths) {
        if (p) {
          imageFile = loadedZip.file(p);
          if (imageFile) break;
        }
      }

      if (imageFile) {
        const base64Data = await imageFile.async("base64");
        const ext = baseName.split('.').pop()?.toLowerCase() || "jpeg";
        recipe.image = `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${base64Data}`;
      } else {
        recipe.image = undefined;
      }
    } catch (err) {
      console.error(`Failed to load zip image: ${recipe.image}`, err);
      recipe.image = undefined;
    }
  }

  return recipe;
};

// Orchestrates DOM parsing over standard and flat fallback exports
export const parseRecipesFromHtml = async (htmlText: string, loadedZip: JSZip): Promise<Recipe[]> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const parsedRecipes: Recipe[] = [];

  // Plan A: Locate explicit recipe blocks
  const possibleContainers = Array.from(doc.querySelectorAll('.recipe, .recipe-card, .recipe-entry, .recipe-container, .recipe-details-container'));
  if (possibleContainers.length > 0) {
    for (const container of possibleContainers) {
      const headingEl = container.querySelector('h1, h2, h3, h4, .recipe-title, .title');
      if (!headingEl) continue;
      const title = cleanString(headingEl.textContent || "");
      if (!title) continue;

      const childElements = Array.from(container.querySelectorAll('*'));
      const recipeInfo = await parseRecipeFromSiblings(title, childElements, loadedZip);

      const rating = recipeInfo.rating || parseFloat((4.5 + Math.random() * 0.5).toFixed(1));
      const category = recipeInfo.category || "Quick Meals";
      
      const fullRecipe: Recipe = {
        id: recipeInfo.id || `rk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: recipeInfo.name || title,
        description: recipeInfo.description || "Parsed Recipe Keeper Pro entry.",
        time: recipeInfo.time || "30m",
        rating,
        category,
        image: recipeInfo.image || "",
        ingredients: recipeInfo.ingredients || [],
        instructions: recipeInfo.instructions || [],
        tags: recipeInfo.tags || ["Recipe Keeper"],
        bookmarked: false,
        meals: ["solo"]
      };

      if (fullRecipe.ingredients.length > 0 || fullRecipe.instructions.length > 0) {
        parsedRecipes.push(fullRecipe);
      }
    }

    if (parsedRecipes.length > 0) {
      return parsedRecipes;
    }
  }

  // Plan B: Parsing long single-page lists by scanning headers and layout tags
  const headingTags = Array.from(doc.querySelectorAll('body h1, body h2, body h3'));
  
  const bannedHeadingKeywords = [
    "ingredients", "directions", "instructions", "notes", "method", "preparation", 
    "table of contents", "index", "my recipes", "cully", "recipe keeper", "pro", "course"
  ];

  const recipeHeadings = headingTags.filter(h => {
    const textStr = cleanString(h.textContent || "").toLowerCase();
    if (!textStr || textStr.length > 80) return false;
    return !bannedHeadingKeywords.some(keyword => textStr === keyword || (textStr.includes(keyword) && textStr.length < 20));
  });

  for (let i = 0; i < recipeHeadings.length; i++) {
    const currentHeading = recipeHeadings[i];
    const nextHeading = recipeHeadings[i + 1] || null;
    const title = cleanString(currentHeading.textContent || "");
    if (!title) continue;

    const elementsBetween: Element[] = [];
    let walker = currentHeading.nextElementSibling;
    
    while (walker && walker !== nextHeading) {
      elementsBetween.push(walker);
      const nested = Array.from(walker.querySelectorAll('*'));
      elementsBetween.push(...nested);
      walker = walker.nextElementSibling;
    }

    const recipeInfo = await parseRecipeFromSiblings(title, elementsBetween, loadedZip);

    const rating = recipeInfo.rating || parseFloat((4.5 + Math.random() * 0.5).toFixed(1));
    const category = recipeInfo.category || "Quick Meals";
    
    const fullRecipe: Recipe = {
      id: recipeInfo.id || `rk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: recipeInfo.name || title,
      description: recipeInfo.description || "Parsed Recipe Keeper Pro entry.",
      time: recipeInfo.time || "30m",
      rating,
      category,
      image: recipeInfo.image || "",
      ingredients: recipeInfo.ingredients || [],
      instructions: recipeInfo.instructions || [],
      tags: recipeInfo.tags || ["Recipe Keeper"],
      bookmarked: false,
      meals: ["solo"]
    };

    if (fullRecipe.ingredients.length > 0 || fullRecipe.instructions.length > 0) {
      parsedRecipes.push(fullRecipe);
    }
  }

  return parsedRecipes;
};
