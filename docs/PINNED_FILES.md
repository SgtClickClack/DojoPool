# Pinned Files

This document tracks critical files that should always be visible to new agents for context. Each file is listed with its purpose and importance.

## Core Documentation
| File Path | Purpose | Update Frequency | Priority |
|-----------|---------|------------------|----------|
| `docs/ROADMAP.md` | Project vision and milestones | Monthly | High |
| `docs/DEVELOPMENT_TRACKING.md` | Current sprint progress | Daily | High |
| `docs/DOCUMENTATION_INDEX.md` | Central documentation reference | As needed | High |

## Configuration Files
| File Path | Purpose | Update Frequency | Priority |
|-----------|---------|------------------|----------|
| `requirements.txt` | Project dependencies | When dependencies change | High |
| `.gitignore` | Version control exclusions | When patterns change | Medium |
| `src/dojopool/config.py` | Application configuration | When settings change | High |

## Core Scripts
| File Path | Purpose | Update Frequency | Priority |
|-----------|---------|------------------|----------|
| `src/dojopool/scripts/monitor_performance.py` | Performance tracking | When metrics change | High |
| `src/dojopool/scripts/optimize_images.py` | Image optimization | When optimization logic changes | Medium |
| `src/dojopool/scripts/enhance_images.py` | Image enhancement | When enhancement logic changes | Medium |
| `src/dojopool/scripts/monitor_pinned_files.py` | Pinned files monitoring | When monitoring logic changes | High |
| `src/dojopool/scripts/update_context.py` | Context documentation management | When context rules change | High |
| `src/dojopool/scripts/generate_context_summary.py` | Context summarization | When summary format changes | High |
| `src/dojopool/scripts/validate_context.py` | Context validation | When validation rules change | High |

## Templates
| File Path | Purpose | Update Frequency | Priority |
|-----------|---------|------------------|----------|
| `src/dojopool/templates/landing.html` | Main landing page | When UI changes | High |
| `src/dojopool/templates/base.html` | Base template | When structure changes | High |

## Asset Organization
| File Path | Purpose | Update Frequency | Priority |
|-----------|---------|------------------|----------|
| `src/dojopool/static/images/README.md` | Image asset guidelines | When guidelines change | Medium |
| `src/dojopool/static/css/README.md` | CSS organization guidelines | When guidelines change | Medium |

## Performance Data
| File Path | Purpose | Update Frequency | Priority |
|-----------|---------|------------------|----------|
| `performance_metrics.json` | Historical performance data | Automated updates | Medium |
| `image_performance.log` | Performance monitoring logs | Automated updates | Low |
| `context_updates.yaml` | Pending context updates | Automated updates | High |
| `pinned_files_status.yaml` | Pinned files status | Automated updates | High |
| `context_summary.md` | Current context summary | Automated updates | High |
| `context_validation.yaml` | Context validation results | Automated updates | High |

## Notes for Agents
1. Always check these pinned files first when starting a new task
2. Update relevant documentation when making changes
3. Keep track of file update frequencies
4. Consider priority levels when making decisions
5. Add new files to this list if they become critical for context
6. Use `update_context.py` to manage documentation updates
7. Check `context_summary.md` for quick context overview
8. Run `validate_context.py` to ensure consistency

## File Update Protocol
1. When updating a pinned file:
   - Use `update_context.py` to record the change
   - Document the change in `DEVELOPMENT_TRACKING.md`
   - Update any related documentation
   - Consider impacts on other pinned files
   - Run `validate_context.py` to check consistency

2. When adding a new pinned file:
   - Add it to this list with all required information
   - Create any necessary documentation
   - Update `DOCUMENTATION_INDEX.md`
   - Use `update_context.py` to track the addition
   - Run `validate_context.py` to verify

3. When removing a pinned file:
   - Document the reason for removal
   - Update all related documentation
   - Ensure no critical context is lost
   - Use `update_context.py` to track the removal
   - Run `validate_context.py` to verify

## Monitoring and Maintenance
- Review this list monthly
- Archive files that are no longer critical
- Update priorities based on project needs
- Ensure all paths are valid and files exist
- Run `monitor_pinned_files.py` regularly
- Check `context_updates.yaml` for pending updates
- Review `context_summary.md` daily
- Run `validate_context.py` after changes 