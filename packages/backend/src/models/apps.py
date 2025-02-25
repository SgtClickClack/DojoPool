from django.apps import AppConfig

class ModelsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.models'
    verbose_name = 'DojoPool Models'

    def ready(self):
        """
        Initialize any app-specific settings or signals
        """
        pass  # Add any initialization code here if needed 