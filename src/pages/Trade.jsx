import { useState, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
const Trade = () => {
  const [sellerTo, setSellerTo] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { backendUrl } = useContext(ShopContext);
  const handleTrade = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/trades/initiate`,
        { sellerTo, productId, quantity },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Trade initiated:', response.data);
    } catch (error) {
      console.error('Error initiating trade:', error);
    }
  };

  return (
    <div>
      <h1>Initiate Trade</h1>
      <input
        type="text"
        placeholder="Seller To"
        value={sellerTo}
        onChange={(e) => setSellerTo(e.target.value)}
      />
      <input
        type="text"
        placeholder="Product ID"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <button onClick={handleTrade}>Initiate Trade</button>
    </div>
  );
};

export default Trade;