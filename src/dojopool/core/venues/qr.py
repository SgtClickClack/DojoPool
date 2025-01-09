import qrcode
import io
import json
import base64
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
from .models import PoolTable
from core.models import db

logger = logging.getLogger(__name__)

class QRCodeManager:
    """Manages QR codes for pool tables."""
    def __init__(self, secret_key: str, expiry_minutes: int = 60):
        self.secret_key = secret_key
        self.expiry_minutes = expiry_minutes

    def generate_table_qr(self, table_id: int, venue_id: int) -> Optional[str]:
        """Generate a QR code for a pool table."""
        try:
            # Create QR code data
            qr_data = {
                'table_id': table_id,
                'venue_id': venue_id,
                'timestamp': datetime.utcnow().isoformat(),
                'expires': (datetime.utcnow() + timedelta(minutes=self.expiry_minutes)).isoformat()
            }

            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(json.dumps(qr_data))
            qr.make(fit=True)

            # Create QR code image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_str = base64.b64encode(img_buffer.getvalue()).decode()

            return f"data:image/png;base64,{img_str}"

        except Exception as e:
            logger.error(f"Failed to generate QR code: {str(e)}")
            return None

    def verify_qr_code(self, qr_data: str) -> Optional[Dict]:
        """Verify a QR code and return table information."""
        try:
            # Parse QR data
            data = json.loads(qr_data)
            
            # Check expiration
            expires = datetime.fromisoformat(data['expires'])
            if expires < datetime.utcnow():
                logger.warning("QR code has expired")
                return None

            # Get table information
            table = PoolTable.query.filter_by(
                id=data['table_id'],
                venue_id=data['venue_id']
            ).first()

            if not table:
                logger.warning("Table not found")
                return None

            return {
                'table_id': table.id,
                'venue_id': table.venue_id,
                'table_number': table.table_number,
                'is_occupied': table.is_occupied,
                'needs_maintenance': table.needs_maintenance,
                'current_game_id': table.current_game_id
            }

        except Exception as e:
            logger.error(f"Failed to verify QR code: {str(e)}")
            return None

    def generate_batch_qr_codes(self, venue_id: int) -> Dict[int, str]:
        """Generate QR codes for all tables in a venue."""
        try:
            tables = PoolTable.query.filter_by(venue_id=venue_id).all()
            qr_codes = {}

            for table in tables:
                qr_code = self.generate_table_qr(table.id, venue_id)
                if qr_code:
                    qr_codes[table.id] = qr_code

            return qr_codes

        except Exception as e:
            logger.error(f"Failed to generate batch QR codes: {str(e)}")
            return {}

    def update_table_status_from_qr(
        self,
        qr_data: str,
        user_id: int,
        action: str
    ) -> Optional[Dict]:
        """Update table status using QR code scan."""
        try:
            # Verify QR code
            table_info = self.verify_qr_code(qr_data)
            if not table_info:
                return None

            table = PoolTable.query.get(table_info['table_id'])
            if not table:
                return None

            # Handle different actions
            if action == 'check_in':
                if table.is_occupied:
                    return {
                        'success': False,
                        'message': 'Table is already occupied'
                    }
                table.is_occupied = True
                
            elif action == 'check_out':
                if not table.is_occupied:
                    return {
                        'success': False,
                        'message': 'Table is not occupied'
                    }
                table.is_occupied = False
                table.current_game_id = None
                
            elif action == 'report_maintenance':
                table.needs_maintenance = True
                
            else:
                return {
                    'success': False,
                    'message': 'Invalid action'
                }

            # Save changes
            db.session.commit()

            return {
                'success': True,
                'table': table.to_dict(),
                'message': f'Successfully performed {action}'
            }

        except Exception as e:
            logger.error(f"Failed to update table status: {str(e)}")
            db.session.rollback()
            return None

    def get_table_status_from_qr(self, qr_data: str) -> Optional[Dict]:
        """Get table status from QR code."""
        try:
            table_info = self.verify_qr_code(qr_data)
            if not table_info:
                return None

            table = PoolTable.query.get(table_info['table_id'])
            if not table:
                return None

            return {
                'table': table.to_dict(),
                'venue': table.venue.to_dict() if table.venue else None
            }

        except Exception as e:
            logger.error(f"Failed to get table status: {str(e)}")
            return None 