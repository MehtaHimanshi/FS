const products = [
  { name: "Laptop", category: "electronics" },
  { name: "Smartphone", category: "electronics" },
  { name: "T-Shirt", category: "clothing" },
  { name: "Jeans", category: "clothing" },
  { name: "Novel", category: "books" },
  { name: "Notebook", category: "books" }
];

const productList = document.getElementById("productList");
const categoryFilter = document.getElementById("categoryFilter");

function renderProducts(items) {
  productList.innerHTML = items.map(p => `<div class="product">${p.name}</div>`).join("");
}

renderProducts(products);

categoryFilter.addEventListener("change", () => {
  const category = categoryFilter.value;
  const filtered = category === "all" ? products : products.filter(p => p.category === category);
  renderProducts(filtered);
});