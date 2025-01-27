"""Script to generate API documentation from route decorators and docstrings."""

import ast
import os
import json
from pathlib import Path
from typing import Dict, List, Optional

class APIDocGenerator:
    """Generates API documentation from Flask route decorators and docstrings."""
    
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.api_routes: Dict[str, List[Dict]] = {}
        self.ignored_dirs = {'.git', '__pycache__', 'node_modules', 'venv'}
        
    def should_ignore(self, path: str) -> bool:
        """Check if path should be ignored."""
        return any(ignored in path.parts for ignored in self.ignored_dirs)
        
    def find_route_files(self) -> List[Path]:
        """Find all Python files that might contain API routes."""
        route_files = []
        for path in self.root_dir.rglob('*.py'):
            if not self.should_ignore(path):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if '@route' in content or '@blueprint' in content:
                        route_files.append(path)
        return route_files
        
    def extract_route_info(self, node: ast.FunctionDef) -> Optional[Dict]:
        """Extract route information from function definition."""
        route_info = {
            'name': node.name,
            'docstring': ast.get_docstring(node),
            'methods': [],
            'url': None,
            'params': [],
            'returns': []
        }
        
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Call):
                if hasattr(decorator.func, 'attr') and decorator.func.attr in ['route', 'get', 'post', 'put', 'delete']:
                    if decorator.args:
                        route_info['url'] = decorator.args[0].value
                    for kw in decorator.keywords:
                        if kw.arg == 'methods':
                            if isinstance(kw.value, ast.List):
                                route_info['methods'] = [e.value for e in kw.value.elts]
                                
        # Extract parameters from docstring
        if route_info['docstring']:
            for line in route_info['docstring'].split('\n'):
                if ':param' in line:
                    param = line.split(':param')[-1].strip()
                    route_info['params'].append(param)
                elif ':return:' in line:
                    ret = line.split(':return:')[-1].strip()
                    route_info['returns'].append(ret)
                    
        return route_info if route_info['url'] else None
        
    def analyze_file(self, file_path: Path) -> List[Dict]:
        """Analyze a single file for API routes."""
        routes = []
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read())
            
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                route_info = self.extract_route_info(node)
                if route_info:
                    routes.append(route_info)
                    
        return routes
        
    def generate_docs(self) -> None:
        """Generate API documentation in markdown format."""
        route_files = self.find_route_files()
        
        for file_path in route_files:
            relative_path = file_path.relative_to(self.root_dir)
            routes = self.analyze_file(file_path)
            if routes:
                self.api_routes[str(relative_path)] = routes
                
        # Generate markdown documentation
        docs_dir = self.root_dir / 'docs' / 'api'
        docs_dir.mkdir(parents=True, exist_ok=True)
        
        with open(docs_dir / 'api_documentation.md', 'w', encoding='utf-8') as f:
            f.write('# API Documentation\n\n')
            
            for file_path, routes in self.api_routes.items():
                f.write(f'## {file_path}\n\n')
                
                for route in routes:
                    f.write(f"### `{route['name']}`\n\n")
                    f.write(f"**URL:** `{route['url']}`\n\n")
                    f.write(f"**Methods:** {', '.join(route['methods']) or 'GET'}\n\n")
                    
                    if route['docstring']:
                        f.write("**Description:**\n\n")
                        f.write(f"{route['docstring']}\n\n")
                    
                    if route['params']:
                        f.write("**Parameters:**\n\n")
                        for param in route['params']:
                            f.write(f"- {param}\n")
                        f.write('\n')
                    
                    if route['returns']:
                        f.write("**Returns:**\n\n")
                        for ret in route['returns']:
                            f.write(f"- {ret}\n")
                        f.write('\n')
                    
                    f.write('---\n\n')
                    
        # Generate JSON schema
        with open(docs_dir / 'api_schema.json', 'w', encoding='utf-8') as f:
            json.dump(self.api_routes, f, indent=2)

if __name__ == '__main__':
    generator = APIDocGenerator('src/dojopool')
    generator.generate_docs() 