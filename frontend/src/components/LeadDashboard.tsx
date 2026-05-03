import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseService, Lead } from '../services/supabaseService';

export const LeadDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticação
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchLeads();
      }
    });
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Aqui você precisaria ter o organizationId do usuário
      // Para exemplo, vamos usar um ID fixo
      const organizationId = 'org-id-exemplo';
      const fetchedLeads = await supabaseService.fetchLeads(organizationId);
      setLeads(fetchedLeads);
      setError(null);
    } catch (err) {
      setError('Failed to fetch leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: Lead['stage']) => {
    try {
      await supabaseService.updateLead(leadId, { stage: newStage });
      fetchLeads(); // Recarregar leads
    } catch (err) {
      setError('Failed to update lead');
      console.error(err);
    }
  };

  const handleSignUp = async () => {
    try {
      await supabaseService.signUp('user@example.com', 'password123', 'User Name');
      fetchLeads();
    } catch (err) {
      setError('Sign up failed');
      console.error(err);
    }
  };

  const handleSignIn = async () => {
    try {
      await supabaseService.signIn('user@example.com', 'password123');
      fetchLeads();
    } catch (err) {
      setError('Sign in failed');
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      setLeads([]);
      setUser(null);
    } catch (err) {
      setError('Sign out failed');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading leads...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lead Dashboard</h1>
      
      {!user ? (
        <div className="space-y-4">
          <button 
            onClick={handleSignUp}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Sign Up
          </button>
          <button 
            onClick={handleSignIn}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Sign In
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Welcome, {user.email}</span>
            <button 
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            {leads.map((lead) => (
              <div key={lead.id} className="border rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Lead ID: {lead.id}</h3>
                    <p>Stage: {lead.stage}</p>
                    <p>Temperature: {lead.temperature}</p>
                    <p>Score: {lead.score}</p>
                  </div>
                  <div className="space-x-2">
                    <button 
                      onClick={() => updateLeadStage(lead.id, 'GANHO')}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Mark as Won
                    </button>
                    <button 
                      onClick={() => updateLeadStage(lead.id, 'PERDIDO')}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Mark as Lost
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leads.length === 0 && (
            <p>No leads found</p>
          )}
        </div>
      )}
    </div>
  );
};