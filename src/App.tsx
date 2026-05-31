import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Calendar, 
  ScanLine, 
  ShoppingCart, 
  User, 
  Search, 
  SlidersHorizontal,
  Plus, 
  Clock, 
  Star, 
  Bookmark, 
  Play, 
  Square, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Trash2, 
  FileText, 
  CheckSquare, 
  FileCode,
  PackageCheck,
  ChevronRight,
  Info
} from "lucide-react";
import { Recipe, Ingredient, MealPlan, ShoppingItem, PantryItem, MealPlanDay } from "./types";

// Base Category List
const CATEGORIES = ["All Recipes", "Appetizers", "Baking", "Quick Meals", "Desserts"];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"recipes" | "planner" | "scanner" | "groceries" | "account">("recipes");
  
  // Database State
  const [recipesList, setRecipesList] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Recipes");
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>(["Pasta", "Sourdough", "Classics", "Quick", "Breakfast", "Superfood", "Vegan", "High-Protein"]);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagNameInput, setNewTagNameInput] = useState("");

  // Detailed Modal / Focus Pane State
  const [focusedRecipe, setFocusedRecipe] = useState<Recipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<{ [key: string]: boolean }>({});
  const [focusedStepIndex, setFocusedStepIndex] = useState<number | null>(null);
  
  // Kitchen Timer State
  const [timerDuration, setTimerDuration] = useState<number>(0); // in seconds
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerLabel, setTimerLabel] = useState<string>("Kitchen Timer");

  // Meal Planner State
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    Monday: { dinner: undefined, breakfast: undefined, lunch: undefined },
    Tuesday: { breakfast: undefined, dinner: undefined, lunch: undefined },
    Wednesday: { breakfast: undefined, lunch: undefined, dinner: undefined },
    Thursday: { breakfast: undefined, lunch: undefined, dinner: undefined },
    Friday: { breakfast: undefined, lunch: undefined, dinner: undefined },
    Saturday: { breakfast: undefined, lunch: undefined, dinner: undefined },
    Sunday: { breakfast: undefined, lunch: undefined, dinner: undefined },
  });
  const [showScheduleModal, setShowScheduleModal] = useState<Recipe | null>(null);

  // Manual Recipe Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualRecipeName, setManualRecipeName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualCategory, setManualCategory] = useState("Quick Meals");
  const [manualIngredients, setManualIngredients] = useState<Ingredient[]>([{ name: "", amount: "" }]);
  const [manualInstructions, setManualInstructions] = useState<string[]>([""]);
  const [manualTagsInput, setManualTagsInput] = useState("");

  // AI Generator Widget State
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiIngredientsInput, setAiIngredientsInput] = useState("");
  const [aiSelectedCategory, setAiSelectedCategory] = useState("Quick Meals");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("");

  // Scanner Web tab state
  const [scannerInput, setScannerInput] = useState("");
  const [scanningAI, setScanningAI] = useState(false);
  const [scannerLogText, setScannerLogText] = useState<string[]>([]);
  
  // Groceries / Pantry State
  const [pantryInventory, setPantryInventory] = useState<PantryItem[]>([
    { id: "p1", name: "Extra Virgin Olive Oil", category: "Pantry", inStock: true },
    { id: "p2", name: "Sea Salt & Red Pepper Flakes", category: "Spices", inStock: true },
    { id: "p3", name: "Fine Sea Salt", category: "Spices", inStock: true },
    { id: "p4", name: "Water", category: "Liquids", inStock: true },
  ]);
  const [manualGroceryItem, setManualGroceryItem] = useState("");
  const [customShoppingItems, setCustomShoppingItems] = useState<ShoppingItem[]>([]);

  // Synchronizing status visual state
  const [syncState, setSyncState] = useState<"idle" | "syncing">("idle");

  // Fetch initial recipes from backend
  const fetchRecipes = async () => {
    setSyncState("syncing");
    try {
      const response = await fetch("/api/recipes");
      const data = await response.json();
      if (data.success) {
        setRecipesList(data.recipes);
        
        // Setup initial default meal plans aligned with Cully's screenshots!
        // Sourdough Margherita on Monday Dinner, Elevated Avo Toast on Tuesday Breakfast
        const margherita = data.recipes.find((r: Recipe) => r.id === "2");
        const avoToast = data.recipes.find((r: Recipe) => r.id === "3");
        
        setMealPlan({
          Monday: { dinner: margherita, breakfast: undefined, lunch: undefined },
          Tuesday: { breakfast: avoToast, lunch: undefined, dinner: undefined },
          Wednesday: { breakfast: undefined, lunch: undefined, dinner: undefined },
          Thursday: { breakfast: undefined, lunch: undefined, dinner: undefined },
          Friday: { breakfast: undefined, lunch: undefined, dinner: undefined },
          Saturday: { breakfast: undefined, lunch: undefined, dinner: undefined },
          Sunday: { breakfast: undefined, lunch: undefined, dinner: undefined },
        });
      }
    } catch (err) {
      console.error("Failed to fetch recipes", err);
    } finally {
      setLoadingRecipes(false);
      setTimeout(() => setSyncState("idle"), 800);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Timer Countdown Tick
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timerRemaining === 0 && timerActive) {
      setTimerActive(false);
      alert(`⏱️ Cully Timer Done: "${timerLabel}" has elapsed!`);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerRemaining]);

  // Handle Bookmarking
  const toggleBookmark = async (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    setSyncState("syncing");
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarked: !recipe.bookmarked })
      });
      const data = await response.json();
      if (data.success) {
        setRecipesList((prev) =>
          prev.map((r) => (r.id === recipe.id ? { ...r, bookmarked: !recipe.bookmarked } : r))
        );
        // Also update focused model copy if active
        if (focusedRecipe && focusedRecipe.id === recipe.id) {
          setFocusedRecipe({ ...focusedRecipe, bookmarked: !recipe.bookmarked });
        }
      }
    } catch (error) {
      console.error("Bookmark sync error:", error);
    } finally {
      setTimeout(() => setSyncState("idle"), 400);
    }
  };

  // Kitchen Timer Utilities
  const startTimer = (seconds: number, label: string) => {
    setTimerDuration(seconds);
    setTimerRemaining(seconds);
    setTimerLabel(label);
    setTimerActive(true);
  };

  const toggleTimerPause = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerRemaining(timerDuration);
    setTimerActive(false);
  };

  // Smart Parser for directions times
  const scanTimerTrigger = (step: string) => {
    const minMatch = step.match(/(\d+)\s*-\s*(\d+)\s*minutes?/i) || step.match(/(\d+)\s*minutes?/i);
    if (minMatch) {
      const minutes = parseInt(minMatch[2] || minMatch[1]);
      return {
        hasTimer: true,
        minutes,
        label: step.substring(0, 30) + "..."
      };
    }
    return { hasTimer: false, minutes: 0, label: "" };
  };

  // Add Custom User Filter Tag
  const addNewTag = () => {
    if (newTagNameInput.trim() && !customTags.includes(newTagNameInput.trim())) {
      setCustomTags([...customTags, newTagNameInput.trim()]);
      setNewTagNameInput("");
      setShowNewTagInput(false);
    }
  };

  // Schedule Recipe in weekly calendar
  const scheduleRecipe = (day: keyof MealPlan, mealType: "breakfast" | "lunch" | "dinner", recipe?: Recipe) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: recipe
      }
    }));
    setShowScheduleModal(null);
  };

  // Manual Recipe Add Submits
  const handleAddNewManualRecipe = async () => {
    if (!manualRecipeName.trim()) {
      alert("Please specify a recipe title.");
      return;
    }
    setSyncState("syncing");
    
    const preparedIngredients = manualIngredients.filter((i) => i.name.trim() !== "");
    const preparedInstructions = manualInstructions.filter((step) => step.trim() !== "");
    const tagsParsed = manualTagsInput.split(",").map((t) => t.trim()).filter((t) => t !== "");

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualRecipeName,
          description: manualDescription,
          time: manualTime || "30m",
          category: manualCategory,
          ingredients: preparedIngredients,
          instructions: preparedInstructions,
          tags: tagsParsed,
          meals: ["solo"]
        })
      });
      const data = await response.json();
      if (data.success) {
        setRecipesList((prev) => [...prev, data.recipe]);
        setShowAddModal(false);
        // Clear forms
        setManualRecipeName("");
        setManualDescription("");
        setManualTime("");
        setManualIngredients([{ name: "", amount: "" }]);
        setManualInstructions([""]);
        setManualTagsInput("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSyncState("idle"), 400);
    }
  };

  // Delete Recipe
  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("Are you sure you want to retire this recipe from Cully's collection?")) return;
    setSyncState("syncing");
    try {
      const response = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setRecipesList((prev) => prev.filter((r) => r.id !== id));
        if (focusedRecipe?.id === id) {
          setFocusedRecipe(null);
        }
      }
    } catch (err) {
      console.error("Retire error:", err);
    } finally {
      setTimeout(() => setSyncState("idle"), 400);
    }
  };

  // AI Generation Trigger using server endpoints
  const triggerAIGenerate = async () => {
    if (!aiIngredientsInput.trim()) return;
    setGeneratingAI(true);
    setAiStatusMessage("Analyzing ingredient culinary metrics...");
    
    const statuses = [
      "Consulting gourmet catalogs...",
      "Structuring precision quantities (Mise en Place)...",
      "Formulating ideal roasting and kitchen instructions...",
      "Simulating food plating layout..."
    ];

    let checkIndex = 0;
    const interval = setInterval(() => {
      if (checkIndex < statuses.length) {
        setAiStatusMessage(statuses[checkIndex]);
        checkIndex++;
      }
    }, 1800);

    try {
      const response = await fetch("/api/recipes/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientsList: aiIngredientsInput,
          categoryOption: aiSelectedCategory
        })
      });
      const data = await response.json();
      if (data.success) {
        setRecipesList((prev) => [...prev, data.recipe]);
        setFocusedRecipe(data.recipe); // Auto highlight generated masterpiece
        setShowAIPanel(false);
        setAiIngredientsInput("");
      } else {
        alert("Chef Gemini failed to process: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      clearInterval(interval);
      setGeneratingAI(false);
      setAiStatusMessage("");
    }
  };

  // Smart Raw Text parser trigger
  const triggerTextScan = async () => {
    if (!scannerInput.trim()) return;
    setScanningAI(true);
    setScannerLogText([
      "[SYSTEM] Loading Cully smart text engine...",
      "[SYSTEM] Establishing sandboxed Google AI connection..."
    ]);

    setTimeout(() => {
      setScannerLogText(prev => [...prev, "[AI] Received raw recipe unstructured transcript block.", "[AI] Scanning ingredient lists..."]);
    }, 1000);

    setTimeout(() => {
      setScannerLogText(prev => [...prev, "[AI] Calibrating chef standard measurement weights...", "[AI] Organizing sequential step arrays..."]);
    }, 2200);

    try {
      const response = await fetch("/api/recipes/ai-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: scannerInput })
      });
      const data = await response.json();
      if (data.success) {
        setScannerLogText(prev => [...prev, `[SUCCESS] Captured: "${data.recipe.name}" formatted into database!`, "[SYSTEM] Ready."]);
        setRecipesList((prev) => [...prev, data.recipe]);
        setScannerInput("");
        // Alert
        alert(`🎉 Smart Scanned: "${data.recipe.name}" has been formatted and successfully added to your recipe collection!`);
      } else {
        setScannerLogText(prev => [...prev, `[ERROR] AI Scanner failed: ${data.error}`]);
      }
    } catch (err: any) {
      setScannerLogText(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
    } finally {
      setScanningAI(false);
    }
  };

  // Scanner Presets for testing
  const applyPresetScan = (presetType: "salmon" | "cookie") => {
    if (presetType === "salmon") {
      setScannerInput(`Lemon Herb Roast Salmon
prep total: 20m.
gourmet standard
Ingredients:
- 2 Salmon Fillets (approx 150g each)
- 1 organic fresh lemon slices
- 2 sprigs organic dill rosemary
- 30ml olive dressing
- 1 tsp high quality sea salt

directions of use:
preheat gas oven to 190C. Coat the salmon fillets with golden olive dressing. Season cleanly with sea salt. Lay dill sprigs and lemon wheels over fillets. Cook for 15-18 minutes until flaky.`);
    } else {
      setScannerInput(`Chef Chocolate Lava Cake
quick dessert luxury
minutes required: 15 mins
necessities:
- 100g dark baking chocolate 70% cocoa
- 50g grassfed unsalted butter
- 2 large standard eggs
- 30g pure cane sugar
- 1 tbsp cocoa dust

walkthrough guide:
Melt dark organic chocolate and unsalted butter in double boiler. Whisk eggs together with cane sugar until aerated and pale. Fold the chocolate into the egg cloud. Add cocoa dust. Grease baking ramekins. Fill with core batter. Bake at 200C for only 8-10 minutes. Serve hot so center streams fluid lava.`);
    }
  };

  // GROCERY LIST GENERATION ENGINE (Dynamic compiler)
  // Extracts ingredient lists from all planned recipes in mealPlan
  const getCompiledGroceries = (): ShoppingItem[] => {
    const list: ShoppingItem[] = [];
    let idCounter = 1;

    // Iterate week plan
    Object.entries(mealPlan).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, recipe]) => {
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            // Check if ingredient name matches any in pantry inventory that is already "in Stock"
            const isPantryStocked = pantryInventory.some(
              (p) => p.inStock && p.name.toLowerCase().includes(ing.name.toLowerCase())
            );

            if (!isPantryStocked) {
              // Try to aggregate counts if same ingredient name exists
              const existingItem = list.find(
                (item) => item.name.toLowerCase() === ing.name.toLowerCase()
              );
              if (existingItem) {
                // Combine descriptions or keep robust
                if (!existingItem.amount.includes(ing.amount)) {
                  existingItem.amount += ` & ${ing.amount}`;
                }
              } else {
                list.push({
                  id: `compile-${idCounter++}`,
                  name: ing.name,
                  amount: ing.amount,
                  purchased: false,
                  recipeName: recipe.name,
                  category: recipe.category
                });
              }
            }
          });
        }
      });
    });

    // Add manual groceries
    customShoppingItems.forEach((manualItem) => {
      list.push(manualItem);
    });

    return list;
  };

  // Add Manual Custom Shopping Item
  const addManualGrocery = () => {
    if (manualGroceryItem.trim()) {
      const newItem: ShoppingItem = {
        id: `manual-gro-${Date.now()}`,
        name: manualGroceryItem.trim(),
        amount: "As needed",
        purchased: false,
        recipeName: "Custom Item",
        category: "Miscellaneous"
      };
      setCustomShoppingItems([...customShoppingItems, newItem]);
      setManualGroceryItem("");
    }
  };

  // Helper lists for pantry config
  const togglePantryStock = (pantryId: string) => {
    setPantryInventory((prev) =>
      prev.map((item) => (item.id === pantryId ? { ...item, inStock: !item.inStock } : item))
    );
  };

  // Add Pantry Item Custom
  const [newPantryName, setNewPantryName] = useState("");
  const addCustomPantry = () => {
    if (newPantryName.trim()) {
      const newItem: PantryItem = {
        id: `pantry-${Date.now()}`,
        name: newPantryName.trim(),
        category: "Staples",
        inStock: true
      };
      setPantryInventory([...pantryInventory, newItem]);
      setNewPantryName("");
    }
  };

  // Count planned meals
  const getPlannedMealsCount = () => {
    let count = 0;
    (Object.keys(mealPlan) as Array<keyof MealPlan>).forEach((day) => {
      const dayPlan = mealPlan[day];
      if (dayPlan.breakfast) count++;
      if (dayPlan.lunch) count++;
      if (dayPlan.dinner) count++;
    });
    return count;
  };

  // Filter recipes according to query, tags, bookmarks
  const filteredRecipes = recipesList.filter((recipe) => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      selectedCategory === "All Recipes" || 
      recipe.category === selectedCategory;
    
    const matchesBookmark = !showBookmarksOnly || recipe.bookmarked;
    
    const matchesTagFilter = !activeTagFilter || recipe.tags.includes(activeTagFilter);

    return matchesSearch && matchesCategory && matchesBookmark && matchesTagFilter;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f9fb]">
      
      {/* ================================= DECKNAV CLUSTER (LEFT SIDEBAR ON DESKTOP) ================================= */}
      <aside className="hidden md:flex flex-col w-64 bg-[#091426] text-white fixed h-screen z-40 p-6 shadow-xl justify-between">
        <div className="flex flex-col gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-[#fed01b] ${syncState === "syncing" ? "syncing" : ""}`}>
              sync
            </span>
            <h1 className="font-headline-lg text-xl tracking-tight uppercase font-bold text-[#f7f9fb]">CULLY</h1>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-3">
            <button 
              onClick={() => setActiveTab("recipes")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 uppercase font-medium tracking-wider ${activeTab === "recipes" ? "bg-[#fed01b] text-[#231b00] font-semibold font-mono" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <BookOpen size={18} />
              My Recipes
            </button>
            <button 
              onClick={() => setActiveTab("planner")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 uppercase font-medium tracking-wider ${activeTab === "planner" ? "bg-[#fed01b] text-[#231b00] font-semibold font-mono" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <Calendar size={18} />
              Weekly Planner
            </button>
            <button 
              onClick={() => setActiveTab("scanner")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 uppercase font-medium tracking-wider ${activeTab === "scanner" ? "bg-[#fed01b] text-[#231b00] font-semibold font-mono" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <ScanLine size={18} />
              AI Text Scanner
            </button>
            <button 
              onClick={() => setActiveTab("groceries")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 uppercase font-medium tracking-wider ${activeTab === "groceries" ? "bg-[#fed01b] text-[#231b00] font-semibold font-mono" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <ShoppingCart size={18} />
              Grocery Cart
            </button>
            <button 
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 uppercase font-medium tracking-wider ${activeTab === "account" ? "bg-[#fed01b] text-[#231b00] font-semibold font-mono" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <User size={18} />
              Chef Workspace
            </button>
          </nav>
        </div>

        {/* Global Live Timer in Sidebar if running */}
        <div className="bg-[#1a2a3e] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Kitchen Counter</span>
            <Clock size={14} className={timerActive ? "text-[#fed01b] animate-pulse" : "text-slate-500"} />
          </div>
          {timerRemaining > 0 ? (
            <div>
              <p className="font-mono text-xl font-bold tracking-tight text-white">
                {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-slate-400 truncate mt-1">{timerLabel}</p>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={toggleTimerPause}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] uppercase px-2 py-1 rounded"
                >
                  {timerActive ? "Pause" : "Resume"}
                </button>
                <button 
                  onClick={resetTimer}
                  className="bg-slate-700 hover:bg-slate-600 text-[#ba1a1a] text-[10px] uppercase px-2 py-1 rounded"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-400">No active timer.</p>
              <p className="text-[10px] text-slate-500 mt-1">Tap a step in recipe focus mode to link timer.</p>
            </div>
          )}
        </div>
      </aside>

      {/* ================================= TOP BAR (MOBILE ONLY / HEADER ON DESKTOP) ================================= */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#091426] text-white flex items-center justify-between px-6 z-30 shadow-md md:left-64">
        <div className="flex items-center gap-3">
          {/* Menu button placeholder or simple mobile indicator */}
          <span className={`material-symbols-outlined text-[#fed01b] md:hidden ${syncState === "syncing" ? "syncing" : ""}`}>
            sync
          </span>
          <h1 className="font-headline-lg-mobile text-lg md:text-xl tracking-tight uppercase font-bold text-white md:hidden">CULLY</h1>
          <span className="hidden md:inline-block text-xs font-mono tracking-widest text-slate-400">MISE EN PLACE SYSTEM ONLINE</span>
        </div>

        {/* Sync / Loader state indicators & Chef Profile Avatar */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {syncState === "syncing" && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-mono uppercase bg-slate-800 text-[#fed01b] px-2 py-0.5 rounded"
              >
                Syncing..
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setActiveTab("account")}
            className="w-9 h-9 rounded-full overflow-hidden border border-slate-700 hover:ring-2 hover:ring-[#fed01b] transition-all cursor-pointer"
          >
            <img 
              alt="Chef Profile" 
              className="w-full h-full object-cover" 
              src="/src/assets/images/chef_avatar_1780262086540.png"
            />
          </button>
        </div>
      </header>

      {/* ================================= MAIN CANVAS CONTAINER ================================= */}
      <main className="flex-grow pt-20 pb-24 md:pb-8 md:pl-72 md:pr-8 px-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* ======================= TAB 1: RECIPES COLLECTIVE VIEW ======================= */}
          {activeTab === "recipes" && (
            <motion.div 
              key="recipes-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              
              {/* Header Title & Floating Trigger layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#091426]">My Collections</h2>
                  <p className="text-sm text-[#45474c] mt-1">Scurry search ingredients, construct with Gemini, or start cooking.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500 text-white text-xs uppercase px-4 py-3 rounded-full font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Sparkles size={14} className="text-[#fed01b] animate-pulse" />
                    Kitchen AI Cook
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-[#fed01b] border-2 border-[#6f5900] text-[#231b00] text-xs uppercase px-4 py-3 rounded-full font-semibold shadow-md active:scale-95 transition-all"
                  >
                    <Plus size={14} />
                    Manual Recipe
                  </button>
                </div>
              </div>

              {/* Smart Search filter and Bookmarks toggle row */}
              <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search titles, descriptions, tags..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#f2f4f6] text-slate-900 placeholder-slate-400 border-none rounded-lg py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] transition-all"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-semibold uppercase border transition-all ${showBookmarksOnly ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white border-slate-200 hover:bg-[#f2f4f6] text-slate-700"}`}
                  >
                    <Bookmark size={14} className={showBookmarksOnly ? "fill-amber-600 text-amber-600" : ""} />
                    Saved Bookmarks
                  </button>

                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All Recipes");
                      setActiveTagFilter(null);
                    }}
                    className="px-4 py-3 bg-white border border-slate-200 hover:bg-[#f2f4f6] rounded-lg text-xs font-semibold uppercase text-slate-600"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>

              {/* Category Pills & Tags Slider */}
              <div className="space-y-3">
                <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar scroll-smooth">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all uppercase cursor-pointer ${selectedCategory === cat ? "bg-[#091426] text-white shadow-md font-bold font-mono" : "bg-white border border-slate-200 hover:bg-[#f2f4f6] text-slate-600"}`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNewTagInput(!showNewTagInput)}
                    className="flex-shrink-0 px-4 py-2.5 border border-dashed border-slate-300 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-50 flex items-center gap-1 uppercase"
                  >
                    <Plus size={12} /> New Tag
                  </button>
                </div>

                {/* Sub-tag slider */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                      className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-wider transition-all ${activeTagFilter === tag ? "bg-[#fed01b] border-2 border-[#6f5900] text-[#231b00] font-bold" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                {/* Quick Add Custom Tag input if toggled */}
                {showNewTagInput && (
                  <div className="flex gap-2 max-w-sm pt-2">
                    <input 
                      type="text" 
                      placeholder="Enter tag name..." 
                      value={newTagNameInput}
                      onChange={(e) => setNewTagNameInput(e.target.value)}
                      className="bg-white border border-slate-300 rounded-md py-1.5 px-3 text-xs w-full focus:outline-none"
                    />
                    <button 
                      onClick={addNewTag}
                      className="bg-[#091426] text-white text-xs px-4 py-1.5 rounded-md font-semibold uppercase"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* ===================== UPCOMING MEALS CAROUSELL (MATCHING SCREENSHOT) ===================== */}
              <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-headline-md font-bold text-lg text-[#091426]">Upcoming Planned Meals</h3>
                    <p className="text-xs text-slate-500">Scheduled in your Cully Organizer.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("planner")}
                    className="text-xs uppercase font-mono tracking-wider text-[#735c00] hover:underline flex items-center gap-1 font-bold"
                  >
                    Open Planner <ChevronRight size={14} />
                  </button>
                </div>

                <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                  {/* Monday Dinner */}
                  {mealPlan.Monday.dinner ? (
                    <div className="flex-shrink-0 w-[290px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex group cursor-pointer hover:border-amber-400 active:scale-98 transition-all" onClick={() => setFocusedRecipe(mealPlan.Monday.dinner || null)}>
                      <div className="w-24 h-24 flex-shrink-0 bg-slate-100 overflow-hidden">
                        <img 
                          alt="Pizza" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          src={mealPlan.Monday.dinner.image} 
                        />
                      </div>
                      <div className="p-3 flex flex-col justify-center min-w-0">
                        <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 self-start px-2 py-0.5 rounded mb-1 uppercase tracking-wider">Today • Dinner</span>
                        <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{mealPlan.Monday.dinner.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Cooking time: {mealPlan.Monday.dinner.time}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-[290px] bg-white/60 rounded-xl border border-dashed border-slate-300 flex items-center justify-center p-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => setActiveTab("planner")}>
                      <span className="text-xs text-slate-400 font-mono">Today's Dinner slot empty. Tap to plan.</span>
                    </div>
                  )}

                  {/* Tuesday Breakfast */}
                  {mealPlan.Tuesday.breakfast ? (
                    <div className="flex-shrink-0 w-[290px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex group cursor-pointer hover:border-indigo-400 active:scale-98 transition-all" onClick={() => setFocusedRecipe(mealPlan.Tuesday.breakfast || null)}>
                      <div className="w-24 h-24 flex-shrink-0 bg-slate-100 overflow-hidden">
                        <img 
                          alt="Avocado Toast" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          src={mealPlan.Tuesday.breakfast.image} 
                        />
                      </div>
                      <div className="p-3 flex flex-col justify-center min-w-0">
                        <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 self-start px-2 py-0.5 rounded mb-1 uppercase tracking-wider">Tomorrow • Breakfast</span>
                        <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{mealPlan.Tuesday.breakfast.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Cooking time: {mealPlan.Tuesday.breakfast.time}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-[290px] bg-white/60 rounded-xl border border-dashed border-slate-300 flex items-center justify-center p-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => setActiveTab("planner")}>
                      <span className="text-xs text-slate-400 font-mono">Tomorrow's Breakfast empty. Tap to plan.</span>
                    </div>
                  )}

                  {/* Empty generic placeholder card representing infinite queue */}
                  <div className="flex-shrink-0 w-[290px] bg-[#eceef0]/30 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center">
                    <span className="text-[10px] text-slate-400 font-mono">Select more meals inside Calendar to populate grocery list.</span>
                  </div>
                </div>
              </div>

              {/* ===================== AI KITCHEN GENERATION FORM SHEET ===================== */}
              {showAIPanel && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-900 border-2 border-indigo-500/40 text-white rounded-2xl p-6 overflow-hidden space-y-4 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-[#fed01b]" />
                    <h3 className="font-headline-md text-lg text-white font-bold">Chef Gemini AI Assembly</h3>
                  </div>
                  
                  <p className="text-sm text-slate-300">
                    Scribble or list what leftovers are remaining inside your crisper or pantry cabinet. Chef Gemini will craft a high-end gourmet culinary recipe.
                  </p>

                  <div className="space-y-3">
                    <label className="text-xs font-mono text-slate-400 uppercase">Ingredients available:</label>
                    <textarea 
                      placeholder="e.g. skinless salmon, wild honey, rosemary sprigs, garlic cloves, parsnips..."
                      disabled={generatingAI}
                      value={aiIngredientsInput}
                      onChange={(e) => setAiIngredientsInput(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#fed01b] font-body-md"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-mono text-slate-400 uppercase">Gourmet Category:</span>
                      <select 
                        value={aiSelectedCategory}
                        onChange={(e) => setAiSelectedCategory(e.target.value)}
                        className="bg-slate-800 text-xs text-white uppercase border border-slate-700 py-1.5 px-3 rounded"
                      >
                        <option value="Quick Meals">Quick Meals</option>
                        <option value="Appetizers">Appetizers</option>
                        <option value="Baking">Baking</option>
                        <option value="Desserts font-mono">Desserts</option>
                      </select>
                    </div>

                    <div className="flex gap-3 justify-end w-full sm:w-auto">
                      <button
                        onClick={() => setShowAIPanel(false)}
                        className="px-4 py-2 text-xs text-slate-400 hover:text-white uppercase font-semibold font-mono"
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={triggerAIGenerate}
                        disabled={generatingAI || !aiIngredientsInput.trim()}
                        className="flex items-center gap-2 bg-[#fed01b] text-[#231b00] px-6 py-2.5 rounded-full text-xs font-bold uppercase disabled:opacity-40 tracking-wider font-mono hover:scale-102 active:scale-95 transition-all"
                      >
                        {generatingAI ? (
                          <>
                            <span className="animate-spin mr-1">⚡</span>
                            Crafting...
                          </>
                        ) : (
                          <>
                            Assemble Recipe
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Status Loader */}
                  {generatingAI && (
                    <div className="bg-slate-950/80 p-4 border border-indigo-500/20 rounded-lg flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                      <p className="text-xs text-indigo-300 font-mono animate-pulse">{aiStatusMessage}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ===================== RECIPE IMAGES BENTO/MASONRY GRID CONTAINER ===================== */}
              {loadingRecipes ? (
                <div className="flex flex-col justify-center items-center py-20 gap-3">
                  <span className="material-symbols-outlined text-3xl animate-spin text-slate-500">sync</span>
                  <p className="text-sm text-slate-500 font-mono">Initializing gourmet database...</p>
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center space-y-3">
                  <BookOpen className="mx-auto text-slate-300" size={40} />
                  <h4 className="font-headline-md text-slate-700">No Custom Culinary Craft Found</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">Try broadening your active search bar parameters or customize leftovers using Chief Gemini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map((recipe, index) => {
                    const isBigCard = index === 0 && searchQuery === "" && selectedCategory === "All Recipes" && !showBookmarksOnly && !activeTagFilter;
                    
                    return (
                      <motion.article 
                        key={recipe.id}
                        layoutId={`recipe-container-${recipe.id}`}
                        onClick={() => setFocusedRecipe(recipe)}
                        className={`relative rounded-2xl overflow-hidden shadow-sm border border-slate-200/85 hover:shadow-md transition-all duration-300 group cursor-pointer bg-white flex flex-col h-full ${isBigCard ? "md:col-span-2 lg:col-span-2 min-h-[460px] justify-end" : "min-h-[380px]"}`}
                      >
                        {isBigCard ? (
                          // Large Featured Layout
                          <>
                            <div className="absolute inset-0 z-0 bg-slate-900">
                              <img 
                                alt={recipe.name} 
                                className="w-full h-full object-cover group-hover:scale-102 transition-all duration-700 opacity-80" 
                                src={recipe.image} 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#091426] via-[#091426]/40 to-transparent"></div>
                            </div>

                            {/* Cooking Timebadge */}
                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-1.5 z-10 text-white font-mono text-xs">
                              <Clock size={12} className="text-[#fed01b]" /> 
                              {recipe.time}
                            </div>

                            <div className="relative z-10 p-6 text-white space-y-2">
                              {/* Sub Header info */}
                              <div className="flex items-center gap-2">
                                {recipe.tags.slice(0, 2).map(t => (
                                  <span key={t} className="text-[9px] font-mono border border-amber-400 px-2 py-0.5 rounded text-[#fed01b] bg-amber-950/20 uppercase tracking-wider">#{t}</span>
                                ))}
                              </div>
                              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{recipe.name}</h2>
                              <p className="text-xs text-slate-300 line-clamp-2 max-w-xl font-body-md bg-opacity-30">{recipe.description}</p>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-slate-750">
                                <div className="flex items-center gap-1.5 font-mono text-xs text-amber-400">
                                  <Star size={14} className="fill-current text-[#fed01b]" />
                                  {recipe.rating}
                                  <span className="text-slate-400">• {recipe.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => toggleBookmark(e, recipe)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-[#fed01b]"
                                  >
                                    <Bookmark size={18} className={recipe.bookmarked ? "fill-current" : ""} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowScheduleModal(recipe);
                                    }}
                                    className="flex items-center gap-1 bg-[#fed01b] text-slate-900 border border-amber-600 text-[10px] uppercase tracking-wider font-mono px-3 py-1.5 rounded-full font-bold"
                                  >
                                    Plan
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          // Standard Grid Item
                          <>
                            <div className="relative aspect-video w-full overflow-hidden bg-slate-100 z-0">
                              <img 
                                alt={recipe.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                                src={recipe.image}
                              />
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 z-10 text-slate-700 font-mono text-[10px] font-semibold">
                                <Clock size={10} className="text-slate-800" />
                                {recipe.time}
                              </div>
                            </div>

                            <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-mono font-bold tracking-widest text-[#735c00] uppercase block">{recipe.category}</span>
                                <h3 className="text-lg font-bold text-[#091426] line-clamp-1 group-hover:text-[#735c00] transition-colors">{recipe.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{recipe.description}</p>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {recipe.tags.slice(0, 3).map(t => (
                                  <span key={t} className="text-[8px] font-mono tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">#{t}</span>
                                ))}
                              </div>

                              <div className="pt-3 border-t border-slate-150 flex items-center justify-between">
                                <div className="flex items-center gap-1 font-mono text-xs text-slate-700">
                                  <Star size={12} className="fill-current text-[#fed01b]" />
                                  {recipe.rating}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => toggleBookmark(e, recipe)}
                                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-450 hover:text-amber-500 transition-all"
                                  >
                                    <Bookmark size={16} className={recipe.bookmarked ? "fill-current text-amber-500" : ""} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowScheduleModal(recipe);
                                    }}
                                    className="flex items-center gap-1 bg-[#091426] text-white hover:bg-slate-800 text-[9px] uppercase tracking-wider font-mono px-2.5 py-1.5 rounded font-medium"
                                  >
                                    <Calendar size={10} /> Assign
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe.id); }}
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all ml-1"
                                    title="Retire recipe"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.article>
                    );
                  })}
                </div>
              )}

            </motion.div>
          )}

          {/* ======================= TAB 2: MEAL PLANNER GRID WORKSPACE ======================= */}
          {activeTab === "planner" && (
            <motion.div 
              key="planner-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#091426]">Weekly Chef Planner</h2>
                  <p className="text-sm text-slate-500 mt-1">Populate menu cycles. Ingredients automatically compile into shopping sheets.</p>
                </div>
                
                <div className="bg-[#1e293b] text-white rounded-lg p-3 text-xs flex gap-4 font-mono">
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px]">Cycles Stocked</span>
                    <span className="text-[#fed01b] font-bold text-base">{getPlannedMealsCount()} Meals</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px]">Average rating</span>
                    <span className="text-[#fed01b] font-bold text-base">★ 4.9</span>
                  </div>
                </div>
              </div>

              {/* Weekly Calendar Grid columns */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {(Object.keys(mealPlan) as Array<keyof MealPlan>).map((day) => {
                  const dayPlan = mealPlan[day];
                  return (
                    <div key={day} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full min-h-[290px] shadow-sm">
                      {/* Day Card Header */}
                      <div className="bg-[#091426] text-white p-2.5 text-center font-semibold text-xs tracking-wider uppercase font-headline-md">
                        {day}
                      </div>

                      {/* Cycles Slots */}
                      <div className="p-3 flex-grow flex flex-col gap-3 justify-between">
                        
                        {/* Breakfast Slot */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono tracking-widest text-[#735c00] uppercase block font-semibold">Breakfast Slot</span>
                          {dayPlan.breakfast ? (
                            <div className="bg-slate-50 hover:bg-slate-100 p-2 rounded border border-slate-150 flex items-center justify-between gap-1 group cursor-pointer" onClick={() => setFocusedRecipe(dayPlan.breakfast || null)}>
                              <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-grow pr-1">{dayPlan.breakfast.name}</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); scheduleRecipe(day, "breakfast", undefined); }}
                                className="text-slate-400 hover:text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                // Assign via local mock model popup
                                setShowScheduleModal(recipesList[0]); // default
                                // Setting global trigger to choose specific day slot
                                (window as any)._targetDay = day;
                                (window as any)._targetSlot = "breakfast";
                              }}
                              className="w-full bg-slate-50 border border-dashed border-slate-200/80 rounded py-2 text-center hover:bg-slate-100 text-[10px] text-slate-400 font-mono"
                            >
                              + Assign Meal
                            </button>
                          )}
                        </div>

                        {/* Lunch Slot */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono tracking-widest text-indigo-700 uppercase block font-semibold">Lunch Slot</span>
                          {dayPlan.lunch ? (
                            <div className="bg-slate-50 hover:bg-slate-100 p-2 rounded border border-slate-150 flex items-center justify-between gap-1 group cursor-pointer" onClick={() => setFocusedRecipe(dayPlan.lunch || null)}>
                              <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-grow pr-1">{dayPlan.lunch.name}</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); scheduleRecipe(day, "lunch", undefined); }}
                                className="text-slate-400 hover:text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setShowScheduleModal(recipesList[0]);
                                (window as any)._targetDay = day;
                                (window as any)._targetSlot = "lunch";
                              }}
                              className="w-full bg-slate-50 border border-dashed border-slate-200/80 rounded py-2 text-center hover:bg-slate-100 text-[10px] text-slate-400 font-mono"
                            >
                              + Assign Meal
                            </button>
                          )}
                        </div>

                        {/* Dinner Slot */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono tracking-widest text-emerald-800 uppercase block font-semibold">Dinner Slot</span>
                          {dayPlan.dinner ? (
                            <div className="bg-slate-50 hover:bg-slate-100 p-2 rounded border border-slate-150 flex items-center justify-between gap-1 group cursor-pointer" onClick={() => setFocusedRecipe(dayPlan.dinner || null)}>
                              <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-grow pr-1">{dayPlan.dinner.name}</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); scheduleRecipe(day, "dinner", undefined); }}
                                className="text-slate-400 hover:text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setShowScheduleModal(recipesList[0]);
                                (window as any)._targetDay = day;
                                (window as any)._targetSlot = "dinner";
                              }}
                              className="w-full bg-slate-50 border border-dashed border-slate-200/80 rounded py-2 text-center hover:bg-slate-100 text-[10px] text-slate-400 font-mono"
                            >
                              + Assign Meal
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative advice for planner sync */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <Info className="text-[#735c00] flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-amber-900 space-y-1 font-body-md">
                  <p className="font-semibold">Mise en Place Engine Active:</p>
                  <p>Adding/scheduling recipes dynamically aggregates all necessary raw material metrics on the **Grocery Cart** tab. It checks matching pantry staples (e.g. olive oil, water, salts) and automatically subtracts them from the listing to minimize double buying.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================= TAB 3: SMART RECIPE TRANSCRIPT TEXT SCANNER ======================= */}
          {activeTab === "scanner" && (
            <motion.div 
              key="scanner-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#091426]">AI Recipe Parser</h2>
                  <p className="text-sm text-slate-500 mt-1">Convert sloppy cookbook scribbles, email snippets, or web screenshots directly.</p>
                </div>
                
                {/* Preset helpers */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => applyPresetScan("salmon")}
                    className="p-2 bg-white border border-slate-300 rounded text-[10px] font-mono hover:bg-slate-100 uppercase"
                  >
                    Draft: Salmon Fillet
                  </button>
                  <button 
                    onClick={() => applyPresetScan("cookie")}
                    className="p-2 bg-white border border-slate-300 rounded text-[10px] font-mono hover:bg-slate-100 uppercase"
                  >
                    Draft: Lava Cake
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Input block */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                    <label className="text-xs font-mono tracking-wider uppercase text-slate-500 font-bold block">Raw recipe text / OCR data block:</label>
                    <textarea 
                      placeholder="Paste instructions, steps, ingredients block scribbled from note pads..."
                      value={scannerInput}
                      onChange={(e) => setScannerInput(e.target.value)}
                      disabled={scanningAI}
                      className="w-full bg-[#f2f4f6] border-none text-slate-900 placeholder-slate-400 rounded-lg p-4 text-sm font-body-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                      rows={12}
                    />

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={triggerTextScan}
                        disabled={scanningAI || !scannerInput.trim()}
                        className="flex items-center gap-2 bg-[#091426] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-40 animate-pulse-once"
                      >
                        {scanningAI ? "Processing metrics..." : "Structure Recipe with Gemini"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status/Output Logs */}
                <div className="space-y-4">
                  <div className="bg-neutral-900 text-emerald-400 p-6 rounded-2xl border border-neutral-800 space-y-4 min-h-[360px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4 h-6">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">System Logs Terminal</span>
                        <div className="flex gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono space-y-2 h-[220px] overflow-y-auto leading-relaxed">
                        {scannerLogText.length === 0 ? (
                          <p className="text-neutral-500">&gt;_ Waiting for input block compilation parameters...</p>
                        ) : (
                          scannerLogText.map((log, lidx) => (
                            <p key={lidx} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("[SUCCESS]") ? "text-[#fed01b] font-bold" : ""}>
                              {log}
                            </p>
                          ))
                        )}
                        {scanningAI && (
                          <p className="animate-pulse">_ Generating schema parameters...</p>
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-neutral-500 uppercase border-t border-neutral-800 pt-3">
                      Powered by google/genai 2.4.0 sdk
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ======================= TAB 4: COMPILATION GROCERY CART PAGE ======================= */}
          {activeTab === "groceries" && (
            <motion.div 
              key="groceries-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#091426]">Gourmet Provision Cart</h2>
                  <p className="text-sm text-slate-500 mt-1">Compiled in real-time based on active scheduled planned cycles.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Provision Shopping Items List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <span className="text-xs font-mono tracking-wider uppercase text-slate-500 font-bold">Materials required compile</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-mono font-bold">Qty: {getCompiledGroceries().length} items</span>
                    </div>

                    {getCompiledGroceries().length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-3">
                        <CheckSquare className="mx-auto text-slate-350" size={32} />
                        <p className="text-xs font-mono">No grocery metrics compiled yet. Assign meals in your **Planner** calendar first!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {getCompiledGroceries().map((item) => (
                          <div key={item.id} className="py-3 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={item.purchased}
                                onChange={() => {
                                  // toggle custom items
                                  if (item.id.startsWith("manual-gro")) {
                                    setCustomShoppingItems(prev => prev.map(si => si.id === item.id ? { ...si, purchased: !si.purchased } : si));
                                  } else {
                                    // Local UI toggle flag or simple notification
                                    item.purchased = !item.purchased;
                                    setSyncState("syncing");
                                    setTimeout(() => setSyncState("idle"), 200);
                                  }
                                }}
                                className="w-4.5 h-4.5 text-[#091426] border-slate-300 rounded focus:ring-0"
                              />
                              <div>
                                <p className={`text-sm font-semibold text-slate-800 ${item.purchased ? "line-through text-slate-400" : ""}`}>{item.name}</p>
                                <span className="text-[10px] font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded mr-1">Measure: {item.amount}</span>
                                {item.recipeName && (
                                  <span className="text-[10px] text-slate-400">Context: ({item.recipeName})</span>
                                )}
                              </div>
                            </div>

                            {/* Remove Trigger for manual items */}
                            {item.id.startsWith("manual-gro") && (
                              <button 
                                onClick={() => setCustomShoppingItems(prev => prev.filter(si => si.id !== item.id))}
                                className="text-slate-300 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Manual Grocery appending */}
                    <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4 leading-none">
                      <input 
                        type="text" 
                        placeholder="e.g. Scouring sponge..." 
                        value={manualGroceryItem}
                        onChange={(e) => setManualGroceryItem(e.target.value)}
                        className="bg-[#f2f4f6] text-[#091426] text-xs py-2 px-3 focus:outline-none rounded-lg flex-grow"
                      />
                      <button 
                        onClick={addManualGrocery}
                        className="bg-slate-900 text-white text-xs px-4 py-2 rounded-lg font-mono tracking-wider font-semibold uppercase"
                      >
                        Append
                      </button>
                    </div>

                  </div>
                </div>

                {/* Pantry Staples List inventory configuration */}
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                    <div>
                      <h4 className="font-headline-md font-bold text-sm text-[#091426] uppercase tracking-wider">Chef Pantry Staples</h4>
                      <p className="text-[11px] text-slate-400">Active staples stocked. Checking true automatically subtracts them from grocery compilations.</p>
                    </div>

                    <div className="space-y-2.5">
                      {pantryInventory.map((pantry) => (
                        <div key={pantry.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-all">
                          <span className="text-xs font-semibold text-slate-800">{pantry.name}</span>
                          <button
                            onClick={() => togglePantryStock(pantry.id)}
                            className={`text-[9px] font-mono uppercase tracking-wider px-2.5 py-1 rounded font-bold transition-all ${pantry.inStock ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300" : "bg-red-50 text-red-700 border border-red-200"}`}
                          >
                            {pantry.inStock ? "In Stock" : "Out of stock"}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Pantry Custom */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <input 
                        type="text" 
                        placeholder="e.g. Canola oil..." 
                        value={newPantryName}
                        onChange={(e) => setNewPantryName(e.target.value)}
                        className="text-[11px] border border-slate-300 rounded p-1 w-full"
                      />
                      <button 
                        onClick={addCustomPantry}
                        className="bg-[#091426] text-white text-[11px] font-mono font-bold px-3 py-1 rounded"
                      >
                        + Add
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ======================= TAB 5: CHEF WORKSPACE / ACCOUNT TAB ======================= */}
          {activeTab === "account" && (
            <motion.div 
              key="account-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Banner with Profile Details embedded directly */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#091426] relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[160px]">
                  {/* Top right label */}
                  <span className="absolute top-4 right-4 text-xs font-mono tracking-widest text-[#fed01b] select-none uppercase font-semibold">Chef Workspace</span>
                  
                  <div className="flex items-center gap-5 mt-4 md:mt-0">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-800 overflow-hidden shadow-lg bg-white flex-shrink-0">
                      <img 
                        alt="Chef Profile Avatar" 
                        className="w-full h-full object-cover" 
                        src="/src/assets/images/chef_avatar_1780262086540.png"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-none">Angel Acosta</h3>
                      <p className="text-sm text-slate-300 font-mono select-all">Mr.AngelAcosta@gmail.com</p>
                    </div>
                  </div>

                  <div className="text-xs font-mono bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 space-y-1 text-slate-300 md:self-center self-start">
                    <p><span className="text-slate-400">Environment:</span> Production Sandbox</p>
                    <p><span className="text-slate-400">Gemini SDK model:</span> gemini-3.5-flash (paid flow supported)</p>
                  </div>
                </div>

                {/* Profile Details layout */}
                <div className="px-6 py-6 relative">
                  {/* Active Metrics Bento Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#f2f4f6] p-4 rounded-xl text-center space-y-1 border border-slate-200">
                      <BookOpen className="text-indigo-900 mx-auto" size={18} />
                      <span className="text-[10px] uppercase font-mono text-slate-400 block pt-1">Active Recipes</span>
                      <span className="text-lg font-bold text-[#091426]">{recipesList.length} Items</span>
                    </div>

                    <div className="bg-[#f2f4f6] p-4 rounded-xl text-center space-y-1 border border-slate-200">
                      <Bookmark className="text-amber-600 mx-auto fill-current" size={18} />
                      <span className="text-[10px] uppercase font-mono text-slate-400 block pt-1">Saved Bookmarks</span>
                      <span className="text-lg font-bold text-[#091426]">{recipesList.filter(r => r.bookmarked).length} Recipes</span>
                    </div>

                    <div className="bg-[#f2f4f6] p-4 rounded-xl text-center space-y-1 border border-slate-200">
                      <Calendar className="text-emerald-800 mx-auto" size={18} />
                      <span className="text-[10px] uppercase font-mono text-slate-400 block pt-1">Planned Cycles</span>
                      <span className="text-lg font-bold text-[#091426]">{getPlannedMealsCount()} Weekly</span>
                    </div>

                    <div className="bg-[#f2f4f6] p-4 rounded-xl text-center space-y-1 border border-slate-200">
                      <Clock className="text-orange-850 mx-auto" size={18} />
                      <span className="text-[10px] uppercase font-mono text-slate-400 block pt-1">Timers linked</span>
                      <span className="text-lg font-bold text-[#091426]">{timerDuration > 0 ? "1 Active" : "0 Standby"}</span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                    <h4 className="font-headline-md font-bold text-sm text-[#091426] uppercase tracking-wider">Cully Digital License</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-body-md bg-opacity-10">
                      This system leverages **Mise en Place** principles of kitchen management. It coordinates data sync states, aggregates groceries from recipes, links active cooking checkmarks to timer processes, and processes raw unstructured scribbles directly via Gemini AI pipelines.
                    </p>
                  </div>

                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ================================= BOTTOM NAV PILLS (MOBILE ONLY) ================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#091426] border-t border-slate-800 flex justify-around items-center z-40 px-3">
        <button 
          onClick={() => setActiveTab("recipes")}
          className={`flex flex-col items-center gap-1 text-[10px] uppercase font-semibold font-mono tracking-tighter ${activeTab === "recipes" ? "text-[#fed01b]" : "text-slate-400"}`}
        >
          <BookOpen size={16} />
          Recipes
        </button>
        <button 
          onClick={() => setActiveTab("planner")}
          className={`flex flex-col items-center gap-1 text-[10px] uppercase font-semibold font-mono tracking-tighter ${activeTab === "planner" ? "text-[#fed01b]" : "text-slate-400"}`}
        >
          <Calendar size={16} />
          Planner
        </button>
        <button 
          onClick={() => setActiveTab("scanner")}
          className={`flex flex-col items-center gap-1 text-[10px] uppercase font-semibold font-mono tracking-tighter ${activeTab === "scanner" ? "text-[#fed01b]" : "text-slate-400"}`}
        >
          <ScanLine size={16} />
          Scanner
        </button>
        <button 
          onClick={() => setActiveTab("groceries")}
          className={`flex flex-col items-center gap-1 text-[10px] uppercase font-semibold font-mono tracking-tighter ${activeTab === "groceries" ? "text-[#fed01b]" : "text-slate-400"}`}
        >
          <ShoppingCart size={16} />
          Provision
        </button>
        <button 
          onClick={() => setActiveTab("account")}
          className={`flex flex-col items-center gap-1 text-[10px] uppercase font-semibold font-mono tracking-tighter ${activeTab === "account" ? "text-[#fed01b]" : "text-slate-400"}`}
        >
          <User size={16} />
          Workspace
        </button>
      </nav>

      {/* ========================================================================================================= */}
      {/* ============================================== PANE MODALS ============================================== */}
      {/* ========================================================================================================= */}

      <AnimatePresence>
        
        {/* ======================= MODAL A: RECIPE DETAILS FOCUS DRAWER ======================= */}
        {focusedRecipe && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto flex justify-end"
            onClick={() => setFocusedRecipe(null)}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-4xl bg-[#f7f9fb] min-h-screen text-[#191c1e] p-6 md:p-8 space-y-6 flex flex-col justify-between shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Handle / Corner button */}
              <button 
                onClick={() => setFocusedRecipe(null)}
                className="absolute top-4 left-4 bg-white/20 text-white rounded-full p-2 hover:bg-white/40 transition-all z-20"
              >
                <ChevronRight size={20} className="transform rotate-180" />
              </button>

              <div className="space-y-6 flex-grow pb-10">
                {/* Visual Banner */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 relative">
                  <img 
                    alt={focusedRecipe.name} 
                    className="w-full h-full object-cover opacity-80" 
                    src={focusedRecipe.image} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-6 left-6 text-white space-y-1">
                    <span className="text-[10px] tracking-widest font-mono uppercase bg-amber-500 text-slate-900 font-bold px-2.5 py-1 rounded select-none">{focusedRecipe.category}</span>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white pt-2">{focusedRecipe.name}</h2>
                    <p className="text-xs text-slate-300 font-mono flex items-center gap-1 pt-1">
                      <Star size={12} className="fill-current text-[#fed01b]" /> {focusedRecipe.rating} ★ Cook time: {focusedRecipe.time}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 border-l-4 border-[#091426] pl-4 font-body-md">{focusedRecipe.description}</p>

                {/* Sub-tag indicators */}
                <div className="flex gap-1.5 flex-wrap">
                  {focusedRecipe.tags.map(t => (
                    <span key={t} className="text-[9px] font-mono uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">#{t}</span>
                  ))}
                </div>

                {/* Focus Split Workspace */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  
                  {/* Ingredients Checklist Pane */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h4 className="font-headline-md font-bold text-sm text-[#091426] uppercase">Mise en Place Checklist</h4>
                      <button 
                        onClick={() => setCheckedIngredients({})}
                        className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-red-500"
                      >
                        Reset Checklists
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">Verify and prepare measured items before cooking trigger:</p>

                    <div className="space-y-2">
                      {focusedRecipe.ingredients.map((ing, idx) => {
                        const checkKey = `${focusedRecipe.id}-${idx}`;
                        const isChecked = !!checkedIngredients[checkKey];
                        
                        return (
                          <div 
                            key={idx} 
                            onClick={() => setCheckedIngredients({ ...checkedIngredients, [checkKey]: !isChecked })}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? "bg-emerald-55/40 border-emerald-300/40 opacity-50" : "bg-white border-slate-220 hover:border-slate-400"}`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? "bg-emerald-600 border-emerald-700 text-white" : "border-slate-350 bg-white"}`}>
                              {isChecked && <Check size={10} />}
                            </div>

                            <div className="flex justify-between w-full text-xs">
                              <span className={`font-semibold ${isChecked ? "line-through text-slate-400" : "text-slate-800"}`}>{ing.name}</span>
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 text-[10px]">{ing.amount}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instructions sequential walkthrough pane */}
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-slate-200">
                      <h4 className="font-headline-md font-bold text-sm text-[#091426] uppercase">Walkthrough steps</h4>
                    </div>

                    <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
                      {focusedRecipe.instructions.map((step, idx) => {
                        const isFocused = focusedStepIndex === idx;
                        const timerTrigger = scanTimerTrigger(step);

                        return (
                          <div 
                            key={idx} 
                            onClick={() => setFocusedStepIndex(isFocused ? null : idx)}
                            className={`p-3.5 rounded-lg border transition-all cursor-pointer ${isFocused ? "bg-[#091426] text-white border-[#091426] shadow-md" : "bg-white border-slate-220 hover:border-slate-300 text-slate-700"}`}
                          >
                            <div className="flex gap-2.5 items-start">
                              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${isFocused ? "bg-[#fed01b] text-slate-900" : "bg-slate-100 text-slate-600"}`}>
                                {idx + 1}
                              </span>
                              <div className="text-xs leading-relaxed space-y-2 flex-grow">
                                <p>{step}</p>
                                
                                {/* Micro Timer Trigger if parsed */}
                                {timerTrigger.hasTimer && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startTimer(timerTrigger.minutes * 60, `Step ${idx+1} for ${focusedRecipe.name}`);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider mt-2 transition-all ${isFocused ? "bg-[#fed01b] text-slate-900 hover:brightness-110" : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"}`}
                                  >
                                    <Clock size={10} /> Link Cooking Timer ({timerTrigger.minutes}m)
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

              {/* Drawer footer Controls */}
              <div className="border-t border-slate-200 pt-4 flex gap-4 justify-between items-center bg-transparent z-10">
                <button 
                  onClick={() => setFocusedRecipe(null)}
                  className="px-6 py-2.5 border border-slate-350 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-lg font-mono"
                >
                  Close Focus Mode
                </button>

                <div className="flex gap-3">
                  <button 
                    onClick={(e) => toggleBookmark(e, focusedRecipe)}
                    className="p-3 border border-slate-350 rounded-lg hover:bg-slate-100 transition-all"
                  >
                    <Bookmark size={16} className={focusedRecipe.bookmarked ? "fill-amber-600 text-amber-600" : "text-slate-500"} />
                  </button>

                  <button 
                    onClick={() => setShowScheduleModal(focusedRecipe)}
                    className="bg-[#fed01b] border border-[#6f5900] text-slate-900 hover:brightness-105 font-bold text-xs uppercase px-6 py-2.5 rounded-lg font-mono tracking-wider"
                  >
                    Set Week Planner
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}

        {/* ======================= MODAL B: WEEK ORGANIZER ALLOTMENT SELECTION MODAL ======================= */}
        {showScheduleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-6"
            onClick={() => setShowScheduleModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#091426] text-white p-5">
                <h3 className="font-headline-md font-bold text-base">Schedule Week Menu</h3>
                <p className="text-xs text-slate-400 mt-1">Scurry assign "{showScheduleModal.name}" to cycle slots.</p>
              </div>

              {/* Selection Grids */}
              <div className="p-5 space-y-4">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Choose day of the week:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as Array<keyof MealPlan>).map((day) => (
                    <div key={day} className="border border-slate-200 rounded p-2 text-center bg-slate-50">
                      <span className="text-[11px] font-mono block font-bold text-[#091426] mb-1.5 uppercase">{day}</span>
                      <div className="flex flex-col gap-1 text-[10px] uppercase font-semibold">
                        <button 
                          onClick={() => scheduleRecipe(day, "breakfast", showScheduleModal)} 
                          className="w-full py-1 bg-white hover:bg-amber-100 hover:border-amber-400 border border-slate-200 rounded font-mono text-[9px]"
                        >
                          + Breakfast
                        </button>
                        <button 
                          onClick={() => scheduleRecipe(day, "lunch", showScheduleModal)}
                          className="w-full py-1 bg-white hover:bg-indigo-105 hover:border-indigo-400 border border-slate-200 rounded font-mono text-[9px]"
                        >
                          + Lunch
                        </button>
                        <button 
                          onClick={() => scheduleRecipe(day, "dinner", showScheduleModal)}
                          className="w-full py-1 bg-white hover:bg-emerald-105 hover:border-emerald-400 border border-slate-200 rounded font-mono text-[9px]"
                        >
                          + Dinner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 flex justify-end">
                <button 
                  onClick={() => setShowScheduleModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-600 uppercase font-mono"
                >
                  Cancel Planning
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ======================= MODAL C: HAND-CRAFT MANUAL RECIPE MODAL ======================= */}
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[55] flex items-center justify-center p-6 overflow-y-auto"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden text-slate-800 flex flex-col justify-between max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#091426] text-white p-5">
                <h3 className="font-headline-md font-bold text-base">Handcraft Manual Recipe</h3>
                <p className="text-xs text-slate-400 mt-1">Formulate physical chits directly in your collective vault.</p>
              </div>

              <div className="p-5 flex-grow overflow-y-auto space-y-4">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Recipe Title:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Classic Beef Carbonnade..." 
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-[#091426]"
                      value={manualRecipeName}
                      onChange={(e) => setManualRecipeName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Total Duration time:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 45m or 1h 15m..." 
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-[#091426]"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Category Tag:</label>
                    <select 
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none"
                    >
                      <option value="Quick Meals">Quick Meals</option>
                      <option value="Appetizers">Appetizers</option>
                      <option value="Baking">Baking</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Brief Narrative bio:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A rich, buttery roast highlight designed for late autumnal nights..." 
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-[#091426]"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sub ingredients arrays dynamic addition */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Measured ingredients required:</label>
                    <button 
                      onClick={() => setManualIngredients([...manualIngredients, { name: "", amount: "" }])}
                      className="text-[10px] font-mono text-[#735c00] hover:underline font-bold"
                    >
                      + Add Item row
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {manualIngredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ingredient item name..." 
                          className="border border-slate-300 rounded p-1.5 text-xs w-2/3"
                          value={ing.name}
                          onChange={(e) => {
                            const updated = [...manualIngredients];
                            updated[idx].name = e.target.value;
                            setManualIngredients(updated);
                          }}
                        />
                        <input 
                          type="text" 
                          placeholder="e.g. 200g, 4 units" 
                          className="border border-slate-300 rounded p-1.5 text-xs w-1/3 font-mono"
                          value={ing.amount}
                          onChange={(e) => {
                            const updated = [...manualIngredients];
                            updated[idx].amount = e.target.value;
                            setManualIngredients(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub sequential manual steps */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">walkthrough instructions steps:</label>
                    <button 
                      onClick={() => setManualInstructions([...manualInstructions, ""])}
                      className="text-[10px] font-mono text-[#735c00] hover:underline font-bold"
                    >
                      + Append walkthrough step
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[145px] overflow-y-auto">
                    {manualInstructions.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="font-mono text-xs text-slate-400 font-bold">#{idx+1}</span>
                        <input 
                          type="text" 
                          placeholder="Bake until golden fluff envelopes center..." 
                          className="border border-slate-300 rounded p-1.5 text-xs w-full"
                          value={step}
                          onChange={(e) => {
                            const updated = [...manualInstructions];
                            updated[idx] = e.target.value;
                            setManualInstructions(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub custom tags input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#735c00] font-bold">Filter tags (comma-separated):</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Roast, Autumn, Classics, Butter..." 
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none"
                    value={manualTagsInput}
                    onChange={(e) => setManualTagsInput(e.target.value)}
                  />
                </div>

              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#ba1a1a] text-[#ba1a1a] rounded text-xs font-semibold uppercase font-mono"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddNewManualRecipe}
                  className="bg-[#091426] text-white px-6 py-2 rounded text-xs font-bold uppercase font-mono tracking-wider"
                >
                  Format Add Recipe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
