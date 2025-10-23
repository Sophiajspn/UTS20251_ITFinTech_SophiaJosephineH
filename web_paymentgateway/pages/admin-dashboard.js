import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
      router.push('/'); 
    }

    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.json())
      .then(data => setOrders(data.orders));

    fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.json())
      .then(data => setAnalytics(data.analytics));
  }, [router]);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div>
        <h3>Orders</h3>
        <ul>
          {orders.map(order => (
            <li key={order._id}>
              {order.productName} - {order.status}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Analytics</h3>
        <p>Total Sales: {analytics.totalSales}</p>
        <p>Sales Today: {analytics.salesToday}</p>
      </div>
    </div>
  );
}
