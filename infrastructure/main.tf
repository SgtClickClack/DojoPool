terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "dojopool-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "dojopool-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "DojoPool"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  environment = var.environment
  cidr_block  = var.vpc_cidr
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"

  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  container_port = 8080
}

# RDS Database
module "rds" {
  source = "./modules/rds"

  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  engine_version = "15.3"
  instance_class = "db.t3.medium"
}

# Redis Cache
module "redis" {
  source = "./modules/redis"

  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  node_type      = "cache.t3.micro"
}

# S3 and CloudFront
module "frontend" {
  source = "./modules/frontend"

  environment = var.environment
  domain     = var.domain_name
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  environment = var.environment
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnet_ids
} 