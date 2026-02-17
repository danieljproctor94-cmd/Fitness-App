-- Drop problematic policies to break recursion
DROP POLICY IF EXISTS "Collaborators can view goals" ON goals;
DROP POLICY IF EXISTS "Collaborators can update goals" ON goals;
DROP POLICY IF EXISTS "View goal collaborators" ON goal_collaborators;
DROP POLICY IF EXISTS "Add goal collaborators" ON goal_collaborators;
DROP POLICY IF EXISTS "Remove goal collaborators" ON goal_collaborators;

-- Create helper function to break recursion
CREATE OR REPLACE FUNCTION get_goal_owner(goal_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT user_id FROM goals WHERE id = goal_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create policies for goal_collaborators

-- 1. View: Collaborator OR Owner
CREATE POLICY "View goal collaborators" ON goal_collaborators
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = get_goal_owner(goal_id)
    );

-- 2. Insert: Only Owner can modify collaborators list
CREATE POLICY "Add goal collaborators" ON goal_collaborators
    FOR INSERT WITH CHECK (
        auth.uid() = get_goal_owner(goal_id)
    );

-- 3. Delete: Owner or Self
CREATE POLICY "Remove goal collaborators" ON goal_collaborators
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.uid() = get_goal_owner(goal_id)
    );

-- Re-create policies for goals allow access to collaborators

-- View: Collaborator can see goal
CREATE POLICY "Collaborators can view goals" ON goals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM goal_collaborators WHERE goal_id = id AND user_id = auth.uid())
    );

-- Update: Collaborator can update goal
CREATE POLICY "Collaborators can update goals" ON goals
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM goal_collaborators WHERE goal_id = id AND user_id = auth.uid())
    );
