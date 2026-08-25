-- ReconFlow merchant schema, RLS, and signup trigger

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  owner_name text not null,
  created_at timestamptz not null default now()
);

create table public.ledger_uploads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  file_name text not null,
  record_count integer not null default 0,
  rejected_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.ledger_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  upload_id uuid not null references public.ledger_uploads(id) on delete cascade,
  order_id text not null,
  customer text,
  amount_paise bigint not null,
  transaction_date timestamptz not null,
  created_at timestamptz not null default now()
);

create index ledger_records_business_id_idx on public.ledger_records (business_id);
create index ledger_records_upload_id_idx on public.ledger_records (upload_id);
create index ledger_records_order_id_idx on public.ledger_records (order_id);
create index ledger_records_transaction_date_idx on public.ledger_records (transaction_date);

create table public.razorpay_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  razorpay_payment_id text,
  razorpay_order_id text,
  settlement_id text,
  gross_amount_paise bigint not null,
  fee_paise bigint not null default 0,
  tax_paise bigint not null default 0,
  net_amount_paise bigint not null,
  utr text,
  transaction_date timestamptz not null,
  raw_data jsonb,
  created_at timestamptz not null default now()
);

create index razorpay_transactions_business_id_idx on public.razorpay_transactions (business_id);
create index razorpay_transactions_payment_id_idx on public.razorpay_transactions (razorpay_payment_id);
create index razorpay_transactions_order_id_idx on public.razorpay_transactions (razorpay_order_id);
create index razorpay_transactions_settlement_id_idx on public.razorpay_transactions (settlement_id);
create index razorpay_transactions_date_idx on public.razorpay_transactions (transaction_date);

create unique index razorpay_transactions_payment_unique
  on public.razorpay_transactions (business_id, razorpay_payment_id)
  where razorpay_payment_id is not null;

create table public.reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ledger_upload_id uuid not null references public.ledger_uploads(id) on delete cascade,
  total_records integer not null,
  resolved_records integer not null,
  exception_count integer not null,
  match_rate numeric not null,
  accuracy numeric,
  precision_score numeric,
  recall_score numeric,
  processing_time_ms integer not null,
  status text not null check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create unique index reconciliation_runs_one_processing
  on public.reconciliation_runs (ledger_upload_id)
  where status = 'processing';

create table public.reconciliation_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.reconciliation_runs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  ledger_record_id uuid not null references public.ledger_records(id) on delete cascade,
  method text not null check (
    method in ('exact', 'fee_adjusted', 'split', 'ai_assisted', 'unresolved')
  ),
  confidence numeric,
  reason text not null,
  status text not null check (status in ('matched', 'review')),
  created_at timestamptz not null default now()
);

create unique index reconciliation_results_run_ledger_unique
  on public.reconciliation_results (run_id, ledger_record_id);

create table public.reconciliation_result_transactions (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.reconciliation_results(id) on delete cascade,
  razorpay_transaction_id uuid not null references public.razorpay_transactions(id) on delete cascade
);

create table public.exceptions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.reconciliation_runs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  ledger_record_id uuid references public.ledger_records(id) on delete cascade,
  type text not null check (
    type in (
      'AMOUNT_MISMATCH',
      'MISSING_RAZORPAY_RECORD',
      'DUPLICATE_PAYMENT',
      'AMBIGUOUS_MATCH',
      'DATE_MISMATCH',
      'AI_LOW_CONFIDENCE',
      'INVALID_LEDGER_RECORD'
    )
  ),
  reason text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.businesses (owner_user_id, name, owner_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'My business'),
    coalesce(nullif(new.raw_user_meta_data->>'owner_name', ''), 'Owner')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.businesses enable row level security;
alter table public.ledger_uploads enable row level security;
alter table public.ledger_records enable row level security;
alter table public.razorpay_transactions enable row level security;
alter table public.reconciliation_runs enable row level security;
alter table public.reconciliation_results enable row level security;
alter table public.reconciliation_result_transactions enable row level security;
alter table public.exceptions enable row level security;

create policy businesses_select on public.businesses
  for select using (owner_user_id = auth.uid());
create policy businesses_insert on public.businesses
  for insert with check (owner_user_id = auth.uid());
create policy businesses_update on public.businesses
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy businesses_delete on public.businesses
  for delete using (owner_user_id = auth.uid());

create policy ledger_uploads_select on public.ledger_uploads
  for select using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy ledger_uploads_insert on public.ledger_uploads
  for insert with check (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy ledger_uploads_update on public.ledger_uploads
  for update using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy ledger_uploads_delete on public.ledger_uploads
  for delete using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));

create policy ledger_records_select on public.ledger_records
  for select using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy ledger_records_insert on public.ledger_records
  for insert with check (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy ledger_records_update on public.ledger_records
  for update using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy ledger_records_delete on public.ledger_records
  for delete using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));

create policy razorpay_transactions_select on public.razorpay_transactions
  for select using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy razorpay_transactions_insert on public.razorpay_transactions
  for insert with check (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy razorpay_transactions_update on public.razorpay_transactions
  for update using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy razorpay_transactions_delete on public.razorpay_transactions
  for delete using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));

create policy reconciliation_runs_select on public.reconciliation_runs
  for select using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy reconciliation_runs_insert on public.reconciliation_runs
  for insert with check (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy reconciliation_runs_update on public.reconciliation_runs
  for update using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy reconciliation_runs_delete on public.reconciliation_runs
  for delete using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));

create policy reconciliation_results_select on public.reconciliation_results
  for select using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy reconciliation_results_insert on public.reconciliation_results
  for insert with check (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy reconciliation_results_update on public.reconciliation_results
  for update using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy reconciliation_results_delete on public.reconciliation_results
  for delete using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));

create policy reconciliation_result_transactions_select on public.reconciliation_result_transactions
  for select using (
    result_id in (
      select id from public.reconciliation_results
      where business_id in (select id from public.businesses where owner_user_id = auth.uid())
    )
  );
create policy reconciliation_result_transactions_insert on public.reconciliation_result_transactions
  for insert with check (
    result_id in (
      select id from public.reconciliation_results
      where business_id in (select id from public.businesses where owner_user_id = auth.uid())
    )
  );
create policy reconciliation_result_transactions_update on public.reconciliation_result_transactions
  for update using (
    result_id in (
      select id from public.reconciliation_results
      where business_id in (select id from public.businesses where owner_user_id = auth.uid())
    )
  );
create policy reconciliation_result_transactions_delete on public.reconciliation_result_transactions
  for delete using (
    result_id in (
      select id from public.reconciliation_results
      where business_id in (select id from public.businesses where owner_user_id = auth.uid())
    )
  );

create policy exceptions_select on public.exceptions
  for select using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy exceptions_insert on public.exceptions
  for insert with check (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy exceptions_update on public.exceptions
  for update using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
create policy exceptions_delete on public.exceptions
  for delete using (business_id in (select id from public.businesses where owner_user_id = auth.uid()));
