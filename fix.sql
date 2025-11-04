-- Get the most recent album (likely the one with duplicates)
SET @album_id = (SELECT id FROM albums ORDER BY createdAt DESC LIMIT 1);

-- Fix track 4 (second occurrence)
UPDATE tracks SET title = 'The Price of the Pulpit (Part 2)' 
WHERE albumId = @album_id AND `index` = 4 AND title = 'The Price of the Pulpit';

-- Fix track 6 (third occurrence)  
UPDATE tracks SET title = 'The Price of the Pulpit (Part 3)'
WHERE albumId = @album_id AND `index` = 6 AND title = 'The Price of the Pulpit';

-- Fix track 7 (fourth occurrence)
UPDATE tracks SET title = 'The Price of the Pulpit (Part 4)'
WHERE albumId = @album_id AND `index` = 7 AND title = 'The Price of the Pulpit';

SELECT id, `index`, title FROM tracks WHERE albumId = @album_id ORDER BY `index`;
