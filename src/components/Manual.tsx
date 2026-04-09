import React from 'react';
import { motion } from 'motion/react';
import { Book, Shield, Zap, Target, Brain, Activity, Wallet, Compass, Star, ChevronRight } from 'lucide-react';

interface ManualSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
}

const ManualSection: React.FC<ManualSectionProps> = ({ icon, title, description, items }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="premium-card p-8 bg-zenit-surface-1 border-zenit-border-primary space-y-6"
  >
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-2xl bg-zenit-accent/10 flex items-center justify-center border border-zenit-accent/20 text-zenit-accent shadow-[0_0_15px_var(--accent-glow)]">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-display font-bold uppercase tracking-tight text-zenit-text-primary">{title}</h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zenit-text-tertiary">{description}</p>
      </div>
    </div>
    
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start space-x-3 group">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zenit-accent shadow-[0_0_8px_var(--accent-glow)] group-hover:scale-125 transition-transform" />
          <span className="text-xs text-zenit-text-secondary leading-relaxed group-hover:text-zenit-text-primary transition-colors">{item}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

export const Manual: React.FC = () => {
  return (
    <div className="min-h-screen bg-zenit-black text-white p-6 pb-32 space-y-12 max-w-4xl mx-auto">
      <header className="text-center space-y-4 pt-12">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-zenit-accent/10 rounded-full border border-zenit-accent/20 mb-4">
          <Book size={14} className="text-zenit-accent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zenit-accent">Guia do Sistema</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter uppercase leading-none">
          Manual do <span className="text-zenit-accent italic">Usuário</span>
        </h1>
        <p className="text-zenit-text-tertiary text-sm max-w-xl mx-auto leading-relaxed uppercase tracking-widest font-bold opacity-60">
          Aprenda a dominar todas as interfaces neurais do ecossistema Zenit IA.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ManualSection 
          icon={<Brain />}
          title="IA Mentor Infinity"
          description="Inteligência Artificial Central"
          items={[
            "O Mentor IA é seu guia para alta performance.",
            "Use o chat para pedir conselhos, criar rotinas ou analisar dados.",
            "Quanto mais você interage, mais o sistema se adapta ao seu perfil.",
            "Acesse pelo botão central ou pelo card no Dashboard."
          ]}
        />
        
        <ManualSection 
          icon={<Zap />}
          title="Nexus Social"
          description="Rede Neural de Evolução"
          items={[
            "Compartilhe seu progresso e conquistas no Fluxo.",
            "O Pulse permite capturar momentos rápidos da sua jornada.",
            "Mantenha o HOT Streak ativo interagindo com outros usuários.",
            "Siga mentes alinhadas aos seus objetivos de evolução."
          ]}
        />

        <ManualSection 
          icon={<Compass />}
          title="Axis"
          description="Visualização de Evolução"
          items={[
            "O Axis mapeia seu progresso em todas as áreas da vida.",
            "Use o Motor de Decisão para analisar dilemas complexos.",
            "Acompanhe seu Life Score e identifique pontos de melhoria.",
            "Visualize sua jornada de forma holística e tecnológica."
          ]}
        />

        <ManualSection 
          icon={<Wallet />}
          title="Finanças"
          description="Protocolo de Riqueza"
          items={[
            "Registre receitas e despesas para manter o equilíbrio.",
            "Defina metas de economia e acompanhe o progresso.",
            "O Mentor Financeiro analisa seus gastos e sugere otimizações.",
            "Mantenha sua saúde financeira em sincronia com sua evolução."
          ]}
        />

        <ManualSection 
          icon={<Activity />}
          title="Protocolos"
          description="Sincronização de Rotina"
          items={[
            "Crie protocolos personalizados para diferentes fases.",
            "Sincronize suas tarefas diárias com o Ciclo de Performance.",
            "Ganhe XP e suba de nível ao completar suas obrigações.",
            "O sistema avisa sobre as próximas ações prioritárias."
          ]}
        />

        <ManualSection 
          icon={<Shield />}
          title="Segurança"
          description="Proteção de Dados"
          items={[
            "Seus dados são protegidos por criptografia de ponta a ponta.",
            "Gerencie sua Chave Neural nas configurações de perfil.",
            "O Modo Admin permite acesso a funções de desenvolvedor.",
            "Mantenha seu Link Neural seguro e atualizado."
          ]}
        />
      </div>

      <footer className="text-center pt-12 space-y-6">
        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-zenit-accent/10 to-transparent border border-zenit-accent/20">
          <p className="text-xs text-zenit-text-secondary leading-relaxed max-w-lg mx-auto">
            Este manual é atualizado constantemente à medida que o sistema Zenit IA evolui. 
            Mantenha sua interface atualizada para acessar as últimas funções neurais.
          </p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="text-[10px] text-zenit-text-tertiary hover:text-zenit-accent uppercase tracking-widest font-bold transition-colors"
        >
          Voltar ao Dashboard
        </button>
      </footer>
    </div>
  );
};
