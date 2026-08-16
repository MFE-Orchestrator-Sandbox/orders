import './App.css'
import { Orders } from "./components/Orders"

// Entry standalone: serve solo a sviluppare il remote da solo (`pnpm dev`).
// Lo shell non passa da qui, importa direttamente "orders/Orders".
function App() {
	return <Orders />
}

export default App
