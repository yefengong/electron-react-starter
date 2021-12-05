import React, { useState } from 'react';
import './Home.css';

const Home: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>
        For a guide and recipes on how to configure / customize this project,<br />
        check out the
        <a
          href="https://github.com/cawa-93/vite-electron-builder"
          rel="noopener noreferrer"
          target="_blank"
        >vite-electron-builder documentation</a>.
      </p>

      <p>
        <a
          href="https://vitejs.dev/guide/features.html"
          target="_blank" rel="noreferrer"
        >Vite Documentation</a> |
        <a
          href="https://reactjs.org/"
          target="_blank" rel="noreferrer"
        >React Documentation</a>
      </p>

      <hr />
      <button onClick={() => setCount((count) => count + 1)}>
        count is: {count}
      </button>
      <p>
        Edit
        <code>renderer/components/Home.tsx</code> to test hot module replacement.
      </p>
    </>
  );
};

export default Home;
