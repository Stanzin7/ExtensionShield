-- User profiles table for tracking karma points and user statistics.
-- Links to auth.users via user_id.

create table "public"."user_profiles" (
  "user_id" uuid primary key references auth.users(id) on delete cascade,
  "karma_points" integer default 0 not null,
  "total_scans" integer default 0 not null,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null
);

create index "idx_user_profiles_karma" 
  on "public"."user_profiles"("karma_points" desc);

alter table "public"."user_profiles" enable row level security;

-- Users can only see their own profile
create policy "user_profiles_select_own"
  on "public"."user_profiles"
  for select
  using (auth.uid() = user_id);

-- Users can update their own profile (for future features)
create policy "user_profiles_update_own"
  on "public"."user_profiles"
  for update
  using (auth.uid() = user_id);

-- Trigger to auto-update updated_at
create trigger "user_profiles_updated_at"
  before update on "public"."user_profiles"
  for each row
  execute function update_updated_at_column();

-- Function to increment karma points when a scan is added
create or replace function "public"."increment_user_karma"()
returns trigger as $$
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
$$ language plpgsql security definer;

-- Trigger to increment karma when scan is added to history
create trigger "user_scan_history_increment_karma"
  after insert on "public"."user_scan_history"
  for each row
  execute function increment_user_karma();


