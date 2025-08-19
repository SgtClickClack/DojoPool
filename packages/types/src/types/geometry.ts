export interface Vector2D {
  x: number;
  y: number;
}

export interface Circle {
  center: Vector2D;
  radius: number;
}

export interface Rectangle {
  position: Vector2D;
  width: number;
  height: number;
}

export interface Line {
  start: Vector2D;
  end: Vector2D;
}
