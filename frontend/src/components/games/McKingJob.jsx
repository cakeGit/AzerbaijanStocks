import React, { useState, useEffect } from 'react';

const McKingJob = () => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState('');

  const ingredients = ['🍔', '🍞', '🥬', '🍅', '🧀', '🥓'];

  const generateOrder = () => {
    const orderIngredients = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
      orderIngredients.push(ingredients[Math.floor(Math.random() * ingredients.length)]);
    }
    return { id: Date.now(), ingredients: orderIngredients, completed: [] };
  };

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(120);
    setOrders([generateOrder()]);
    setCurrentOrder(null);
    setMessage('');
  };

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      setMessage(`Time's up! Final score: ${score}`);
    }
  }, [gameActive, timeLeft]);

  useEffect(() => {
    if (gameActive && orders.length < 3) {
      const addOrder = setTimeout(() => {
        setOrders(prev => [...prev, generateOrder()]);
      }, 30000); // New order every 30 seconds
      return () => clearTimeout(addOrder);
    }
  }, [gameActive, orders]);

  const cookIngredient = (ingredient) => {
    if (!currentOrder) return;
    const newCompleted = [...currentOrder.completed, ingredient];
    const newOrder = { ...currentOrder, completed: newCompleted };
    setCurrentOrder(newOrder);

    if (newCompleted.length === currentOrder.ingredients.length) {
      // Check if correct
      const isCorrect = newCompleted.every((ing, index) => ing === currentOrder.ingredients[index]);
      if (isCorrect) {
        setScore(score + 10);
        setMessage('Order completed perfectly!');
      } else {
        setScore(score + 5);
        setMessage('Order completed, but not perfect.');
      }
      setOrders(orders.filter(o => o.id !== currentOrder.id));
      setCurrentOrder(null);
    }
  };

  return (
    <div className="mcking-job p-8 text-center">
      <h1 className="text-4xl font-bold mb-8">🍔 McKing Job</h1>
      <p className="text-lg mb-4">Score: {score} | Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
      {!gameActive ? (
        <button onClick={startGame} className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
          Start Shift
        </button>
      ) : (
        <div>
          <div className="orders mb-8">
            <h2 className="text-2xl mb-4">Orders</h2>
            <div className="flex justify-center space-x-4">
              {orders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setCurrentOrder(order)} 
                  className={`order p-4 border rounded cursor-pointer ${currentOrder?.id === order.id ? 'bg-blue-200' : 'bg-gray-100'}`}
                >
                  {order.ingredients.join(' ')}
                </div>
              ))}
            </div>
          </div>
          {currentOrder && (
            <div className="cooking mb-8">
              <h2 className="text-2xl mb-4">Cook Order</h2>
              <div className="mb-4">
                Required: {currentOrder.ingredients.join(' ')}
              </div>
              <div className="mb-4">
                Completed: {currentOrder.completed.join(' ')}
              </div>
              <div className="ingredients flex justify-center space-x-4">
                {ingredients.map(ing => (
                  <button 
                    key={ing} 
                    onClick={() => cookIngredient(ing)} 
                    className="text-4xl p-2 border rounded hover:bg-gray-200"
                  >
                    {ing}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {message && <p className="text-xl font-semibold mt-4">{message}</p>}
    </div>
  );
};

export default McKingJob;
