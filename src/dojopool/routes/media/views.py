"""Media upload and management endpoints."""

import hashlib
import os
import uuid
from datetime import datetime
from typing import Set

import magic
from flask import Blueprint, current_app, jsonify, request
from marshmallow import Schema, fields, validate
from werkzeug.utils import secure_filename

from dojopool.core.auth import login_required
from dojopool.core.extensions import db
from dojopool.core.models import MediaFile
from dojopool.core.security.sanitization import sanitize_filename
from dojopool.core.security.virus_scan import scan_file
from dojopool.core.storage import storage_client
from dojopool.core.tasks import generate_thumbnails

media_bp = Blueprint("media", __name__)

# Secure file configuration
ALLOWED_EXTENSIONS: Set[str] = {
    # Images
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    # Documents
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "txt",
    # Audio
    "mp3",
    "wav",
    "ogg",
    # Video
    "mp4",
    "webm",
    "avi",
}

ALLOWED_MIMETYPES: Set[str] = {
    # Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    # Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    # Video
    "video/mp4",
    "video/webm",
    "video/x-msvideo",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_FILES_PER_REQUEST = 10
THUMBNAIL_SIZES = [(200, 200), (400, 400)]


class MediaMetadataSchema(Schema):
    title = fields.Str(validate=validate.Length(max=255))
    description = fields.Str(validate=validate.Length(max=1000))
    tags = fields.List(
        fields.Str(validate=validate.Length(max=50)), validate=validate.Length(max=10)
    )
    category = fields.Str(validate=validate.Length(max=50))


def is_valid_file(file, filename: str) -> bool:
    """Validate file type and content."""
    # Check file size
    if not file or not filename or file.content_length > MAX_FILE_SIZE:
        return False

    # Check file extension
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return False

    # Check actual file type using python-magic
    try:
        file_type = magic.from_buffer(file.read(2048), mime=True)
        file.seek(0)  # Reset file pointer
        if file_type not in ALLOWED_MIMETYPES:
            return False
    except Exception:
        return False

    return True


def generate_file_hash(file) -> str:
    """Generate SHA-256 hash of file content."""
    sha256_hash = hashlib.sha256()
    for chunk in iter(lambda: file.read(4096), b""):
        sha256_hash.update(chunk)
    file.seek(0)
    return sha256_hash.hexdigest()


@media_bp.route("/upload", methods=["POST"])
@login_required
def upload_file():
    """Handle secure file upload."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    files = request.files.getlist("file")
    if len(files) > MAX_FILES_PER_REQUEST:
        return jsonify({"error": f"Maximum {MAX_FILES_PER_REQUEST} files allowed per request"}), 400

    try:
        metadata = MediaMetadataSchema().load(request.form.get("metadata", {}))
    except Exception as e:
        return jsonify({"error": f"Invalid metadata: {str(e)}"}), 400

    uploaded_files = []
    for file in files:
        # Secure filename and validate
        filename = secure_filename(sanitize_filename(file.filename))
        if not is_valid_file(file, filename):
            return jsonify({"error": f"Invalid file: {filename}"}), 400

        # Generate unique filename
        file_hash = generate_file_hash(file)
        ext = filename.rsplit(".", 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}_{file_hash[:8]}.{ext}"

        try:
            # Scan file for viruses
            if not scan_file(file):
                return jsonify({"error": f"Security scan failed for file: {filename}"}), 400

            # Store file securely
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_filename)
            storage_client.save(file, file_path)

            # Create media file record
            media_file = MediaFile(
                id=uuid.uuid4().hex,
                user_id=request.user.id,
                name=filename,
                storage_path=file_path,
                content_type=file.content_type,
                size=file.content_length,
                hash=file_hash,
                metadata=metadata,
                uploaded_at=datetime.utcnow(),
            )
            db.session.add(media_file)

            # Generate thumbnails asynchronously for images
            if file.content_type.startswith("image/"):
                generate_thumbnails.delay(media_file.id, THUMBNAIL_SIZES)

            uploaded_files.append(media_file)

        except Exception as e:
            current_app.logger.error(f"Upload failed for {filename}: {str(e)}")
            return jsonify({"error": f"Upload failed for {filename}"}), 500

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Database error during upload: {str(e)}")
        return jsonify({"error": "Upload failed"}), 500

    return (
        jsonify(
            {
                "message": "Files uploaded successfully",
                "files": [
                    {
                        "id": f.id,
                        "name": f.name,
                        "url": storage_client.get_url(f.storage_path),
                        "size": f.size,
                        "type": f.content_type,
                        "uploaded_at": f.uploaded_at.isoformat(),
                    }
                    for f in uploaded_files
                ],
            }
        ),
        201,
    )


@media_bp.route("/<media_id>", methods=["DELETE"])
@login_required
def delete_file(media_id: str):
    """Delete a media file."""
    media_file = MediaFile.query.get_or_404(media_id)

    # Check ownership
    if media_file.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        # Delete file from storage
        storage_client.delete(media_file.storage_path)

        # Delete thumbnails if they exist
        if media_file.content_type.startswith("image/"):
            for size in THUMBNAIL_SIZES:
                thumb_path = f"thumbnails/{size[0]}x{size[1]}/{media_file.id}.jpg"
                try:
                    storage_client.delete(thumb_path)
                except Exception:
                    pass

        # Delete database record
        db.session.delete(media_file)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Delete failed for {media_id}: {str(e)}")
        return jsonify({"error": "Delete failed"}), 500

    return "", 204


@media_bp.route("/<media_id>", methods=["GET"])
@login_required
def get_file(media_id: str):
    """Get media file details."""
    media_file = MediaFile.query.get_or_404(media_id)

    # Check access permission
    if media_file.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(
        {
            "id": media_file.id,
            "name": media_file.name,
            "url": storage_client.get_url(media_file.storage_path),
            "size": media_file.size,
            "type": media_file.content_type,
            "metadata": media_file.metadata,
            "uploaded_at": media_file.uploaded_at.isoformat(),
            "thumbnails": (
                [
                    {
                        "size": f"{size[0]}x{size[1]}",
                        "url": storage_client.get_url(
                            f"thumbnails/{size[0]}x{size[1]}/{media_file.id}.jpg"
                        ),
                    }
                    for size in THUMBNAIL_SIZES
                ]
                if media_file.content_type.startswith("image/")
                else None
            ),
        }
    )
