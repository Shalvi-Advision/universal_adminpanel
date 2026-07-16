import type { Project } from 'src/services/projects';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
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
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
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

  return (
    <Tooltip title="All data shown in the panel belongs to the selected client">
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
    </Tooltip>
  );
}
