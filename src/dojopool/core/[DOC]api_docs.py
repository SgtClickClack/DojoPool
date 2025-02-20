from os import getenv
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

api_docs_bp: Blueprint = Blueprint("api_docs", __name__)


@api_docs_bp.route("/api/docs", methods=["GET"])
def get_api_docs() -> ResponseReturnValue:
    """Get OpenAPI documentation."""
    return jsonify(
        {
            "openapi": "3.0.0",
            "info": {
                "title": "Dojo Pool API",
                "description": "API for the Dojo Pool gaming platform",
                "version": "1.0.0",
            },
            "servers": [{"url": "/api/v1", "description": "Main API server"}],
            "paths": {
                "/auth/register": {
                    "post": {
                        "summary": "Register a new user",
                        "tags": ["Authentication"],
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": ["email", "username", "password"],
                                        "properties": {
                                            "email": {
                                                "type": "string",
                                                "format": "email",
                                            },
                                            "username": {
                                                "type": "string",
                                                "minLength": 3,
                                            },
                                            "password": {
                                                "type": "string",
                                                "minLength": 8,
                                            },
                                            "bio": {"type": "string"},
                                            "profile_pic": {"type": "string"},
                                        },
                                    }
                                }
                            },
                        },
                        "responses": {
                            "201": {"description": "User registered successfully"},
                            "400": {"description": "Invalid input"},
                            "409": {"description": "User already exists"},
                        },
                    }
                },
                "/auth/login": {
                    "post": {
                        "summary": "Login user",
                        "tags": ["Authentication"],
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": ["email", "password"],
                                        "properties": {
                                            "email": {
                                                "type": "string",
                                                "format": "email",
                                            },
                                            "password": {"type": "string"},
                                        },
                                    }
                                }
                            },
                        },
                        "responses": {
                            "200": {"description": "Login successful"},
                            "401": {"description": "Invalid credentials"},
                        },
                    }
                },
                "/venues": {
                    "get": {
                        "summary": "Get all venues",
                        "tags": ["Venues"],
                        "parameters": [
                            {
                                "name": "name",
                                "in": "query",
                                "schema": {"type": "string"},
                                "description": "Filter by venue name",
                            },
                            {
                                "name": "dojo_level",
                                "in": "query",
                                "schema": {"type": "integer"},
                                "description": "Filter by dojo level",
                            },
                            {
                                "name": "lat",
                                "in": "query",
                                "schema": {"type": "number"},
                                "description": "Latitude for location-based search",
                            },
                            {
                                "name": "lng",
                                "in": "query",
                                "schema": {"type": "number"},
                                "description": "Longitude for location-based search",
                            },
                            {
                                "name": "radius",
                                "in": "query",
                                "schema": {"type": "number"},
                                "description": "Search radius in kilometers",
                            },
                        ],
                        "responses": {
                            "200": {"description": "List of venues"},
                            "500": {"description": "Server error"},
                        },
                    },
                    "post": {
                        "summary": "Create a new venue",
                        "tags": ["Venues"],
                        "security": [{"bearerAuth": []}],
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": [
                                            "name",
                                            "address",
                                            "latitude",
                                            "longitude",
                                        ],
                                        "properties": {
                                            "name": {"type": "string"},
                                            "address": {"type": "string"},
                                            "latitude": {"type": "number"},
                                            "longitude": {"type": "number"},
                                            "description": {"type": "string"},
                                            "tables_count": {"type": "integer"},
                                            "operating_hours": {"type": "object"},
                                            "amenities": {"type": "object"},
                                        },
                                    }
                                }
                            },
                        },
                        "responses": {
                            "201": {"description": "Venue created"},
                            "400": {"description": "Invalid input"},
                            "401": {"description": "Unauthorized"},
                        },
                    },
                },
                "/games": {
                    "get": {
                        "summary": "Get all games",
                        "tags": ["Games"],
                        "parameters": [
                            {
                                "name": "venue_id",
                                "in": "query",
                                "schema": {"type": "integer"},
                                "description": "Filter by venue",
                            },
                            {
                                "name": "status",
                                "in": "query",
                                "schema": {"type": "string"},
                                "description": "Filter by game status",
                            },
                            {
                                "name": "player_id",
                                "in": "query",
                                "schema": {"type": "integer"},
                                "description": "Filter by player",
                            },
                        ],
                        "responses": {
                            "200": {"description": "List of games"},
                            "500": {"description": "Server error"},
                        },
                    },
                    "post": {
                        "summary": "Create a new game",
                        "tags": ["Games"],
                        "security": [{"bearerAuth": []}],
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": ["venue_id", "game_type"],
                                        "properties": {
                                            "venue_id": {"type": "integer"},
                                            "game_type": {"type": "string"},
                                        },
                                    }
                                }
                            },
                        },
                        "responses": {
                            "201": {"description": "Game created"},
                            "400": {"description": "Invalid input"},
                            "401": {"description": "Unauthorized"},
                        },
                    },
                },
            },
            "components": {
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT",
                    }
                }
            },
        }
    )
