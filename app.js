const STORAGE_KEY = "recipe-ratio-tool-v4";
const COST_STORAGE_KEY = "recipe-ratio-costs-v1";

const defaultRecipes = [
  {
    name: "黑糖甜粿",
    ingredients: [
      { name: "糯米粉", amount: 600 },
      { name: "黑糖", amount: 350 },
      { name: "水", amount: 450 },
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
    name: "小糰子",
    ingredients: [
      { name: "無鹽奶油", amount: 100 },
      { name: "砂糖", amount: 90 },
      { name: "雞蛋", amount: 1 },
      { name: "中筋麵粉", amount: 60 },
      { name: "低筋麵粉", amount: 130 },
      { name: "調色粉", amount: 10 },
      { name: "泡打粉", amount: 2 },
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
    name: "鬆餅",
    ingredients: [
      { name: "低筋麵粉", amount: 200 },
      { name: "泡打粉", amount: 8 },
      { name: "奶粉", amount: 64 },
      { name: "蛋", amount: 1 },
      { name: "糖", amount: 30 },
      { name: "橄欖油", amount: 30 },
      { name: "水", amount: 240 },
    ],
  },
];

let recipes = loadRecipes();
let costData = loadCostData();
let selectedIndex = 0;
let mode = "single";
let scaleMode = "single";
let editingIndex = null;

const recipeList = document.querySelector("#recipeList");
const recipePicker = document.querySelector("#recipePicker");
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
const costMode = document.querySelector("#costMode");
const costInputs = document.querySelector("#costInputs");
const costSummary = document.querySelector("#costSummary");
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
recipeDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
recipeDialog.querySelectorAll(".dialog-close").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    closeDialog(recipeDialog);
  });
});
ingredientSelect.addEventListener("change", renderResults);
targetAmount.addEventListener("input", renderResults);
precisionSelect.addEventListener("change", renderResults);
recipePicker.addEventListener("change", () => {
  selectedIndex = Number(recipePicker.value);
  render();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const nextMode = tab.dataset.mode;
    if (nextMode !== "cost") scaleMode = nextMode;
    mode = nextMode;
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    singleMode.classList.toggle("hidden", mode !== "single");
    pantryMode.classList.toggle("hidden", mode !== "pantry");
    costMode.classList.toggle("hidden", mode !== "cost");
    renderResults();
  });
});

function loadRecipes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneRecipes(defaultRecipes);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : cloneRecipes(defaultRecipes);
  } catch {
    return cloneRecipes(defaultRecipes);
  }
}

function cloneRecipes(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function loadCostData() {
  const saved = localStorage.getItem(COST_STORAGE_KEY);
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCostData() {
  localStorage.setItem(COST_STORAGE_KEY, JSON.stringify(costData));
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

function formatMoney(value) {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(2)).toLocaleString("zh-Hant", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function renderRecipeList() {
  recipeList.innerHTML = "";
  recipePicker.innerHTML = "";
  recipes.forEach((recipe, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = recipe.name;
    option.selected = index === selectedIndex;
    recipePicker.append(option);

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
  pantryInputs.innerHTML = "";
  costInputs.innerHTML = "";

  recipe.ingredients.forEach((ingredient) => {
    const option = document.createElement("option");
    option.value = ingredient.name;
    option.textContent = ingredient.name;
    ingredientSelect.append(option);

    const pantryLabel = document.createElement("label");
    pantryLabel.innerHTML = `<span>${ingredient.name}</span>`;
    const pantryInput = document.createElement("input");
    pantryInput.type = "number";
    pantryInput.min = "0";
    pantryInput.step = "0.01";
    pantryInput.inputMode = "decimal";
    pantryInput.dataset.ingredient = ingredient.name;
    pantryInput.placeholder = String(ingredient.amount);
    pantryInput.addEventListener("input", renderResults);
    pantryLabel.append(pantryInput);
    pantryInputs.append(pantryLabel);

    const savedCost = costData[ingredient.name] ?? {};
    const costCard = document.createElement("div");
    costCard.className = "cost-card";
    costCard.innerHTML = `
      <strong>${ingredient.name}</strong>
      <label>
        <span>買進總價</span>
        <input type="number" min="0" step="0.01" inputmode="decimal" data-cost-field="price" data-ingredient="${ingredient.name}" value="${savedCost.price ?? ""}">
      </label>
      <label>
        <span>買進總重量</span>
        <input type="number" min="0" step="0.01" inputmode="decimal" data-cost-field="weight" data-ingredient="${ingredient.name}" value="${savedCost.weight ?? ""}">
      </label>
    `;
    costCard.querySelectorAll("input").forEach((costInput) => {
      costInput.addEventListener("input", () => {
        const ingredientName = costInput.dataset.ingredient;
        costData[ingredientName] = costData[ingredientName] ?? {};
        costData[ingredientName][costInput.dataset.costField] = costInput.value;
        saveCostData();
        renderResults();
      });
    });
    costInputs.append(costCard);
  });

  targetAmount.value = recipe.ingredients[0]?.amount ?? 0;
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
    const input = findPantryInput(ingredient.name);
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

function findPantryInput(ingredientName) {
  return Array.from(pantryInputs.querySelectorAll("input")).find(
    (input) => input.dataset.ingredient === ingredientName
  );
}

function getIngredientCost(ingredientName, need) {
  const source = costData[ingredientName];
  if (!source) return null;

  const price = Number(source.price);
  const weight = Number(source.weight);
  if (!Number.isFinite(price) || !Number.isFinite(weight) || price <= 0 || weight <= 0) return null;

  return need * (price / weight);
}

function renderResults() {
  const recipe = currentRecipe();
  const singleRatio = getSingleRatio();
  const pantryResult = getPantryRatio();
  const ratio = scaleMode === "pantry" ? pantryResult.ratio : singleRatio;
  let totalCost = 0;
  let hasAnyCost = false;

  document.body.dataset.mode = mode;
  extraHeader.textContent = mode === "cost" ? "成本" : mode === "single" ? "調整" : "剩餘";
  resultBody.innerHTML = "";

  recipe.ingredients.forEach((ingredient) => {
    const need = ingredient.amount * ratio;
    const row = document.createElement("tr");
    const pantryInput = findPantryInput(ingredient.name);
    const available = Number(pantryInput?.value);
    const difference = need - ingredient.amount;
    let extraText = difference === 0 ? "不變" : `${difference > 0 ? "+" : "-"}${formatNumber(Math.abs(difference))}`;
    let statusClass = "";

    if (mode === "pantry") {
      if (Number.isFinite(available) && available > 0) {
        const left = available - need;
        extraText = `${left >= -0.0001 ? "剩 " : "缺 "}${formatNumber(Math.abs(left))}`;
        statusClass = left >= -0.0001 ? "status-ok" : "status-warn";
      } else {
        extraText = "";
      }
    }

    if (mode === "cost") {
      const cost = getIngredientCost(ingredient.name, need);
      if (cost === null) {
        extraText = "";
      } else {
        totalCost += cost;
        hasAnyCost = true;
        extraText = `$${formatMoney(cost)}`;
        statusClass = "status-ok";
      }
    }

    row.innerHTML = `
      <td>${ingredient.name}</td>
      <td>${formatNumber(need)}</td>
      <td class="${statusClass}">${extraText}</td>
    `;
    resultBody.append(row);
  });

  renderSummary(ratio, pantryResult);
  renderCostSummary(totalCost, hasAnyCost);
}

function renderSummary(ratio, pantryResult) {
  if (mode === "single") {
    const ingredientName = ingredientSelect.value;
    singleSummary.textContent = `以「${ingredientName}」換算，比例 ${formatNumber(ratio)} 倍。`;
    return;
  }

  if (mode !== "pantry") return;

  if (!pantryResult.limiter) {
    pantrySummary.textContent = "填入手邊食材後自動計算。";
    return;
  }

  pantrySummary.textContent = `可做 ${formatNumber(pantryResult.ratio)} 倍，限制：${pantryResult.limiter}`;
}

function renderCostSummary(totalCost, hasAnyCost) {
  if (mode !== "cost") return;

  if (!hasAnyCost) {
    costSummary.textContent = "填入買進總價與總重量後自動計算成本。";
    return;
  }

  costSummary.textContent = `本次成品成本：$${formatMoney(totalCost)}`;
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
  openDialog(recipeDialog);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
    document.body.classList.add("dialog-open");
  }
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
  }
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
  closeDialog(recipeDialog);
  render();
}

function removeRecipeFromDialog() {
  if (editingIndex === null || recipes.length <= 1) return;
  const confirmed = confirm(`確定刪除「${recipes[editingIndex].name}」嗎？`);
  if (!confirmed) return;

  recipes.splice(editingIndex, 1);
  selectedIndex = Math.max(0, selectedIndex - 1);
  saveRecipes();
  closeDialog(recipeDialog);
  render();
}

function resetBuiltInRecipes() {
  const confirmed = confirm("這會清除自訂修改並恢復目前內建食譜，確定嗎？");
  if (!confirmed) return;

  recipes = cloneRecipes(defaultRecipes);
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
