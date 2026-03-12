import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Target, Clock, Dumbbell, Brain, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Bem-vindo ao Zenith IA",
    description: "Seu Sistema Operacional de Vida de alta performance. O Zenith não é apenas um app, é seu mentor neural para o sucesso.",
    icon: <Sparkles className="w-12 h-12 text-zenith-scarlet" />,
    color: "from-zenith-crimson/20 to-transparent"
  },
  {
    title: "Hábitos Atômicos",
    description: "Construa consistência com nosso rastreador de hábitos avançado. Streaks, gráficos e metas mensais para sua evolução.",
    icon: <Target className="w-12 h-12 text-zenith-scarlet" />,
    color: "from-red-900/20 to-transparent"
  },
  {
    title: "Rotinas de Elite",
    description: "Organize seu dia com precisão cirúrgica. Notificações inteligentes e priorização para manter o foco no que importa.",
    icon: <Clock className="w-12 h-12 text-zenith-scarlet" />,
    color: "from-zenith-crimson/20 to-transparent"
  },
  {
    title: "Treino e Mente",
    description: "Biblioteca completa de exercícios para corpo e mente. Yoga, meditação e treinos de força integrados.",
    icon: <Dumbbell className="w-12 h-12 text-zenith-scarlet" />,
    color: "from-red-900/20 to-transparent"
  },
  {
    title: "Mentor IA",
    description: "Inteligência Artificial de ponta para analisar seu progresso e sugerir estratégias personalizadas de vida.",
    icon: <Brain className="w-12 h-12 text-zenith-scarlet" />,
    color: "from-zenith-crimson/20 to-transparent"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.15)_0%,transparent_70%)]" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-lg relative"
        >
          <div className={`glass-card p-10 rounded-[32px] border-white/5 bg-gradient-to-b ${steps[currentStep].color} backdrop-blur-3xl text-center space-y-8`}>
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="p-6 bg-white/5 rounded-3xl border border-white/10"
              >
                {steps[currentStep].icon}
              </motion.div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {steps[currentStep].title}
              </h2>
              <p className="text-white/60 leading-relaxed text-lg">
                {steps[currentStep].description}
              </p>
            </div>

            <div className="flex justify-center space-x-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === currentStep ? 'w-8 bg-zenith-scarlet' : 'w-2 bg-white/10'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="w-full py-5 bg-zenith-crimson hover:bg-zenith-scarlet text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group shadow-[0_0_30px_rgba(139,0,0,0.3)]"
            >
              {currentStep === steps.length - 1 ? 'Começar Jornada' : 'Próximo'}
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
