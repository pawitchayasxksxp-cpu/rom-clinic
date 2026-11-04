-- Apply after billing migration. Retain internal hn column/sequence names for compatibility.
BEGIN;
LOCK TABLE rom_patient, rom_dispensing, rom_certificate, rom_payment IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
 IF EXISTS(SELECT 1 FROM rom_patient WHERE hn IS NOT NULL GROUP BY CASE WHEN hn ~ '^HN-[0-9]+$' THEN 'CN-'||substring(hn FROM 4) ELSE hn END HAVING count(*)>1) THEN
  RAISE EXCEPTION 'CN conversion would duplicate an existing patient identifier';
 END IF;
END $$;
CREATE TEMP TABLE rom_cn_mapping ON COMMIT DROP AS
 SELECT id,hn AS previous,'CN-'||substring(hn FROM 4) AS cn FROM rom_patient WHERE hn ~ '^HN-[0-9]+$';
UPDATE rom_dispensing d SET hn=m.cn FROM rom_cn_mapping m WHERE d.patient_id=m.id AND d.hn=m.previous;
UPDATE rom_payment p SET hn=m.cn FROM rom_cn_mapping m WHERE p.patient_id=m.id AND p.hn=m.previous;
UPDATE rom_certificate c SET patient_snapshot=jsonb_set(c.patient_snapshot,'{hn}',to_jsonb(m.cn),false)
 FROM rom_cn_mapping m WHERE c.patient_id=m.id AND c.patient_snapshot->>'hn'=m.previous;
UPDATE rom_patient p SET hn=m.cn FROM rom_cn_mapping m WHERE p.id=m.id;
CREATE OR REPLACE FUNCTION rom_next_patient_hn() RETURNS text
LANGUAGE sql VOLATILE AS $$
 SELECT 'CN-'||lpad(number::text,greatest(6,length(number::text)),'0')
 FROM (SELECT nextval('rom_patient_hn_seq') AS number) AS next_hn;
$$;
-- Restart transactionally at the same next number (or above any existing CN).
DO $$
DECLARE next_number bigint;
BEGIN
 SELECT greatest(CASE WHEN is_called THEN last_value+1 ELSE last_value END,
   COALESCE((SELECT max(substring(hn FROM '^CN-([0-9]+)$')::bigint)+1 FROM rom_patient),1))
 INTO next_number FROM rom_patient_hn_seq;
 EXECUTE format('ALTER SEQUENCE rom_patient_hn_seq RESTART WITH %s',next_number);
END $$;
COMMIT;
