import type { Project } from 'src/services/projects';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { getProjects } from 'src/services/projects';
import { useProject } from 'src/contexts/project-context';

export function ProjectSelector() {
  const { projectCode, setProjectCode } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getProjects();
        if (response.success) {
          setProjects(response.data);
          // Scoped admins may not have access to the locally remembered
          // project — snap the selection to a project they're allowed on.
          const allowed = response.data.map((p) => p.project_code);
          if (allowed.length && !allowed.includes(projectCode)) {
            setProjectCode(allowed[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event: any) => {
    const selectedCode = event.target.value;
    if (selectedCode && selectedCode !== projectCode) {
      setProjectCode(selectedCode);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!projects.length) {
    return null;
  }

  // Single-project admins are locked to their client — no switcher
  if (projects.length === 1) {
    return (
      <Tooltip title="Your account is scoped to this client">
        <Chip
          color="primary"
          variant="outlined"
          label={projects[0].client_name}
          sx={{ fontWeight: 600 }}
        />
      </Tooltip>
    );
  }

  // No Tooltip here: it would render over the open dropdown and hide the
  // first option. The floating "Client / Project" label is context enough.
  return (
    <FormControl size="small" sx={{ minWidth: 190 }}>
      <InputLabel id="project-select-label">Client / Project</InputLabel>
      <Select
        labelId="project-select-label"
        id="project-select"
        value={projectCode}
        label="Client / Project"
        onChange={handleChange}
      >
        {projects.map((project) => (
          <MenuItem key={project.project_code} value={project.project_code}>
            {project.client_name} ({project.project_code})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
