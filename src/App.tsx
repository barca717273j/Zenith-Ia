import { useState } from "react";
import Dashboard from "./components/Dashboard";
import { Navigation } from "./components/Navigation";

function App() {

  const [activeTab, setActiveTab] = useState("home");

  const t = {
    nav: {
      home: "Home",
      routine: "Rotina",
      exercises: "Exercícios",
      finance: "Finanças",
      profile: "Perfil"
    },
    dashboard: {
      infinityMentor: "Mentor IA",
      aiGreeting: "Como posso ajudar hoje?",
      energyLevel: "Energia",
      mentalFocus: "Foco"
    }
  };

  const userData = {};

  return (
    <div className="min-h-screen bg-black text-white">

      <Dashboard
        userData={userData}
        t={t}
        setActiveTab={setActiveTab}
      />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        t={t}
      />

    </div>
  );
}

export default App;
