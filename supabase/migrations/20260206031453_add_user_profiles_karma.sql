
  create table "public"."user_profiles" (
    "user_id" uuid not null,
    "karma_points" integer not null default 0,
    "total_scans" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_profiles" enable row level security;

CREATE INDEX idx_user_profiles_karma ON public.user_profiles USING btree (karma_points DESC);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (user_id);

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_user_karma()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Insert or update user profile with karma increment
  insert into "public"."user_profiles" ("user_id", "karma_points", "total_scans", "updated_at")
  values (new.user_id, 1, 1, now())
  on conflict ("user_id") 
  do update set 
    "karma_points" = "user_profiles"."karma_points" + 1,
    "total_scans" = "user_profiles"."total_scans" + 1,
    "updated_at" = now();
  
  return new;
end;
$function$
;

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";


  create policy "user_profiles_select_own"
  on "public"."user_profiles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "user_profiles_update_own"
  on "public"."user_profiles"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER user_scan_history_increment_karma AFTER INSERT ON public.user_scan_history FOR EACH ROW EXECUTE FUNCTION public.increment_user_karma();


