CREATE OR REPLACE FUNCTION notify_data_changes()
RETURNS TRIGGER AS $$
DECLARE
  row_data JSONB;
  changed_fields JSONB := '{}'::jsonb;
  log_id BIGINT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    row_data := to_jsonb(OLD);
  ELSE
    row_data := to_jsonb(NEW);

    IF (TG_OP = 'UPDATE') AND (OLD IS DISTINCT FROM NEW) THEN
      SELECT jsonb_object_agg(
        key,
        jsonb_build_object(
          'old', old_val,
          'new', new_val
        )
      ) INTO changed_fields
      FROM (
        SELECT
          key,
          (to_jsonb(OLD) -> key) as old_val,
          (to_jsonb(NEW) -> key) as new_val
        FROM jsonb_each(to_jsonb(NEW))
        WHERE (to_jsonb(OLD) -> key) IS DISTINCT FROM (to_jsonb(NEW) -> key)
      ) t;

      IF changed_fields = '{}'::jsonb THEN
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  INSERT INTO notification_logs_table (table_name, action, payload)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    jsonb_build_object(
      'id', COALESCE(NEW.id, OLD.id),
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', row_data,
      'changes', changed_fields,
      'timestamp', to_jsonb(NOW())
    )
  )
  RETURNING id INTO log_id;

  PERFORM pg_notify('db_updates_channel', log_id::text);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

SELECT 1;

CREATE TRIGGER data_trigger
AFTER INSERT OR UPDATE OR DELETE ON "data_table"
FOR EACH ROW EXECUTE FUNCTION notify_data_changes();
