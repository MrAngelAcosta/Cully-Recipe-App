import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Shared in-memory recipe store populated with premium starter recipes
let recipes: Recipe[] = [
  {
    id: "1",
    name: "Heirloom Tomato Rigatoni",
    description: "A deeply flavorful, slow-roasted tomato sauce that transforms simple pantry staples into an elegant showcase of summer produce.",
    time: "45m",
    rating: 4.9,
    category: "Quick Meals",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjEjJAKb7cbY7Otq-F3WEQWTZgZe4HX2xbDEVELzTNlehzto4teX7iz_PE4KgiFGz6_L1T2HOECJErfHgMLoov8whsOJlYl3RMIzMj07OHDh9vQMVN5XwhTI9C5YR84MppZ3D0aJfXTDeg0DyjhOCHX7IikC6gfHNeONm_qPA_1N-q-VbN5tYjfOM6EThSrxB6sM9waCQTmahBfQacXG6BOMh8KLlglhuCdpEOUmmBvot0X54Wu0Kx1eZ51rH9YHRBBHwQqP0G9dwx",
    tags: ["Pasta", "Vegetarian", "Summer"],
    meals: ["solo", "family"],
    ingredients: [
      { name: "Rigatoni Pasta", amount: "400g" },
      { name: "Heirloom Tomatoes", amount: "800g" },
      { name: "Fresh Basil Leaves", amount: "1 bunch" },
      { name: "Garlic Cloves", amount: "4 cloves, smashed" },
      { name: "Extra Virgin Olive Oil", amount: "60ml" },
      { name: "Parmigiano-Reggiano", amount: "50g, grated" },
      { name: "Sea Salt & Red Pepper Flakes", amount: "to taste" }
    ],
    instructions: [
      "Preheat your oven to 200°C (400°F). Toss the whole heirloom tomatoes, smashed garlic cloves, and extra virgin olive oil onto a baking sheet, seasoning with coarse salt.",
      "Roast for 25-30 minutes until the skin of the tomatoes is blistered, slightly charred, and yielding juicy pools of flavor.",
      "Meanwhile, cook the rigatoni pasta in a large pot of heavily salted boiling water until it reaches a precise al dente. Reserve about 100ml of starchy cooking water.",
      "Transfer the roasted tomatoes, garlic, and all pan juices into a warm skillet over low heat. Mash them gently with a fork to form a rustic, textured sauce.",
      "Toss the pasta directly into the sauce, adding a splash of the pasta cooking water and a generous handful of ripped fresh basil.",
      "Finely grate Parmigiano-Reggiano and fold everything until a glossy, rich sauce wraps around every tube of pasta. Serve with a pinch of red pepper flakes."
    ],
    bookmarked: true
  },
  {
    id: "2",
    name: "Sourdough Margherita Pizza",
    description: "A wood-fired style artisan pizza leveraging a slow-fermented sourdough crust, vibrant San Marzano tomatoes, and creamy fresh mozzarella.",
    time: "1h 20m",
    rating: 4.8,
    category: "Baking",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBiGm4nel1_f1X6GgX30U3bvOjayaCj0pCmMPQ057IHhD8B6WQvwMJtob3-czTQw_8kfJSCtspLxb49zHEJzBz356KMrp-gfhIMIbZjXu3VVDXXseUfxEaZBI8FmyVgPbi6ycMYTVfW_-Gl5Bd8gBNZnByxQ8dC8WAW4OUfXuwNwbaALM13CQJEcHoGBhNbvV4FPs1PRlbGQsYSK2XoFyRzJIGdnM_XBmwTlqc-hsQIUU-OxSnseVy0twccPQYqPhst7FtGqf4AJgsb",
    tags: ["Pizza", "Sourdough", "Classics"],
    meals: ["family"],
    ingredients: [
      { name: "Sourdough Pizza Dough", amount: "1 ball (approx. 250g)" },
      { name: "San Marzano Canned Tomatoes", amount: "150g, crushed by hand" },
      { name: "Fresh Mozzarella di Bufala", amount: "125g, drained" },
      { name: "Fresh Basil Leaves", amount: "6-8 whole leaves" },
      { name: "Extra Virgin Olive Oil", amount: "1 tbsp" },
      { name: "Semolina Flour", amount: "for dusting" }
    ],
    instructions: [
      "Place your baking steel or pizza stone in the top third of your oven and preheat to its absolute highest setting of 250°C-275°C (500°F) for at least 1 hour.",
      "On a lightly floured surface dusted with semolina, gently stretch and pull the sourdough ball from the inside out, preserving the airy pockets in the outer crust rim.",
      "Ladle a thin layer of hand-crushed San Marzano tomatoes over the base, leaving a 2cm border for the crust expansion.",
      "Tear fresh mozzarella into small chunks and distribute evenly across the tomato layer.",
      "Slide the pizza onto the blistering hot stone or steel using a floured wooden peel. Bake for 6 to 8 minutes until the crust is blistered and charred, and cheese is bubbling.",
      "Remove premium bake, immediately scatter fresh basil leaves, drizzle a thin stream of premium olive oil, slice immediately and serve hot."
    ],
    bookmarked: false
  },
  {
    id: "3",
    name: "Elevated Avo Toast",
    description: "A clean, high-key breakfast combining toasted seeded sourdough, velvety Hass avocados, and perfectly poached organic eggs, topped with microgreens.",
    time: "15m",
    rating: 4.9,
    category: "Appetizers",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOR6cWFlAyNqU9NnfNb0OzT4fWoiIdTOuVR87sbNgDq_AvSoNGwonYBEZjeLnh9KP6rgHbIdJDC437aB7G2_frxuwfBuZGTB15Np4y5lRelbIkF7yBPLqo61XhUNfuf0FIXfW39f79tOlQDa8SD4p0KMYAgJO1GZ4h1T1x2P9qomac3JwOGQWgtpqovGpkiR7AO8ftAD1y5lvhynQpOxL4-gnDx9jzpm6EMNPJTzUZuPaXCENgdR6FRK86Q-MaatCKhyaeRxvV82PV",
    tags: ["Quick", "Breakfast", "Superfood"],
    meals: ["solo"],
    ingredients: [
      { name: "Artisanal Seeded Sourdough Bread", amount: "2 thick slices" },
      { name: "Ripe Hass Avocados", amount: "2 whole" },
      { name: "Pasture-Raised Large Eggs", amount: "2 organic eggs" },
      { name: "Lemon", amount: "1/2 juicy lemon" },
      { name: "Microgreens or Radish Shoots", amount: "small handful" },
      { name: "Fleur de Sel (Flaky Salt)", amount: "to taste" },
      { name: "Chile Flakes or Aleppo Pepper", amount: "to taste" }
    ],
    instructions: [
      "Bring a wide pan of water with 1 tbsp of white vinegar to a gentle, quiet simmer. Crack your cold pasteurized eggs into individual fine mesh strainers to remove excess thin whites.",
      "Stir the simmering hot water gently to create a subtle whirlpool vortex. Slide the eggs into the absolute center one by one.",
      "Poach gently for exactly 3 minutes until the whites are opaque and set, yet the yolk center remains completely fluid and gold.",
      "Meanwhile, toast your thick sourdough slices until incredibly golden with a deeply crunchy exterior crust.",
      "Halve your avocados, remove the pits, mash the vibrant pulp in a bowl with freshly squeezed lemon juice, fine sea salt, and a light drizzle of oil.",
      "Schmear the creamy green blend generously on active sourdough. Carefully lift poached eggs with a slotted spoon, dry on paper towel, place over the toast.",
      "Garnish with radish microgreens, cracked black pepper, flaky fleur de sel, and red chili flakes."
    ],
    bookmarked: false
  }
];

// Helper to search and assign standard images based on keyword keywords
function matchBestImage(name: string): string {
  const lowercase = name.toLowerCase();
  if (lowercase.includes("pasta") || lowercase.includes("spaghetti") || lowercase.includes("rigatoni") || lowercase.includes("noodle")) {
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuCjEjJAKb7cbY7Otq-F3WEQWTZgZe4HX2xbDEVELzTNlehzto4teX7iz_PE4KgiFGz6_L1T2HOECJErfHgMLoov8whsOJlYl3RMIzMj07OHDh9vQMVN5XwhTI9C5YR84MppZ3D0aJfXTDeg0DyjhOCHX7IikC6gfHNeONm_qPA_1N-q-VbN5tYjfOM6EThSrxB6sM9waCQTmahBfQacXG6BOMh8KLlglhuCdpEOUmmBvot0X54Wu0Kx1eZ51rH9YHRBBHwQqP0G9dwx";
  }
  if (lowercase.includes("pizza") || lowercase.includes("flatbread") || lowercase.includes("dough") || lowercase.includes("margherita")) {
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuBiGm4nel1_f1X6GgX30U3bvOjayaCj0pCmMPQ057IHhD8B6WQvwMJtob3-czTQw_8kfJSCtspLxb49zHEJzBz356KMrp-gfhIMIbZjXu3VVDXXseUfxEaZBI8FmyVgPbi6ycMYTVfW_-Gl5Bd8gBNZnByxQ8dC8WAW4OUfXuwNwbaALM13CQJEcHoGBhNbvV4FPs1PRlbGQsYSK2XoFyRzJIGdnM_XBmwTlqc-hsQIUU-OxSnseVy0twccPQYqPhst7FtGqf4AJgsb";
  }
  return "https://lh3.googleusercontent.com/aida-public/AB6AXuDOR6cWFlAyNqU9NnfNb0OzT4fWoiIdTOuVR87sbNgDq_AvSoNGwonYBEZjeLnh9KP6rgHbIdJDC437aB7G2_frxuwfBuZGTB15Np4y5lRelbIkF7yBPLqo61XhUNfuf0FIXfW39f79tOlQDa8SD4p0KMYAgJO1GZ4h1T1x2P9qomac3JwOGQWgtpqovGpkiR7AO8ftAD1y5lvhynQpOxL4-gnDx9jzpm6EMNPJTzUZuPaXCENgdR6FRK86Q-MaatCKhyaeRxvV82PV";
}

// Lazy Initialize Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("MY_GEMINI_API_KEY") || key === "YOUR_API_KEY") {
      console.warn("GEMINI_API_KEY is missing or using default placeholder. Falling back to local offline generation engine.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// REST API Endpoints

// 1. Get all recipes
app.get("/api/recipes", (req, res) => {
  res.json({ success: true, count: recipes.length, recipes });
});

// 2. Create a recipe manually
app.post("/api/recipes", (req, res) => {
  const { name, description, time, category, ingredients, instructions, tags, meals } = req.body;
  if (!name || !ingredients || !instructions) {
    return res.status(400).json({ success: false, error: "Missing required parameters (name, ingredients, or instructions)" });
  }

  const newRecipe: Recipe = {
    id: Date.now().toString(),
    name,
    description: description || "A personalized handcrafted recipe designed with Cully.",
    time: time || "30m",
    rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
    category: category || "Quick Meals",
    image: req.body.image || matchBestImage(name),
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    instructions: Array.isArray(instructions) ? instructions : [],
    tags: Array.isArray(tags) ? tags : [],
    meals: Array.isArray(meals) ? meals : ["solo"],
    bookmarked: false
  };

  recipes.push(newRecipe);
  res.status(201).json({ success: true, recipe: newRecipe });
});

// 3. Update single recipe (toggling bookmark or modifying)
app.put("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Recipe not found" });
  }

  recipes[index] = {
    ...recipes[index],
    ...req.body,
    id // preserve original ID
  };

  res.json({ success: true, recipe: recipes[index] });
});

// 4. Delete single recipe
app.delete("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  const originalLength = recipes.length;
  recipes = recipes.filter((r) => r.id !== id);
  if (recipes.length === originalLength) {
    return res.status(404).json({ success: false, error: "Recipe not found" });
  }
  res.json({ success: true, message: "Recipe deleted successfully" });
});

// 5. Smart AI Generator using Gemini Key
app.post("/api/recipes/ai-generate", async (req, res) => {
  const { ingredientsList, categoryOption } = req.body;
  if (!ingredientsList || ingredientsList.trim() === "") {
    return res.status(400).json({ success: false, error: "Please enter some ingredients." });
  }

  const client = getGeminiClient();
  if (!client) {
    // Elegant procedural fallback when GEMINI_API_KEY is not defined
    return res.json({
      success: true,
      recipe: {
        id: `local-ai-${Date.now()}`,
        name: `Garden Harvest ${categoryOption || "Quick Meal"}`,
        description: `Procedural chef signature utilizing highlights of: ${ingredientsList}. Connect a real Gemini API Key for premium real-time recipes!`,
        time: "30m",
        rating: 4.8,
        category: categoryOption || "Quick Meals",
        image: matchBestImage(ingredientsList),
        tags: ["Local", "AI Mock", "Smart Prep"],
        ingredients: [
          { name: "Primary Stock Ingredient", amount: "250g" },
          { name: "Your Fridge ingredients: " + ingredientsList, amount: "As desired" },
          { name: "Cold-Pressed Olive Oil", amount: "2 tbsp" },
          { name: "Fresh Herb Assortment", amount: "small bundle" }
        ],
        instructions: [
          "Gently wash and prepare your ingredients (" + ingredientsList + "). Portion them perfectly.",
          "In a wide carbon-steel pan, heat extra virgin olive oil over medium-high heat until shimmer ripples form.",
          "Sauté your ingredients to perfection, bringing out their natural sweetness and deep savory aroma.",
          "Plate elegantly, add a dash of flaky sea salt, rip fresh herbs over the top, and serve warm immediately."
        ]
      }
    });
  }

  try {
    const prompt = `You are a world-class Michelin star chef. Generate an incredibly detailed, high-end culinary recipe that can be created using primarily these source ingredients: "${ingredientsList}". Focus on technical quality and elite kitchen practices.
    The recipe must belong to or match the culinary category: "${categoryOption || "Quick Meals"}".
    You must format your response exactly as a JSON object matching the following structural specification. Do not include any markdown backticks outside of the pure valid JSON document.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Elegant name of the chef-crafted recipe" },
            description: { type: Type.STRING, description: "Vibrant and aesthetic culinary description of the plated dish" },
            time: { type: Type.STRING, description: "Total preparation and cook time, e.g. '25m' or '1h 5m'" },
            rating: { type: Type.NUMBER, description: "Perfect chef rating score of 4.8, 4.9, or 5.0" },
            category: { type: Type.STRING, description: "Exactly match one of: Appetizers, Baking, Quick Meals, Desserts" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the ingredient, with professional specificity" },
                  amount: { type: Type.STRING, description: "Exact gourmet measurements, e.g., '150g', '2 tbsp', '1/2 tsp'" }
                },
                required: ["name", "amount"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: "Complete, detailed cooking instructions utilizing chef terminology" }
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["name", "description", "time", "category", "ingredients", "instructions", "tags"]
        }
      }
    });

    const textContent = response.text;
    if (!textContent) {
      throw new Error("Empty response from Gemini server.");
    }

    const parsedRecipe = JSON.parse(textContent);
    // Add custom computed values
    parsedRecipe.id = `ai-${Date.now()}`;
    parsedRecipe.image = matchBestImage(parsedRecipe.name);
    parsedRecipe.meals = ["solo"];

    // Push into our active store to save it!
    recipes.push(parsedRecipe);

    res.json({ success: true, recipe: parsedRecipe });
  } catch (error: any) {
    console.error("Gemini Recipe Generation failed:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate recipe with Gemini Engine." });
  }
});

// 6. Smart Scanner using Gemini Key
app.post("/api/recipes/ai-scan", async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || rawText.trim() === "") {
    return res.status(400).json({ success: false, error: "Please paste some recipe text or OCR content first." });
  }

  const client = getGeminiClient();
  if (!client) {
    // Procedural scanner fallback
    return res.json({
      success: true,
      recipe: {
        id: `local-scan-${Date.now()}`,
        name: "Procedural Scanned Recipe",
        description: "Elegant layout compiled procedural translation. Connect a real Gemini API Key for smart parse!",
        time: "20m",
        rating: 4.7,
        category: "Quick Meals",
        image: matchBestImage(rawText),
        tags: ["Scanned", "Local"],
        ingredients: [
          { name: "Scanned Ingredients Context", amount: "To Taste" },
          { name: "Filtered paste block content", amount: "1 unit" }
        ],
        instructions: [
          "Organized from the original parsed block data.",
          "Consult your pasted recipe source for step guides.",
          "Bon Appétit!"
        ]
      }
    });
  }

  try {
    const prompt = `You are a food database structural compiler. Convert the following unstructured text, OCR data, or raw recipe scribble into a polished, perfectly organized, formatted structure. Correct spelling mistakes and format measurements into standard chef metrics.
    
    Source unstructured content:
    """
    ${rawText}
    """
    
    Respond in strict JSON matching this exact structure:`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Title of the cooked dish" },
            description: { type: Type.STRING, description: "A elegant summarization of the item" },
            time: { type: Type.STRING, description: "Preparation time, e.g. '15m' or '2h'" },
            category: { type: Type.STRING, description: "Appetizers, Baking, Quick Meals, or Desserts" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING }
                },
                required: ["name", "amount"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["name", "description", "time", "category", "ingredients", "instructions", "tags"]
        }
      }
    });

    const textContent = response.text;
    if (!textContent) {
      throw new Error("Zero bytes returned from parser model.");
    }

    const parsedRecipe = JSON.parse(textContent);
    parsedRecipe.id = `scanned-${Date.now()}`;
    parsedRecipe.rating = parseFloat((4.6 + Math.random() * 0.4).toFixed(1));
    parsedRecipe.image = matchBestImage(parsedRecipe.name);
    parsedRecipe.meals = ["solo"];

    recipes.push(parsedRecipe);

    res.json({ success: true, recipe: parsedRecipe });
  } catch (error: any) {
    console.error("Gemini Recipe Scanner parsing failed:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to parse recipe content." });
  }
});


// Dev Server Mounting / Static Serving Mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets safely from the compiled dist directory
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cully Cooking Server initialized securely on http://localhost:${PORT}`);
  });
}

startServer();
