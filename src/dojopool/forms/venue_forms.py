from flask_wtf import FlaskForm
from wtforms import (
    StringField, TextAreaField, IntegerField, FloatField, SelectField,
    SelectMultipleField, TimeField, BooleanField, FileField
)
from wtforms.validators import (
    DataRequired, Email, URL, Optional, NumberRange, Length, ValidationError
)
from src.utils.validators import (
    validate_phone, validate_postal_code, validate_coordinates
)

class VenueForm(FlaskForm):
    """Form for creating and editing venues."""
    
    # Basic Information
    name = StringField('Venue Name', validators=[
        DataRequired(),
        Length(min=2, max=100)
    ])
    description = TextAreaField('Description', validators=[Optional()])
    
    # Location
    address = StringField('Street Address', validators=[
        DataRequired(),
        Length(max=200)
    ])
    city = StringField('City', validators=[
        DataRequired(),
        Length(max=100)
    ])
    state = StringField('State', validators=[
        DataRequired(),
        Length(max=100)
    ])
    country = StringField('Country', validators=[
        DataRequired(),
        Length(max=100)
    ])
    postal_code = StringField('Postal Code', validators=[
        DataRequired(),
        Length(max=20)
    ])
    latitude = FloatField('Latitude', validators=[Optional()])
    longitude = FloatField('Longitude', validators=[Optional()])
    
    # Contact Information
    phone = StringField('Phone Number', validators=[Optional()])
    email = StringField('Email', validators=[
        Optional(),
        Email()
    ])
    website = StringField('Website', validators=[
        Optional(),
        URL()
    ])
    
    # Features and Amenities
    features = SelectMultipleField('Features', choices=[
        ('parking', 'Parking'),
        ('food_service', 'Food Service'),
        ('bar', 'Bar'),
        ('tournaments', 'Tournaments'),
        ('lessons', 'Lessons'),
        ('equipment_rental', 'Equipment Rental'),
        ('wifi', 'WiFi'),
        ('air_conditioning', 'Air Conditioning'),
        ('pro_shop', 'Pro Shop'),
        ('billiards_supplies', 'Billiards Supplies'),
        ('snooker_tables', 'Snooker Tables'),
        ('pool_tables', 'Pool Tables'),
        ('dart_boards', 'Dart Boards'),
        ('arcade_games', 'Arcade Games'),
        ('smoking_area', 'Smoking Area'),
        ('outdoor_seating', 'Outdoor Seating'),
        ('private_rooms', 'Private Rooms'),
        ('event_space', 'Event Space'),
        ('live_music', 'Live Music'),
        ('tv_screens', 'TV Screens')
    ])
    
    # Tables and Pricing
    tables = IntegerField('Number of Tables', validators=[
        DataRequired(),
        NumberRange(min=1)
    ])
    per_hour = FloatField('Price per Hour', validators=[
        Optional(),
        NumberRange(min=0)
    ])
    per_game = FloatField('Price per Game', validators=[
        Optional(),
        NumberRange(min=0)
    ])
    
    # Operating Hours
    monday_open = TimeField('Monday Open', validators=[DataRequired()])
    monday_close = TimeField('Monday Close', validators=[DataRequired()])
    tuesday_open = TimeField('Tuesday Open', validators=[DataRequired()])
    tuesday_close = TimeField('Tuesday Close', validators=[DataRequired()])
    wednesday_open = TimeField('Wednesday Open', validators=[DataRequired()])
    wednesday_close = TimeField('Wednesday Close', validators=[DataRequired()])
    thursday_open = TimeField('Thursday Open', validators=[DataRequired()])
    thursday_close = TimeField('Thursday Close', validators=[DataRequired()])
    friday_open = TimeField('Friday Open', validators=[DataRequired()])
    friday_close = TimeField('Friday Close', validators=[DataRequired()])
    saturday_open = TimeField('Saturday Open', validators=[DataRequired()])
    saturday_close = TimeField('Saturday Close', validators=[DataRequired()])
    sunday_open = TimeField('Sunday Open', validators=[DataRequired()])
    sunday_close = TimeField('Sunday Close', validators=[DataRequired()])
    
    # Image Upload
    image = FileField('Venue Image', validators=[Optional()])
    
    def validate_phone(self, field):
        """Validate phone number format."""
        if field.data and not validate_phone(field.data):
            raise ValidationError('Invalid phone number format')
    
    def validate_postal_code(self, field):
        """Validate postal code format."""
        if field.data and not validate_postal_code(field.data, self.country.data):
            raise ValidationError('Invalid postal code format')
    
    def validate_coordinates(self, field):
        """Validate geographic coordinates."""
        if (self.latitude.data is not None or self.longitude.data is not None) and \
           not validate_coordinates(self.latitude.data, self.longitude.data):
            raise ValidationError('Invalid coordinates')
    
    def validate_hours(self, field):
        """Validate that closing time is after opening time."""
        day = field.name.split('_')[0]  # Extract day from field name
        if getattr(self, f'{day}_close').data <= getattr(self, f'{day}_open').data:
            raise ValidationError('Closing time must be after opening time')

class VenueSearchForm(FlaskForm):
    """Form for searching venues."""
    
    city = StringField('City', validators=[Optional()])
    state = StringField('State', validators=[Optional()])
    features = SelectMultipleField('Features', choices=[
        ('parking', 'Parking'),
        ('food_service', 'Food Service'),
        ('bar', 'Bar'),
        ('tournaments', 'Tournaments'),
        ('lessons', 'Lessons')
    ])
    min_tables = IntegerField('Minimum Tables', validators=[
        Optional(),
        NumberRange(min=1)
    ])
    min_rating = FloatField('Minimum Rating', validators=[
        Optional(),
        NumberRange(min=0, max=5)
    ])
    radius = IntegerField('Search Radius (km)', validators=[
        Optional(),
        NumberRange(min=1, max=100)
    ])
