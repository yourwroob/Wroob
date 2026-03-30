
-- Expand the type check constraint to include 'local'
ALTER TABLE public.groups DROP CONSTRAINT groups_type_check;
ALTER TABLE public.groups ADD CONSTRAINT groups_type_check CHECK (type = ANY (ARRAY['geo', 'cohort', 'local']));

-- Seed 5 local community groups
INSERT INTO public.groups (type, label, centroid_lat, centroid_lng, geohash) VALUES
  ('local', 'Mumbai Tech Community', 19.076, 72.8777, 'te7ud'),
  ('local', 'Delhi Startup Hub', 28.6139, 77.209, 'ttncj'),
  ('local', 'Bangalore Innovators', 12.9716, 77.5946, 'tdr1w'),
  ('local', 'Hyderabad Student Network', 17.385, 78.4867, 'tephz'),
  ('local', 'Pune Learning Circle', 18.5204, 73.8567, 'te7kx');
