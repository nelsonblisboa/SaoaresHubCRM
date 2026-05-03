-- Função para obter dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(org_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'leadsQuentes', COALESCE((SELECT COUNT(*)::INTEGER FROM leads WHERE organization_id::TEXT = org_id AND temperature = 'QUENTE' AND (is_deleted = FALSE OR is_deleted IS NULL)), 0),
    'leadsMornos', COALESCE((SELECT COUNT(*)::INTEGER FROM leads WHERE organization_id::TEXT = org_id AND temperature = 'MORNO' AND (is_deleted = FALSE OR is_deleted IS NULL)), 0),
    'leadsFrios', COALESCE((SELECT COUNT(*)::INTEGER FROM leads WHERE organization_id::TEXT = org_id AND temperature = 'FRIO' AND (is_deleted = FALSE OR is_deleted IS NULL)), 0),
    'conversasAtivas', COALESCE((SELECT COUNT(*)::INTEGER FROM conversations c JOIN contacts ct ON c.contact_id = ct.id WHERE ct.organization_id::TEXT = org_id AND c.status = 'ATIVA'), 0),
    'totalLeads', COALESCE((SELECT COUNT(*)::INTEGER FROM leads WHERE organization_id::TEXT = org_id AND (is_deleted = FALSE OR is_deleted IS NULL)), 0),
    'leadsGanhos', COALESCE((SELECT COUNT(*)::INTEGER FROM leads WHERE organization_id::TEXT = org_id AND stage = 'GANHO'), 0)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;