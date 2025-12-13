-- =====================================================
-- NEXA: Helper Function for Optional TimescaleDB Support
-- Run this BEFORE other schema files
-- =====================================================

-- Create a helper function to safely call TimescaleDB functions
CREATE OR REPLACE FUNCTION try_create_hypertable(
    table_name TEXT,
    time_column TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    has_timescaledb BOOLEAN;
BEGIN
    -- Check if TimescaleDB is available
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) INTO has_timescaledb;
    
    IF has_timescaledb THEN
        EXECUTE format('SELECT create_hypertable(%L, %L, if_not_exists => TRUE)', table_name, time_column);
        RAISE NOTICE 'Created hypertable for %.%', 'public', table_name;
        RETURN TRUE;
    ELSE
        RAISE WARNING 'TimescaleDB not available - % will use standard table. Install TimescaleDB for better performance.', table_name;
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not create hypertable for %: %', table_name, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Helper for compression policies
CREATE OR REPLACE FUNCTION try_add_compression_policy(
    hypertable_name TEXT,
    compress_after INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
    has_timescaledb BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) INTO has_timescaledb;
    
    IF has_timescaledb THEN
        PERFORM add_compression_policy(hypertable_name, compress_after);
        RAISE NOTICE 'Added compression policy for %', hypertable_name;
        RETURN TRUE;
    ELSE
        RAISE WARNING 'TimescaleDB not available - compression not configured for %', hypertable_name;
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add compression policy for %: %', hypertable_name, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Helper for retention policies
CREATE OR REPLACE FUNCTION try_add_retention_policy(
    hypertable_name TEXT,
    drop_after INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
    has_timescaledb BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) INTO has_timescaledb;
    
    IF has_timescaledb THEN
        PERFORM add_retention_policy(hypertable_name, drop_after);
        RAISE NOTICE 'Added retention policy for %', hypertable_name;
        RETURN TRUE;
    ELSE
        RAISE WARNING 'TimescaleDB not available - retention not configured for %', hypertable_name;
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add retention policy for %: %', hypertable_name, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Helper for continuous aggregates
CREATE OR REPLACE FUNCTION try_add_continuous_aggregate_policy(
    view_name TEXT,
    start_offset INTERVAL,
    end_offset INTERVAL,
    schedule_interval INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
    has_timescaledb BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) INTO has_timescaledb;
    
    IF has_timescaledb THEN
        PERFORM add_continuous_aggregate_policy(view_name, start_offset, end_offset, schedule_interval);
        RAISE NOTICE 'Added continuous aggregate policy for %', view_name;
        RETURN TRUE;
    ELSE
        RAISE WARNING 'TimescaleDB not available - continuous aggregate not configured for %', view_name;
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add continuous aggregate policy for %: %', view_name, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Check TimescaleDB status
DO $$
DECLARE
    ts_version TEXT;
BEGIN
    SELECT extversion INTO ts_version FROM pg_extension WHERE extname = 'timescaledb';
    
    IF FOUND THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'TimescaleDB Version: %', ts_version;
        RAISE NOTICE 'Time-series optimizations: ENABLED';
        RAISE NOTICE '========================================';
    ELSE
        RAISE WARNING '========================================';
        RAISE WARNING 'TimescaleDB: NOT INSTALLED';
        RAISE WARNING 'Schema will work but without time-series optimizations';
        RAISE WARNING 'See INSTALL_TIMESCALEDB.md for installation instructions';
        RAISE WARNING '========================================';
    END IF;
END $$;

COMMENT ON FUNCTION try_create_hypertable IS 'Safely create hypertable if TimescaleDB is available';
COMMENT ON FUNCTION try_add_compression_policy IS 'Safely add compression policy if TimescaleDB is available';
COMMENT ON FUNCTION try_add_retention_policy IS 'Safely add retention policy if TimescaleDB is available';
