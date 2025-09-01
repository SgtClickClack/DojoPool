# Strategic Map API

- Base Path: `/api/v1/territories`

## GET /map

- Description: Returns strategic territories with coordinates, resources, and strategic values.
- Query Params:
  - `bbox` (optional): `minLng,minLat,maxLng,maxLat`
- Response: `StrategicTerritory[]`

## POST /:territoryId/scout

- Body: `{ playerId: string }`
- Response: `{ success: boolean, eventId?: string }`

## POST /:territoryId/manage

- Body: `{ action: 'upgrade_defense' | 'allocate_resources' | 'transfer_ownership', payload?: any }`
- Response: `{ success: boolean, ... }`
