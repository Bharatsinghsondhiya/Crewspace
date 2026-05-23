import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupApiClient } from "./lib/auth-setup";

setupApiClient();

createRoot(document.getElementById("root")!).render(<App />);
