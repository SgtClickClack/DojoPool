# A/B Testing Visualization Guide

The `InteractiveVisualizer` class provides interactive visualizations for A/B test analysis results using Plotly. This guide explains how to use each visualization type and interpret the results.

## Installation

Ensure you have the required dependencies:
```bash
pip install plotly>=5.18.0 seaborn>=0.13.0
```

## Quick Start

```python
from dojopool.core.experiments.interactive_viz import InteractiveVisualizer
from dojopool.core.experiments.analysis import ExperimentAnalyzer

# Create instances
visualizer = InteractiveVisualizer()
analyzer = ExperimentAnalyzer()

# Create visualizations
visualizer.plot_confidence_interval(result, save_path="confidence_interval.html")
visualizer.plot_effect_size(result, save_path="effect_size.html")
visualizer.plot_power_curve(analyzer, save_path="power_curve.html")
visualizer.plot_sample_size_estimation(analyzer, save_path="sample_size.html")

# Create a combined dashboard
visualizer.create_dashboard(result, analyzer, save_path="dashboard.html")
```

## Available Visualizations

### 1. Confidence Interval Plot
```python
visualizer.plot_confidence_interval(result, save_path=None)
```
- Shows the difference between variants with confidence intervals
- Includes hover information with exact values and significance
- Vertical line at zero for reference
- Interactive zooming and panning

### 2. Effect Size Plot
```python
visualizer.plot_effect_size(result, save_path=None)
```
- Visualizes Cohen's d effect size with interpretation regions
- Color-coded regions for small, medium, and large effects
- Includes hover information with exact effect size
- Reference lines for standard thresholds

### 3. Power Curve Analysis
```python
visualizer.plot_power_curve(
    analyzer,
    effect_sizes=[0.2, 0.5, 0.8],
    sample_sizes=range(20, 500, 20),
    save_path=None
)
```
- Shows statistical power for different sample sizes
- Multiple curves for different effect sizes
- Reference line at 0.8 power threshold
- Interactive legend for toggling curves

### 4. Sample Size Estimation
```python
visualizer.plot_sample_size_estimation(
    analyzer,
    min_effect=0.1,
    max_effect=1.0,
    save_path=None
)
```
- Estimates required sample size for different effect sizes
- Reference points for common effect sizes
- Interactive hover information with exact values
- Helps in experiment planning

### 5. Combined Dashboard
```python
visualizer.create_dashboard(result, analyzer, save_path=None)
```
- Combines all visualizations in a single dashboard
- 2x2 grid layout
- Shared interactivity across plots
- Comprehensive view of experiment analysis

## Saving Visualizations

All visualization methods accept a `save_path` parameter:
- If provided, saves the plot as an HTML file at the specified path
- HTML files can be opened in any web browser
- Interactive features are preserved in saved files

## Interpreting Results

### Confidence Intervals
- If interval doesn't cross zero: statistically significant difference
- Width indicates precision of estimate
- Hover for exact values and significance

### Effect Sizes
- < 0.2: Small effect
- 0.2 - 0.5: Medium effect
- > 0.8: Large effect
- Sign indicates direction (positive = improvement)

### Power Analysis
- Target 0.8 power (80% chance of detecting true effect)
- Larger effect sizes need smaller samples
- Use for planning sample size requirements

### Sample Size Estimation
- Shows minimum required sample size
- Based on desired effect size
- Reference points for common scenarios

## Best Practices

1. Always check confidence intervals before making decisions
2. Consider practical significance alongside statistical significance
3. Use power analysis for experiment planning
4. Save visualizations for documentation and sharing
5. Use the dashboard for comprehensive analysis

## Examples

### Basic Analysis
```python
# Create visualization of experiment results
visualizer.plot_confidence_interval(result)
visualizer.plot_effect_size(result)

# Save for sharing
visualizer.create_dashboard(result, analyzer, save_path="analysis.html")
```

### Experiment Planning
```python
# Analyze required sample size
visualizer.plot_power_curve(analyzer, effect_sizes=[0.1, 0.2, 0.3])
visualizer.plot_sample_size_estimation(analyzer, min_effect=0.1, max_effect=0.3)
``` 