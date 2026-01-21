-- Fix Jessie's species from 'dog' to 'cat'
-- This updates the specific animal record

UPDATE dogs
SET species = 'cat'
WHERE name = 'Jessie'
  AND species = 'dog';

-- Verify the update
SELECT id, name, species, breed
FROM dogs
WHERE name = 'Jessie';
