DELETE FROM study_groups
WHERE user_id LIKE 'seed-user-%'
   OR user_id IN (
     SELECT id FROM users
     WHERE email LIKE 'qa-%@studysync.edu'
        OR email LIKE 'browser-%@example.edu'
        OR email LIKE 'browser-candidate-%@example.edu'
        OR email LIKE 'a11y-%@example.edu'
   )
   OR user_id NOT IN (SELECT id FROM users);

DELETE FROM users
WHERE (id LIKE 'seed-user-%' AND email LIKE 'student%@studysync.edu')
   OR email LIKE 'qa-%@studysync.edu'
   OR email LIKE 'browser-%@example.edu'
   OR email LIKE 'browser-candidate-%@example.edu'
   OR email LIKE 'a11y-%@example.edu';

DELETE FROM student_profiles
WHERE user_id NOT IN (SELECT id FROM users);

DELETE FROM matches
WHERE user_id NOT IN (SELECT id FROM users)
   OR (candidate_user_id IS NOT NULL AND candidate_user_id NOT IN (SELECT id FROM users));

DELETE FROM group_members
WHERE group_id NOT IN (SELECT id FROM study_groups)
   OR user_id NOT IN (SELECT id FROM users);

DELETE FROM match_candidates
WHERE match_id NOT IN (SELECT id FROM matches)
   OR user_id NOT IN (SELECT id FROM users);

DELETE FROM conversation_members
WHERE conversation_id NOT IN (SELECT id FROM conversations)
   OR user_id NOT IN (SELECT id FROM users);

UPDATE matches
SET avatar_url = NULL
WHERE avatar_url LIKE 'https://images.unsplash.com/%';
