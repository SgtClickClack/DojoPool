from services.shot_analysis import ShotAnalysis


class PerformancePredictionService:
    def __init__(self):
        self.shot_analysis = ShotAnalysis()
