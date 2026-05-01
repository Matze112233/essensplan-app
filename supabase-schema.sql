-- Gerichte
create table dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  suitable_for text not null default 'both' check (suitable_for in ('mittag', 'abend', 'both')),
  created_at timestamptz default now()
);

-- Zutaten
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid references dishes(id) on delete cascade,
  name text not null
);

-- Wochenplan
create table meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  meal_type text not null check (meal_type in ('mittag', 'abend')),
  dish_id uuid references dishes(id) on delete cascade,
  created_at timestamptz default now()
);

-- Zugriff für alle (keine Authentifizierung)
alter table dishes enable row level security;
alter table ingredients enable row level security;
alter table meal_plan_entries enable row level security;

create policy "Alle dürfen lesen" on dishes for select using (true);
create policy "Alle dürfen schreiben" on dishes for insert with check (true);
create policy "Alle dürfen bearbeiten" on dishes for update using (true);
create policy "Alle dürfen löschen" on dishes for delete using (true);

create policy "Alle dürfen lesen" on ingredients for select using (true);
create policy "Alle dürfen schreiben" on ingredients for insert with check (true);
create policy "Alle dürfen bearbeiten" on ingredients for update using (true);
create policy "Alle dürfen löschen" on ingredients for delete using (true);

create policy "Alle dürfen lesen" on meal_plan_entries for select using (true);
create policy "Alle dürfen schreiben" on meal_plan_entries for insert with check (true);
create policy "Alle dürfen bearbeiten" on meal_plan_entries for update using (true);
create policy "Alle dürfen löschen" on meal_plan_entries for delete using (true);
