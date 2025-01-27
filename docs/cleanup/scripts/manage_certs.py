"""
Certificate management script for DojoPool cleanup.
This script helps organize and manage SSL certificates.
"""

import os
import shutil
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set
import subprocess

class CertificateManager:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.cert_files = []
        self.cert_hashes = {}
        self.duplicates = []
        
        # Define standard locations
        self.cert_dir = root_dir / 'certs'
        self.dev_cert_dir = self.cert_dir / 'development'
        self.prod_cert_dir = self.cert_dir / 'production'
        self.backup_dir = self.cert_dir / 'backup'

    def setup_directories(self):
        """Create necessary directory structure."""
        for directory in [self.cert_dir, self.dev_cert_dir, self.prod_cert_dir, self.backup_dir]:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"Created directory: {directory}")

    def find_certificates(self):
        """Find all certificate files in the project."""
        cert_extensions = {'.key', '.pem', '.crt', '.cert', '.p12', '.jks', '.keystore', '.pub'}
        
        for path in self.root_dir.rglob('*'):
            if path.suffix in cert_extensions:
                print(f"Found certificate: {path.relative_to(self.root_dir)}")
                self.cert_files.append(path)

    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def find_duplicates(self):
        """Find duplicate certificate files based on content."""
        for cert_file in self.cert_files:
            file_hash = self.calculate_file_hash(cert_file)
            if file_hash not in self.cert_hashes:
                self.cert_hashes[file_hash] = []
            self.cert_hashes[file_hash].append(cert_file)

        for file_hash, files in self.cert_hashes.items():
            if len(files) > 1:
                self.duplicates.append(files)

    def backup_certificates(self):
        """Create backups of all certificate files."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_subdir = self.backup_dir / timestamp
        backup_subdir.mkdir(parents=True, exist_ok=True)

        for cert_file in self.cert_files:
            relative_path = cert_file.relative_to(self.root_dir)
            backup_path = backup_subdir / relative_path
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(cert_file, backup_path)
            print(f"Backed up: {relative_path}")

    def generate_development_certificates(self):
        """Generate development certificates for localhost."""
        key_file = self.dev_cert_dir / 'localhost.key'
        cert_file = self.dev_cert_dir / 'localhost.crt'
        
        # Generate private key
        subprocess.run([
            'openssl', 'genrsa',
            '-out', str(key_file),
            '2048'
        ], check=True)

        # Generate certificate signing request
        subprocess.run([
            'openssl', 'req',
            '-new',
            '-key', str(key_file),
            '-out', str(self.dev_cert_dir / 'localhost.csr'),
            '-subj', '/CN=localhost'
        ], check=True)

        # Generate self-signed certificate
        subprocess.run([
            'openssl', 'x509',
            '-req',
            '-days', '365',
            '-in', str(self.dev_cert_dir / 'localhost.csr'),
            '-signkey', str(key_file),
            '-out', str(cert_file)
        ], check=True)

        print("Generated development certificates")

    def organize_certificates(self):
        """Organize certificates into production and development directories."""
        for cert_file in self.cert_files:
            if 'localhost' in cert_file.name.lower() or 'development' in str(cert_file):
                target_dir = self.dev_cert_dir
            else:
                target_dir = self.prod_cert_dir

            target_path = target_dir / cert_file.name
            if not target_path.exists():
                shutil.copy2(cert_file, target_path)
                print(f"Moved {cert_file.name} to {target_dir}")

    def generate_report(self):
        """Generate a report of certificate management actions."""
        report = f"""# Certificate Management Report
Generated at: {datetime.now().isoformat()}

## Certificate Files Found
Total Files: {len(self.cert_files)}

### Production Certificates
{self._list_files(self.prod_cert_dir)}

### Development Certificates
{self._list_files(self.dev_cert_dir)}

## Duplicate Certificates
"""
        if self.duplicates:
            for dup_group in self.duplicates:
                report += "\nDuplicate Group:\n"
                for file in dup_group:
                    report += f"- {file.relative_to(self.root_dir)}\n"
        else:
            report += "No duplicates found.\n"

        report += "\n## Backup Information\n"
        report += f"Backup location: {self.backup_dir}\n"
        
        # Save report
        report_path = self.root_dir / 'docs' / 'cleanup' / 'certificate_management_report.md'
        report_path.write_text(report, encoding='utf-8')
        print(f"Report generated: {report_path}")

    def _list_files(self, directory: Path) -> str:
        """Helper to list files in a directory for the report."""
        if not directory.exists():
            return "Directory not created yet.\n"
        
        files = list(directory.glob('*'))
        if not files:
            return "No files found.\n"
        
        return '\n'.join(f"- {f.name}" for f in files) + '\n'

    def run(self):
        """Run the certificate management process."""
        print("Setting up directories...")
        self.setup_directories()

        print("Finding certificates...")
        self.find_certificates()

        print("Creating backups...")
        self.backup_certificates()

        print("Finding duplicates...")
        self.find_duplicates()

        print("Generating development certificates...")
        self.generate_development_certificates()

        print("Organizing certificates...")
        self.organize_certificates()

        print("Generating report...")
        self.generate_report()

def main():
    """Main function to run the certificate management."""
    root_dir = Path(__file__).parent.parent.parent.parent
    manager = CertificateManager(root_dir)
    manager.run()

if __name__ == "__main__":
    main() 