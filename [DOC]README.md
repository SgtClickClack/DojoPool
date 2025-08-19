# DojoPool

DojoPool is an innovative platform that combines AI-powered training, analytics, and community features to help pool players improve their game. The platform offers personalized training recommendations, real-time shot analysis, and a marketplace for pool equipment.

## Features

- 🎯 **AI-Powered Training**: Advanced shot analysis and personalized training recommendations
- 📊 **Analytics Dashboard**: Track your progress with detailed performance metrics
- 🛍️ **Marketplace**: Buy, sell, and trade pool equipment
- 💥 **Community**: Connect with other players and participate in events
- 📈 **A/B Testing**: Interactive visualizations for experiment analysis

## Tech Stack

- **Frontend**: React, Material-UI, React Router
- **Backend**: Python, FastAPI, SQLAlchemy
- **AI/ML**: TensorFlow, OpenCV, MediaPipe
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Docker, Kubernetes, AWS
- **Analytics**: Plotly, Seaborn, NumPy, SciPy

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Python 3.9+
- Docker (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/dojopool.git
   cd dojopool
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Development

- Run tests:

  ```bash
  npm test
  pytest
  ```

- Run linting:

  ```bash
  npm run lint
  flake8
  mypy .
  ```

- Format code:
  ```bash
  npm run format
  black .
  ```

## Project Structure

```
dojopool/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API and service integrations
│   ├── utils/         # Helper functions and utilities
│   ├── core/          # Core business logic
│   │   └── experiments/  # A/B testing framework
│   ├── App.js         # Main application component
│   └── index.js       # Application entry point
├── public/            # Static assets
├── docs/             # Documentation
└── package.json      # Project dependencies and scripts
```

## A/B Testing Framework

The platform includes a powerful A/B testing framework with interactive visualizations:

### Basic Usage

```python
from dojopool.core.experiments.interactive_viz import InteractiveVisualizer
from dojopool.core.experiments.analysis import ExperimentAnalyzer

# Create instances
visualizer = InteractiveVisualizer()
analyzer = ExperimentAnalyzer()

# Analyze experiment results
result = analyzer.analyze_metric(control_events, variant_events)

# Create interactive visualizations
visualizer.plot_confidence_interval(result, save_path="confidence.html")
visualizer.plot_effect_size(result, save_path="effect.html")

# Create comprehensive dashboard
visualizer.create_dashboard(result, analyzer, save_path="dashboard.html")
```

### Experiment Planning

```python
# Analyze required sample size
visualizer.plot_power_curve(
    analyzer,
    effect_sizes=[0.2, 0.5, 0.8],
    save_path="power.html"
)

# Estimate sample size requirements
visualizer.plot_sample_size_estimation(
    analyzer,
    min_effect=0.1,
    max_effect=0.8,
    save_path="sample_size.html"
)
```

For more details, see the [A/B Testing Visualization Guide](docs/visualization.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Material-UI](https://mui.com/) for the beautiful UI components
- [React](https://reactjs.org/) for the frontend framework
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [TensorFlow](https://www.tensorflow.org/) for AI/ML capabilities
- [Plotly](https://plotly.com/) for interactive visualizations
