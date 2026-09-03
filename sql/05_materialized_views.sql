drop materialized view if exists property_summary cascade;

create materialized view property_summary as
select p.id as PropertyID,p.title as Title,
count(b.id) as TotalNightsBooked, coalesce(sum(b.total_cost),0.00) as GrossRevenue
from properties p left join bookings b on p.id = b.property_id
group by p.id,p.title;

create unique index property_summary_idx on property_summary(PropertyID);

create or replace function refresh_property_summary()
returns void
language plpgsql
as $$
begin
refresh materialized view concurrently property_summary;
end;
$$;

select refresh_property_summary();

select * from property_summary;