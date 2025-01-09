"""Blueprint module for DojoPool."""

from flask import Blueprint
from typing import Optional, Dict, Any, List, Type
from dataclasses import dataclass

@dataclass
class BlueprintConfig:
    """Configuration for blueprint registration."""
    
    url_prefix: str
    template_folder: Optional[str] = None
    static_folder: Optional[str] = None
    subdomain: Optional[str] = None
    url_defaults: Optional[Dict[str, Any]] = None
    cli_group: Optional[str] = None

class BaseBlueprint(Blueprint):
    """Base blueprint class with common functionality."""
    
    def __init__(
        self,
        name: str,
        import_name: str,
        config: Optional[BlueprintConfig] = None,
        **kwargs: Any
    ):
        """Initialize blueprint.
        
        Args:
            name: Blueprint name
            import_name: Import name for blueprint
            config: Blueprint configuration
            **kwargs: Additional blueprint arguments
        """
        self.bp_config = config or BlueprintConfig(url_prefix=f"/{name}")
        
        super().__init__(
            name,
            import_name,
            template_folder=self.bp_config.template_folder or "templates",
            static_folder=self.bp_config.static_folder or "static",
            subdomain=self.bp_config.subdomain,
            url_defaults=self.bp_config.url_defaults,
            cli_group=self.bp_config.cli_group,
            **kwargs
        )
        
        # Register error handlers
        self.register_error_handlers()
        
        # Register CLI commands
        self.register_commands()
    
    def register_error_handlers(self) -> None:
        """Register blueprint-specific error handlers."""
        pass
    
    def register_commands(self) -> None:
        """Register blueprint-specific CLI commands."""
        pass
    
    @classmethod
    def register_blueprints(cls, app: Any, blueprints: List[Type['BaseBlueprint']]) -> None:
        """Register multiple blueprints with the app.
        
        Args:
            app: Flask application instance
            blueprints: List of blueprint classes to register
        """
        for blueprint_cls in blueprints:
            blueprint = blueprint_cls()
            app.register_blueprint(
                blueprint,
                url_prefix=blueprint.bp_config.url_prefix,
                subdomain=blueprint.bp_config.subdomain,
                url_defaults=blueprint.bp_config.url_defaults
            ) 