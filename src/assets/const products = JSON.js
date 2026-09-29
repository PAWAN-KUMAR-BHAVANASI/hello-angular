const products = JSON.parse(localStorage.getItem('local-products-db'));
products.unshift({
  id: Date.now(),
  name: "Headphones",
  category: "electronics",
  price: 2500,
  createdAt: new Date().toISOString()
});
localStorage.setItem('local-products-db', JSON.stringify(products));
location.reload();