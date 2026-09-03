create or replace procedure create_booking(guestid uuid, propertyid uuid,totalcost decimal(10,2))
language plpgsql
as $$
declare
curr_bal decimal(10,2);
begin
	select wallet_balance into curr_bal from guests where guest_id = guestid for update;
	if not found then
		raise exception 'Guest doesnt exist: %',guestid;
	end if;

	if totalcost<=0 then
		raise exception 'Invalid booking cost';
	end if;

	if curr_bal < totalcost then
		raise exception 'Insufficient Balance. Available: %, Required: %',curr_bal,totalcost;
	end if;

	update guests set wallet_balance = wallet_balance-totalcost where id = guestid;

	insert into bookings(guest_id,property_id,total_cost,status) values(guestid,propertyid,totalcost,'CONFIRMED');
	commit;
exception
	when others then rollback;
	raise notice 'Booking Failed: %', sqlerrm;
end;
$$;