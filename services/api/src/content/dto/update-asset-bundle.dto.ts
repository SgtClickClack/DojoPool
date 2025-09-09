import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetBundleDto } from './create-asset-bundle.dto';

export class UpdateAssetBundleDto extends PartialType(CreateAssetBundleDto) {}
