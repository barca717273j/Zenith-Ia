import { useState } from "react";
import { Dashboard } from "./components/Dashboard";

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const userData = {
    photoURL: ""
  };

  const t = {
    dashboard: {
      infinityMentor: "Mentor IA",
      aiGreeting: "Olá. Vamos evoluir hoje?",
      energyLevel: "Energia",
      mentalFocus: "Foco Mental"
    },
    nav: {
      home: "Home",
      routine: "Rotina",
      exercises: "Exercícios",
      finance: "Finanças",
      profile: "Perfil"
    }
  };

  return (
    <Dashboard
      userData={userData}
      t={t}
      setActiveTab={setActiveTab}
    />
  );
}

export default App;
