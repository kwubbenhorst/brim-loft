// This file contains the createOrder function which responds to a click on the cart when it has items in it.
// This function will put in a post call to the api/orders/create-new-order-at-checkout endpoint, using the cart data it has created and stored in session storage..
// The api call will result in an order_id being assigned to the group of items in the order table and it will update the order-items table so that these products from the cart are all associated both with both the order_id (associated with a user) and with the product_id of all the individual products in the order
// We then have access to all that data at the front end to render it to the order summary view in checkout.handlebars


// Variable and constant initialization
let subtotal = 0;
let shippingCost = 9.99; // Default shipping cost
let taxes = 0;
let orderTotal = 0;
let orderItems = []; // Assuming this is declared globally to store order items

// Function to replace the page and initiate the order creation process
function createOrder() {

  // Get the cart data from sessionStorage
  const cart = JSON.parse(sessionStorage.getItem('cart')) || [];

  // Prepare the request body
  const requestBody = {
    cart: cart,
  };

  // Make a POST request to create a new order
  fetch('/api/orders/create-new-order-at-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
    .then(response => response.json())
    .then(orderData => {
      // Log the order data
      console.log('Order Data:', orderData);

      // Update the global orderItems array
      orderItems = orderData.orderItems;

      // Call the function to render the order summary
      console.log('Calling renderOrderSummary');
      renderOrderSummary(orderData);
    })
    .catch(error => {
      console.error('Error creating order:', error);
    });
}

// Function to render order summary
function renderOrderSummary(orderData) {
  console.log('Entering renderOrderSummary');
  // Access the orderItems array from orderData
  const orderItems = orderData.orderItems;
  console.log('Order Items:', orderItems);

  // Select the list group container in the DOM
  const listGroupContainer = document.querySelector('.order-item-group');

  // Clear existing content in the list group container
  listGroupContainer.innerHTML = '';

  // Iterate over each order item and generate the HTML dynamically
  orderItems.forEach((orderItem) => {
    // Create a list group item element
    const listGroupItem = document.createElement('div');
    listGroupItem.classList.add('list-group-item');

    // Create the content for the list group item
    const content = `
      <div class="d-flex w-100 justify-content-between">
        <img src="${orderItem.product.image1_url}" alt="${orderItem.product.name}" class="order-item-image product-image" style="max-height: 60px; max-width: 40px;">
        <h5 class="mb-1">${orderItem.product.name}</h5>
        <p class="mb-1">Price: $${orderItem.orderItem.price_at_purchase.toFixed(2)}</p>
        <select class="custom-select quantity-dropdown" data-orderitemid="${orderItem.orderItem.id}">
          ${generateQuantityOptions(orderItem.orderItem.quantity)}
        </select>
      </div>`;

    // Update subtotal with the price_at_purchase of the current order item
    subtotal += orderItem.orderItem.price_at_purchase;

    // Set the innerHTML of the list group item
    listGroupItem.innerHTML = content;

    // Append the list group item to the container
    listGroupContainer.appendChild(listGroupItem);
  });

  // Calculate taxes as 15% of the sum of itemTally and shipping
  taxes = (subtotal + shippingCost) * 0.15;

  // Calculate the total by summing up itemTally, shipping, and taxes
  orderTotal = subtotal + shippingCost + taxes;

  // Render Subtotal, Shipping, Taxes, and Total
  renderOrderTotalElements(subtotal, shippingCost, taxes, orderTotal);
  console.log('Exiting renderOrderSummary');
}
  

// Helper function to generate quantity options for the dropdown
function generateQuantityOptions(selectedQuantity) {
  console.log('selected quantity:', selectedQuantity);
  let options = '';
    // options += `<option value="${0}" "${selectedQuantity == 0 ? 'selected' : ''}">${0}</option>`;
  for (let i = 0; i <= 9; i++) {
    options += `<option value="${i}" ${selectedQuantity == i ? "selected" : null}>${i}</option>`;
  }

  return options;
}

// Helper function to render Subtotal, Shipping, Taxes, and Total
function renderOrderTotalElements(subtotal, shippingCost, taxes, orderTotal) {
  // Replace 'elementId' with the actual IDs of the elements in your HTML
  document.getElementById('subtotal').innerText = `$${subtotal.toFixed(2)}`;
  document.getElementById('shippingCost').innerText = `$${shippingCost.toFixed(2)}`;
  document.getElementById('orderItemTaxes').innerText = `$${taxes.toFixed(2)}`;
  document.getElementById('orderTotal').innerText = `$${orderTotal.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', function () {
  const listGroupContainer = document.querySelector('.list-group');

  listGroupContainer.addEventListener('change', async function (event) {
    if (event.target.classList.contains('quantity-dropdown')) {
      // Call the function to update totals and handle deletions
      await updateTotal(event.target);
    }
  });
});

// Helper function to update totals
async function updateTotal(target) {
  try {
    console.log('Order items:', orderItems);
    // Recalculate subtotal, taxes, and total
    const selectedQuantity = target.options[target.selectedIndex].value
    const orderItemId = target.dataset.orderitemid;
    console.log('selected quantity', selectedQuantity);
    console.log('orderitemid', orderItemId);
    // Update quantities and handle deletions
    // const quantityDropdowns = document.querySelectorAll('.quantity-dropdown');
    // const updatedOrderItems = [];
    // console.log('Updated Order Items:', updatedOrderItems);

    // for (const dropdown of quantityDropdowns) {
    //   const orderItemId = dropdown.getAttribute('data-orderitemid');
    //   const selectedQuantity = parseInt(dropdown.value);

      // Handle deletion if quantity is zero
      if (selectedQuantity === 0) {
        // Make a DELETE request to remove the order item
        try {
          await fetch(`/api/order-items/${orderItemId}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Error deleting order item:', error);
        }
      } else {
        // Update the quantity for the order item
        console.log('orderItems:', orderItems);
        const updatedItem = orderItems.find((item) => item.orderItem.id == orderItemId);
        console.log('orderItemId:', orderItemId);
        console.log('updatedItem:', updatedItem);
        if (updatedItem) {
        updatedItem.orderItem.quantity = selectedQuantity;
        let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        // const cart = [];
        cart=cart.map(item => {
          if(item.product_id == updatedItem.product.id){
            return {product_id: updatedItem.product.id, quantity: parseInt(selectedQuantity)} 
          } else {
            return item;
          }
        })
        // cart.push({product_id: updatedItem.product.id, quantity: selectedQuantity});
        sessionStorage.setItem("cart", JSON.stringify(cart));
        // updatedOrderItems.push(updatedItem);
        orderItems=orderItems.map(item=>{
          if(item.orderItem.id === updatedItem.orderItem.id){
            return updatedItem;
          } else {
            return item;
          }
        })
        // Make a PUT request to update the order item quantity on the server
        try {
          const result = await fetch(`/api/order-items/${orderItemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: selectedQuantity }),
          });
          const response = await result.json()
          console.log('response:', response);
        
        subtotal = orderItems.reduce((total, item) => total + item.orderItem.price_at_purchase, 0); //CHECK FOR PROBLEM HERE!!
        taxes = (subtotal + shippingCost) * 0.15;
        orderTotal = subtotal + shippingCost + taxes;
      
          // Render the updated totals
          renderOrderTotalElements(subtotal, shippingCost, taxes, orderTotal);
          console.log('Order items:', orderItems);
          renderOrderSummary({orderItems});
        } catch (error) {
          console.error('Error updating order item:', error);
        }
      }

        
      }
    // }

    // Update orderItems array with the modified quantities
    // orderItems.length = 0;
    // Array.prototype.push.apply(orderItems, updatedOrderItems);
    
  } catch (error) {
    console.error('Error updating totals:', error);
  }
}

// Call the createOrder function when the script is loaded
createOrder();


  
  
  
  