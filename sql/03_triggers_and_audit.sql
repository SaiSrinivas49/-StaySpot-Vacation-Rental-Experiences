create or replace function audit_log()
returns trigger
language plpgsql
as $$
declare
	amount_diff decimal(10,2);
	action varchar(50);
begin
	amount_diff :=new.wallet_balance -old.wallet_balance;
	if amount_diff < 0 then action := 'DEBIT';
	elseif amount_diff > 0 then action := 'CREDIT';
	else action := 'NO_CHANGE';
	end if;

	insert into wallet_audit_logs(guest_id, amount_changed, action_type, balance_after) values(new.id,amount_diff,action,new.wallet_balance);

	return new;
end;
$$

create trigger audit_log_trigger after update of wallet_balance
on guests
for each row
when (old.wallet_balance != new.wallet_balance)
execute function audit_log();