DO
$$
BEGIN
    IF register_patch('MigrateVisitRegistrationDatesToTimestampTz.sql', 'Jekabs Karklins', 'Migrate visit registration start and end date columns to TIMESTAMPTZ', '2026-05-23') THEN

        ALTER TABLE visits_has_users
        ALTER COLUMN starts_at TYPE timestamp with time zone USING starts_at AT TIME ZONE 'UTC',
        ALTER COLUMN ends_at TYPE timestamp with time zone USING ends_at AT TIME ZONE 'UTC';

    END IF;
END;
$$
LANGUAGE plpgsql;
