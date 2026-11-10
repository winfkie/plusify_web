-- Jalankan di Supabase: SQL Editor > New query > paste > Run
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product text not null check (char_length(product) between 1 and 80),
  rating int not null check (rating between 1 and 5),
  name text not null check (char_length(name) between 2 and 40),
  comment text not null check (char_length(comment) between 5 and 600),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

grant usage on schema public to anon;
grant select, insert on public.reviews to anon;

-- Pengunjung hanya boleh MELIHAT ulasan yang disetujui
drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews
  for select to anon using (approved = true);

-- Pengunjung boleh MENGIRIM ulasan (tidak bisa edit / hapus)
-- Mode langsung tayang (NEEDS_APPROVAL: false):
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews
  for insert to anon with check (approved = true);

-- Mode moderasi (NEEDS_APPROVAL: true): hapus policy di atas, lalu jalankan ini:
-- create policy "reviews_insert" on public.reviews
--   for insert to anon with check (approved = false);
-- Setelah itu setujui ulasan lewat Table Editor: ubah kolom "approved" jadi true.

create index if not exists reviews_product_idx on public.reviews (product, created_at desc);
