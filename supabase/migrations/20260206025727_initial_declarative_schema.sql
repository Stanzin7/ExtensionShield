set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_page_view(p_day text, p_path text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_count integer;
begin
  -- Atomic upsert: insert with count=1 or increment existing count
  insert into "public"."page_views_daily" ("day", "path", "count")
  values (p_day, p_path, 1)
  on conflict ("day", "path") 
  do update set "count" = "page_views_daily"."count" + 1
  returning "count" into v_count;
  
  return v_count;
end;
$function$
;


