import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZenithLogo } from './ZenithLogo';
import { ChevronRight, Target, Zap, Brain, Rocket, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    goal: '',
    focusStyle: '',
  });

  const nextStep = () => setStep(s => s + 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <ZenithLogo size={80} className="mx-auto" />
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter uppercase">Welcome to Zenith</h1>
              <p className="text-white/40 text-sm max-w-xs mx-auto">
                Your journey to peak performance starts here. We'll help you build unbreakable discipline.
              </p>
            </div>
            <button onClick={nextStep} className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center space-x-2">
              <span>Initialize System</span>
              <ChevronRight size={18} />
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight uppercase">Define Your Objective</h2>
              <p className="text-white/40 text-xs">What is your primary focus area?</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'productivity', label: 'Improve Productivity', icon: <Zap size={20} /> },
                { id: 'health', label: 'Improve Health', icon: <Target size={20} /> },
                { id: 'study', label: 'Study More', icon: <Brain size={20} /> },
              ].map(goal => (
                <button
                  key={goal.id}
                  onClick={() => { setSelections({ ...selections, goal: goal.id }); nextStep(); }}
                  className="glass-card p-6 flex items-center space-x-4 hover:bg-white/5 transition-all text-left"
                >
                  <div className="text-zenith-electric-blue">{goal.icon}</div>
                  <span className="font-medium">{goal.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-8"
          >
            <div className="w-20 h-20 bg-zenith-electric-blue/10 rounded-full flex items-center justify-center mx-auto border border-zenith-electric-blue/20">
              <Rocket size={40} className="text-zenith-electric-blue" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight uppercase">First Routine</h2>
              <p className="text-white/40 text-sm">
                We've prepared a "Morning Peak" routine for you. It includes hydration, meditation, and goal setting.
              </p>
            </div>
            <button onClick={nextStep} className="btn-primary w-full max-w-xs mx-auto">
              Accept Routine
            </button>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight uppercase">Focus Style</h2>
              <p className="text-white/40 text-xs">How do you prefer to work?</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'pomodoro', label: 'Pomodoro (25/5)', desc: 'Classic interval training' },
                { id: 'deep', label: 'Deep Work (90m)', desc: 'For complex problem solving' },
                { id: 'flow', label: 'Flow State', desc: 'No timer, just focus' },
              ].map(style => (
                <button
                  key={style.id}
                  onClick={() => { setSelections({ ...selections, focusStyle: style.id }); nextStep(); }}
                  className="glass-card p-6 flex flex-col space-y-1 hover:bg-white/5 transition-all text-left"
                >
                  <span className="font-bold text-white">{style.label}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">{style.desc}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <ZenithLogo size={100} className="mx-auto" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-zenith-electric-blue blur-3xl -z-10"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter uppercase">System Ready</h2>
              <p className="text-white/40 text-sm max-w-xs mx-auto">
                Your personalized Zenith OS is configured. Time to reach your peak.
              </p>
            </div>
            <button onClick={() => onComplete(selections)} className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center space-x-2">
              <Rocket size={18} />
              <span>Launch Dashboard</span>
            </button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zenith-black flex items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#0a1931,0%,#000814,100%)]" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
        
        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-12">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                step === i ? 'w-8 bg-zenith-electric-blue' : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
