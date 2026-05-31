export interface Ingredient {
  name: string;
  amount: string;
  stocked?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  time: string; // e.g. "45m", "1h 20m"
  rating: number; // 4.5 - 5.0
  category: string; // "Appetizers" | "Baking" | "Quick Meals" | "Desserts"
  image: string; // image URL (or base64)
  tags: string[]; // custom tags
  meals?: string[]; // e.g. ["solo", "family"]
  ingredients: Ingredient[];
  instructions: string[];
  bookmarked?: boolean;
  nutrition?: NutritionInfo;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs?: number;
}

export interface MealPlanDay {
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner?: Recipe;
}

export interface MealPlan {
  Monday: MealPlanDay;
  Tuesday: MealPlanDay;
  Wednesday: MealPlanDay;
  Thursday: MealPlanDay;
  Friday: MealPlanDay;
  Saturday: MealPlanDay;
  Sunday: MealPlanDay;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  purchased: boolean;
  recipeName?: string;
  category?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category?: string;
  inStock: boolean;
}
