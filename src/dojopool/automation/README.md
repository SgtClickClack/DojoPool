# DojoPool Automation Tools

## Overview

The DojoPool automation tools provide a comprehensive suite of code improvement and maintenance utilities. These tools help maintain code quality, security, and performance across the codebase.

## Components

### 1. Code Fixer (`code_fixer.py`)
- Code formatting using black and autopep8
- Import organization with isort
- Type checking and fixes with mypy
- Linting with pylint
- Docstring completion
- Variable naming convention enforcement
- Error handling pattern improvements

### 2. Security Fixer (`security_fixer.py`)
- Detection and removal of hardcoded secrets
- SQL injection vulnerability fixes
- Secure file operation patterns
- XSS vulnerability prevention
- Input validation improvements

### 3. Performance Fixer (`performance_fixer.py`)
- Database query optimization (N+1 queries)
- Memory leak detection and fixes
- CPU-intensive operation optimization
- Caching implementation
- Resource cleanup improvements

### 4. Dependency Fixer (`dependency_fixer.py`)
- Security vulnerability scanning
- Version conflict resolution
- Unused dependency removal
- Missing dependency detection
- Package version optimization

### 5. Auto Fixer (`auto_fixer.py`)
- Coordination of all fixing tools
- Parallel processing support
- Progress tracking and reporting
- Detailed fix summaries
- JSON report generation

## Usage

### Basic Usage

```bash
# Run all fixes
python -m src.dojopool.automation.auto_fixer --verbose

# Fix specific path
python -m src.dojopool.automation.auto_fixer --path src/dojopool/models

# Run sequentially (no parallel processing)
python -m src.dojopool.automation.auto_fixer --no-parallel
```

### PowerShell Script

```powershell
# Run the auto-fix script
.\scripts\auto_fix.ps1
```

## Configuration

The tools can be configured through:

1. Command line arguments
2. Environment variables
3. Configuration files

### Environment Variables

- `DOJOPOOL_AUTOFIX_PARALLEL`: Enable/disable parallel processing
- `DOJOPOOL_AUTOFIX_VERBOSE`: Enable verbose logging
- `DOJOPOOL_AUTOFIX_REPORT_DIR`: Custom report directory

## Reports

Reports are generated in JSON format and include:

```json
{
    "summary": {
        "total_fixes": 42,
        "fixes_by_category": {
            "code": 15,
            "security": 8,
            "performance": 12,
            "dependencies": 7
        }
    },
    "timing": {
        "start": "2024-03-14T12:00:00",
        "end": "2024-03-14T12:01:30",
        "duration": "0:01:30"
    }
}
```

## Best Practices

1. Run auto-fixes before committing code
2. Review generated reports
3. Test thoroughly after applying fixes
4. Keep dependencies up to date
5. Monitor fix patterns for recurring issues

## Contributing

When adding new fixes:

1. Create a new fixer class or extend existing ones
2. Add comprehensive tests
3. Update documentation
4. Follow the existing code style
5. Add logging and error handling

## Development

### Adding New Fixers

1. Create a new fixer class:
```python
class NewFixer:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        
    def fix_all(self, path: Optional[Path] = None) -> Dict[str, Any]:
        # Implementation
        pass
```

2. Register in `auto_fixer.py`:
```python
self.new_fixer = NewFixer(project_root)
```

### Testing

Run tests with:
```bash
pytest tests/automation/
```

## Troubleshooting

Common issues and solutions:

1. **Parallel Processing Errors**
   - Try running with `--no-parallel`
   - Check system resources

2. **Missing Dependencies**
   - Run `pip install -r requirements.txt`
   - Check virtual environment

3. **Permission Issues**
   - Ensure write access to report directory
   - Check file permissions

## Support

For issues and feature requests:
1. Check existing issues
2. Provide detailed error messages
3. Include relevant logs
4. Share reproduction steps 