// Script de prueba para verificar el endpoint takeOrder
const fetch = require('node-fetch');

async function testTakeOrder() {
  try {
    // Primero, hacer login como Elena (mesera)
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'elena.vargas@bellavista.com',
        password: 'mesero123',
        role: 'MESERO'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      console.error('Login failed:', loginData.error);
      return;
    }

    const token = loginData.data.token;
    console.log('Token obtenido:', token);

    // Obtener las órdenes actuales
    const ordersResponse = await fetch('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const ordersData = await ordersResponse.json();
    console.log('Orders Response:', JSON.stringify(ordersData, null, 2));

    if (ordersData.success && ordersData.data.orders.length > 0) {
      const orderToTake = ordersData.data.orders.find(o => !o.meseroId && o.estado === 'ENVIADA');
      
      if (orderToTake) {
        console.log(`\nIntentando tomar orden ${orderToTake.id}...`);
        
        // Tomar la orden
        const takeResponse = await fetch(`http://localhost:3001/api/orders/${orderToTake.id}/take`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        const takeData = await takeResponse.json();
        console.log('Take Order Response:', JSON.stringify(takeData, null, 2));

        if (takeData.success) {
          console.log('\n✅ Orden tomada exitosamente!');
          console.log('Mesero asignado:', takeData.data.mesero);
        } else {
          console.log('\n❌ Error al tomar orden:', takeData.error);
        }
      } else {
        console.log('\n⚠️ No hay órdenes disponibles para tomar');
      }
    }

  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

testTakeOrder(); 