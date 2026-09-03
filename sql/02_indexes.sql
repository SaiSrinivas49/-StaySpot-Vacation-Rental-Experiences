create unique index idx_active_stay on bookings(guest_id) where status='CHECKED_IN';

CREATE INDEX idx_bookings_property_created
ON bookings (property_id, created_at)
WHERE status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED');