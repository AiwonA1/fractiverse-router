-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quick_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.l4_l8_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fractitoken_balances_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fractitoken_transactions_backup ENABLE ROW LEVEL SECURITY;

-- Add a basic policy for authenticated access
CREATE POLICY "Enable access to authenticated users" ON public.users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable access to authenticated users" ON public.user_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable access to authenticated users" ON public.user_responses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable access to authenticated users" ON public.user_quick_reference FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable access to authenticated users" ON public.l4_l8_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable access to authenticated users" ON public.chat_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable access to authenticated users" ON public.fractitoken_balances_backup FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable access to authenticated users" ON public.fractitoken_transactions_backup FOR ALL USING (auth.role() = 'authenticated'); 