-- ===========================================
-- J&T Moments — Schema completo v2
-- Execute no SQL Editor do Supabase
-- ===========================================

-- ── TABELAS BASE ──────────────────────────

create table if not exists public.couples (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.couple_members (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(couple_id, user_id)
);

-- ── GALERIA ───────────────────────────────

create table if not exists public.gallery (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  url text not null,
  path text not null,
  name text,
  created_at timestamptz default now()
);

-- ── NOTAS ─────────────────────────────────

create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  author_id uuid references auth.users(id) not null,
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- ── LUGARES ───────────────────────────────

create table if not exists public.places (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  name text not null,
  category text default 'Outro',
  city text,
  visited boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- ── LISTAS ────────────────────────────────

create table if not exists public.lists (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  title text not null,
  icon text default '🎬',
  created_at timestamptz default now()
);

create table if not exists public.list_items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  text text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- ── WISHLIST ──────────────────────────────

create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  name text not null,
  link text,
  priority text default 'media',
  for_who text default 'ambos',
  created_at timestamptz default now()
);

-- ── RLS ───────────────────────────────────

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.gallery enable row level security;
alter table public.notes enable row level security;
alter table public.places enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.wishlist enable row level security;

-- couples
create policy "select_couples" on public.couples for select using (true);
create policy "insert_couples" on public.couples for insert with check (auth.uid() is not null);

-- couple_members
create policy "select_members" on public.couple_members for select using (auth.uid() is not null);
create policy "insert_members" on public.couple_members for insert with check (auth.uid() = user_id);

-- helper: is_couple_member
create or replace function public.is_couple_member(cid uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = cid and user_id = auth.uid()
  )
$$;

-- gallery
create policy "gallery_select" on public.gallery for select using (is_couple_member(couple_id));
create policy "gallery_insert" on public.gallery for insert with check (is_couple_member(couple_id));
create policy "gallery_delete" on public.gallery for delete using (is_couple_member(couple_id));

-- notes
create policy "notes_select" on public.notes for select using (is_couple_member(couple_id));
create policy "notes_insert" on public.notes for insert with check (is_couple_member(couple_id));
create policy "notes_delete" on public.notes for delete using (is_couple_member(couple_id));

-- places
create policy "places_select" on public.places for select using (is_couple_member(couple_id));
create policy "places_insert" on public.places for insert with check (is_couple_member(couple_id));
create policy "places_update" on public.places for update using (is_couple_member(couple_id));
create policy "places_delete" on public.places for delete using (is_couple_member(couple_id));

-- lists
create policy "lists_select" on public.lists for select using (is_couple_member(couple_id));
create policy "lists_insert" on public.lists for insert with check (is_couple_member(couple_id));
create policy "lists_delete" on public.lists for delete using (is_couple_member(couple_id));

-- list_items
create policy "items_select" on public.list_items for select using (
  exists (select 1 from public.lists l where l.id = list_id and is_couple_member(l.couple_id))
);
create policy "items_insert" on public.list_items for insert with check (
  exists (select 1 from public.lists l where l.id = list_id and is_couple_member(l.couple_id))
);
create policy "items_update" on public.list_items for update using (
  exists (select 1 from public.lists l where l.id = list_id and is_couple_member(l.couple_id))
);
create policy "items_delete" on public.list_items for delete using (
  exists (select 1 from public.lists l where l.id = list_id and is_couple_member(l.couple_id))
);

-- wishlist
create policy "wish_select" on public.wishlist for select using (is_couple_member(couple_id));
create policy "wish_insert" on public.wishlist for insert with check (is_couple_member(couple_id));
create policy "wish_delete" on public.wishlist for delete using (is_couple_member(couple_id));

-- ── STORAGE: galeria ──────────────────────
-- Vá em Storage > New bucket > nome: "gallery" > Public bucket: ON
-- Depois rode:

insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "gallery_storage_select" on storage.objects for select using (bucket_id = 'gallery');
create policy "gallery_storage_insert" on storage.objects for insert with check (bucket_id = 'gallery' and auth.uid() is not null);
create policy "gallery_storage_delete" on storage.objects for delete using (bucket_id = 'gallery' and auth.uid() is not null);
