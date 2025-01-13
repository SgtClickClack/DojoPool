# Documentation Index

## Core Documentation
These documents should be referenced and followed for all development work.

### Project Management
- [Development Tracking](./DEVELOPMENT_TRACKING.md) - Sprint progress and task tracking
  - **DO NOT EDIT** - Historical record of development progress
  - New entries should be added as new files: `DEVELOPMENT_TRACKING_YYYY_MM_DD.md`
- [Roadmap](./ROADMAP.md) - Long-term project vision and milestones

### Development Guidelines
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow and standards
- [Image Assets Guide](./BACKGROUND_IMAGES.md) - Image usage and implementation guidelines
  - Core brand images maintain original case
  - All other images must use lowercase naming
  - Directory structure and naming conventions
  - Performance optimization guidelines

### Testing
- [Test Templates](./tests/) - Standard test templates and examples
  - Image asset tests: `test_image_assets.py`
  - Core functionality tests
  - Frontend component tests

### Asset Organization
```
src/dojopool/static/images/
├── core/           # Core brand assets (LogoDojoPool.jpg, PosterDojoPool.jpg)
├── backgrounds/    # Background images and textures
├── features/       # Feature-specific illustrations
└── icons/         # UI icons and small graphics
```

## Development History
Links to historical development tracking files:

### 2024
- [January 10, 2024](./DEVELOPMENT_TRACKING.md) - Image asset organization and optimization
  - Established directory structure
  - Implemented naming conventions
  - Created automated tests
  - Set up documentation

## Version Control
- `.gitignore` - Version control exclusions
  - Excludes temporary image files
  - Excludes development environment files
  - Excludes build artifacts

## Dependencies
Core dependencies that must be maintained:
```
pytest==7.4.3
Pillow==10.1.0
Flask==3.0.0
python-dotenv==1.0.0
pytest-cov==4.1.0
```

## Scripts
Maintenance and organization scripts:
- `src/dojopool/scripts/organize_images.py` - Image organization and naming convention enforcement
- `src/dojopool/scripts/setup_core_images.py` - Core brand image setup

## Best Practices
1. Always reference this index when starting new development tasks
2. Keep documentation up to date with code changes
3. Preserve development history in tracking files
4. Follow established naming conventions and directory structures
5. Run relevant tests before committing changes 