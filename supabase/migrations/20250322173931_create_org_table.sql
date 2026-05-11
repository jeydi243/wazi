create table if not exists employees (
  id bigint primary key generated always as identity,
  name text not null,
  email text,
  created_at timestamptz default now()
);


create table if not exists organisations (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  code text,
  lookup_id number not null references lookups(id),
  created_at timestamptz default now(),
  created_by uuid not null references auth.users(id),
  updated_at timestamptz default now(),
  updated_by uuid not null references auth.users(id)
);
