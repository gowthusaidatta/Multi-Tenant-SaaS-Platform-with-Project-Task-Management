-- Multi-assignee support for tasks

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- Backfill existing single assignee into task_assignees
INSERT INTO task_assignees(task_id, user_id)
SELECT id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL;
