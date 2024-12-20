"""Flask application factory."""
from flask import Flask, render_template, redirect, url_for, flash, request, send_from_directory, session, jsonify
from flask_login import LoginManager, current_user, AnonymousUserMixin, login_user, logout_user, login_required
from oauthlib.oauth2 import WebApplicationClient
import requests
import json
import os
import hashlib
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Allow HTTP for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

class User(AnonymousUserMixin):
    def __init__(self, id=None, name=None, email=None):
        self.id = id
        self.name = name
        self.email = email
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False

    def get_id(self):
        return str(self.id)

    @property
    def is_authenticated(self):
        return self._is_authenticated

    @is_authenticated.setter
    def is_authenticated(self, value):
        self._is_authenticated = value

    @property
    def is_active(self):
        return self._is_active

    @is_active.setter
    def is_active(self, value):
        self._is_active = value

    @property
    def is_anonymous(self):
        return self._is_anonymous

    @is_anonymous.setter
    def is_anonymous(self, value):
        self._is_anonymous = value

def get_google_provider_cfg():
    try:
        return requests.get(GOOGLE_DISCOVERY_URL).json()
    except:
        return None

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev')
    app.config['GOOGLE_MAPS_API_KEY'] = GOOGLE_MAPS_API_KEY  # Use the defined API key
    
    # Initialize login manager
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login'  # Specify the login view
    
    # OAuth 2 client setup
    client = WebApplicationClient(GOOGLE_CLIENT_ID)
    
    @login_manager.user_loader
    def load_user(user_id):
        # Here you would typically load the user from your database
        return User()
    
    # Serve files from assets directory
    @app.route('/assets/<path:filename>')
    def serve_asset(filename):
        return send_from_directory('../assets', filename)
    
    @app.route('/')
    def index():
        return render_template('landing.html', current_user=current_user)
    
    @app.route('/login')
    def login():
        return render_template('auth/login.html', current_user=current_user)
    
    @app.route('/auth/google')
    def google_login():
        # Get Google provider configuration
        google_provider_cfg = get_google_provider_cfg()
        if not google_provider_cfg:
            flash('Failed to connect to Google', 'danger')
            return redirect(url_for('login'))
            
        # Generate state token for security
        state = hashlib.sha256(os.urandom(64)).hexdigest()
        session['oauth_state'] = state
        
        # Prepare the authorization request
        request_uri = client.prepare_request_uri(
            google_provider_cfg["authorization_endpoint"],
            redirect_uri=url_for('google_callback', _external=True),
            scope=["openid", "email", "profile"],
            state=state
        )
        return redirect(request_uri)

    @app.route('/auth/google/callback')
    def google_callback():
        # Verify state token
        if request.args.get('state') != session.get('oauth_state'):
            flash('Authentication failed: Invalid state token', 'danger')
            return redirect(url_for('login'))

        # Get authorization code
        code = request.args.get("code")
        if not code:
            flash('Authentication failed', 'danger')
            return redirect(url_for('login'))

        google_provider_cfg = get_google_provider_cfg()
        if not google_provider_cfg:
            flash('Failed to connect to Google', 'danger')
            return redirect(url_for('login'))

        # Prepare and send token request
        token_url, headers, body = client.prepare_token_request(
            google_provider_cfg["token_endpoint"],
            authorization_response=request.url,
            redirect_url=url_for('google_callback', _external=True),
            code=code
        )
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        )

        # Parse the tokens
        client.parse_request_body_response(token_response.text)

        # Get user info from Google
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        uri, headers, body = client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body)

        if userinfo_response.json().get("email_verified"):
            unique_id = userinfo_response.json()["sub"]
            users_email = userinfo_response.json()["email"]
            users_name = userinfo_response.json().get("given_name", users_email.split('@')[0])
            
            # Create a user in your db with the information provided by Google
            user = User(id=unique_id, name=users_name, email=users_email)
            login_user(user)
            flash('Successfully logged in with Google!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Google authentication failed', 'danger')
            return redirect(url_for('login'))
    
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            username = request.form.get('username')
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            if password != confirm_password:
                flash('Passwords do not match', 'danger')
                return redirect(url_for('register'))
            
            # Here you would typically create a new user in your database
            user = User(id=1, name=username, email=email)
            login_user(user)
            flash('Registration successful!', 'success')
            return redirect(url_for('dashboard'))
            
        return render_template('auth/register.html', current_user=current_user)
    
    @app.route('/about')
    def about():
        return render_template('about.html', current_user=current_user)
    
    @app.route('/dashboard')
    @login_required
    def dashboard():
        if not current_user.is_authenticated:
            flash('Please log in to access the dashboard.', 'warning')
            return redirect(url_for('login'))
        return render_template('dashboard.html', current_user=current_user)
    
    @app.route('/profile')
    def profile():
        return render_template('profile.html', current_user=current_user)
    
    @app.route('/create-avatar', methods=['GET', 'POST'])
    @login_required
    def create_avatar():
        if request.method == 'POST':
            try:
                # Get form data
                avatar_file = request.files.get('avatar')
                style = request.form.get('style')
                nickname = request.form.get('nickname')
                playstyle = request.form.get('playstyle')
                bio = request.form.get('bio')

                if not all([avatar_file, style, nickname, playstyle]):
                    flash('Please fill in all required fields', 'danger')
                    return redirect(url_for('create_avatar'))

                # Process and save the image
                if avatar_file and avatar_file.filename:
                    try:
                        # Create avatars directory if it doesn't exist
                        avatar_dir = os.path.join(app.static_folder, 'avatars')
                        if not os.path.exists(avatar_dir):
                            os.makedirs(avatar_dir)
                        
                        # Save the file with a unique name
                        filename = f"avatar_{current_user.id}_{int(time.time())}.png"
                        avatar_path = os.path.join(avatar_dir, filename)

                        # First try AI transformation
                        try:
                            from src.core.avatars.generator import AvatarGenerator
                            
                            # Initialize the generator
                            generator = AvatarGenerator(device="cpu")  # Use CPU since we might not have CUDA
                            if generator.initialize():
                                # Read the uploaded image
                                image_bytes = avatar_file.read()
                                
                                # Generate the stylized avatar
                                result_bytes = generator.customize_avatar(
                                    base_image=image_bytes,
                                    style_name=style
                                )
                                
                                if result_bytes:
                                    # Save the generated avatar
                                    with open(avatar_path, 'wb') as f:
                                        f.write(result_bytes)
                                    app.logger.info("Successfully generated AI avatar")
                                else:
                                    raise Exception("Failed to generate avatar")
                            else:
                                raise Exception("Failed to initialize avatar generator")
                        
                        except Exception as e:
                            app.logger.warning(f"AI avatar generation failed, using original image: {str(e)}")
                            # Fallback to using the original image
                            from PIL import Image
                            
                            # Reset file pointer
                            avatar_file.seek(0)
                            
                            # Open and process image
                            image = Image.open(avatar_file)
                            
                            # Convert to RGB if necessary
                            if image.mode != 'RGB':
                                image = image.convert('RGB')
                            
                            # Resize to a square
                            size = min(image.size)
                            left = (image.width - size) // 2
                            top = (image.height - size) // 2
                            image = image.crop((left, top, left + size, top + size))
                            image = image.resize((400, 400), Image.Resampling.LANCZOS)
                            
                            # Save the processed image
                            image.save(avatar_path, 'PNG', quality=95)
                        
                        # Store avatar info in session
                        session['avatar_url'] = url_for('static', filename=f'avatars/{filename}')
                        session['nickname'] = nickname
                        session['playstyle'] = playstyle
                        session['bio'] = bio
                        session['style'] = style

                        flash('Avatar created successfully!', 'success')
                        return redirect(url_for('dashboard'))
                        
                    except Exception as e:
                        app.logger.error(f"Avatar creation failed: {str(e)}")
                        flash('Failed to process avatar image', 'danger')
                        return redirect(url_for('create_avatar'))
                else:
                    flash('Please upload an image', 'danger')
                    return redirect(url_for('create_avatar'))

            except Exception as e:
                app.logger.error(f"Avatar creation failed: {str(e)}")
                flash('Failed to create avatar', 'danger')
                return redirect(url_for('create_avatar'))

        return render_template('avatar/create.html', current_user=current_user)
    
    @app.route('/edit-avatar')
    @login_required
    def edit_avatar():
        return render_template('avatar/edit.html', current_user=current_user)
    
    @app.route('/tournaments')
    def tournaments():
        return render_template('tournaments/index.html', current_user=current_user)
    
    @app.route('/logout')
    def logout():
        logout_user()
        return redirect(url_for('index'))
    
    @app.route('/map')
    def map():
        print("Map route accessed")  # Debug print
        print("Using API key:", GOOGLE_MAPS_API_KEY)  # Debug print
        return render_template('features/map.html', 
                             api_key=GOOGLE_MAPS_API_KEY,
                             current_user=current_user)

    @app.route('/api/venues')
    def get_venues():
        """Get list of venues with optional filtering."""
        try:
            # Mock data for now - you'll want to replace this with database queries
            venues = [
                {
                    'id': 1,
                    'name': 'Downtown Billiards',
                    'address': '123 Main St, San Francisco, CA',
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'rating': 4.5,
                    'tables_count': 8,
                    'current_players': 12
                },
                {
                    'id': 2,
                    'name': 'The Cue Club',
                    'address': '456 Market St, San Francisco, CA',
                    'latitude': 37.7922,
                    'longitude': -122.4068,
                    'rating': 4.8,
                    'tables_count': 12,
                    'current_players': 20
                },
                {
                    'id': 3,
                    'name': 'Shark Pool Hall',
                    'address': '789 Mission St, San Francisco, CA',
                    'latitude': 37.7850,
                    'longitude': -122.4016,
                    'rating': 4.2,
                    'tables_count': 6,
                    'current_players': 8
                }
            ]
            return jsonify(venues)
        except Exception as e:
            app.logger.error(f"Failed to get venues: {str(e)}")
            return jsonify({'error': 'Failed to get venues'}), 500

    @app.route('/venues/<int:venue_id>')
    def venue_details(venue_id):
        """Get detailed information about a specific venue."""
        try:
            # Mock data - replace with database query
            venue = {
                'id': venue_id,
                'name': 'Downtown Billiards',
                'address': '123 Main St, San Francisco, CA',
                'description': 'Premier pool hall in downtown SF',
                'rating': 4.5,
                'tables_count': 8,
                'current_players': 12,
                'features': ['tournaments', 'leagues', 'training'],
                'hours': {
                    'monday': '10:00 AM - 12:00 AM',
                    'tuesday': '10:00 AM - 12:00 AM',
                    'wednesday': '10:00 AM - 12:00 AM',
                    'thursday': '10:00 AM - 2:00 AM',
                    'friday': '10:00 AM - 2:00 AM',
                    'saturday': '11:00 AM - 2:00 AM',
                    'sunday': '11:00 AM - 10:00 PM'
                }
            }
            return jsonify(venue)
        except Exception as e:
            app.logger.error(f"Failed to get venue details: {str(e)}")
            return jsonify({'error': 'Failed to get venue details'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)