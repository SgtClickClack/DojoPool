# DojoPool Automated Testing Framework

This directory contains the automated testing framework for the DojoPool project. The framework provides comprehensive testing capabilities including test execution, coverage reporting, result comparison, and visualization.

## Features

- 🔄 Automated test execution
- 📊 Code coverage reporting
- 📈 Test metrics visualization
- 📧 Email reporting
- 🔍 Test result comparison
- 🧹 Automatic cleanup of old reports

## Usage

### Basic Test Execution

```python
from pathlib import Path
from dojopool.core.testing.automated_testing import AutomatedTesting

# Initialize the testing framework
testing = AutomatedTesting(Path("test_dir"))

# Run all tests
results = testing.run_tests()

# Run specific test types
results = testing.run_tests(['unit', 'integration'])

# Generate HTML report
report_path = testing.generate_report(results)
```

### Coverage Reporting

```python
# Get coverage data
coverage_data = testing.get_coverage_report()

# Coverage data format:
# {
#     'module_name.py': 85.5,  # percentage
#     'another_module.py': 92.3
# }
```

### Test Result Comparison

```python
# Compare two test runs
comparison = testing.compare_results('previous_run', 'current_run')

# Comparison includes:
# - Coverage differences
# - New passing/failing tests
# - Performance metrics
```

### Metrics Visualization

```python
# Plot test metrics over time
metrics = {
    'coverage': [80.0, 82.5, 85.0],
    'passing_tests': [95, 96, 98]
}
testing.plot_metrics(metrics)
```

### Email Reporting

```python
# Send test report via email
testing.send_report_email(
    recipients=['team@dojopool.com'],
    report_path=report_path
)
```

## Configuration

The testing framework uses the following default settings:

- Test results are stored in the `results` subdirectory
- Reports are kept for 30 days by default
- Email reports are sent from 'dojopool-testing@example.com'

## Dependencies

- pytest
- coverage
- matplotlib
- smtplib (for email reporting)

## Best Practices

1. **Regular Execution**: Run tests frequently, ideally on every commit
2. **Coverage Monitoring**: Maintain high test coverage (aim for >80%)
3. **Result Analysis**: Review test reports and metrics regularly
4. **Clean Reports**: Use `cleanup_old_reports()` to manage disk space

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include both positive and negative test cases
3. Add appropriate documentation
4. Update test metrics if needed

## Example

See `test_example.py` for a complete demonstration of the framework's capabilities. 