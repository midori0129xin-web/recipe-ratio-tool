const STORAGE_KEY = "recipe-ratio-tool-v1";

const defaultRecipes = [
  {
    name: "油蔥粿",
    ingredients: [
      { name: "在來米粉", amount: 100 },
      { name: "水", amount: 350 },
      { name: "鹽", amount: 3 },
      { name: "白胡椒粉", amount: 3 },
      { name: "紅蔥頭", amount: 50 },
      { name: "蒜", amount: 1 },
      { name: "醬油", amount: 8 },
      { name: "砂糖", amount: 3 },
    ],
  },
  {
    name: "紅豆甜粿",
    ingredients: [
      { name: "糯米粉", amount: 600 },
      { name: "黑糖", amount: 350 },
      { name: "水", amount: 450 },
      { name: "蜜紅豆", amount: 1200 },
    ],
  },
  {
    name: "蜜紅豆",
    ingredients: [
      { name: "紅豆", amount: 600 },
      { name: "冰糖", amount: 600 },
      { name: "水", amount: 1800 },
    ],
  },
  {
    name: "白粿",
    ingredients: [
      { name: "在來米粉", amount: 100 },
      { name: "水", amount: 400 },
      { name: "鹽", amount: 3 },
      { name: "白胡椒粉", amount: 3 },
    ],
  },
  {
    name: "黑糖甜粿",
    ingredients: [
      { name: "糯米粉", amount: 600 },
      { name: "黑糖", amount: 350 },
      { name: "水", amount: 450 },
    ],
  },
  {
    name: "鬆餅",
    ingredients: [
      { name: "低筋麵粉", amount: 200 },
      { name: "泡打粉", amount: 8 },
      { name: "奶粉", amount: 64 },
      { name: "蛋", amount: 1 },
      { name: "橄欖油", amount: 30 },
      { name: "水", amount: 240 },
    ],
  },
  {
    name: "小糰子",
    ingredients: [
      { name: "無鹽奶油", amount: 100 },
      { name: "砂糖", amount: 100 },
      { name: "雞蛋", amount: 1 },
      { name: "中筋麵粉", amount: 180 },
      { name: "抹茶粉", amount: 20 },
      { name: "泡打粉", amount: 2 },
      { name: "巧克力粒", amount: 50 },
    ],
  },
];

let recipes = loadRecipes();
let selectedIndex = 0;
let mode = "single";
let editingIndex = null;

const recipeList = document.querySelector("#recipeList");
const recipeTitle = document.querySelector("#recipeTitle");
const ingredientSelect = document.querySelector("#ingredientSelect");
const targetAmount = document.querySelector("#targetAmount");
const precisionSelect = document.querySelector("#precisionSelect");
const resultBody = document.querySelector("#resultBody");
const singleSummary = document.querySelector("#singleSummary");
const pantrySummary = document.querySelector("#pantrySummary");
const pantryInputs = document.querySelector("#pantryInputs");
const singleMode = document.querySelector("#singleMode");
const pantryMode = document.querySelector("#pantryMode");
const extraHeader = document.querySelector("#extraHeader");
const recipeDialog = document.querySelector("#recipeDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const recipeNameInput = document.querySelector("#recipeNameInput");
const recipeTextInput = document.querySelector("#recipeTextInput");
const deleteRecipe = document.querySelector("#deleteRecipe");

document.querySelector("#addRecipe").addEventListener("click", () => openRecipeDialog());
document.querySelector("#editRecipe").addEventListener("click", () => openRecipeDialog(selectedIndex));
document.querySelector("#saveRecipe").addEventListener("click", saveRecipeFromDialog);
document.querySelector("#resetData").addEventListener("click", resetBuiltInRecipes);
deleteRecipe.addEventListener("click", removeRecipeFromDialog);
ingredientSelect.addEventListener("change", renderResults);
targetAmount.addEventListener("input", renderResults);
precisionSelect.addEventListener("change", renderResults);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    mode = tab.dataset.mode;
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    singleMode.classList.toggle("hidden", mode !== "single");
    pantryMode.classList.toggle("hidden", mode !== "pantry");
    renderResults();
  });
});

function loadRecipes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultRecipes);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : structuredClone(defaultRecipes);
  } catch {
    return structuredClone(defaultRecipes);
  }
}

function saveRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function currentRecipe() {
  return recipes[selectedIndex] ?? recipes[0];
}

function formatNumber(value) {
  const precision = Number(precisionSelect.value);
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(precision)).toLocaleString("zh-Hant", {
    maximumFractionDigits: precision,
  });
}

function renderRecipeList() {
  recipeList.innerHTML = "";
  recipes.forEach((recipe, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `recipe-item${index === selectedIndex ? " active" : ""}`;
    button.textContent = recipe.name;
    button.addEventListener("click", () => {
      selectedIndex = index;
      render();
    });
    recipeList.append(button);
  });
}

function renderIngredientControls() {
  const recipe = currentRecipe();
  recipeTitle.textContent = recipe.name;
  ingredientSelect.innerHTML = "";
  recipe.ingredients.forEach((ingredient) => {
    const option = document.createElement("option");
    option.value = ingredient.name;
    option.textContent = ingredient.name;
    ingredientSelect.append(option);
  });

  targetAmount.value = recipe.ingredients[0]?.amount ?? 0;
  pantryInputs.innerHTML = "";
  recipe.ingredients.forEach((ingredient) => {
    const label = document.createElement("label");
    label.innerHTML = `<span>${ingredient.name}</span>`;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.inputMode = "decimal";
    input.dataset.ingredient = ingredient.name;
    input.placeholder = String(ingredient.amount);
    input.addEventListener("input", renderResults);
    label.append(input);
    pantryInputs.append(label);
  });
}

function getSingleRatio() {
  const recipe = currentRecipe();
  const selected = recipe.ingredients.find((ingredient) => ingredient.name === ingredientSelect.value);
  const amount = Number(targetAmount.value);
  if (!selected || selected.amount <= 0 || !Number.isFinite(amount)) return 0;
  return amount / selected.amount;
}

function getPantryRatio() {
  const recipe = currentRecipe();
  const ratios = [];

  recipe.ingredients.forEach((ingredient) => {
    const input = pantryInputs.querySelector(`[data-ingredient="${CSS.escape(ingredient.name)}"]`);
    const amount = Number(input?.value);
    if (Number.isFinite(amount) && amount > 0 && ingredient.amount > 0) {
      ratios.push({
        ingredient: ingredient.name,
        ratio: amount / ingredient.amount,
      });
    }
  });

  if (!ratios.length) return { ratio: 1, limiter: null };

  const limiter = ratios.reduce((lowest, item) => (item.ratio < lowest.ratio ? item : lowest), ratios[0]);
  return {
    ratio: limiter.ratio,
    limiter: limiter.ingredient,
  };
}

function renderResults() {
  const recipe = currentRecipe();
  const singleRatio = getSingleRatio();
  const pantryResult = getPantryRatio();
  const ratio = mode === "single" ? singleRatio : pantryResult.ratio;

  extraHeader.textContent = mode === "single" ? "差異" : "剩餘 / 不足";
  resultBody.innerHTML = "";

  recipe.ingredients.forEach((ingredient) => {
    const need = ingredient.amount * ratio;
    const row = document.createElement("tr");
    const pantryInput = pantryInputs.querySelector(`[data-ingredient="${CSS.escape(ingredient.name)}"]`);
    const available = Number(pantryInput?.value);
    let extraText = formatNumber(need - ingredient.amount);
    let statusClass = "";

    if (mode === "pantry") {
      if (Number.isFinite(available) && available > 0) {
        const left = available - need;
        extraText = `${left >= -0.0001 ? "剩 " : "缺 "}${formatNumber(Math.abs(left))}`;
        statusClass = left >= -0.0001 ? "status-ok" : "status-warn";
      } else {
        extraText = "未填";
      }
    }

    row.innerHTML = `
      <td>${ingredient.name}</td>
      <td>${formatNumber(ingredient.amount)}</td>
      <td>${formatNumber(need)}</td>
      <td class="${statusClass}">${extraText}</td>
    `;
    resultBody.append(row);
  });

  renderSummary(ratio, pantryResult);
}

function renderSummary(ratio, pantryResult) {
  if (mode === "single") {
    const ingredientName = ingredientSelect.value;
    singleSummary.textContent = `以「${ingredientName}」換算，目前比例為原始配方的 ${formatNumber(ratio)} 倍。`;
    return;
  }

  if (!pantryResult.limiter) {
    pantrySummary.textContent = "尚未填入手邊食材，先以 1 倍原始配方顯示。";
    return;
  }

  pantrySummary.textContent = `目前最多可做原始配方的 ${formatNumber(pantryResult.ratio)} 倍，限制食材是「${pantryResult.limiter}」。`;
}

function openRecipeDialog(index = null) {
  editingIndex = index;
  const recipe = index === null ? { name: "", ingredients: [] } : recipes[index];

  dialogTitle.textContent = index === null ? "新增食譜" : "編輯食譜";
  recipeNameInput.value = recipe.name;
  recipeTextInput.value = recipe.ingredients
    .map((ingredient) => `${ingredient.name} ${ingredient.amount}`)
    .join("\n");
  deleteRecipe.hidden = index === null;
  recipeDialog.showModal();
}

function parseRecipeText(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s+([0-9]+(?:\.[0-9]+)?)$/);
      if (!match) {
        throw new Error(`無法讀取這一行：${line}`);
      }
      return {
        name: match[1].trim(),
        amount: Number(match[2]),
      };
    });
}

function saveRecipeFromDialog() {
  const name = recipeNameInput.value.trim();
  if (!name) {
    recipeNameInput.focus();
    return;
  }

  let ingredients;
  try {
    ingredients = parseRecipeText(recipeTextInput.value);
  } catch (error) {
    alert(error.message);
    return;
  }

  if (!ingredients.length) {
    alert("請至少輸入一項原料。");
    return;
  }

  const nextRecipe = { name, ingredients };
  if (editingIndex === null) {
    recipes.push(nextRecipe);
    selectedIndex = recipes.length - 1;
  } else {
    recipes[editingIndex] = nextRecipe;
    selectedIndex = editingIndex;
  }

  saveRecipes();
  recipeDialog.close();
  render();
}

function removeRecipeFromDialog() {
  if (editingIndex === null || recipes.length <= 1) return;
  const confirmed = confirm(`確定刪除「${recipes[editingIndex].name}」嗎？`);
  if (!confirmed) return;

  recipes.splice(editingIndex, 1);
  selectedIndex = Math.max(0, selectedIndex - 1);
  saveRecipes();
  recipeDialog.close();
  render();
}

function resetBuiltInRecipes() {
  const confirmed = confirm("這會清除自訂修改並恢復目前內建食譜，確定嗎？");
  if (!confirmed) return;

  recipes = structuredClone(defaultRecipes);
  selectedIndex = 0;
  saveRecipes();
  render();
}

function render() {
  renderRecipeList();
  renderIngredientControls();
  renderResults();
}

render();
