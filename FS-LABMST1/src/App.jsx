import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function ProductCard({ name, price, description, instock }) {
  return (
    <div style={{
      border: "1px solid gray",
      borderRadius: "5px",
      padding: "10px",
      margin: "10px",
      width: "200px"
    }}>
      <h2>{name}</h2>
      <p>Price:{price}rupees</p>
      <p>{description}</p>
      {instock ? (
        <button>Buy Now</button>
      ) : (
        <button style={{ backgroundColor: "red", color: "white" }}>
          Out of Stock
        </button>
      )}
    </div>
  );
}
function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ display: "flex" }}>
      <ProductCard
        name="notebook"
        price={100}
        description="plain pages notebook"
        instock={true}
      />
      <ProductCard
        name="pen"
        price={20}
        description="blue ink pen"
        instock={false}
      />
      <ProductCard
        name="pencil"
        price={10}
        description="apsara pencil"
        instock={true}
      />
    </div>
  );
}

export default App
