
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.bootstrap_first_admin() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
alter function public.touch_updated_at() set search_path = public;
