// main.jsx
import { render } from "./MiniReact";
import { useState } from "./MiniReact/render";

const Counter = ({ theme }) => {
  const [count, setCount] = useState(0);

  return (
    <div
      style={`
        display:flex;
        gap:5px;
        background:${theme};
        padding:10px;
        border-radius: 8px;
        margin: 10px;
        transition: background 1s ease;`
      }
    >
      <div>counter组件：</div>
      <button onClick={() => setCount(pre => pre + 1)}>增加</button>
      <p>count:{count}</p>
      <button onClick={() => setCount(pre => pre - 1)}>减少</button>
    </div>
  );
}


const APP = () => {
  const [color, setColor] = useState('pink');
  const changeColor = () => setColor(pre => pre === 'pink' ? 'lightblue' : 'pink')

  return (
    <div
      style={`
        background:${color === 'pink' ? 'skyblue' : 'pink'}; 
        padding: 10px; 
        border-radius: 8px; 
        margin: 10px;
        transition: background 0.8s ease`
      }
    >
      APP组件
      <Counter theme={color} />
      <button onClick={changeColor}>切换主题</button>
    </div>
  )
}

const container = document.querySelector("#root");
render(<APP />, container);