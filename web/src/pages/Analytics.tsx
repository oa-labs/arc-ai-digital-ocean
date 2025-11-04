import { useState, useEffect } from 'react';
import { agentManagementService, Agent } from '@/services/agentManagementService';
import { AgentAnalytics } from '@/components/AgentAnalytics';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { BarChart3 } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function Analytics() {
  const [agents, setAgents] = useState<Agent[]>([]);

  const loadAgents = async () => {
    try {
      const agentList = await agentManagementService.listAgents();
      setAgents(agentList);
    } catch (error) {
      console.error('Error loading agents:', error);
      showToast.error('Failed to load agents. Please check your configuration.');
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="ArcAI Portal" icon={BarChart3} currentPage="analytics" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AgentAnalytics agents={agents} />
      </main>

      <Footer />
    </div>
  );
}