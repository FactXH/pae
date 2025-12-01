

with raw_data as (

    -- ENGINEERING MANAGER
    select 'ENGINEERING MANAGER' as team, null as sub_classification, 'OLD' as status, 134399 as job_posting_id
    union all
    select 'ENGINEERING MANAGER', null, 'NEW', 248463

    -- FINANCE - SENIOR
    union all
    select 'FINANCE', 'SENIOR', 'OLD', 227422
    union all
    select 'FINANCE', 'SENIOR', 'NEW', 248488

    -- FINANCE - STAFF
    union all
    select 'FINANCE', 'STAFF', 'OLD', 235705
    union all
    select 'FINANCE', 'STAFF', 'NEW', 248493

    -- TALENT
    union all
    select 'TALENT', null, 'OLD', 41921
    union all
    select 'TALENT', null, 'NEW', 248312

    -- OPERATIONS - PAYROLL
    union all
    select 'OPERATIONS', 'PAYROLL', 'OLD', 238793
    union all
    select 'OPERATIONS', 'PAYROLL', 'NEW', 248304

    -- OPERATIONS - TIME
    union all
    select 'OPERATIONS', 'TIME', 'OLD', 248310
    union all
    select 'OPERATIONS', 'TIME', 'NEW', 248304

    -- PLATFORM - BACKOFFICE (SENIOR)
    union all
    select 'PLATFORM', 'BACKOFFICE (SENIOR)', 'OLD', 248466

    -- PLATFORM - DX (two OLD IDs)
    union all
    select 'PLATFORM', 'DX', 'OLD', 231526
    union all
    select 'PLATFORM', 'DX', 'OLD', 239670
    union all
    select 'PLATFORM', 'DX', 'NEW', 261530

    -- PLATFORM - CIAM
    union all
    select 'PLATFORM', 'CIAM', 'OLD', 235148
    union all
    select 'PLATFORM', 'CIAM', 'NEW', 265724

    -- PLATFORM - FOUNDATIONS
    union all
    select 'PLATFORM', 'FOUNDATIONS', 'OLD', 228957
)

select * from raw_data
