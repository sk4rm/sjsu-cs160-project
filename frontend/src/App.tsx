import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}



//tester
// import { useEffect, useState } from 'react'

// export default function App() {
//   const [message, setMessage] = useState('Loading...')

//   useEffect(() => {
//     fetch('/api/user')
//       .then((res) => res.json())
//       .then((data) => {
//         setMessage(`Hello ${data.name}, you are a ${data.role}`)
//       })
//       .catch((err) => {
//         console.error('Fetch failed:', err)
//         setMessage('Error loading user data')
//       })
//   }, [])

//   return (
//     <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
//       <h1>React + Elysia Demo</h1>
//       <p>{message}</p>
//     </main>
//   )
// }
