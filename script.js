
const cartItems = [];
let total = 0;

function addToCart(productName, price) {
  cartItems.push({ name: productName, price });
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartList = document.getElementById("cart-items");
  const totalElem = document.getElementById("total");
  cartList.innerHTML = "";
  total = 0;

  cartItems.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.price} ש״ח`;
    cartList.appendChild(li);
    total += item.price;
  });

  totalElem.textContent = `סה״כ: ${total} ש״ח`;

  if (window.paypal && total > 0) {
    document.getElementById("paypal-button-container").innerHTML = "";
    paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: (total / 3.6).toFixed(2)
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          window.location.href = "thanks.html";
        });
      }
    }).render('#paypal-button-container');
  }
}
