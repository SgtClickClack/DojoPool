from datetime import datetime, timedelta
import secrets
from typing import Optional
from flask import current_app
from flask_mail import Message
from flask_mail import Mail
from werkzeug.security import generate_password_hash

class PasswordRecoveryService:
    def __init__(self, mail: Mail):
        self.mail = mail
        self.recovery_tokens = {}
        self.token_expiry = timedelta(hours=24)

    def generate_recovery_token(self, email: str) -> str:
        """Generate a secure recovery token for password reset."""
        token = secrets.token_urlsafe(32)
        self.recovery_tokens[token] = {
            'email': email,
            'created_at': datetime.utcnow(),
            'used': False
        }
        return token

    def validate_token(self, token: str) -> Optional[str]:
        """Validate a recovery token and return the associated email if valid."""
        if token not in self.recovery_tokens:
            return None

        token_data = self.recovery_tokens[token]
        if token_data['used']:
            return None

        if datetime.utcnow() - token_data['created_at'] > self.token_expiry:
            del self.recovery_tokens[token]
            return None

        return token_data['email']

    def mark_token_used(self, token: str) -> None:
        """Mark a recovery token as used."""
        if token in self.recovery_tokens:
            self.recovery_tokens[token]['used'] = True

    def send_recovery_email(self, email: str, token: str) -> None:
        """Send a password recovery email to the user."""
        recovery_url = f"{current_app.config['FRONTEND_URL']}/auth/reset-password?token={token}"
        
        msg = Message(
            subject="Password Recovery - DojoPool",
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[email]
        )
        
        msg.html = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ text-align: center; margin-bottom: 30px; }}
                    .logo {{ max-width: 150px; }}
                    .button {{ 
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #4CAF50;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        margin: 20px 0;
                    }}
                    .warning {{ 
                        background-color: #fff3cd;
                        border: 1px solid #ffeeba;
                        padding: 15px;
                        border-radius: 4px;
                        margin: 20px 0;
                    }}
                    .footer {{ 
                        text-align: center;
                        margin-top: 30px;
                        font-size: 12px;
                        color: #666;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="{current_app.config['FRONTEND_URL']}/logo.png" alt="DojoPool Logo" class="logo">
                        <h1>Password Recovery</h1>
                    </div>
                    
                    <p>Hello,</p>
                    
                    <p>We received a request to reset your password for your DojoPool account. 
                    If you didn't make this request, you can safely ignore this email.</p>
                    
                    <p>To reset your password, click the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{recovery_url}" class="button">Reset Password</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p>{recovery_url}</p>
                    
                    <div class="warning">
                        <strong>Important:</strong>
                        <ul>
                            <li>This link will expire in 24 hours</li>
                            <li>This link can only be used once</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; {datetime.now().year} DojoPool. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        msg.text = f"""
        Password Recovery - DojoPool
        
        We received a request to reset your password for your DojoPool account.
        If you didn't make this request, you can safely ignore this email.
        
        To reset your password, visit this link:
        {recovery_url}
        
        Important:
        - This link will expire in 24 hours
        - This link can only be used once
        - If you didn't request this, please ignore this email
        
        This is an automated message, please do not reply to this email.
        """
        
        self.mail.send(msg)

    def reset_password(self, token: str, new_password: str) -> bool:
        """Reset a user's password using a valid recovery token."""
        email = self.validate_token(token)
        if not email:
            return False

        # Update password in database (implement this part based on your user model)
        # user = User.query.filter_by(email=email).first()
        # if user:
        #     user.password_hash = generate_password_hash(new_password)
        #     db.session.commit()
        
        self.mark_token_used(token)
        return True 