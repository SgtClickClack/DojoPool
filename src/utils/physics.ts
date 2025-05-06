export interface Vector2D {
  x: number;
  y: number;
}

export interface PhysicsObject {
  position: Vector2D;
  velocity: Vector2D;
  mass: number;
  radius: number;
}

export interface CollisionResult {
  collided: boolean;
  newVelocities?: [Vector2D, Vector2D];
  collisionPoint?: Vector2D;
}

export class PhysicsEngine {
  private readonly friction: number;
  private readonly cushionRestitution: number;
  private readonly ballRestitution: number;
  private readonly minVelocity: number;

  constructor(
    friction = 0.02,
    cushionRestitution = 0.6,
    ballRestitution = 0.95,
    minVelocity = 0.01,
  ) {
    this.friction = friction;
    this.cushionRestitution = cushionRestitution;
    this.ballRestitution = ballRestitution;
    this.minVelocity = minVelocity;
  }

  public calculateTrajectory(
    initialPosition: Vector2D,
    power: number,
    angle: number,
  ): Vector2D {
    const radians = (angle * Math.PI) / 180;
    return {
      x: initialPosition.x + power * Math.cos(radians),
      y: initialPosition.y + power * Math.sin(radians),
    };
  }

  public applyFriction(velocity: Vector2D, deltaTime: number): Vector2D {
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed < this.minVelocity) {
      return { x: 0, y: 0 };
    }

    const frictionFactor = 1 - this.friction * deltaTime;
    return {
      x: velocity.x * frictionFactor,
      y: velocity.y * frictionFactor,
    };
  }

  public detectCollision(
    ball1: PhysicsObject,
    ball2: PhysicsObject,
  ): CollisionResult {
    const dx = ball2.position.x - ball1.position.x;
    const dy = ball2.position.y - ball1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > ball1.radius + ball2.radius) {
      return { collided: false };
    }

    const collisionPoint = {
      x: ball1.position.x + (dx * ball1.radius) / distance,
      y: ball1.position.y + (dy * ball1.radius) / distance,
    };

    const normalX = dx / distance;
    const normalY = dy / distance;

    const relativeVelocityX = ball2.velocity.x - ball1.velocity.x;
    const relativeVelocityY = ball2.velocity.y - ball1.velocity.y;
    const velocityAlongNormal =
      relativeVelocityX * normalX + relativeVelocityY * normalY;

    if (velocityAlongNormal > 0) {
      return { collided: false };
    }

    const restitution = this.ballRestitution;
    const j =
      (-(1 + restitution) * velocityAlongNormal) /
      (1 / ball1.mass + 1 / ball2.mass);

    const impulseX = j * normalX;
    const impulseY = j * normalY;

    const newVelocities: [Vector2D, Vector2D] = [
      {
        x: ball1.velocity.x - impulseX / ball1.mass,
        y: ball1.velocity.y - impulseY / ball1.mass,
      },
      {
        x: ball2.velocity.x + impulseX / ball2.mass,
        y: ball2.velocity.y + impulseY / ball2.mass,
      },
    ];

    return {
      collided: true,
      newVelocities,
      collisionPoint,
    };
  }

  public handleCushionCollision(
    ball: PhysicsObject,
    tableWidth: number,
    tableHeight: number,
  ): Vector2D {
    let newVelocity = { ...ball.velocity };

    if (
      ball.position.x - ball.radius <= 0 ||
      ball.position.x + ball.radius >= tableWidth
    ) {
      newVelocity.x = -newVelocity.x * this.cushionRestitution;
    }

    if (
      ball.position.y - ball.radius <= 0 ||
      ball.position.y + ball.radius >= tableHeight
    ) {
      newVelocity.y = -newVelocity.y * this.cushionRestitution;
    }

    return newVelocity;
  }

  public updatePhysics(
    objects: PhysicsObject[],
    tableWidth: number,
    tableHeight: number,
    deltaTime: number,
  ): PhysicsObject[] {
    const updatedObjects = objects.map((obj) => ({
      ...obj,
      velocity: this.applyFriction(obj.velocity, deltaTime),
    }));

    // Handle ball-to-ball collisions
    for (let i = 0; i < updatedObjects.length; i++) {
      for (let j = i + 1; j < updatedObjects.length; j++) {
        const collision = this.detectCollision(
          updatedObjects[i],
          updatedObjects[j],
        );
        if (collision.collided && collision.newVelocities) {
          updatedObjects[i].velocity = collision.newVelocities[0];
          updatedObjects[j].velocity = collision.newVelocities[1];
        }
      }
    }

    // Update positions and handle cushion collisions
    return updatedObjects.map((obj) => {
      const newVelocity = this.handleCushionCollision(
        obj,
        tableWidth,
        tableHeight,
      );
      return {
        ...obj,
        position: {
          x: obj.position.x + newVelocity.x * deltaTime,
          y: obj.position.y + newVelocity.y * deltaTime,
        },
        velocity: newVelocity,
      };
    });
  }
}
