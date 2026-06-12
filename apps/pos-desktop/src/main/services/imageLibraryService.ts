import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { FoodImageAsset, FoodImageCategory, FoodImageLibraryStatus } from "@restrozapp/shared";
import { getMenuImageDir } from "../config/paths";
import { readActivationState } from "./stateStore";

type CatalogEntry = {
  id: string;
  title: string;
  category: FoodImageCategory;
  tags: string[];
  photoId: string;
};

type DownloadState = {
  status: FoodImageAsset["status"];
  error?: string;
  updatedAt: string;
};

const categories = {
  pizza: ["pizza", "cheese", "italian"],
  burgers: ["burger", "zinger", "fast food"],
  desi: ["desi", "pakistani", "curry"],
  bbq: ["bbq", "grill", "kebab"],
  chicken: ["chicken", "fried", "wings"],
  rice: ["rice", "biryani", "pulao"],
  pasta: ["pasta", "noodles", "italian"],
  sandwiches: ["sandwich", "roll", "wrap"],
  breakfast: ["breakfast", "eggs", "paratha"],
  desserts: ["dessert", "cake", "ice cream"],
  drinks: ["drink", "coffee", "juice"],
} as const;

const catalog: CatalogEntry[] = [
  { id: "pizza-margherita", title: "Classic Cheese Pizza", category: "pizza", tags: [...categories.pizza, "margherita"], photoId: "1574071318508-1cdbab80d002" },
  { id: "pizza-sliced", title: "Fresh Sliced Pizza", category: "pizza", tags: [...categories.pizza, "slices"], photoId: "1513104890138-7c749659a591" },
  { id: "pizza-oven", title: "Oven Baked Pizza", category: "pizza", tags: [...categories.pizza, "oven"], photoId: "1565299624946-b28f40a0ae38" },
  { id: "burger-classic", title: "Classic Beef Burger", category: "burgers", tags: [...categories.burgers, "beef"], photoId: "1568901346375-23c9450c58cd" },
  { id: "burger-double", title: "Double Burger", category: "burgers", tags: [...categories.burgers, "double"], photoId: "1550547660-d9450f859349" },
  { id: "burger-chicken", title: "Crispy Chicken Burger", category: "burgers", tags: [...categories.burgers, "crispy"], photoId: "1571091718767-18b5b1457add" },
  { id: "biryani", title: "Chicken Biryani", category: "rice", tags: [...categories.rice, "chicken"], photoId: "1563379926898-05f4575a45d8" },
  { id: "rice-bowl", title: "Seasoned Rice Bowl", category: "rice", tags: [...categories.rice, "bowl"], photoId: "1512058564366-18510be2db19" },
  { id: "curry", title: "Traditional Curry", category: "desi", tags: [...categories.desi, "karahi"], photoId: "1601050690597-df0568f70950" },
  { id: "desi-platter", title: "Desi Food Platter", category: "desi", tags: [...categories.desi, "platter"], photoId: "1585937421612-70a008356fbe" },
  { id: "grilled-meat", title: "Charcoal Grilled Meat", category: "bbq", tags: [...categories.bbq, "meat"], photoId: "1529193591184-b1d58069ecdd" },
  { id: "steak", title: "Grilled Steak", category: "bbq", tags: [...categories.bbq, "steak"], photoId: "1546833999-b9f581a1996d" },
  { id: "kebab", title: "Grilled Kebabs", category: "bbq", tags: [...categories.bbq, "seekh"], photoId: "1603360946369-dc9bb6258143" },
  { id: "fried-chicken", title: "Crispy Fried Chicken", category: "chicken", tags: [...categories.chicken, "crispy"], photoId: "1562967914-608f82629710" },
  { id: "chicken-wings", title: "Chicken Wings", category: "chicken", tags: [...categories.chicken, "hot wings"], photoId: "1527477396000-e27163b481c2" },
  { id: "roast-chicken", title: "Roast Chicken", category: "chicken", tags: [...categories.chicken, "roast"], photoId: "1598103442097-8b74394b95c6" },
  { id: "pasta-creamy", title: "Creamy Pasta", category: "pasta", tags: [...categories.pasta, "creamy"], photoId: "1473093295043-cdd812d0e601" },
  { id: "pasta-tomato", title: "Tomato Pasta", category: "pasta", tags: [...categories.pasta, "tomato"], photoId: "1551892374-ecf8754cf8b0" },
  { id: "sandwich-club", title: "Club Sandwich", category: "sandwiches", tags: [...categories.sandwiches, "club"], photoId: "1528735602780-2552fd46c7af" },
  { id: "wrap", title: "Chicken Wrap", category: "sandwiches", tags: [...categories.sandwiches, "chicken"], photoId: "1626700051175-6818013e1d4f" },
  { id: "fries", title: "Crispy Fries", category: "popular", tags: ["fries", "starter", "fast food"], photoId: "1573080496219-bb080dd4f877" },
  { id: "salad", title: "Fresh Salad", category: "popular", tags: ["salad", "fresh", "healthy"], photoId: "1540420773420-3366772f4999" },
  { id: "breakfast-eggs", title: "Egg Breakfast", category: "breakfast", tags: [...categories.breakfast, "omelette"], photoId: "1525351484163-7529414344d8" },
  { id: "pancakes", title: "Breakfast Pancakes", category: "breakfast", tags: [...categories.breakfast, "pancakes"], photoId: "1528207776546-365bb710ee93" },
  { id: "cake", title: "Chocolate Cake", category: "desserts", tags: [...categories.desserts, "chocolate"], photoId: "1578985545062-69928b1d9587" },
  { id: "ice-cream", title: "Ice Cream", category: "desserts", tags: [...categories.desserts, "cold"], photoId: "1563805042-7684c019e1cb" },
  { id: "dessert-cup", title: "Cream Dessert", category: "desserts", tags: [...categories.desserts, "cream"], photoId: "1551024506-0bccd828d307" },
  { id: "coffee", title: "Hot Coffee", category: "drinks", tags: [...categories.drinks, "hot"], photoId: "1495474472287-4d71bcdd2085" },
  { id: "cold-drink", title: "Cold Beverage", category: "drinks", tags: [...categories.drinks, "cold"], photoId: "1544145945-f90425340c7e" },
  { id: "juice", title: "Fresh Juice", category: "drinks", tags: [...categories.drinks, "fresh"], photoId: "1600271886742-f049cd451bba" },
];

let workerTimer: NodeJS.Timeout | null = null;
let processing = false;
let notify: (() => void) | null = null;
let online = true;

function restaurantCode() {
  const state = readActivationState();
  return state.status === "approved" ? state.restaurant?.restaurantCode || "" : "";
}

function statePath(code: string) {
  return path.join(getMenuImageDir(code), "library-state.json");
}

function imagePath(code: string, id: string) {
  return path.join(getMenuImageDir(code), `library-${id}.jpg`);
}

function remoteUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=520&h=390&q=82`;
}

function readState(code: string): Record<string, DownloadState> {
  try {
    return JSON.parse(fs.readFileSync(statePath(code), "utf8"));
  } catch {
    return {};
  }
}

function writeState(code: string, state: Record<string, DownloadState>) {
  fs.writeFileSync(statePath(code), JSON.stringify(state, null, 2), "utf8");
}

function normalizedState(code: string) {
  const state = readState(code);
  const now = new Date().toISOString();
  for (const item of catalog) {
    if (fs.existsSync(imagePath(code, item.id))) state[item.id] = { status: "ready", updatedAt: now };
    else if (!state[item.id] || state[item.id].status === "downloading") state[item.id] = { status: "queued", updatedAt: now };
  }
  writeState(code, state);
  return state;
}

export function listFoodImages(): FoodImageAsset[] {
  const code = restaurantCode();
  const state = code ? normalizedState(code) : {};
  return catalog.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    tags: item.tags,
    previewUrl: remoteUrl(item.photoId),
    localUrl: state[item.id]?.status === "ready" ? `restrozapp-media://menu/library-${item.id}.jpg` : "",
    sourceName: "Unsplash",
    sourceUrl: `https://unsplash.com/photos/${item.photoId}`,
    status: state[item.id]?.status || "queued",
    error: state[item.id]?.error,
  }));
}

export function getFoodImageLibraryStatus(): FoodImageLibraryStatus {
  const assets = listFoodImages();
  const count = (status: FoodImageAsset["status"]) => assets.filter((asset) => asset.status === status).length;
  return {
    total: assets.length,
    ready: count("ready"),
    queued: count("queued"),
    downloading: count("downloading"),
    failed: count("failed"),
    online,
    activeTitle: assets.find((asset) => asset.status === "downloading")?.title,
  };
}

async function processNext() {
  if (processing) return;
  const code = restaurantCode();
  if (!code) return;
  const state = normalizedState(code);
  const retryBefore = Date.now() - 30_000;
  for (const entry of catalog) {
    const current = state[entry.id];
    if (current?.status === "failed" && Date.parse(current.updatedAt) <= retryBefore) {
      state[entry.id] = { status: "queued", updatedAt: new Date().toISOString() };
    }
  }
  writeState(code, state);
  const item = catalog
    .filter((entry) => state[entry.id]?.status === "queued")
    .sort((a, b) => state[a.id].updatedAt.localeCompare(state[b.id].updatedAt))[0];
  if (!item) return;
  processing = true;
  state[item.id] = { status: "downloading", updatedAt: new Date().toISOString() };
  writeState(code, state);
  notify?.();
  try {
    const response = await fetch(remoteUrl(item.photoId), { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Download failed (${response.status}).`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 1_500_000) throw new Error("Downloaded image is invalid or too large.");
    const tempPath = `${imagePath(code, item.id)}.tmp`;
    fs.writeFileSync(tempPath, bytes);
    fs.renameSync(tempPath, imagePath(code, item.id));
    online = true;
    state[item.id] = { status: "ready", updatedAt: new Date().toISOString() };
  } catch (error) {
    online = false;
    state[item.id] = {
      status: "failed",
      error: error instanceof Error ? error.message : "Download failed.",
      updatedAt: new Date().toISOString(),
    };
  } finally {
    writeState(code, state);
    processing = false;
    notify?.();
    setTimeout(() => void processNext(), online ? 250 : 15_000);
  }
}

export function prioritizeFoodImage(id: string) {
  const code = restaurantCode();
  if (!code || !catalog.some((item) => item.id === id)) return { ok: false as const, error: "Image not found." };
  const state = normalizedState(code);
  if (state[id]?.status !== "ready") state[id] = { status: "queued", updatedAt: "0000-00-00T00:00:00.000Z" };
  writeState(code, state);
  void processNext();
  notify?.();
  return { ok: true as const, data: { queued: true as const } };
}

export function retryFoodImages() {
  const code = restaurantCode();
  if (!code) return { ok: false as const, error: "This device is not activated." };
  const state = normalizedState(code);
  for (const item of catalog) {
    if (state[item.id]?.status === "failed") state[item.id] = { status: "queued", updatedAt: new Date().toISOString() };
  }
  writeState(code, state);
  void processNext();
  notify?.();
  return { ok: true as const, data: getFoodImageLibraryStatus() };
}

export function copyLibraryImage(id: unknown) {
  if (typeof id !== "string" || !catalog.some((item) => item.id === id)) return "";
  const code = restaurantCode();
  const source = imagePath(code, id);
  if (!fs.existsSync(source)) throw new Error("This image is still downloading. Try again when it is ready.");
  const fileName = `${randomUUID()}.jpg`;
  fs.copyFileSync(source, path.join(getMenuImageDir(code), fileName));
  return fileName;
}

export function startFoodImageLibraryWorker(onChange: () => void) {
  notify = onChange;
  if (!workerTimer) workerTimer = setInterval(() => void processNext(), 15_000);
  void processNext();
}

export function stopFoodImageLibraryWorker() {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
  notify = null;
}
